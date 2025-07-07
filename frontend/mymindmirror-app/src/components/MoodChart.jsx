import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define a consistent color palette for emotions
const EMOTION_COLORS = {
  'joy': '#5CC8C2', // Serene Teal
  'sadness': '#B399D4', // Gentle Lavender
  'anger': '#FF8A7A', // Warm Coral
  'anxiety': '#F7DC6F', // Yellowish for caution
  'fear': '#A93226', // Darker red for fear
  'surprise': '#85C1E9', // Light blue for surprise
  'neutral': '#E0E0E0', // Soft Gray
  'disgust': '#6C3483', // Purple-ish
  'disappointment': '#283747', // Dark blue-gray
  'remorse': '#7F8C8D', // Gray
  'grief': '#17202A', // Very dark blue-gray
  'optimism': '#F1C40F', // Golden yellow
  'caring': '#2ECC71', // Green
  'curiosity': '#AF7AC5', // Light purple
  'relief': '#58D68D', // Light green
  'love': '#E74C3C', // Red
  'pride': '#F39C12', // Orange
  'embarrassment': '#D35400', // Dark orange
  'annoyance': '#E67E22', // Orange
  // Add more as needed based on bhadresh-savani/distilbert-base-uncased-emotion model's labels
};

function MoodChart({ entries }) {
  const [moodData, setMoodData] = useState([]);
  const [emotionTrendData, setEmotionTrendData] = useState({}); // Stores emotion scores per date
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMoodAndEmotionData = async () => {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setError('Not authenticated to fetch mood data.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        // Fetch data for the last 30 days (default)
        const response = await axios.get('http://localhost:8080/api/journal/history', { // Fetch history to get all data
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const fetchedEntries = response.data;

        // Process data for Mood Score chart
        const processedMoodData = fetchedEntries
          .filter(entry => entry.moodScore !== null)
          .map(entry => ({ date: entry.entryDate, moodScore: entry.moodScore }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setMoodData(processedMoodData);

        // Process data for Emotion Trends chart
        const newEmotionTrendData = {}; // {date: {emotion: score, ...}}
        fetchedEntries.forEach(entry => {
          if (entry.emotions) {
            // entry.emotions is already a Map<String, Double> from Spring Boot, NO JSON.parse() needed
            newEmotionTrendData[entry.entryDate] = entry.emotions; 
          }
        });
        setEmotionTrendData(newEmotionTrendData);

        console.log("Fetched mood chart data:", processedMoodData);
        console.log("Processed emotion trend data:", newEmotionTrendData);

      } catch (err) {
        console.error('Error fetching mood/emotion data for chart:', err);
        setError('Failed to load mood/emotion chart data.');
      } finally {
        setLoading(false);
      }
    };

    fetchMoodAndEmotionData();
  }, [entries]); // Re-fetch when journalEntries change (new entry added)

  if (loading) {
    return <div className="font-inter text-gray-700 dark:text-gray-300 text-center">Loading charts...</div>;
  }

  if (error) {
    return <div className="font-inter text-[#FF8A7A] text-center">{error}</div>;
  }

  // Get all unique dates from moodData for x-axis labels
  const allDates = [...new Set(moodData.map(d => d.date))].sort();

  // Dynamically create datasets for top emotions
  const emotionDatasets = [];
  const allEmotionLabels = new Set();
  Object.values(emotionTrendData).forEach(dayEmotions => {
    Object.keys(dayEmotions).forEach(label => allEmotionLabels.add(label));
  });

  // Filter for common/important emotions to display (e.g., top 3-5)
  // Customize this list based on the emotions your model detects and you want to highlight
  const emotionsToShow = ['joy', 'sadness', 'anger', 'anxiety', 'fear', 'neutral']; 

  emotionsToShow.forEach(emotionLabel => {
    if (allEmotionLabels.has(emotionLabel)) {
      emotionDatasets.push({
        label: emotionLabel.charAt(0).toUpperCase() + emotionLabel.slice(1), // Capitalize
        data: allDates.map(date => {
          const dayEmotions = emotionTrendData[date];
          // Ensure we return the score or 0 if not present for that day
          return dayEmotions ? dayEmotions[emotionLabel] || 0 : 0; 
        }),
        borderColor: EMOTION_COLORS[emotionLabel] || '#CCCCCC', // Fallback color
        backgroundColor: (EMOTION_COLORS[emotionLabel] || '#CCCCCC') + '33', // Add transparency
        tension: 0.3, // Smooth curves
        pointBackgroundColor: EMOTION_COLORS[emotionLabel] || '#CCCCCC',
        pointBorderColor: EMOTION_COLORS[emotionLabel] || '#CCCCCC',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false, // Don't fill for emotion lines
      });
    }
  });

  // Main chart data for Mood Score and Emotion Trends
  const chartData = {
    labels: allDates,
    datasets: [
      {
        label: 'Overall Mood Score',
        data: allDates.map(date => {
          const moodEntry = moodData.find(d => d.date === date);
          return moodEntry ? moodEntry.moodScore : null; // Use null for gaps
        }),
        borderColor: '#B399D4', // Gentle Lavender for overall mood
        backgroundColor: 'rgba(179, 153, 212, 0.2)', // With transparency
        tension: 0.3,
        pointBackgroundColor: '#B399D4',
        pointBorderColor: '#B399D4',
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        spanGaps: true, // Connect gaps where data is null
      },
      ...emotionDatasets, // Add emotion trend datasets
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Inter', size: 14 },
          color: 'rgb(75, 85, 99)', // Default text color for legend
        },
      },
      title: {
        display: true,
        text: 'Your Mood & Emotion Trends Over Time',
        font: { family: 'Poppins', size: 20, weight: '600' },
        color: '#1E1A3E', // Dark text for light mode
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(3); // More precision for emotion scores
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Date', font: { family: 'Inter', size: 14 }, color: 'rgb(75, 85, 99)' },
        ticks: { color: 'rgb(75, 85, 99)', font: { family: 'Inter' } },
        grid: { color: 'rgba(200, 200, 200, 0.2)' },
      },
      y: {
        min: -1, // For mood score
        max: 1,  // For mood score and emotion intensity (0 to 1)
        title: { display: true, text: 'Score / Intensity', font: { family: 'Inter', size: 14 }, color: 'rgb(75, 85, 99)' },
        ticks: { color: 'rgb(75, 85, 99)', font: { family: 'Inter' } },
        grid: { color: 'rgba(200, 200, 200, 0.2)' },
      },
    },
  };

  // Adjust chart colors for dark mode dynamically
  const rootElement = document.documentElement;
  if (rootElement.classList.contains('dark')) {
    chartOptions.plugins.legend.labels.color = '#E0E0E0';
    chartOptions.plugins.title.color = '#E0E0E0';
    chartOptions.scales.x.title.color = '#E0E0E0';
    chartOptions.scales.x.ticks.color = '#E0E0E0';
    chartOptions.scales.x.grid.color = 'rgba(100, 100, 100, 0.2)';
    chartOptions.scales.y.title.color = '#E0E0E0';
    chartOptions.scales.y.ticks.color = '#E0E0E0';
    chartOptions.scales.y.grid.color = 'rgba(100, 100, 100, 0.2)';
  }

  return (
    <div className="h-96 w-full"> {/* Increased height for more lines */}
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}

export default MoodChart;
