import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from db_utils import load_all_courses, load_all_careers

def tokenize_skills(skills_str):
    if not skills_str: return []
    items = [x.strip().lower() for x in re.split(r'[,;]+', skills_str)]
    return [i for i in items if i]

def generate_learning_path(current_skills_str, target_career):
    courses = load_all_courses()
    careers = load_all_careers()
    
    current_skills_list = tokenize_skills(current_skills_str)
    
    # Identify the skills required for the career target
    # If using DB, careers might be a single nested dict
    required_skills = careers.get(target_career, [target_career])
        
    # Skills the user doesn't have yet
    missing_skills = [s for s in required_skills if s.lower() not in current_skills_list]
    
    # If the user already has all the skills, show an advanced topic
    if len(missing_skills) == 0:
        missing_skills = [f"Advanced {target_career}"]
        
    # Format a powerful dataset for Vectorization
    df = pd.DataFrame(courses)
    if df.empty:
        return {"target_career": target_career, "missing_skills": missing_skills, "path": []}

    df['skills_text'] = df.get('skills', []).apply(lambda x: " ".join(x) if isinstance(x, list) else str(x))
    # Weight descriptions and skills highly!
    df['combined_text'] = df['title'] + " " + df['category'] + " " + df['description'] + " " + df['skills_text']
    
    documents = df['combined_text'].tolist()
    vectorizer = TfidfVectorizer(stop_words='english')
    
    path_nodes = []
    recommended_ids = set()
    
    for i, skill in enumerate(missing_skills):
        # We append the target skill as the 'query' document
        # But only if documents exist
        docs_with_query = documents + [skill]
        tfidf_matrix = vectorizer.fit_transform(docs_with_query)
        
        # Calculate similarity between our skill query and all courses
        cosine_sim = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1]).flatten()
        
        # Sort matches
        sorted_indices = cosine_sim.argsort()[::-1]
        
        best_course = None
        
        # Find the best unused course for this skill
        for idx in sorted_indices:
            cid = courses[idx]['id']
            if cid not in recommended_ids:
                best_course = courses[idx].copy()
                best_score = cosine_sim[idx]
                recommended_ids.add(cid)
                break
                
        if best_course:
            best_course['targeted_skill'] = skill
            best_course['match_confidence'] = round(best_score * 100)
            best_course['step_number'] = i + 1
            path_nodes.append(best_course)
            
    return {
        "target_career": target_career,
        "missing_skills": missing_skills,
        "path": path_nodes
    }
