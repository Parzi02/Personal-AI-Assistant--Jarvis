import os
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_pinecone import PineconeVectorStore
from langchain_ollama.embeddings import OllamaEmbeddings

# Load environment variables from .env file
load_dotenv()

# Get Pinecone API key and index name from environment variables
PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
PINECONE_INDEX_NAME = os.environ.get('PINECONE_INDEX_NAME')

if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY environment variable not set")
if not PINECONE_INDEX_NAME:
    raise ValueError("PINECONE_INDEX_NAME environment variable not set")

# 1. Load Documents
print("Loading documents...")
loader = DirectoryLoader('./docs', glob="**/*.txt", loader_cls=TextLoader, recursive=True)
documents = loader.load()
if not documents:
    print("No documents found in './docs' directory. Please add some .txt files.")
    exit()

print(f"Loaded {len(documents)} documents.")

# 2. Split Documents
print("Splitting documents...")
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
docs_split = text_splitter.split_documents(documents)
print(f"Split into {len(docs_split)} chunks.")

# 3. Initialize Embeddings
# We use a self-hosted embedding model from Ollama
print("Initializing Ollama embeddings...")
embeddings = OllamaEmbeddings(model="nomic-embed-text")

# 4. Ingest Vectors into Pinecone
print("Ingesting vectors into Pinecone...")
# This will create a new index if it doesn't exist, or add to it if it does.
# Note: PineconeVectorStore.from_documents handles the embedding and uploading.
try:
    vectorstore = PineconeVectorStore.from_documents(
        docs_split,
        embeddings,
        index_name=PINECONE_INDEX_NAME
        # We can remove pinecone_api_key here too,
        # as python-dotenv and the pinecone client handle it.
    )
    print("Ingestion complete!")
    print(f"Vector store details: {vectorstore}")
except Exception as e:
    print(f"An error occurred during ingestion: {e}")
    print("Please ensure your Pinecone API key is correct and the index name matches the one in your dashboard.")
    print(f"The embedding model 'nomic-embed-text' expects 768 dimensions. Did you create your index with 768 dimensions?")