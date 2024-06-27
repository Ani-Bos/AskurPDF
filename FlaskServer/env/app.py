from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import os
import pymongo
from llama_index.core import VectorStoreIndex,SimpleDirectoryReader,ServiceContext
from llama_index.core.prompts.prompts import SimpleInputPrompt
from llama_index.llms.huggingface import HuggingFaceLLM
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.mongodb import MongoDBAtlasVectorSearch
import torch

# Set the Hugging Face token
os.environ['HUGGINGFACE_TOKEN'] = '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'  

# Initialize Flask app
app = Flask(__name__)
CORS(app)
print('Model loaded. Check http://127.0.0.1:5000/')

# Function to initialize the chat engine
def read_data():
    reader = SimpleDirectoryReader(input_dir="upload", recursive=True)
    print("Entering read_data function")
    docs = reader.load_data()

    # Define system and query wrapper prompts
    system_prompt = """
    You are a Q&A assistant. Your goal is to answer questions as 
    accurately as possible based on the instruction and context provided.
    """
    query_wrapper_prompt = SimpleInputPrompt("{query_str}")

    # Configure and instantiate the HuggingFace language model
    llm = HuggingFaceLLM(
        context_window=4096,
        max_new_tokens=256,
        generate_kwargs={"temperature": 0.3, "do_sample": True},
        system_prompt=system_prompt,
        query_wrapper_prompt=query_wrapper_prompt,
        tokenizer_name="Shorya22/LLaMA-2-7B",
        model_name="Shorya22/LLaMA-2-7B",
        device_map="auto",
        model_kwargs={"torch_dtype": torch.float16}
    )
    # Configure and instantiate the embedding model
    embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-mpnet-base-v2")

    # Define service context using the instantiated components
    service_context = ServiceContext.from_defaults(
        chunk_size=1024,
        llm=llm,
        embed_model=embed_model
    )
    # Create the vector store index from documents
    index = VectorStoreIndex.from_documents(docs, service_context=service_context)
    # Convert the index to a query engine
    chat_engine = index.as_chat_engine(chat_mode="condense_question", verbose=True)
    return chat_engine

# Initialize chat engine
chat_engine = read_data()





# Define routes
@app.route('/upload', methods=['POST', 'OPTIONS'])
def upload():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    if request.method == "POST":
        if 'pdf_file' in request.files:
            print("Entering uploading process")
            pdf_file = request.files['pdf_file']
            if pdf_file.filename.endswith('.pdf'):
                upload_folder = 'upload'
                os.makedirs(upload_folder, exist_ok=True)
                pdf_path = os.path.join(upload_folder, pdf_file.filename)
                pdf_file.save(pdf_path)
                print(f"Uploaded PDF path: {pdf_path}")
                print("PDF uploaded successfully")
                return jsonify({"message": "File uploaded successfully"}), 200
            else:
                return jsonify({"error": "Invalid file format. Please upload a PDF."}), 400
        else:
            return jsonify({"error": "No file uploaded."}), 400

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    if request.method == "POST":
        prompt = request.json.get('prompt')
        print("Received prompt: ", prompt)
        if prompt:
            response = chat_engine.chat(prompt);
            print(response);
            print("Generated response: ", response.response)
            return jsonify({"response": response.response}), 200
        else:
            return jsonify({"error": "No prompt provided."}), 400

# CORS preflight response
def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response

def _corsify_actual_response(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

# Run Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0')
