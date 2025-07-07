from flask import Flask, request, jsonify
from transformers import pipeline
from flask_cors import CORS
import os
import logging
import requests
import json
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
os.environ['HF_HUB_ENABLE_HF_TRANSFER'] = '1'

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY environment variable is not set. Gemini API calls will fail.")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
HEADERS = {'Content-Type': 'application/json'}

logger.info("Loading Hugging Face NLP Models...")

try:
    sentiment_analyzer = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest")
    logger.info("✓ Sentiment Analyzer Loaded")
except Exception as e:
    logger.error(f"Failed to load sentiment analyzer: {e}")
    sentiment_analyzer = None

try:
    emotion_analyzer = pipeline("text-classification", model="bhadresh-savani/distilbert-base-uncased-emotion", top_k=5)
    logger.info("✓ Emotion Analyzer Loaded")
except Exception as e:
    logger.error(f"Failed to load emotion analyzer: {e}")
    emotion_analyzer = None

# Removed Hugging Face Summarizer
# try:
#     summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
#     logger.info("✓ Summarizer Loaded")
# except Exception as e:
#     logger.error(f"Failed to load summarizer: {e}")
#     summarizer = None

logger.info("Hugging Face models loaded. Ready for Gemini integration.")


def call_gemini_api(prompt_text, response_schema=None):
    chat_history = [{"role": "user", "parts": [{"text": prompt_text}]}]
    payload = {"contents": chat_history}

    if response_schema:
        payload["generationConfig"] = {
            "responseMimeType": "application/json",
            "responseSchema": response_schema
        }

    try:
        logger.info("Calling Gemini API...")
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers=HEADERS,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        result = response.json()
        logger.info("Gemini API call successful.")

        if result.get("candidates") and result["candidates"][0].get("content") and result["candidates"][0]["content"].get("parts"):
            response_text = result["candidates"][0]["content"]["parts"][0]["text"]
            if response_schema:
                return json.loads(response_text)
            return response_text
        else:
            logger.warning("Gemini API response structure unexpected or content missing: %s", result)
            return None
    except requests.exceptions.RequestException as e:
        logger.error("Gemini API request failed: %s", e)
        return None
    except json.JSONDecodeError as e:
        logger.error("Failed to decode JSON from Gemini response: %s", e)
        return None
    except Exception as e:
        logger.error("An unexpected error occurred during Gemini API call: %s", e)
        return None


def get_gemini_core_concerns(journal_text):
    prompt = f"""Analyze the following journal entry and identify the main themes or core concerns discussed.
    Provide the concerns as a JSON array of strings. Each string should be a concise category.
    Examples of categories: "work", "relationships", "health", "financial", "personal growth", "stress/anxiety", "positive experience", "education", "hobbies".

    Journal Entry: "{journal_text}"

    JSON Array of Concerns:"""

    response_schema = {
        "type": "ARRAY",
        "items": { "type": "STRING" }
    }

    concerns = call_gemini_api(prompt, response_schema)
    if concerns is None:
        logger.warning("Gemini failed to extract core concerns. Returning empty list.")
        return []
    return concerns


def get_gemini_growth_tips(journal_text, emotions, core_concerns):
    emotions_str = ", ".join([f"{label} ({score:.2f})" for label, score in emotions.items()])
    concerns_str = ", ".join(core_concerns) if core_concerns else "No specific concerns identified."

    prompt = f"""Based on the following journal entry, detected emotions, and core concerns,
    generate 3-5 concise, empathetic, and actionable growth tips.
    Provide the tips as a JSON array of strings.

    Journal Entry: "{journal_text}"
    Detected Emotions: {emotions_str}
    Core Concerns: {concerns_str}

    JSON Array of Growth Tips:"""

    response_schema = {
        "type": "ARRAY",
        "items": { "type": "STRING" }
    }

    tips = call_gemini_api(prompt, response_schema)
    if tips is None:
        logger.warning("Gemini failed to generate growth tips. Returning empty list.")
        return ["Keep reflecting on your thoughts and feelings. You're doing great by journaling!"]
    return tips

