import os
import sys
import bcrypt
from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from dotenv import load_dotenv

# Ensure project root is in path for Vercel
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_engine import generate_learning_path
from db_utils import get_db, load_all_careers, seed_database

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'develop-key-for-local-use')

# Setup Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# User Model for Flask-Login
class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data.get('_id'))
        self.email = user_data.get('email')
        self.name = user_data.get('name')
        self.saved_courses = user_data.get('saved_courses', [])

@login_manager.user_loader
def load_user(user_id):
    db = get_db()
    if db == "local_json" or db is None:
        return None
    from bson.objectid import ObjectId
    user_data = db.users.find_one({"_id": ObjectId(user_id)})
    if user_data:
        return User(user_data)
    return None

@app.route('/')
@login_required
def index():
    # Force sync DB to ensure the new real URLs are pushed to MongoDB Atlas
    seed_database(force=True) 
    
    careers = load_all_careers()
    career_list = list(careers.keys())
    return render_template('index.html', careers=career_list)

@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html', user=current_user)

@app.route('/recommend', methods=['GET', 'POST'])
def recommend():
    if request.method == 'GET':
        return redirect(url_for('index'))
    current_skills = request.form.get('current_skills', '')
    target_career = request.form.get('target_career', '')
    
    if not target_career:
        return redirect(url_for('index'))
        
    learning_data = generate_learning_path(current_skills, target_career)
    return render_template('recommendations.html', 
                           target_career=learning_data['target_career'],
                           missing_skills=learning_data['missing_skills'],
                           path=learning_data['path'])

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        db = get_db()
        if db == "local_json" or db is None:
            flash("Database unavailable. Local fallback active.", "warning")
            return render_template('login.html')
            
        user_data = db.users.find_one({"email": email})
        if user_data and bcrypt.checkpw(password.encode('utf-8'), user_data['password']):
            user = User(user_data)
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash("Invalid email or password", "danger")
            
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        
        db = get_db()
        if db == "local_json" or db is None:
            flash("Database unavailable. Please configure MongoDB.", "danger")
            return redirect(url_for('signup'))
            
        # Check if user exists
        if db.users.find_one({"email": email}):
            flash("Email already registered", "warning")
            return redirect(url_for('signup'))
            
        # Hash password and store
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        db.users.insert_one({
            "name": name,
            "email": email,
            "password": hashed_pw,
            "saved_courses": []
        })
        flash("Account created! Please login.", "success")
        return redirect(url_for('login'))
        
    return render_template('signup.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/api/save-course', methods=['POST'])
@login_required
def save_course():
    """Allows authenticated users to persist courses to the DB"""
    data = request.json
    course_id = data.get('id')
    db = get_db()
    if db != "local_json" and db is not None:
        db.users.update_one(
            {"_id": current_user.id},
            {"$addToSet": {"saved_courses": data}}
        )
    return jsonify({"status": "success"})

# Needed for Vercel functions to export the app
app = app

if __name__ == '__main__':
    # Initial setup
    seed_database()
    app.run(host='0.0.0.0', debug=True, port=5000)
