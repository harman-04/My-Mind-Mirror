# MyMindMirror: AI-Powered Mood Diary \& Smart Journal

# Project Overview

# MyMindMirror is an innovative web application designed to help users gain deeper insights into their emotional well-being and thought patterns through journaling. It leverages Artificial Intelligence to analyze free-form daily entries, extracting key emotions, core concerns, and generating personalized growth tips. The system also visualizes mood trends over time, providing a comprehensive tool for self-reflection and personal growth.

# 

# Key Features (MVP)

# Secure User Authentication: Register and log in with JWT-based authentication.

# 

# Daily Journal Entry: Write and submit free-form journal entries.

# 

# AI-Powered Analysis: Each entry is automatically analyzed by an AI service to extract:

# 

# Mood Score: A numerical representation of the overall sentiment (-1.0 to 1.0).

# 

# Dominant Emotions: Identification of key emotions (e.g., sadness, joy, anxiety) with confidence scores.

# 

# Core Concerns: Extraction of recurring themes or topics (e.g., work, relationships, financial).

# 

# Concise Summary: An AI-generated summary of the journal entry.

# 

# Personalized Growth Tips: Actionable suggestions based on detected emotions and concerns.

# 

# Interactive Mood Trend Visualization: View your mood score trends over time on a dynamic chart.

# 

# Journal History: Browse past entries with their full AI insights.

# 

# Responsive Design: Optimized for various screen sizes (desktop and mobile).

# 

# Dark/Light Mode: Smooth theme toggling for comfortable viewing.

# 

# Technology Stack

# Frontend:

# 

# ReactJS: For building the interactive user interface.

# 

# Vite: Fast build tool for React.

# 

# Tailwind CSS: Utility-first CSS framework for rapid and consistent styling.

# 

# axios: For making HTTP requests to the backend.

# 

# react-router-dom: For client-side routing.

# 

# chart.js \& react-chartjs-2: For data visualization (mood charts).

# 

# jwt-decode: For decoding JWT on the client-side (for username display).

# 

# Main Backend:

# 

# Spring Boot (Java): For building robust RESTful APIs, user management, and data persistence.

# 

# Spring Data JPA: For database interaction (ORM).

# 

# MySQL: Relational database for storing user accounts and journal entries.

# 

# Spring Security \& JWT: For secure user authentication and authorization.

# 

# WebClient (Spring WebFlux): For making non-blocking HTTP calls to the Flask AI/ML service.

# 

# Lombok: Reduces boilerplate code.

# 

# AI/ML Service:

# 

# Flask (Python): Lightweight web framework for exposing AI models as a REST API.

# 

# Hugging Face transformers: For state-of-the-art pre-trained NLP models (Sentiment Analysis, Emotion Recognition, Summarization).

# 

# flask-cors: For enabling Cross-Origin Resource Sharing.

# 

# Setup and Running Instructions

# Follow these steps to get MyMindMirror running on your local machine.

# 

# Prerequisites

# Java Development Kit (JDK): Version 17 or higher (e.g., OpenJDK)

# 

# Maven: (Usually comes with Java IDEs like IntelliJ)

# 

# Node.js \& npm: (LTS version recommended)

# 

# Python: Version 3.8+

# 

# pip: Python package installer

# 

# MySQL Server: (e.g., MySQL Community Server)

# 

# Postman / Insomnia: (Optional, for API testing)

# 

# 1\. Database Setup (MySQL)

# Ensure your MySQL server is running.

# 

# Open your MySQL client (e.g., MySQL Workbench, or command line).

# 

# Create a new database for the application:

# 

# CREATE DATABASE mymindmirror\_db;

# 

# Update the spring.datasource.username and spring.datasource.password in backend/src/main/resources/application.properties with your MySQL credentials.

# 

# 2\. AI/ML Service Setup (Flask)

# Navigate to the ml-service directory in your terminal:

# 

# cd MyMindMirror/ml-service

# 

# Create and activate a Python virtual environment:

# 

# python3 -m venv venv

# \# On macOS/Linux:

# source venv/bin/activate

# \# On Windows (Command Prompt):

# .\\venv\\Scripts\\activate

# \# On Windows (PowerShell):

# .\\venv\\Scripts\\Activate.ps1