# ⭐ NEW FUNCTION FOR GEMINI SUMMARY GENERATION ⭐
def get_gemini_summary(journal_text):
    """
    Uses Gemini to generate a concise summary of the journal entry.
    """
    prompt = f"""Summarize the following journal entry concisely, in 1-3 sentences.
    Focus on the main points and overall sentiment.

    Journal Entry: "{journal_text}"

    Summary:"""

    summary = call_gemini_api(prompt) # Call Gemini without a schema for raw text response
    if summary is None:
        logger.warning("Gemini failed to generate summary. Returning truncated raw text.")
        # Fallback to a simple truncation if Gemini fails
        return journal_text[:150] + "..." if len(journal_text) > 150 else journal_text
    return summary


@app.route('/generate_reflection', methods=['POST'])
def generate_reflection():
    data = request.json
    prompt_text = data.get('prompt_text', '')

    if not prompt_text:
        return jsonify({"error": "No prompt text provided"}), 400

    reflection_text = call_gemini_api(prompt_text)
    
    if reflection_text:
        return jsonify({"reflection": reflection_text})
    else:
        return jsonify({"error": "Failed to generate reflection from AI."}), 500


# --- API Endpoint for Journal Analysis ---
@app.route('/analyze_journal', methods=['POST'])
def analyze_journal():
    data = request.json
    journal_text = data.get('text', '')

    if not journal_text:
        return jsonify({"error": "No text provided"}), 400

    response_data = {
        "moodScore": 0.0,
        "emotions": {},
        "coreConcerns": [],
        "summary": "", # Will be populated by Gemini
        "growthTips": []
    }

    analysis_text = journal_text
    # Keep truncation for Hugging Face models if they are still used for emotion/sentiment
    # Gemini can handle longer texts, but it's good to be mindful of token limits and cost.
    # For summarization, Gemini will handle length internally based on prompt.
    if len(journal_text.split()) > 500:
        analysis_text = " ".join(journal_text.split()[:500])
        logger.warning("Journal text truncated for Hugging Face analysis due to length.")


    # 1. Emotion Recognition (Hugging Face)
    detected_emotions_dict = {}
    dominant_emotions_labels = []
    if emotion_analyzer:
        try:
            emotion_results = emotion_analyzer(analysis_text)
            detected_emotions_dict = {e['label']: float(e['score']) for e in emotion_results[0]}
            response_data["emotions"] = detected_emotions_dict
            
            dominant_emotions_labels = [
                e[0] for e in sorted(
                    detected_emotions_dict.items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:3] if e[1] > 0.1
            ]
        except Exception as e:
            logger.error(f"Hugging Face Emotion analysis failed: {e}")

    # 2. Mood Score (Derived from Emotion Recognition)
    emotion_weights = {
        'joy': 1.0, 'love': 1.0, 'surprise': 0.5, 'amusement': 0.5, 'excitement': 0.8,
        'sadness': -1.0, 'anger': -0.8, 'fear': -0.7, 'disappointment': -0.6, 'grief': -1.0,
        'neutral': 0.0, 'optimism': 0.7, 'relief': 0.4, 'caring': 0.6, 'curiosity': 0.3,
        'embarrassment': -0.4, 'pride': 0.5, 'remorse': -0.5, 'annoyance': -0.3, 'disgust': -0.6
    }
    
    calculated_mood_score = 0.0
    total_emotion_score = 0.0
    for emotion, score in response_data["emotions"].items():
        weight = emotion_weights.get(emotion, 0.0)
        calculated_mood_score += score * weight
        total_emotion_score += score

    if total_emotion_score > 0:
        response_data["moodScore"] = calculated_mood_score / total_emotion_score
    else:
        response_data["moodScore"] = 0.0

    # 3. Core Concerns (Gemini AI)
    response_data["coreConcerns"] = get_gemini_core_concerns(journal_text)

    # ⭐ 4. Summarization (Gemini AI) ⭐
    response_data["summary"] = get_gemini_summary(journal_text)

    # 5. Growth Tips (Gemini AI)
    response_data["growthTips"] = get_gemini_growth_tips(
        journal_text, 
        response_data["emotions"], 
        response_data["coreConcerns"]
    )

    return jsonify(response_data)

if __name__ == '__main__':
    logger.info("\nAPI Ready! Access at http://127.0.0.1:5000/analyze_journal")
    app.run(debug=True, port=5000)
