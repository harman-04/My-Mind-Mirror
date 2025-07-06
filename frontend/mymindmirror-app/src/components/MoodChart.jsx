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
  Filler // Added this import
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler // Added this registration
);

function MoodChart({ entries }) {
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch mood data specifically for the chart
  useEffect(() => {
    const fetchMoodData = async () => {
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
        const response = await axios.get('http://localhost:8080/api/journal/mood-data', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Ensure data is sorted by date for the chart
        const sortedData = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setMoodData(sortedData);
        console.log("Fetched mood chart data:", sortedData);
      } catch (err) {
        console.error('Error fetching mood data for chart:', err);
        setError('Failed to load mood chart data.');
      } finally {
        setLoading(false);
      }
    };

    fetchMoodData();
  }, [entries]); // Re-fetch when journalEntries change (new entry added)

  if (loading) {
    return <div className="font-inter text-gray-700 dark:text-gray-300 text-center">Loading mood chart...</div>;
  }

  if (error) {
    return <div className="font-inter text-[#FF8A7A] text-center">{error}</div>;
  }

  // Prepare data for Chart.js
  const chartData = {
    labels: moodData.map(dataPoint => dataPoint.date),
    datasets: [
      {
        label: 'Mood Score',
        data: moodData.map(dataPoint => dataPoint.moodScore),
        borderColor: '#5CC8C2', // Serene Teal
        backgroundColor: 'rgba(92, 200, 194, 0.2)', // Serene Teal with transparency
        tension: 0.3, // Smooth curves
        pointBackgroundColor: '#B399D4', // Gentle Lavender
        pointBorderColor: '#B399D4',
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true, // Fill area under the line
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow custom sizing
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Inter', // Apply Inter font to legend
            size: 14,
          },
          color: 'rgb(75, 85, 99)', // Default text color for legend
        },
      },
      title: {
        display: true,
        text: 'Your Mood Trend Over Time',
        font: {
          family: 'Poppins', // Apply Poppins font to title
          size: 20,
          weight: '600',
        },
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
                label += context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          font: { family: 'Inter', size: 14 },
          color: 'rgb(75, 85, 99)',
        },
        ticks: {
          color: 'rgb(75, 85, 99)',
          font: { family: 'Inter' },
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)', // Lighter grid lines
        }
      },
      y: {
        min: -1,
        max: 1,
        title: {
          display: true,
          text: 'Mood Score (-1: Negative, 1: Positive)',
          font: { family: 'Inter', size: 14 },
          color: 'rgb(75, 85, 99)',
        },
        ticks: {
          color: 'rgb(75, 85, 99)',
          font: { family: 'Inter' },
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)', // Lighter grid lines
        }
      },
    },
  };

  // Adjust chart colors for dark mode
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
    <div className="h-80 w-full"> {/* Fixed height for the chart container */}
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}

export default MoodChart;
