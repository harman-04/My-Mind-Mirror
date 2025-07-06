# 🧠 MyMindMirror: AI-Powered Mood Diary & Smart Journal

MyMindMirror is a powerful and innovative journaling web application that uses Artificial Intelligence to analyze your daily thoughts and emotional patterns. Designed for self-reflection and growth, it provides intelligent insights such as mood trends, emotion recognition, and personalized wellness tips — all wrapped in a beautifully responsive UI.

---

## 🔍 Project Overview

- ✨ AI-analyzed journal entries
- 📊 Mood trend visualizations
- 🧩 Personalized tips for emotional well-being
- 📱 Mobile-friendly and theme adaptive
- 🔐 Secure login & user data storage

---

## 🚀 Key Features (MVP)

- 🔐 Secure User Authentication (JWT-based)
- 📝 Daily Journal Entry (free-form)
- 🤖 AI-Powered Analysis:
  - Mood Score (−1.0 to +1.0)
  - Dominant Emotions (with confidence)
  - Core Concerns (recurring themes)
  - Concise Summary
  - Personalized Growth Tips
- 📈 Mood Trend Visualization (interactive chart)
- 🗂 Journal History (with full AI insights)
- 🌓 Dark/Light Mode toggle
- 💻 Responsive Design (desktop & mobile)

---

## 🛠️ Technology Stack

### 🖥 Frontend

- ReactJS
- Vite
- Tailwind CSS
- axios
- react-router-dom
- chart.js & react-chartjs-2
- jwt-decode

### ⚙️ Backend (Spring Boot)

- Spring Boot (Java)
- Spring Security + JWT
- Spring Data JPA (MySQL)
- WebClient (Spring WebFlux)
- Lombok

### 🤖 AI/ML Service (Python)

- Flask
- Flask-CORS
- Hugging Face Transformers
- PyTorch
- NumPy

---

## ⚙️ Setup Instructions

### ✅ Prerequisites

- Java 17+
- Maven
- Node.js (LTS recommended)
- Python 3.8+
- pip
- MySQL Server

---

### 1️⃣ Database Setup (MySQL)

1. Start MySQL and create database:

   ```sql
   CREATE DATABASE mymindmirror_db;



   Update your credentials in:
   backend/src/main/resources/application.properties
   ```

properties
Copy
Edit
spring.datasource.url=jdbc:mysql://localhost:3306/mymindmirror_db
spring.datasource.username=yourUsername
spring.datasource.password=yourPassword
jwt.secret=yourVerySecretJWTKey
app.ml-service.url=http://localhost:5000

🤖 AI/ML Service Setup (Flask - Python)
bash
Copy
Edit
cd MyMindMirror/ml-service
python -m venv venv
Activate the virtual environment:

Windows CMD:

bash
Copy
Edit
.\venv\Scripts\activate
PowerShell:

bash
Copy
Edit
.\venv\Scripts\Activate.ps1
macOS/Linux:

bash
Copy
Edit
source venv/bin/activate
Install Python dependencies:

bash
Copy
Edit
pip install Flask flask-cors transformers torch numpy
Start the Flask service:

bash
Copy
Edit
python app.py

# Running on http://127.0.0.1:5000/

🚀 Backend Setup (Spring Boot - Java)
bash
Copy
Edit
cd MyMindMirror/backend
mvn spring-boot:run

# Running on http://localhost:8080/

Or open the backend folder in IntelliJ or Eclipse and run the main class.

💻 Frontend Setup (React - Vite)
bash
Copy
Edit
cd MyMindMirror/frontend/mymindmirror-app
npm install
npm run dev

# Running on http://localhost:5173/

vbnet
Copy
Edit

📦 Now your full setup steps are cleanly documented in one box and fully formatted for GitHub README.md usage.

Let me know if you’d like:

- The full README again with this updated section replaced
- This exported as a .md file
- Markdown preview rendered or deployed to GitHub Pages

I'm happy to assist!
