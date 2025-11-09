Build Your Own Jarvis: A "Smart" AI Assistant

Note: Create a GIF of your app named jarvis_demo.gif and place it in the root of your project to have it display here.

This project is a complete, step-by-step guide to building your own "Jarvis" style AI assistant.

This isn't just a simple chatbot. It's a powerful, voice-enabled AI agent that can:

Read Your Documents: Answer questions about your personal PDFs, DOCX, and TXT files using Retrieval-Augmented Generation (RAG).

Browse the Web: Get real-time answers about news, sports, tech, and more using a live web search tool.

Use Your Voice: Be controlled entirely by voice (Speech-to-Text) and speak its answers back to you (Text-to-Speech).

Run Locally: Uses the powerful and free Ollama and Llama 3 to run the "brain" on your own machine.

✨ Key Features

🧠 Conversational Memory: Remembers the context of your chat to have a natural, flowing conversation.

📂 RAG on Custom Data: "Teaches" the AI by feeding it your own files via the ingest.py script.

🌐 Live Web Search: Uses Tavily AI to answer questions about current events (e.g., "Who won the F1 race?" or "Latest tech news").

🗣️ Voice-to-Voice Interaction: Click the mic to talk, and listen for the AI's spoken response.

🚀 Modern Tech Stack: Built with a blazing-fast Python (FastAPI) backend and a sleek React frontend.

🔒 Self-Hosted & Private: The core LLM (Ollama) runs on your machine, so your conversations and documents remain private.

🛠️ Tech Stack & Architecture

This project is built with a modern, agentic architecture.

Technologies Used

<p align="center">
<!-- Frontend -->
<img src="https://www.google.com/search?q=https://img.shields.io/badge/React-20232A%3Fstyle%3Dfor-the-badge%26logo%3Dreact%26logoColor%3D61DAFB" alt="React" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/HTML5-E34F26%3Fstyle%3Dfor-the-badge%26logo%3Dhtml5%26logoColor%3Dwhite" alt="HTML5" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/CSS3-1572B6%3Fstyle%3Dfor-the-badge%26logo%3Dcss3%26logoColor%3Dwhite" alt="CSS3" />
<!-- Backend -->
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Python-3776AB%3Fstyle%3Dfor-the-badge%26logo%3Dpython%26logoColor%3Dwhite" alt="Python" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/FastAPI-009688%3Fstyle%3Dfor-the-badge%26logo%3Dfastapi%26logoColor%3Dwhite" alt="FastAPI" />
<!-- AI & Data -->
<img src="https://www.google.com/search?q=https://img.shields.io/badge/LangChain-008a2b%3Fstyle%3Dfor-the-badge%26logo%3Dlangchain%26logoColor%3Dwhite" alt="LangChain" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Ollama-000000%3Fstyle%3Dfor-the-badge%26logo%3Dollama%26logoColor%3Dwhite" alt="Ollama" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Pinecone-008a2b%3Fstyle%3Dfor-the-badge%26logo%3Dpinecone%26logoColor%3Dwhite" alt="Pinecone" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Tavily AI-000000?style=for-the-badge&logo=other&logoColor=white" alt="Tavily AI" />
</p>

How It Works

This project uses a "tool-calling agent." When you send a message, the agent (powered by Llama 3) decides which tool to use.

graph TD
    A[React UI (with Voice)] <--> B(FastAPI Backend);
    B --> C{LangChain Agent};
    C -- "Needs Doc Info?" --> D[Document Retriever (Pinecone)];
    C -- "Needs Web Info?" --> E[Web Search (Tavily)];
    D --> F[Ollama (Llama 3)];
    E --> F;
    F -- "Final Answer" --> C;
    C --> B;
    B --> A;


🚀 Getting Started

Follow these steps to get your own Jarvis assistant running.

1. Prerequisites

You'll need a few accounts and one local app.

Ollama: Download and install Ollama.

Pinecone: Sign up for a free account to get your API key and index name.

Tavily AI: Sign up for a free account to get your API key.

Once Ollama is installed, run these commands in your terminal to download the models:

ollama pull llama3
ollama pull nomic-embed-text


2. Backend Setup

This terminal will run the Python "brain" of your AI.

# Clone this repository (or download the files)
git clone <your-repo-url>
cd <your-repo-folder>/python-backend

# Create a virtual environment
python -m venv venv

# Activate it
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install all required libraries
pip install -r requirements.txt

# IMPORTANT: Edit the .env file
# Add your API keys from Pinecone and Tavily
nano .env 


3. Data Ingestion (Teach Your AI)

"Ingest" your custom files to make them searchable.

Add your files (.pdf, .docx, .txt) into the python-backend/data/ folder.

Run the ingestion script:

python ingest.py


4. Frontend Setup

This terminal will run the React chat interface.

# In a NEW terminal, navigate to the frontend folder
cd <your-repo-folder>/react-chat-ui

# Install the React app's dependencies
npm install


💻 How to Run

You must have both the backend and frontend running at the same time.

Terminal 1: Start the Backend

# In your python-backend folder (with venv active)
uvicorn server:app --reload --port 5000


Terminal 2: Start the Frontend

# In your react-chat-ui folder
npm start


Your browser will automatically open to http://localhost:3000. Remember to grant microphone permissions to use the voice features!