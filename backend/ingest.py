import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore
from langchain_ollama.embeddings import OllamaEmbeddings

# --- 1. Load Environment Variables ---
# Load variables from .env file (PINECONE_API_KEY, PINECONE_INDEX_NAME)
load_dotenv()

PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
PINECONE_INDEX_NAME = os.environ.get('PINECONE_INDEX_NAME')
DATA_DIR = "data/" # Directory where your files are

if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY environment variable not set in .env file")
if not PINECONE_INDEX_NAME:
    raise ValueError("PINECONE_INDEX_NAME environment variable not set in .env file")

# --- 2. Define File Loaders ---
# Map file extensions to their respective LangChain loader classes
LOADER_MAPPING = {
    ".pdf": PyPDFLoader,
    ".txt": TextLoader,
    ".docx": Docx2txtLoader,
    # Add more mappings here as needed
}

def load_documents_from_directory(directory_path):
    """
    Loads all supported documents from the specified directory.
    """
    documents = []
    print(f"Loading documents from {directory_path}...")

    for filename in os.listdir(directory_path):
        file_path = os.path.join(directory_path, filename)
        
        # Skip if it's a directory
        if os.path.isdir(file_path):
            continue
        
        # Get the file extension
        file_ext = os.path.splitext(filename)[1].lower()
        
        # Check if we have a loader for this file type
        if file_ext in LOADER_MAPPING:
            loader_class = LOADER_MAPPING[file_ext]
            loader = loader_class(file_path)
            try:
                # Load the document
                doc_pages = loader.load()
                documents.extend(doc_pages)
                print(f"  - Loaded {filename}")
            except Exception as e:
                print(f"  - Failed to load {filename}: {e}")
        else:
            print(f"  - Skipping {filename} (unsupported file type)")
            
    return documents

# --- 3. Main Ingestion Logic ---
def main():
    """
    Main function to load, split, and ingest documents into Pinecone.
    """
    
    # --- Load Documents ---
    documents = load_documents_from_directory(DATA_DIR)
    if not documents:
        print("No documents found in the 'data/' directory. Exiting.")
        return

    print(f"Loaded {len(documents)} document pages total.")

    # --- Split Documents ---
    # We split the documents into smaller chunks for better retrieval
    print("Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)
    print(f"Split documents into {len(chunks)} chunks.")

    # --- Initialize Embeddings ---
    print("Initializing embeddings model (nomic-embed-text)...")
    # This is the model that turns text chunks into vectors
    embeddings = OllamaEmbeddings(model="nomic-embed-text")

    # --- Ingest into Pinecone ---
    print(f"Ingesting {len(chunks)} chunks into Pinecone index '{PINECONE_INDEX_NAME}'...")
    try:
        # This will add the chunks to your Pinecone index
        # If the index already has data, this will add to it
        PineconeVectorStore.from_documents(
            chunks,
            embedding=embeddings,
            index_name=PINECONE_INDEX_NAME
        )
        print("Ingestion complete!")
        print(f"Your AI can now answer questions based on {len(chunks)} new text chunks.")

    except Exception as e:
        print(f"Error during ingestion: {e}")
        print("Please check your Pinecone index, API key, and network connection.")

# --- Run the script ---
if __name__ == "__main__":
    # Ensure the 'data' directory exists
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print(f"Created 'data/' directory. Please add your files (PDF, DOCX, TXT) there and run again.")
    else:
        main()