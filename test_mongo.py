import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv('MONGO_URI')

client = MongoClient(MONGO_URI)
db = client.get_default_database()

print("Testing db == 'local_json'")
try:
    if db == "local_json":
        print("True")
    else:
        print("False")
except Exception as e:
    import traceback
    traceback.print_exc()

print("Testing db is None")
try:
    if db is None:
        print("db is None")
    else:
        print("db is not None")
except Exception as e:
    import traceback
    traceback.print_exc()
