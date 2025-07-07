import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define a consistent color palette for emotions (use distinct colors)
const EMOTION_BAR_COLORS = {
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


function AverageEmotionChart({ entries }) {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const processEmotionAverages = () => {
      setLoading(true);
      setError('');
      try {
        const emotionSums = {};
        const emotionCounts = {};

        entries.forEach(entry => {
          if (entry.emotions && Object.keys(entry.emotions).length > 0) {
            Object.entries(entry.emotions).forEach(([emotion, score]) => {
              emotionSums[emotion] = (emotionSums[emotion] || 0) + score;
              emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
            });
          }
        });

        const averageEmotions = {};
        for (const emotion in emotionSums) {
          averageEmotions[emotion] = emotionSums[emotion] / emotionCounts[emotion];
        }

        // Sort emotions by average intensity (descending) and take top N
        const sortedAverages = Object.entries(averageEmotions)
          .sort(([, avgA], [, avgB]) => avgB - avgA)
          .slice(0, 7); // Show top 7 average emotions

        const labels = sortedAverages.map(([emotion]) => 
          emotion.charAt(0).toUpperCase() + emotion.slice(1) // Capitalize
        );
        const data = sortedAverages.map(([, avg]) => avg);
        const backgroundColors = labels.map(label => EMOTION_BAR_COLORS[label.toLowerCase()] || '#CCCCCC');

        setChartData({
          labels: labels,
          datasets: [
            {
              label: 'Average Intensity',
              data: data,
              backgroundColor: backgroundColors,
              borderColor: backgroundColors.map(color => color + 'CC'), // Slightly darker border
              borderWidth: 1,
              borderRadius: 5, // Rounded bars
            },
          ],
        });
        console.log("Processed average emotion data:", sortedAverages);
      } catch (err) {
        console.error('Error processing average emotion data:', err);
        setError('Failed to process average emotion data.');
      } finally {
        setLoading(false);
      }
    };

    processEmotionAverages();
  }, [entries]); // Re-process when journalEntries change

  if (loading) {
    return <div className="font-inter text-gray-700 dark:text-gray-300 text-center">Loading average emotions...</div>;
  }

  if (error) {
    return <div className="font-inter text-[#FF8A7A] text-center">{error}</div>;
  }

  if (chartData.labels.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center font-inter text-gray-700 dark:text-gray-300">
        No emotion data available yet. Journal more to see your average emotional landscape!
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // No need for legend for single dataset bar chart
      },
      title: {
        display: true,
        text: 'Average Emotion Intensity Across Entries',
        font: { family: 'Poppins', size: 20, weight: '600' },
        color: '#1E1A3E', // Default dark text for light mode
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(3);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Emotion', font: { family: 'Inter', size: 14 }, color: 'rgb(75, 85, 99)' },
        ticks: { color: 'rgb(75, 85, 99)', font: { family: 'Inter' } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        max: 1.0, // Emotion scores are 0-1
        title: { display: true, text: 'Average Intensity', font: { family: 'Inter', size: 14 }, color: 'rgb(75, 85, 99)' },
        ticks: {
            color: 'rgb(75, 85, 99)',
            font: { family: 'Inter' },
            stepSize: 0.2,
        },
        grid: { color: 'rgba(200, 200, 200, 0.2)' },
      },
    },
  };

  // Adjust chart colors for dark mode dynamically
  const rootElement = document.documentElement;
  if (rootElement.classList.contains('dark')) {
    chartOptions.plugins.title.color = '#E0E0E0';
    chartOptions.scales.x.title.color = '#E0E0E0';
    chartOptions.scales.x.ticks.color = '#E0E0E0';
    chartOptions.scales.y.title.color = '#E0E0E0';
    chartOptions.scales.y.ticks.color = '#E0E0E0';
    chartOptions.scales.y.grid.color = 'rgba(100, 100, 100, 0.2)';
    
    // For bar chart, we need to adjust individual bar colors if they are dynamic
    // Here, we re-map the backgroundColors for dark mode
    if (chartData.datasets.length > 0) {
      chartData.datasets[0].backgroundColor = chartData.labels.map(label => {
        const emotionKey = label.toLowerCase();
        // Use a slightly different shade or a dark-mode specific color if available
        // For simplicity, we'll just use a general dark mode bar color for this chart
        return '#B399D4'; // Gentle Lavender for dark mode bars
      });
      chartData.datasets[0].borderColor = chartData.datasets[0].backgroundColor;
    }
  }

  return (
    <div className="h-80 w-full">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

export default AverageEmotionChart;
