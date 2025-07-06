import React, { useState } from 'react';
import axios from 'axios';

function JournalInput({ onNewEntry }) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      setError('You are not logged in. Please log in to submit a journal entry.');
      setLoading(false);
      return;
    }
    if (text.trim() === '') {
      setError('Journal entry cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8080/api/journal', { text }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Entry saved and analyzed:', response.data);
      setMessage('Entry saved and analyzed successfully!');
      setText(''); // Clear textarea after successful submission
      onNewEntry(); // Trigger data refetch in parent (JournalPage)
    } catch (err) {
      console.error('Error saving entry:', err.response ? err.response.data : err.message);
      setError('Failed to save entry. Please ensure backend services are running and you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4 p-6 rounded-lg
                                            bg-white/60 dark:bg-black/40 shadow-inner transition-all duration-500">
      <h2 className="text-2xl font-poppins font-semibold text-[#B399D4] dark:text-[#5CC8C2]">
        What's on your mind today?
      </h2>
      {message && <p className="text-green-600 dark:text-green-400 font-inter">{message}</p>}
      {error && <p className="text-[#FF8A7A] font-inter">{error}</p>}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your thoughts here... The AI will help you understand them."
        rows="10"
        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600
                   bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
                   focus:outline-none focus:ring-2 focus:ring-[#B399D4] dark:focus:ring-[#5CC8C2]
                   font-inter resize-y transition-colors duration-300"
        aria-label="Journal Entry Text Area"
      ></textarea>
      <button
        type="submit"
        className="py-3 px-6 rounded-full font-poppins font-semibold text-white text-lg
                   bg-[#FF8A7A] hover:bg-[#FF6C5A] active:bg-[#D45E4D]
                   shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FF8A7A] focus:ring-opacity-75
                   transition-all duration-300
                   disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? 'Analyzing & Saving...' : 'Analyze & Save Entry'}
      </button>
    </form>
  );
}

export default JournalInput;
