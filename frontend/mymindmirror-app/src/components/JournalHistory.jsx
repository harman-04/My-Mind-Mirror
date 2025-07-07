import React, { useState } from 'react';
import axios from 'axios';
import JournalInput from './JournalInput'; // Re-use JournalInput for editing

// Import Chart.js components for Doughnut chart
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement, // Required for Doughnut/Pie charts
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define a consistent color palette for emotions (expanded for more variety)
const EMOTION_CHART_COLORS = {
  'joy': '#5CC8C2',       // Serene Teal
  'sadness': '#B399D4',    // Gentle Lavender
  'anger': '#FF8A7A',      // Warm Coral
  'fear': '#A93226',       // Darker Red
  'surprise': '#85C1E9',   // Light Blue
  'neutral': '#E0E0E0',    // Soft Gray
  'love': '#E74C3C',       // Red
  'disgust': '#6C3483',    // Purple
  'anxiety': '#F7DC6F',    // Yellow
  'optimism': '#F1C40F',   // Golden Yellow
  'relief': '#58D68D',     // Light Green
  'caring': '#2ECC71',     // Green
  'curiosity': '#AF7AC5',  // Light Purple
  'embarrassment': '#D35400', // Dark Orange
  'pride': '#F39C12',      // Orange
  'remorse': '#7F8C8D',    // Gray
  'annoyance': '#E67E22',  // Orange-Brown
  'disappointment': '#283747', // Dark Blue-Gray
  'grief': '#17202A',      // Very Dark Blue-Gray
  // Add more as needed
};


