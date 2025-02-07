from flask import Flask, request, jsonify
import os
import json
import pandas as pd
from flask_cors import CORS
from Analysis import get_statistics
from PDF_IMG import read_pdf, extract_and_save_json, LLM_response
from werkzeug.utils import secure_filename
import time

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            try:
                print("Processing PDF...")
                text = read_pdf(filepath)
                print("Calling GPT...")
                start_time = time.time()
                response = LLM_response(text)
                end_time = time.time()
                print(f"GPT call took {end_time - start_time} seconds")
                with open("time_tracker.txt", "a") as f:
                    f.write(f"{end_time - start_time} seconds")
                print("Writing response...")
                with open("Chat_response.txt", "w") as f:
                    f.write(response.choices[0].message.content)
                print("Extracting JSON...")
                extract_and_save_json("Chat_response.txt")
                print("Processing complete!")
                
                return jsonify({'message': 'File uploaded and processed successfully'}), 200
            finally:
                if os.path.exists(filepath):
                    os.remove(filepath)
        
        return jsonify({'error': 'Invalid file type'}), 400
    except Exception as e:
        print(f"Error in upload: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_statistics')
def give_stats():
    try:
        stats = get_statistics('bank_statement.json')
        return jsonify(stats)
    except Exception as e:
        print(f"Error in statistics: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/load_bank_statement')
def get_bank_statement():
    try:
        with open('bank_statement.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return "Bank statement not found"

if __name__ == '__main__':
    app.run(debug=True)