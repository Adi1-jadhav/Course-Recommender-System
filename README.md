# 🚀 AI Course Recommender & Learning Workspace

A professional-grade, AI-driven learning path generator that transforms your career goals into high-impact educational roadmaps. This system uniquely combines personalized ML matching with a dedicated study workspace.

---

## 🌟 Premium Features

### 🧠 **AI-Powered Career Roadmapping**
- **Dynamic Matching**: Uses TF-IDF analysis to bridge the gap between your current skills and target career roles (e.g., AI Engineer, Cyber Analyst).
- **Domain-Wise Organization**: Roadmaps are automatically categorized into technical domains (e.g., Programming, Math, Data Science) for a structured learning journey.

### 💼 **Professional Learning Workspace**
- **Progress Tracking**: Mark modules as "In Progress" or "Completed" and watch your **Overall Progress Bar** climb in real-time.
- **Cloud-Synced Study Notes**: Take personal notes for every course step. Notes are automatically saved to the cloud with debounced auto-syncing logic.

### 🔍 **Verified Course Previews**
- **Spotlight Modals**: Preview course curriculum, ratings (⭐), and duration without leaving the platform.
- **Global Course Database**: Includes real-world integration with Coursera, Udemy, and edX featuring verified links and enrollment statistics.

### 📄 **Utility & Export Tools**
- **Export to PDF**: Professional-grade PDF generation for roadmaps to keep your learning plan offline.
- **Interactive AI Loader**: A high-end "Thinking" overlay that guides you through the analysis phase with real-time status updates.

---

## 🏗️ Technical Architecture

- **Backend**: Python Flask with Serverless Vercel optimization.
- **Database**: MongoDB Atlas for user persistence (fallback to local JSON for zero-config local testing).
- **Intelligence**: Scikit-learn TF-IDF Vectorization for matching skills to industry categories.
- **UI/UX**: Custom Glassmorphism CSS with Font Awesome 6 icons and Outfit typography.
- **Storage**: Hybrid system using MongoDB for profiles and LocalStorage for fast guest interaction.

---

## 🛠️ System Requirements & Setup

1. **Environment**: Python 3.9+
2. **Database**: MongoDB Atlas (Sign up for a free tier M0 cluster).
3. **API Keys**: Add `MONGO_URI` and `SECRET_KEY` to your `.env` file.

### Installation

```bash
# Clone the repository
git clone https://github.com/Adi1-jadhav/Course-Recommender-System.git
cd Course-Recommender-System

# Install dependencies
pip install -r requirements.txt

# Run the project locally
python app.py