function JournalHistory({ entries, onEntryChange }) {
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const sortedEntries = [...entries].sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));

  const getMoodLabel = (score) => {
    if (score === null || score === undefined) return 'N/A';
    if (score > 0.5) return 'Very Positive';
    if (score > 0.1) return 'Positive';
    if (score < -0.5) return 'Very Negative';
    if (score < -0.1) return 'Negative';
    return 'Neutral';
  };

  const getMoodColor = (score) => {
    if (score === null || score === undefined) return 'text-gray-500';
    if (score > 0.5) return 'text-green-500';
    if (score > 0.1) return 'text-lime-500';
    if (score < -0.5) return 'text-red-500';
    if (score < -0.1) return 'text-orange-500';
    return 'text-gray-500';
  };

  const handleEditClick = (entry) => {
    setEditingEntry(entry);
    setDeleteMessage('');
    setDeleteError('');
  };

  const handleDeleteClick = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    setDeleteMessage('Deleting...');
    setDeleteError('');
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      setDeleteError('Authentication required to delete.');
      setDeleteMessage('');
      return;
    }

    try {
      await axios.delete(`http://localhost:8080/api/journal/${entryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteMessage('Entry deleted successfully!');
      setDeleteError('');
      onEntryChange();
      setEditingEntry(null);
    } catch (err) {
      console.error('Error deleting entry:', err.response ? err.response.data : err.message);
      setDeleteError('Failed to delete entry. Please try again.');
      setDeleteMessage('');
    }
  };

  const handleEntryUpdated = () => {
    setEditingEntry(null);
    onEntryChange();
    setDeleteMessage('');
    setDeleteError('');
  };

  // Function to prepare data for the emotion Doughnut chart
  const getEmotionChartData = (emotions) => {
    if (!emotions || Object.keys(emotions).length === 0) {
      return null;
    }

    const labels = Object.keys(emotions);
    const data = Object.values(emotions);
    const backgroundColors = labels.map(label => EMOTION_CHART_COLORS[label] || '#CCCCCC'); // Default gray

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color + 'CC'), // Slightly darker border
          borderWidth: 1,
        },
      ],
    };
  };

  // Options for the emotion Doughnut chart
  const emotionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right', // Place legend on the right
        labels: {
          font: { family: 'Inter', size: 12 },
          color: 'rgb(75, 85, 99)', // Default text color
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed !== null) {
                label += (context.parsed * 100).toFixed(1) + '%';
            }
            return label;
          }
        }
      }
    },
  };

  // Adjust emotion chart colors for dark mode dynamically
  const rootElement = document.documentElement;
  if (rootElement.classList.contains('dark')) {
    emotionChartOptions.plugins.legend.labels.color = '#E0E0E0';
  }


  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-2xl font-poppins font-semibold text-[#B399D4] dark:text-[#5CC8C2]">
        Your Journal History
      </h2>

      {deleteMessage && <p className="text-green-600 dark:text-green-400 font-inter text-center">{deleteMessage}</p>}
      {deleteError && <p className="text-[#FF8A7A] font-inter text-center">{deleteError}</p>}

      {sortedEntries.length === 0 ? (
        <p className="font-inter text-gray-700 dark:text-gray-300 text-center py-4">
          No entries yet. Start journaling to see your history!
        </p>
      ) : (
        sortedEntries.map((entry) => (
          <div key={entry.id} className="p-5 rounded-lg
                                         bg-white/70 dark:bg-black/50 shadow-md border border-white/40 dark:border-white/15
                                         transition-all duration-300">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-poppins font-semibold text-[#1E1A3E] dark:text-[#E0E0E0]">
                {entry.entryDate}
              </h3>
              <span className={`font-inter font-medium px-3 py-1 rounded-full text-sm ${getMoodColor(entry.moodScore)}`}>
                {getMoodLabel(entry.moodScore)} ({entry.moodScore !== null ? entry.moodScore.toFixed(2) : 'N/A'})
              </span>
            </div>

            {/* AI Insights */}
            <div className="space-y-2 mb-4 font-inter text-gray-700 dark:text-gray-300">
              {entry.summary && (
                <p><strong>Summary:</strong> <span className="font-playfair italic">{entry.summary}</span></p>
              )}
              {entry.emotions && Object.keys(entry.emotions).length > 0 && (
                <p><strong>Emotions:</strong> {Object.entries(entry.emotions)
                  .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                  .map(([emotion, score]) => `${emotion} (${(score * 100).toFixed(1)}%)`)
                  .join(', ')}
                </p>
              )}
              {entry.coreConcerns && entry.coreConcerns.length > 0 && (
                <p><strong>Core Concerns:</strong> {entry.coreConcerns.join(', ')}</p>
              )}
              {entry.growthTips && entry.growthTips.length > 0 && (
                <p><strong>Growth Tips:</strong> {entry.growthTips.join(' • ')}</p>
              )}
            </div>

            {/* Emotion Distribution Chart for this entry */}
            {entry.emotions && Object.keys(entry.emotions).length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-poppins font-semibold mb-2 text-[#1E1A3E] dark:text-[#E0E0E0]">Emotion Breakdown</h4>
                <div className="h-48 w-full flex justify-center items-center"> {/* Fixed height for chart */}
                  <Doughnut data={getEmotionChartData(entry.emotions)} options={emotionChartOptions} />
                </div>
              </div>
            )}


            {/* Edit/Delete Buttons */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => handleEditClick(entry)}
                className="py-1 px-3 rounded-full font-inter text-sm font-semibold text-white
                           bg-[#B399D4] hover:bg-[#9E7BBF] active:bg-[#8A67A8]
                           shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#B399D4] focus:ring-opacity-75"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteClick(entry.id)}
                className="py-1 px-3 rounded-full font-inter text-sm font-semibold text-white
                           bg-[#FF8A7A] hover:bg-[#FF6C5A] active:bg-[#D45E4D]
                           shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF8A7A] focus:ring-opacity-75"
              >
                Delete
              </button>
            </div>

            {/* Edit Form (conditionally rendered) */}
            {editingEntry && editingEntry.id === entry.id && (
              <div className="mt-4 p-4 rounded-lg bg-white/60 dark:bg-black/40 border border-gray-300 dark:border-gray-600">
                <h4 className="text-lg font-poppins font-semibold mb-3 text-[#1E1A3E] dark:text-[#E0E0E0]">Edit Entry for {editingEntry.entryDate}</h4>
                <JournalInput 
                  initialText={editingEntry.rawText} 
                  entryIdToUpdate={editingEntry.id} 
                  onNewEntry={handleEntryUpdated}
                  onCancelEdit={() => setEditingEntry(null)}
                />
              </div>
            )}

            {/* Full Entry (Collapsible) */}
            <details className="mt-2 font-inter text-gray-700 dark:text-gray-300">
              <summary className="cursor-pointer text-[#B399D4] dark:text-[#5CC8C2] hover:underline font-semibold">
                Read Full Entry
              </summary>
              <p className="mt-2 p-3 rounded-md bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-gray-700">
                {entry.rawText}
              </p>
            </details>
          </div>
        ))
      )}
    </div>
  );
}

export default JournalHistory;
