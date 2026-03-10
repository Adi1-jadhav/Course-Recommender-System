import os
import json
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')

# Handle absolute paths for Vercel Serverless Functions
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COURSES_PATH = os.path.join(BASE_DIR, 'data', 'courses.json')
CAREERS_PATH = os.path.join(BASE_DIR, 'data', 'careers.json')

# Initialize DB connection (Caching it for performance)
_db = None

def get_db():
    global _db
    if _db is None:
        if MONGO_URI:
            try:
                # Adding a 25-second timeout to handle slow initial handshakes
                client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=25000)
                # Test connection
                client.admin.command('ping')
                # Explicitly check for None instead of using 'or' to avoid truth value testing error
                default_db = client.get_default_database()
                if default_db is not None:
                    _db = default_db
                else:
                    _db = client['CourseMatchDB']
                print("[OK] Connected to MongoDB Atlas successfully!")
            except Exception as e:
                print(f"[ERROR] MongoDB connection failed: {e}")
                print("[WARN] Falling back to Local JSON Data for now...")
                _db = "local_json"
        else:
            print("[INFO] No MONGO_URI found, using local JSON fallback")
            _db = "local_json"
    return _db

def load_all_courses():
    db = get_db()
    if db == "local_json":
        with open(COURSES_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        # Fetch from MongoDB
        return list(db.courses.find({}, {'_id': 0}))

def load_all_careers():
    db = get_db()
    if db == "local_json":
        with open(CAREERS_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        # Fetch careers from MongoDB
        careers_raw = db.careers.find_one({}, {'_id': 0})
        return careers_raw if careers_raw else {}

def seed_database(force=False):
    """Helper to push local JSON files to the DB and ensure data is fresh"""
    db = get_db()
    if db == "local_json" or db is None:
        return "Cannot seed: No valid MongoDB connection"

    # Synchronize Courses (We check if a refresh is needed or force it)
    if db.courses.count_documents({}) == 0 or force:
        db.courses.delete_many({})  # Clear existing potentially stale data
        with open(COURSES_PATH, 'r', encoding='utf-8') as f:
            courses = json.load(f)
            db.courses.insert_many(courses)
            print("[OK] Synchronized Courses with MongoDB")

    # Synchronize Careers
    if db.careers.count_documents({}) == 0 or force:
        db.careers.delete_many({})
        with open(CAREERS_PATH, 'r', encoding='utf-8') as f:
            careers = json.load(f)
            db.careers.insert_one(careers)
            print("[OK] Synchronized Careers with MongoDB")
    
    return "Sync success"
