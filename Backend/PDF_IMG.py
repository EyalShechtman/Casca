from ollama import chat # type: ignore
from ollama import ChatResponse # type: ignore
import base64
from pdf2image import convert_from_path
import pdfplumber
import time
from openai import OpenAI
import dotenv
import os
import json
import re

dotenv.load_dotenv(override=True)

client = OpenAI(api_key=os.getenv("open_ai_key"))


prompt = """
You are a Bank Statement PDF analyzer. All you need to do is to extract the following information about the document: 

1️⃣ Account Holder Name
2️⃣ Statement Period (Start Date, End Date)
3️⃣ Currency (standard ISO 4217 currency code. Ex. USD, EUR, GBP, etc.)
4️⃣ Opening Balance
5️⃣ Closing Balance
6️⃣ All Transactions (Date, Description, Amount, Type)
- Date (When the transaction happened)
- Description (Who or what the transaction was for)
- Amount (The transaction value), Don't include the currency symbol in the amount.
- (Credit or Debit), ONLY PAY ATTENTION WHETHER THE MONEY IS GOING OUT OR COMING IN, not the type of transaction. (Credit - Money In, Debit - Meney Out)
For all MONEY, DONT INCLUDE CR or DR in the amounts!

Rules:
MAKE SURE TO READ EVERY TRANSACTION AND INCLUDE IT IN THE JSON. 
In the JSON, create a summary of the user's spending, make sure to include whether you would reccomend the user to get a loan or not based on their spending. Be on the safer side. 
-- Make the summary no more than 70 words.
In adittion, in the JSON, identify if there are any recurring transactions, THERE ARE USUALLY MULTIPLE.
IN adittion, if you can, in teh JSON, identify the user's top categoris of spending. 
All the dates should be in this format: 14 Oct 2017

RETURN A JSON OBJECT. 
This is how the JSON should look like:

{
  "account_holder_name": "x",
  "statement_period": {
    "start_date": "x",
    "end_date": "x"
  },
  "currency": "x",
  "opening_balance": "$x",
  "closing_balance": "$x",
  "transactions": [
    {
      "date": "x",
      "description": "x",
      "amount": "$x",
      "type": "x"
    },
    {
      "date": "x",
      "description": "x",
      "amount": "$x",
      "type": "x"
    },
    ...
  ],
  "summary": "x",
  "recurring_transactions": ["x", "x", ...],
  "top_categories": {
    "category_name": "# of transactions - ONLY INCLUDE THE NUMBER",
    "category_name": "# of transactions - ONLY INCLUDE THE NUMBER",
    ...
  }
}
"""

def read_pdf(pdf_path):
  text = ""
  pdf = pdfplumber.open(pdf_path)
  text += read_page(1, pdf)
  text += read_page(2, pdf)
  return text

def read_page(page_number, pdf):
    text = ""
    p0 = pdf.pages[page_number-1]
    text += p0.extract_text(keep_blank_chars=True)
    text += "\nNEW PAGW BELOW\n"
    return text

# text = read_pdf("Untitled (1).pdf")



def extract_and_save_json(input_file, output_file="bank_statement.json"):
    """
    Extracts JSON data from a text file and saves it as a separate JSON file.

    :param input_file: Path to the text file containing the JSON data.
    :param output_file: Path to save the extracted JSON data (default: "bank_statement.json").
    """
    try:
        with open(input_file, "r") as file:
            text = file.read()
        json_match = re.search(r"```json\n(.*?)\n```", text, re.DOTALL)

        if json_match:
            json_data = json_match.group(1)
            
            json_object = json.loads(json_data)
            
            with open(output_file, "w") as json_file:
                json.dump(json_object, json_file, indent=4)

            # print(f"✅ JSON data extracted and saved as '{output_file}'")
            return output_file  # Return the filename for further use
        else:
            print("❌ No JSON data found in the text.")
            return None
    except Exception as e:
        print(f"⚠️ Error: {e}")
        return None
    
def LLM_response(text):
    chat_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user", "content": f"{prompt} \n {text}"}
        ]
    )
    print('successful GPT call')
    return chat_response

# print(chat_response)

# print(chat_response.choices[0].message.content)


# extract_and_save_json("Chat_response.txt")