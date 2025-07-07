import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JournalInput from '../components/JournalInput';
import MoodChart from '../components/MoodChart'; // Mood & Emotion Trends (Line Chart)
import JournalHistory from '../components/JournalHistory';
import ConcernFrequencyChart from '../components/ConcernFrequencyChart';
import TodaysReflection from '../components/TodaysReflection';
import AverageEmotionChart from '../components/AverageEmotionChart'; // New Import
import DailyEmotionSnapshot from '../components/DailyEmotionSnapshot'; // New Import
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import ThemeToggle from '../components/ThemeToggle'; // Make sure this is imported if you want to use it in App.jsx header

function JournalPage() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const fetchJournalData = async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      setUsername(decodedToken.sub);
    } catch (decodeError) {
      console.error("Error decoding JWT:", decodeError);
      localStorage.removeItem('jwtToken');
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:8080/api/journal/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJournalEntries(response.data);
      console.log("Fetched journal entries:", response.data);
    } catch (err) {
      console.error('Error fetching journal data:', err);
      setError('Failed to load journal data. Please try logging in again.');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('jwtToken');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournalData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/login');
  };

  const latestEntryForDashboard = journalEntries.length > 0 ? journalEntries[0] : null;

  if (loading) {
    return (
      <div className="w-full max-w-4xl flex-grow p-6 rounded-xl
                     bg-white/70 dark:bg-black/30 backdrop-blur-md shadow-lg border border-white/30 dark:border-white/10
                     transition-all duration-500 flex items-center justify-center font-inter text-lg">
        Loading your journal...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl flex-grow p-6 rounded-xl
                     bg-white/70 dark:bg-black/30 backdrop-blur-md shadow-lg border border-white/30 dark:border-white/10
                     transition-all duration-500 flex flex-col items-center justify-center font-inter text-lg text-[#FF8A7A]">
        <p>{error}</p>
        <button 
          onClick={handleLogout} 
          className="mt-4 py-2 px-4 rounded-full font-poppins font-semibold text-white
                     bg-[#FF8A7A] hover:bg-[#FF6C5A] active:bg-[#D45E4D]
                     shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FF8A7A] focus:ring-opacity-75
                     transition-all duration-300"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4
                     bg-gradient-to-br from-[#F8F9FA] to-[#E0E0E0]
                     dark:from-[#1E1A3E] dark:to-[#3A355C]
                     text-gray-800 dark:text-gray-200">
      
      {/* REMOVED DUPLICATE HEADER HERE. The main header should be in App.jsx */}
      {/* <header className="w-full max-w-4xl flex justify-between items-center py-4 px-6 mb-8 rounded-xl
                          bg-white/50 dark:bg-black/20 backdrop-blur-md shadow-lg border border-white/30 dark:border-white/10
                          transition-all duration-500">
        <h1 className="text-3xl font-poppins font-bold text-[#B399D4] dark:text-[#5CC8C2]">
          MyMindMirror
        </h1>
        <button 
          onClick={handleLogout} 
          className="py-2 px-4 rounded-full font-poppins font-semibold text-white
                     bg-[#B399D4] hover:bg-[#9E7BBF] active:bg-[#8A67A8]
                     shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#B399D4] focus:ring-opacity-75
                     transition-all duration-300"
        >
          Logout
        </button>
        <ThemeToggle />
      </header> */}

      {/* Main Content Area */}
      <main className="w-full max-w-4xl flex-grow p-6 rounded-xl
                        bg-white/70 dark:bg-black/30 backdrop-blur-md shadow-lg border border-white/30 dark:border-white/10
                        transition-all duration-500 flex flex-col space-y-8">
        
        {/* Journal Input Section */}
        <JournalInput onNewEntry={fetchJournalData} />

        {/* Top Row of Widgets: Today's Reflection & Daily Emotion Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TodaysReflection latestEntry={latestEntryForDashboard} />
          <DailyEmotionSnapshot latestEntry={latestEntryForDashboard} />
        </div>

        {/* Mood & Emotion Trends Chart Section */}
        <div className="bg-white/60 dark:bg-black/40 p-6 rounded-lg shadow-inner transition-all duration-500">
          <MoodChart entries={journalEntries} />
        </div>

        {/* Average Emotion Intensity Chart Section */}
        <div className="bg-white/60 dark:bg-black/40 p-6 rounded-lg shadow-inner transition-all duration-500">
          <AverageEmotionChart entries={journalEntries} />
        </div>

        {/* Core Concerns Frequency Chart Section */}
        <div className="bg-white/60 dark:bg-black/40 p-6 rounded-lg shadow-inner transition-all duration-500">
          <ConcernFrequencyChart entries={journalEntries} />
        </div>

        {/* Journal History Section */}
        <div className="bg-white/60 dark:bg-black/40 p-6 rounded-lg shadow-inner transition-all duration-500">
          <JournalHistory entries={journalEntries} onEntryChange={fetchJournalData} />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
        &copy; {new Date().getFullYear()} MyMindMirror. All rights reserved.
      </footer>
    </div>
  );
}

export default JournalPage;