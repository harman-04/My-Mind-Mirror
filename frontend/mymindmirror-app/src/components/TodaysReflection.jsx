import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TodaysReflection({ latestEntry }) {
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to generate reflection using Gemini
  const generateReflection = async (entry) => {
    setLoading(true);
    setError('');
    setReflection(''); // Clear previous reflection

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      setError('Not authenticated to generate reflection.');
      setLoading(false);
      return;
    }

    if (!entry || !entry.rawText) {
      setReflection("Journal an entry today to get your daily reflection!");
      setLoading(false);
      return;
    }

    const emotions_str = entry.emotions ? 
      Object.entries(entry.emotions).map(([label, score]) => `${label} (${(score * 100).toFixed(1)}%)`).join(', ') : 'No specific emotions detected.';
    const concerns_str = entry.coreConcerns && entry.coreConcerns.length > 0 ? 
      entry.coreConcerns.join(', ') : 'No specific concerns identified.';

    const prompt = `Based on the following journal entry, its detected emotions, and core concerns,
    generate a concise (1-2 sentences), empathetic, and insightful "Today's Reflection" or a short, encouraging thought.
    Focus on summarizing the emotional state and offering a gentle, positive perspective.

    Journal Entry: "${entry.rawText}"
    Detected Emotions: ${emotions_str}
    Core Concerns: ${concerns_str}

    Today's Reflection:`;

    try {
      // Call your Flask ML service's /analyze_journal endpoint, but with a special prompt
      // Alternatively, you could create a new endpoint in Flask specifically for reflections
      // For simplicity and to reuse existing Flask setup, we'll send a reflection-specific prompt
      // to the existing /analyze_journal endpoint and rely on its general text generation capability.
      // NOTE: This assumes your Flask ML service is configured to handle arbitrary text generation
      // if it's not explicitly structured for it. If it only returns fixed analysis,
      // you'd need a new Flask endpoint that calls Gemini for just the reflection.

      // A better approach for a dedicated reflection: call Gemini directly from Flask with this prompt
      // For now, let's simulate by sending it to a new Flask endpoint or directly from frontend if allowed.
      // Since Flask is already calling Gemini for tips/concerns, let's add a new endpoint in Flask.

      const flaskResponse = await axios.post('http://localhost:5000/generate_reflection', { prompt_text: prompt }, {
        headers: { Authorization: `Bearer ${token}` } // Not strictly needed for Flask, but good practice if Flask had auth
      });

      if (flaskResponse.data && flaskResponse.data.reflection) {
        setReflection(flaskResponse.data.reflection);
      } else {
        setReflection("Couldn't generate a reflection today. Keep journaling!");
      }

    } catch (err) {
      console.error('Error generating reflection:', err.response ? err.response.data : err.message);
      setError('Failed to generate reflection.');
      setReflection("Couldn't generate a reflection today. Keep journaling!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (latestEntry) {
      generateReflection(latestEntry);
    } else {
      setReflection("Journal an entry today to get your daily reflection!");
    }
  }, [latestEntry]); // Regenerate when the latest entry changes

  return (
    <div className="p-6 rounded-lg bg-white/60 dark:bg-black/40 shadow-inner transition-all duration-500">
      <h3 className="text-2xl font-poppins font-semibold mb-3 text-[#5CC8C2] dark:text-[#B399D4]">
        Today's Reflection
      </h3>
      {loading ? (
        <p className="font-inter text-gray-700 dark:text-gray-300">Generating your reflection...</p>
      ) : error ? (
        <p className="font-inter text-[#FF8A7A]">{error}</p>
      ) : (
        <p className="font-playfair italic text-lg text-gray-800 dark:text-gray-200">
          "{reflection}"
        </p>
      )}
    </div>
  );
}

export default TodaysReflection;
