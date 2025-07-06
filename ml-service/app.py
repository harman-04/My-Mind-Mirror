from flask import Flask, request, jsonify
from transformers import pipeline
from flask_cors import CORS
import os
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# --- Environment Configuration ---
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
os.environ['HF_HUB_ENABLE_HF_TRANSFER'] = '1'

# --- Model Loading ---
logger.info("Loading NLP Models...")

# 1. Sentiment Analysis (fixed label handling)
# This model gives 'LABEL_0' (negative), 'LABEL_1' (neutral), 'LABEL_2' (positive)
try:
    sentiment_analyzer = pipeline(
        "sentiment-analysis",
        model="cardiffnlp/twitter-roberta-base-sentiment-latest"
    )
    logger.info("✓ Sentiment Analyzer Loaded")
except Exception as e:
    logger.error(f"Failed to load sentiment analyzer: {e}")
    sentiment_analyzer = None

# 2. Emotion Recognition (more granular emotions)
# This model gives specific emotion labels like 'joy', 'sadness', 'anger', 'fear', etc.
try:
    emotion_analyzer = pipeline(
        "text-classification", 
        model="bhadresh-savani/distilbert-base-uncased-emotion",
        top_k=5 # Get top 5 most likely emotions
    )
    logger.info("✓ Emotion Analyzer Loaded")
except Exception as e:
    logger.error(f"Failed to load emotion analyzer: {e}")
    emotion_analyzer = None

# 3. Summarization (with better length handling)
try:
    summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
    logger.info("✓ Summarizer Loaded")
except Exception as e:
    logger.error(f"Failed to load summarizer: {e}")
    summarizer = None

# --- Enhanced Core Concerns Detection ---
CONCERN_KEYWORDS = {
    "work": ["work", "job", "boss", "career", "project", "tasks", "office", "deadline"],
    "relationship": ["partner", "wife", "husband", "girlfriend", "boyfriend", "relationship", "friend", "family", "parents", "children", "siblings"],
    "financial": ["money", "financial", "bill", "debt", "rent", "salary", "expense", "cost"],
    "health": ["health", "sick", "doctor", "illness", "sleep", "tired", "energy", "wellness"],
    "education": ["school", "study", "exam", "university", "course", "assignment", "grade"],
    "stress/anxiety": ["stress", "anxious", "overwhelmed", "nervous", "worry", "pressure", "burnout", "fear"]
}

def detect_core_concerns(text):
    concerns = set()
    text_lower = text.lower()
    for concern, keywords in CONCERN_KEYWORDS.items():
        if any(keyword in text_lower for keyword in keywords):
            concerns.add(concern)
    return list(concerns)

# --- Improved Growth Tips ---
GROWTH_TIPS_MAP = {
    "sadness": [
        "Consider journaling more about what's making you feel sad.",
        "Reach out to a trusted friend or family member for support.",
        "Engage in activities you usually enjoy, even small ones."
    ],
    "anger": [
        "Try physical activity to release tension and frustration.",
        "Practice deep breathing exercises to calm your mind.",
        "Identify the root cause of your anger and address it constructively."
    ],
    "fear": [
        "Break down worries into smaller, manageable pieces.",
        "Focus on what you can control right now, and let go of what you can't.",
        "Challenge negative thoughts by looking for evidence."
    ],
    "anxiety": [
        "Practice mindfulness or grounding techniques when you feel overwhelmed.",
        "Limit exposure to news or social media that increases your anxiety.",
        "Ensure you're getting enough sleep and balanced nutrition."
    ],
    "work": [
        "Prioritize tasks using a method like the Eisenhower Matrix.",
        "Schedule short, regular breaks to prevent burnout.",
        "Communicate your workload and deadlines effectively with your team."
    ],
    "relationship": [
        "Use 'I feel' statements when discussing issues with others.",
        "Schedule quality time to reconnect with loved ones.",
        "Practice active listening to understand others' perspectives."
    ],
    "financial": [
        "Create a budget to gain clarity on your finances.",
        "Seek advice from a financial advisor if concerns persist.",
        "Focus on one small financial goal at a time."
    ],
    "health": [
        "Prioritize rest and listen to your body's signals.",
        "Incorporate light physical activity into your routine.",
        "Consult a healthcare professional for persistent concerns."
    ],
    "education": [
        "Break down study material into smaller, manageable chunks.",
        "Create a study schedule and stick to it.",
        "Seek help from teachers or tutors when you're stuck."
    ],
    "stress/anxiety": [ # General for stress or anxiety if not specific emotion
        "Practice stress-reducing techniques like meditation or yoga.",
        "Identify your stressors and develop coping strategies.",
        "Ensure you're maintaining a healthy work-life balance."
    ],
    "joy": [
        "Reflect on what brought you joy today and try to incorporate more of it into your routine.",
        "Share your positive experiences with others.",
        "Practice gratitude by listing things you're thankful for."
    ],
    "positive_general": "Keep reflecting on what made you feel good today and seek more of it.",
    "negative_general": "Take some time for self-care and reflection. It's okay to feel this way. Consider talking to someone you trust."
}

