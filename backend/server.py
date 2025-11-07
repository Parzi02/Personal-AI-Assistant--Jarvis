import os
from flask import Flask, request, jsonify  # REMOVED
from flask_cors import CORS  # REMOVED
from fastapi import FastAPI, HTTPException  # ADDED
from fastapi.middleware.cors import CORSMiddleware  # ADDED
from pydantic import BaseModel  # ADDED
from dotenv import load_dotenv
from langchain_pinecone import PineconeVectorStore
from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_ollama.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# Load environment variables from .env file
load_dotenv()

# --- Setup ---

# Initialize Flask App  - UPDATED
# app = Flask(__name__) - REMOVED
app = FastAPI(  # ADDED
    title="Jarvis RAG API",
    description="API for the 'Build Your Own Jarvis' RAG system"
)

# Enable Cross-Origin Resource Sharing (CORS) - UPDATED
# This allows our React app (on a different port) to talk to this server.
# CORS(app) - REMOVED
app.add_middleware(  # ADDED
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"], # Allow your React app's origin
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, etc.)
    allow_headers=["*"], # Allow all headers
)


# Check for environment variables
PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
PINECONE_INDEX_NAME = os.environ.get('PINECONE_INDEX_NAME')

if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY environment variable not set")
if not PINECONE_INDEX_NAME:
    raise ValueError("PINECONE_INDEX_NAME environment variable not set")


# --- LangChain RAG Setup ---

# 1. Initialize Embeddings Model (Ollama)
# This is used to turn the user's query into a vector to search Pinecone.
try:
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
except Exception as e:
    print(f"Error initializing Ollama embeddings: {e}")
    print("Please ensure Ollama is running and the 'nomic-embed-text' model is installed ('ollama pull nomic-embed-text').")
    exit()


# 2. Initialize Pinecone Vector Store
# This connects to our existing Pinecone index to retrieve documents.
try:
    vectorstore = PineconeVectorStore.from_existing_index(
        index_name=PINECONE_INDEX_NAME,
        embedding=embeddings
    )
    # Create a retriever from the vector store
    # --- OPTIMIZATION 1: Retrieve fewer documents ---
    # We are setting k=2 to retrieve only the top 2 most relevant documents.
    # This sends less context to the LLM, making it faster.
    # The default is k=4.
    retriever = vectorstore.as_retriever(search_kwargs={"k": 2})
    print("Successfully connected to Pinecone.")
except Exception as e:
    print(f"Error connecting to Pinecone: {e}")
    print("Please check your API key and index name.")
    exit()

# 3. Initialize LLM (Ollama)
# This is the "brain" that will generate the final answer.
try:
    llm = ChatOllama(model="llama3")
    print("Successfully initialized Ollama LLM (llama3).")

    # --- OPTIMIZATION 2: (Try this if it's still slow) ---
    # Using a smaller model is much faster but less "smart".
    # 1. First, pull the model: `ollama pull phi3:mini`
    # 2. Then, uncomment the line below and comment out the `llama3` line.
    #
    # llm = ChatOllama(model="phi3:mini")
    # print("Successfully initialized Ollama LLM (phi3:mini).")

except Exception as e:
    print(f"Error initializing Ollama LLM: {e}")
    print("Please ensure Ollama is running and the 'llama3' model is installed ('ollama pull llama3').")
    exit()


# 4. Define the RAG Prompt Template
# This is the "magic" - we create a prompt that instructs the LLM
# to answer the user's question *based on* the context we retrieved
# from Pinecone.
prompt_template = """
You are an AI assistant named Jarvis.
Answer the user's question based *only* on the following context.
If the context doesn't contain the answer, say "I'm sorry, I don't have that information in my knowledge base."

Context:
{context}

Question:
{question}

Answer:
"""
prompt = ChatPromptTemplate.from_template(prompt_template)

# 5. Create the RAG Chain
# This chains all the pieces together:
# 1. The user's question ({'question': ...}) is passed in.
# 2. The 'context' is populated by the 'retriever' (which queries Pinecone).
# 3. The 'question' is passed through using RunnablePassthrough.
# 4. The populated {context} and {question} are fed into the 'prompt'.
# 5. The prompt is fed into the 'llm'.
# 6. The 'StrOutputParser' cleans up the LLM's output into a simple string.

rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

print("RAG chain created successfully. Server is ready.")

# --- API Endpoint ---

# ADDED: Pydantic model for request validation
class ChatRequest(BaseModel):
    message: str

# @app.route('/api/chat', methods=['POST']) - REMOVED
@app.post("/api/chat")  # UPDATED
async def chat(request: ChatRequest):  # UPDATED to use Pydantic model and async
    """
    Handles chat messages from the React frontend.
    """
    try:
        # data = request.json - REMOVED
        # query = data.get('message') - REMOVED
        query = request.message # UPDATED (comes from Pydantic model)

        if not query:
            # This is now handled by Pydantic, but we'll keep it as a fallback.
            raise HTTPException(status_code=400, detail="No message provided") # UPDATED

        print(f"Received query: {query}")

        # --- THIS IS THE KEY LINE ---
        # We invoke the RAG chain with the user's query.
        # LangChain handles the retrieval, prompting, and generation.
        # response_text = rag_chain.invoke(query) - REMOVED
        response_text = await rag_chain.ainvoke(query) # UPDATED to async version
        # --- END OF KEY LINE ---

        print(f"Generated response: {response_text}")

        # Return the LLM's response to the frontend
        # return jsonify({"answer": response_text}) - REMOVED
        return {"answer": response_text} # UPDATED (FastAPI handles JSON conversion)

    except Exception as e:
        print(f"Error in /api/chat: {e}")
        # return jsonify({"error": "An internal server error occurred"}), 500 - REMOVED
        raise HTTPException(status_code=500, detail="An internal server error occurred") # UPDATED

# --- Run the Server ---

# if __name__ == '__main__': - REMOVED
    # Runs the Flask server on port 5000.
    # The React app will send requests to this port.
    # app.run(port=5000, debug=True) - REMOVED

# ADDED: Instructions for how to run with Uvicorn
# To run the server, use the following command in your terminal:
# uvicorn server:app --reload --port 5000
#
# - `server`: The name of this file (server.py)
# - `app`: The name of the FastAPI object (app = FastAPI())
# - `--reload`: Automatically restarts the server when you save changes
# - `--port 5000`: Runs on the same port your React app expects