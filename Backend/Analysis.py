import pandas as pd
import json
import os
import dotenv
from openai import OpenAI
import time
import re
import numpy as np


dotenv.load_dotenv(override=True)

client = OpenAI(api_key=os.getenv("open_ai_key"))

def convert_numpy_types(obj):
    """ Recursively convert numpy types to native Python types """
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(value) for value in obj]
    return obj

def prepare_data(data):
    with open(data, "r") as f:
        data = json.load(f)
    transactions = data.get('transactions')
    starting_balance = data.get('opening_balance', "$0.00")
    starting_balance = float(starting_balance.replace("$", "").replace(",", ""))    
    df = pd.DataFrame(transactions)

    print("Date values before parsing:", df['date'].head())

    df['date'] = pd.to_datetime(df['date'], format='mixed', dayfirst=True)
    print("Date values after parsing:", df['date'].head())    
    df = df.sort_values(by='date')
    # print(df)



    df["numeric_amount"] = df["amount"].replace(r'[\$,]', '', regex=True).astype(float)
    df["adjusted_amount"] = df["numeric_amount"] * df["type"].apply(lambda x: -1 if x == "Credit" else 1)
    df["current_balance"] = starting_balance + df["adjusted_amount"].cumsum()

    return df


def get_NCF(df):
    df['date'] = pd.to_datetime(df['date'], format='%d %b %Y')
    monthly_ncf = {}
    for month in set(df['date'].dt.month):
        ncf_value = round(df[df["date"].dt.month == month]["adjusted_amount"].sum(), 2)

        # print(f"Net Cash Flow for month {month}: {ncf_value}")

        monthly_ncf[int(month)] = ncf_value
    return monthly_ncf


def get_expense_income_ratio(df):
    df['date'] = pd.to_datetime(df['date'], format='%d %b %Y')

    monthly_ratios = {}

    for month in df['date'].dt.month.unique():
        monthly_data = df[df["date"].dt.month == month]

        total_expenses = abs(monthly_data[monthly_data["type"] == "Credit"]["adjusted_amount"].sum())

        total_income = monthly_data[monthly_data["type"] == "Debit"]["adjusted_amount"].sum()

        if total_expenses == 0:
            ratio = 0
        else:
            ratio = (round(total_expenses / total_income, 2)) * 100

        monthly_ratios[int(month)] = ratio

    return monthly_ratios

def get_overdraft_limit(df):
    counter = 0
    for index, row in df.iterrows():
        if row['current_balance'] < 0:
            counter += 1

    return counter

def get_income_stability(df):
    monthly_list = []
    for month in df['date'].dt.month.unique():
        monthly_data = df[df["date"].dt.month == month]
        monthly_income = monthly_data[monthly_data["type"] == "Debit"]["adjusted_amount"].sum()
        monthly_list.append(monthly_income)

    return round((min(monthly_list)/max(monthly_list))*100, 2)

def get_statistics(data):
    stats = {}
    print('getting stats')
    df = prepare_data(data)
    print('df prepared')
    
    # Convert numpy types to native Python types
    stats['NCF'] = {str(k): float(v) for k, v in get_NCF(df).items()}
    print('NCF done')
    stats['expense_income_ratio'] = {str(k): float(v) for k, v in get_expense_income_ratio(df).items()}
    print('expense_income_ratio done')
    stats['overdraft_limit'] = int(get_overdraft_limit(df))
    print('overdraft_limit done')
    stats['income_stability'] = float(get_income_stability(df))
    print('income_stability done')
    return stats


# data = prepare_data('bank_statement.json')
# NCF = get_NCF(data)
# NCF.get(10)
# expense_income_ratio = get_expense_income_ratio(data)
# print(expense_income_ratio)
# print(get_overdraft_limit(data))
# print(get_income_stability(data))
# print(get_statistics('bank_statement.json'))