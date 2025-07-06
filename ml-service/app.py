from flask import Flask, request, jsonify
from transformers import pipeline
from flask_cors import CORS
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# --- Environment Configuration ---
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'  # Disable symlink warnings
os.environ['HF_HUB_ENABLE_HF_TRANSFER'] = '1'       # Enable faster downloads

# --- Model Loading with Fallbacks ---
def load_model_with_fallback(task, primary_model, fallback_model=None, **kwargs):
    try:
        logger.info(f"Attempting to load primary model: {primary_model}")
        return pipeline(task, model=primary_model, **kwargs)
    except Exception as e:
        if fallback_model:
            logger.warning(f"Failed to load {primary_model}: {str(e)}. Trying fallback: {fallback_model}")
            try:
                return pipeline(task, model=fallback_model, **kwargs)
            except Exception as fallback_e:
                logger.error(f"Failed to load fallback model {fallback_model}: {str(fallback_e)}")
                raise
        raise

print("Loading NLP Models...")

# 1. Sentiment Analysis
try:
    sentiment_analyzer = load_model_with_fallback(
        "sentiment-analysis",
        "cardiffnlp/twitter-roberta-base-sentiment-latest",
        "distilbert-base-uncased-finetuned-sst-2-english"
    )
    print("✓ Sentiment Analyzer Loaded")
except Exception as e:
    print(f"Failed to load sentiment analyzer: {e}")
    sentiment_analyzer = None

# 2. Emotion Recognition
try:
    emotion_analyzer = load_model_with_fallback(
        "text-classification",
        "bhadresh-savani/distilbert-base-uncased-emotion",  # Primary replacement
        "finiteautomata/bertweet-base-emotion-analysis",     # Fallback
        top_k=5
    )
    print("✓ Emotion Analyzer Loaded")
except Exception as e:
    print(f"Failed to load emotion analyzer: {e}")
    emotion_analyzer = None

# 3. Summarization
try:
    summarizer = load_model_with_fallback(
        "summarization",
        "sshleifer/distilbart-cnn-12-6",
        "facebook/bart-large-cnn"
    )
    print("✓ Summarizer Loaded")
except Exception as e:
    print(f"Failed to load summarizer: {e}")
    summarizer = None

# --- Growth Tips Configuration (Unchanged) ---
GROWTH_TIPS_MAP = {
    "work_stress": "Consider breaking down large work tasks into smaller, manageable steps.",
    "relationship_issues": "Try open and honest communication about your feelings.",
    # ... (rest of your tips map)
}

def get_growth_tips(detected_emotions, core_concerns_list):
    # ... (your existing implementation)
    pass

# --- API Endpoint with Robust Error Handling ---
@app.route('/analyze_journal', methods=['POST'])
def analyze_journal():
    try:
        data = request.json
        journal_text = data.get('text', '')

        if not journal_text:
            return jsonify({"error": "No text provided"}), 400

        processed_text = journal_text[:1000] if len(journal_text) > 1000 else journal_text
        response = {"moodScore": 0.0, "emotions": {}, "coreConcerns": [], "summary": "", "growthTips": []}

        # 1. Sentiment Analysis
        if sentiment_analyzer:
            try:
                sentiment_result = sentiment_analyzer(processed_text)[0]
                if sentiment_result['label'] == 'LABEL_2':  # Positive
                    response["moodScore"] = float(sentiment_result['score'])
                elif sentiment_result['label'] == 'LABEL_0':  # Negative
                    response["moodScore"] = -float(sentiment_result['score'])
            except Exception as e:
                logger.error(f"Sentiment analysis failed: {e}")

        # 2. Emotion Recognition
        if emotion_analyzer:
            try:
                emotion_results = emotion_analyzer(processed_text)
                response["emotions"] = {e['label']: float(e['score']) for e in emotion_results[0]}
            except Exception as e:
                logger.error(f"Emotion analysis failed: {e}")

        # 3. Summarization
        if summarizer:
            try:
                summary_result = summarizer(processed_text, max_length=150, min_length=50, do_sample=False)
                response["summary"] = summary_result[0]['summary_text']
            except Exception as e:
                logger.error(f"Summarization failed: {e}")

        # 4. Core Concerns (unchanged)
        core_concerns = []
        journal_text_lower = journal_text.lower()
        # ... (your existing core concerns logic)
        response["coreConcerns"] = list(dict.fromkeys(core_concerns))

        # 5. Growth Tips
        response["growthTips"] = get_growth_tips(
            list(response["emotions"].keys()),
            response["coreConcerns"]
        )

        return jsonify(response)

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == '__main__':
    print("\nAPI Ready! Access at http://127.0.0.1:5000/analyze_journal")
    app.run(debug=True, port=5000)