# 

# Install required Python libraries:

# 

# pip install Flask flask-cors transformers torch numpy jwt-decode

# \# Note: jwt-decode is for frontend but sometimes needed for dev server in specific setups.

# \# If you encounter issues, you might need to install 'sentence-transformers' for KeyBERT

# \# if you decide to enhance core concerns detection with it later.

# 

# Create app.py in ml-service and paste the code provided in the development steps.

# 

# Run the Flask application:

# 

# python app.py

# 

# The service will start on http://127.0.0.1:5000/. Keep this terminal open.

# 

# 3\. Backend Setup (Spring Boot)

# Navigate to the backend directory in your terminal:

# 

# cd MyMindMirror/backend

# 

# Open the backend project in your IDE (e.g., IntelliJ IDEA). Maven should automatically download dependencies.

# 

# Verify backend/src/main/resources/application.properties:

# 

# Ensure spring.datasource.url, username, password are correct.

# 

# Ensure app.ml-service.url=http://localhost:5000 is correct.

# 

# Crucially, change jwt.secret=yourVerySecretKeyThatIsLongAndRandomForJWT to a strong, random key. You can generate one using openssl rand -base64 32 in your terminal.

# 

# Run the Spring Boot application from your IDE or via Maven:

# 

# mvn spring-boot:run

# 

# The backend will start on http://localhost:8080/. Keep this terminal/IDE process open.

# 

# 4\. Frontend Setup (React)

# Navigate to the frontend/mymindmirror-app directory in your terminal:

# 

# cd MyMindMirror/frontend/mymindmirror-app

# 

# Install frontend dependencies:

# 

# npm install

# 

# Run the React development server:

# 

# npm run dev

# 

# The frontend will open in your browser, usually at http://localhost:5173/.

# 

# How to Use MyMindMirror

# Open your browser to http://localhost:5173/.

# 

# You will be redirected to the Login Page.

# 

# Click "New user? Register" to create a new account.

# 

# After successful registration, log in with your new credentials.

# 

# You will be taken to your Journal Dashboard.

# 

# Write your thoughts in the text area and click "Analyze \& Save Entry".

# 

# Observe the AI-generated insights (mood score, emotions, concerns, summary, tips) appear below.

# 

# Submit multiple entries (you can change your system date temporarily to simulate different days for the chart, or just submit for the same day to update it).

# 

# Observe the Mood Trend Chart update with your entries.

# 

# Toggle between Light and Dark modes using the button in the header.

# 

# Future Enhancements (Vision for MyMindMirror)

# This MVP provides a strong foundation. Here are some ideas for future development to further enhance MyMindMirror:

# 

# Advanced AI Insights:

# 

# Trigger Identification: AI to detect potential triggers for mood shifts by analyzing recurring events or keywords preceding changes in mood.

# 

# Personalized Exercises: Suggest specific mindfulness exercises, journaling prompts, or cognitive behavioral therapy (CBT) techniques based on identified patterns.

# 

# Long-term Trend Analysis: More sophisticated analysis of mood and concern patterns over months/years.

# 

# Enhanced User Experience:

# 

# Voice Journaling: Allow users to dictate entries with real-time transcription and emotion tracking.

# 

# Interactive Mood Visualization: Develop more engaging visualizations (e.g., a "mood galaxy" or fluid blobs) that dynamically morph based on emotional data.

# 

# Gamification: Introduce streaks, badges, or points for consistent journaling and self-reflection.

# 

# Search \& Filter History: Allow users to search past entries by keywords, emotions, or concerns.

# 

# Privacy \& Data Management:

# 

# Data Export: Allow users to export their journal data.

# 

# Local-first Option: Explore storing sensitive data locally on the user's device (e.g., using IndexedDB) with optional cloud sync.

# 

# Integrations (with consent):

# 

# Integrate with calendar, sleep trackers, or fitness apps to find correlations between daily activities and mood.

# 

# Community Features (Optional \& Anonymized):

# 

# Aggregated, anonymized insights into common concerns or effective strategies within a broader user base (e.g., "Many users dealing with 'work stress' found X tip helpful").

# 

# Contribution

# (If you plan to open-source or collaborate)

# 

# License

# (e.g., MIT License)

