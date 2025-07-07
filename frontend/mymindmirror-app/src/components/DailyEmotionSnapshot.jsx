import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define a consistent color palette for emotions (expanded for more variety)
const EMOTION_DOUGHNUT_COLORS = {
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
};

function DailyEmotionSnapshot({ latestEntry }) {

  // Function to prepare data for the emotion Doughnut chart
  const getEmotionChartData = (emotions) => {
    if (!emotions || Object.keys(emotions).length === 0) {
      return null;
    }

    const labels = Object.keys(emotions);
    const data = Object.values(emotions);
    const backgroundColors = labels.map(label => EMOTION_DOUGHNUT_COLORS[label] || '#CCCCCC'); // Default gray

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
      },
      title: {
        display: true,
        text: "Today's Emotion Breakdown",
        font: { family: 'Poppins', size: 18, weight: '600' },
        color: '#1E1A3E', // Default dark text for light mode
      },
    },
  };

  // Adjust emotion chart colors for dark mode dynamically
  const rootElement = document.documentElement;
  if (rootElement.classList.contains('dark')) {
    emotionChartOptions.plugins.legend.labels.color = '#E0E0E0';
    emotionChartOptions.plugins.title.color = '#E0E0E0';
  }

  // If no latest entry or no emotions, display a message
  if (!latestEntry || !latestEntry.emotions || Object.keys(latestEntry.emotions).length === 0) {
    return (
      <div className="p-6 rounded-lg bg-white/60 dark:bg-black/40 shadow-inner transition-all duration-500
                      h-80 flex items-center justify-center font-inter text-gray-700 dark:text-gray-300">
        Journal an entry today to see your daily emotion breakdown!
      </div>
    );
  }

  const chartData = getEmotionChartData(latestEntry.emotions);

  return (
    <div className="p-6 rounded-lg bg-white/60 dark:bg-black/40 shadow-inner transition-all duration-500">
      <div className="h-64 w-full flex justify-center items-center"> {/* Adjusted height for this chart */}
        <Doughnut data={chartData} options={emotionChartOptions} />
      </div>
    </div>
  );
}

export default DailyEmotionSnapshot;