def get_growth_tips(dominant_emotion_labels, core_concerns):
    tips = []
    
    # Add emotion-based tips for dominant emotions
    for emotion_label in dominant_emotion_labels:
        if emotion_label in GROWTH_TIPS_MAP:
            tips.extend(GROWTH_TIPS_MAP[emotion_label])
    
    # Add concern-based tips
    for concern_label in core_concerns:
        if concern_label in GROWTH_TIPS_MAP:
            tips.extend(GROWTH_TIPS_MAP[concern_label])
    
    # Fallback general tips if no specific tips were added or if they are very few
    if not tips or len(tips) < 2:
        if any(e in dominant_emotion_labels for e in ["sadness", "anger", "anxiety", "fear", "disappointment"]):
            tips.append(GROWTH_TIPS_MAP.get("negative_general"))
        elif any(e in dominant_emotion_labels for e in ["joy", "love", "surprise"]):
            tips.append(GROWTH_TIPS_MAP.get("positive_general"))
        else: # Default if no strong emotion or specific concern triggers
            tips.append(GROWTH_TIPS_MAP.get("neutral"))

    # Remove duplicates and limit to a reasonable number (e.g., 5-7 tips)
    return list(dict.fromkeys(tips))[:7] 

# --- API Endpoint ---
@app.route('/analyze_journal', methods=['POST'])
def analyze_journal():
    try:
        data = request.json
        journal_text = data.get('text', '')
        
        if not journal_text:
            return jsonify({"error": "No text provided"}), 400

        response = {
            "moodScore": 0.0,
            "emotions": {},
            "coreConcerns": [],
            "summary": "",
            "growthTips": []
        }

        # Ensure text is not too long for models (e.g., summarizer has limits)
        # Summarizer model (distilbart-cnn) can handle up to 1024 tokens.
        # Emotion/Sentiment models often handle up to 512 tokens.
        # Truncate for analysis, but keep original for storage if needed later.
        analysis_text = journal_text
        if len(journal_text.split()) > 500: # Check word count for models
            analysis_text = " ".join(journal_text.split()[:500]) # Truncate to 500 words
            logger.warning("Journal text truncated for analysis due to length.")


        # 1. Emotion Recognition (More granular emotions first, as it's more reliable for mood score)
        dominant_emotions_labels = []
        if emotion_analyzer:
            try:
                # emotion_results is a list of lists, take the first inner list
                emotion_results = emotion_analyzer(analysis_text)
                # Convert list of dicts to a dict for easier processing {emotion_label: score}
                detected_emotions_dict = {e['label']: float(e['score']) for e in emotion_results[0]}
                response["emotions"] = detected_emotions_dict
                
                # Get top 2-3 dominant emotion labels for tip generation and mood score calculation
                dominant_emotions_labels = [
                    e[0] for e in sorted(
                        detected_emotions_dict.items(),
                        key=lambda x: x[1],
                        reverse=True
                    )[:3] if e[1] > 0.1 # Only consider emotions with a score above a threshold
                ]
            except Exception as e:
                logger.error(f"Emotion analysis failed: {e}")

        # 2. Mood Score (Derived from Emotion Recognition for better accuracy)
        # Define weights for emotions to calculate mood score
        emotion_weights = {
            'joy': 1.0, 'love': 1.0, 'surprise': 0.5, 'amusement': 0.5, 'excitement': 0.8,
            'sadness': -1.0, 'anger': -0.8, 'fear': -0.7, 'disappointment': -0.6, 'grief': -1.0,
            'neutral': 0.0, 'optimism': 0.7, 'relief': 0.4, 'caring': 0.6, 'curiosity': 0.3,
            'embarrassment': -0.4, 'pride': 0.5, 'remorse': -0.5, 'annoyance': -0.3, 'disgust': -0.6
        }
        
        calculated_mood_score = 0.0
        total_emotion_score = 0.0
        for emotion, score in response["emotions"].items():
            weight = emotion_weights.get(emotion, 0.0) # Default weight 0 for unknown emotions
            calculated_mood_score += score * weight
            total_emotion_score += score # Sum of all emotion scores

        # Normalize mood score to -1 to 1 range based on total emotion intensity
        if total_emotion_score > 0:
            response["moodScore"] = calculated_mood_score / total_emotion_score
        else:
            response["moodScore"] = 0.0 # Default to neutral if no emotions detected

        # 3. Core Concerns (enhanced)
        response["coreConcerns"] = detect_core_concerns(journal_text)

        # 4. Summarization
        if summarizer:
            try:
                # Dynamic length for summary, ensuring it's not too short
                num_words = len(journal_text.split())
                # Ensure min_sum_length is at least 30, and max_sum_length is at least 50 for a meaningful summary
                # Also, ensure max_sum_length doesn't exceed num_words
                min_sum_length = max(30, min(num_words // 4, 50)) # At least 30 words, or 1/4 of input, max 50
                max_sum_length = min(num_words, min(200, num_words // 2 + 20)) # At most 200 words, or 1/2 of input + 20, capped by num_words

                # Ensure min_sum_length is not greater than max_sum_length
                if min_sum_length > max_sum_length:
                    min_sum_length = max_sum_length - 10 if max_sum_length > 10 else max_sum_length
                
                # For very short entries, summarizer might struggle, just return full text or a simple truncation
                if num_words < 50: 
                    response["summary"] = journal_text[:max_sum_length] + "..." if len(journal_text) > max_sum_length else journal_text
                else:
                    summary_result = summarizer(
                        journal_text,
                        max_length=max_sum_length,
                        min_length=min_sum_length,
                        do_sample=False
                    )
                    response["summary"] = summary_result[0]['summary_text']
            except Exception as e:
                logger.error(f"Summarization failed: {e}")

        # 5. Growth Tips (enhanced)
        response["growthTips"] = get_growth_tips(dominant_emotions_labels, response["coreConcerns"])

        return jsonify(response)

    except Exception as e:
        logger.error(f"Unexpected error in analyze_journal: {e}", exc_info=True) # exc_info for full traceback
        return jsonify({"error": "An internal server error occurred.", "details": str(e)}), 500

if __name__ == '__main__':
    logger.info("\nAPI Ready! Access at http://127.0.0.1:5000/analyze_journal")
    app.run(debug=True, port=5000)
