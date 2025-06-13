import requests
import random
from datetime import datetime, timedelta
import json

BASE_URL = "http://localhost:4000/api"

# WBS categories and subcategories
WBS_CATEGORIES = {
    "Labor": ["Direct Labor", "Indirect Labor", "Overtime"],
    "Materials": ["Raw Materials", "Supplies", "Equipment"],
    "Services": ["Consulting", "Training", "Maintenance"],
    "Travel": ["Airfare", "Lodging", "Per Diem"],
    "Other": ["Miscellaneous", "Contingency"]
}

# Vendor names
VENDORS = [
    "Acme Corporation",
    "Tech Solutions Inc",
    "Global Services LLC",
    "Innovative Systems",
    "Quality Products Co",
    "Professional Services Group",
    "Advanced Technologies",
    "Strategic Partners Inc",
    "Elite Solutions",
    "Premier Services"
]

def generate_transaction(program_id, is_annual):
    # Randomly select WBS category and subcategory
    category = random.choice(list(WBS_CATEGORIES.keys()))
    subcategory = random.choice(WBS_CATEGORIES[category])
    
    # Generate dates
    if is_annual:
        baseline_date = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 364))
    else:
        baseline_date = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 547))  # 18 months
    
    planned_date = baseline_date + timedelta(days=random.randint(0, 30))
    
    # 70% chance of having actuals
    has_actuals = random.random() < 0.7
    actual_date = planned_date + timedelta(days=random.randint(0, 30)) if has_actuals else None
    
    # Generate amounts
    baseline_amount = round(random.uniform(10000, 500000), 2)
    planned_amount = round(baseline_amount * random.uniform(0.8, 1.2), 2)
    actual_amount = round(planned_amount * random.uniform(0.9, 1.1), 2) if has_actuals else None
    
    return {
        "vendor_name": random.choice(VENDORS),
        "expense_description": f"{category} - {subcategory} expenses",
        "wbs_category": category,
        "wbs_subcategory": subcategory,
        "baseline_date": baseline_date.strftime("%Y-%m-%d"),
        "baseline_amount": baseline_amount,
        "planned_date": planned_date.strftime("%Y-%m-%d"),
        "planned_amount": planned_amount,
        "actual_date": actual_date.strftime("%Y-%m-%d") if actual_date else None,
        "actual_amount": actual_amount,
        "notes": f"Transaction for {category} - {subcategory}"
    }

def main():
    # Generate transactions for Annual Program (ID: 1)
    print("Generating transactions for Annual Program...")
    for _ in range(40):
        transaction = generate_transaction(1, True)
        response = requests.post(f"{BASE_URL}/programs/1/ledger", json=transaction)
        if response.status_code != 201:
            print(f"Error creating transaction: {response.text}")
    
    # Generate transactions for POP Program (ID: 2)
    print("Generating transactions for POP Program...")
    for _ in range(40):
        transaction = generate_transaction(2, False)
        response = requests.post(f"{BASE_URL}/programs/2/ledger", json=transaction)
        if response.status_code != 201:
            print(f"Error creating transaction: {response.text}")

if __name__ == "__main__":
    main() 