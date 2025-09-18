from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
import requests
import xml.etree.ElementTree as ET
import re
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__, instance_relative_config=True)

# 确保 instance 目录存在
os.makedirs(app.instance_path, exist_ok=True)

# 把 SQLite 放到 instance/app.db，并把路径打印出来方便你确认
db_path = os.path.join(app.instance_path, "app.db")
print(f"[DB PATH] Using SQLite at: {db_path}")

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
app.config["DEBUG"] = os.getenv("DEBUG") == "True"
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    papers = db.relationship('UserPaperTodo', back_populates='user', lazy=True)

    def __repr__(self):
        return f'<User {self.email}>'


class UserPaperTodo(db.Model):
    __tablename__ = 'user_paper_todo'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    paper_title = db.Column(db.String(255), nullable=False)
    doi = db.Column(db.String(255))
    paper_link = db.Column(db.String(255))
    published = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    status = db.Column(db.Enum('pending', 'in_progress', 'completed', name='status_enum'), default='pending')
    created_at = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    rating = db.Column(db.Integer, default=2)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'doi', name='unique_user_doi'),
    )

    user = db.relationship('User', back_populates='papers')

    def __repr__(self):
        return f'<UserPaperTodo {self.paper_title}>'


def fetch_arxiv_papers(keyword, max_results=10):
    query = f'all:"{keyword}"'
    base_url = 'http://export.arxiv.org/api/query'
    params = {
        'search_query': query,
        'start': 0,
        'max_results': max_results,
        'sortBy': 'submittedDate',
        'sortOrder': 'descending'
    }

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.text
        root = ET.fromstring(data)
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}

        papers = []
        for entry in root.findall('atom:entry', namespace):
            title = entry.find('atom:title', namespace).text
            link = entry.find('atom:id', namespace).text
            published = entry.find('atom:published', namespace).text
            summary = entry.find('atom:summary', namespace).text.strip()

            authors = entry.findall('atom:author', namespace)
            first_author_name = authors[0].find('atom:name', namespace).text if authors else 'Unknown Author'
            affiliation_val = authors[0].find('atom:affiliation', namespace)
            author_affiliation = affiliation_val.text if authors and affiliation_val else 'No affiliation listed'

            papers.append({
                'title': title,
                'link': link,
                'published': published,
                'summary': summary,
                'first_author': first_author_name,
                'author_affiliation': author_affiliation
            })
        return papers
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to fetch papers. Please try again later.'}), 500


# Define the password validation function
def is_valid_password(password):
    # Password should be at least 8 characters long, contain at least one uppercase letter, and one digit
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):  # Check for at least one uppercase letter
        return False
    if not re.search(r"[0-9]", password):  # Check for at least one digit
        return False
    return True


# Utility function to check if user is logged in
def is_logged_in():
    return 'user_id' in session

# Routes
@app.route('/')
@app.route('/my-papers')
def index():
    return render_template('index.html', logged_in=is_logged_in())


@app.route('/search', methods=['POST'])
def search():
    keyword = request.form.get('keyword', '')
    max_results = int(request.form.get('max_results', 10))
    papers = fetch_arxiv_papers(keyword, max_results)
    return jsonify(papers)


@app.route('/save_paper', methods=['POST'])
def save_paper():
    user_id = session['user_id']
    paper_title = request.json.get('paper_title')
    doi = request.json.get('doi')
    paper_link = request.json.get('paper_link')
    published = request.json.get('published')

    # Check if paper already exists for this user and DOI
    existing_paper = UserPaperTodo.query.filter_by(user_id=user_id, doi=doi).first()
    if existing_paper:
        return jsonify({'message': 'Paper already saved for this user.'}), 400

    new_paper = UserPaperTodo(
        user_id=user_id,
        paper_title=paper_title,
        doi=doi,
        paper_link=paper_link,
        published=published,
    )

    db.session.add(new_paper)
    db.session.commit()

    return jsonify({'message': 'Paper saved successfully!'}), 200

@app.route('/update_status', methods=['POST'])
def update_status():
    data = request.get_json()
    user_id = data.get('userId')
    doi = data.get('doi')
    new_status = data.get('status')

    # Ensure valid status
    if new_status not in ['pending', 'in_progress', 'completed']:
        return jsonify({'message': 'Invalid status value'}), 400

    # Find the paper in the database
    paper = UserPaperTodo.query.filter_by(doi=doi, user_id=user_id).first()

    if not paper:
        return jsonify({'message': 'Paper not found'}), 404

    # Update the status
    paper.status = new_status
    if new_status == 'in_progress' or 'completed':
        paper.updated_at = datetime.utcnow() # current time stamp

    # Commit the changes to the database
    db.session.commit()

    return jsonify({'message': 'Status updated successfully!'}), 200

@app.route('/update_rating', methods=['POST'])
def update_rating():
    data = request.get_json()
    user_id = data.get('userId')
    doi = data.get('doi')
    rating = data.get('rating')

    paper = UserPaperTodo.query.filter_by(doi=doi, user_id=user_id).first()
    # Update the status
    paper.rating = rating
    db.session.commit()
    return jsonify({"message": "Rating updated successfully!"}), 200



@app.route('/remove_one_paper', methods=['POST'])
def remove_one_paper():
    user_id = session['user_id']
    doi = request.json.get('doi')

    if not doi:
        return jsonify({'message': 'Paper ID is required.'}), 400

    # Find the paper by ID and check if it belongs to the logged-in user
    paper = UserPaperTodo.query.filter_by(doi=doi, user_id=user_id).first()

    if not paper:
        return jsonify({'message': 'Paper not found or not owned by user.'}), 404

    # Remove the paper from the database
    db.session.delete(paper)
    db.session.commit()

    return jsonify({'message': 'Paper removed successfully!'}), 200


@app.route('/<int:user_id>/papers/', methods=['GET'])
def get_user_papers(user_id):
    user = User.query.get(user_id)
    if user:
        papers = UserPaperTodo.query.filter_by(user_id=user.id).all()
        papers_list = [{'id': paper.id, 'title': paper.paper_title, 'link': paper.paper_link, 'status': paper.status,
                        'published': paper.published, 'created_at': paper.created_at, 'updated_at': paper.updated_at,
                        'doi': paper.doi, 'rating': paper.rating}
                       for paper in papers]
        return jsonify({'papers': papers_list}), 200
    return jsonify({'error': 'User not found'}), 404


@app.route('/login', methods=['POST'])
def login():
    if 'user_id' in session:
        return jsonify({'message': 'Already logged in.', 'userId': session['user_id']}), 200

    if not request.json:
        return jsonify({'message': 'Login successful.'}), 200

    email = request.json.get('email')
    password = request.json.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required.'}), 400

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        session['email'] = user.email  # Storing email in session for convenience
        return jsonify({'message': 'Login successful.', 'userId': user.id}), 200
    else:
        return jsonify({'message': 'Invalid credentials, please try again.'}), 401


@app.route('/register', methods=['POST'])
def register():
    email = request.json.get('email')
    password = request.json.get('password')

    if not is_valid_password(password):
        return jsonify({
            'message': 'Password must be at least 8 characters long, contain at least one uppercase letter and one number.'}), 400

    password_hash = generate_password_hash(password)

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered.'}), 400

    new_user = User(email=email, password=password_hash)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Registration successful! Please log in.'}), 200


@app.route('/logout')
def logout():
    session.clear()  # Clear all session data
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(debug=True)
