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
  Filler, // Although Filler is registered, it's typically for line charts, not strictly needed for bar.
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function ConcernFrequencyChart({ entries }) {
  const [concernData, setConcernData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const processConcerns = () => {
      setLoading(true);
      setError('');
      try {
        const concernCounts = {};
        entries.forEach(entry => {
          if (entry.coreConcerns && Array.isArray(entry.coreConcerns)) {
            entry.coreConcerns.forEach(concern => {
              if (typeof concern === 'string' && concern.trim() !== '') {
                concernCounts[concern] = (concernCounts[concern] || 0) + 1;
              }
            });
          }
        });

        const sortedConcerns = Object.entries(concernCounts)
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 7);

        const labels = sortedConcerns.map(([concern]) => 
          concern.charAt(0).toUpperCase() + concern.slice(1)
        );
        const data = sortedConcerns.map(([, count]) => count);

        // Define a base color for datasets
        const baseBackgroundColor = '#5CC8C2'; // Serene Teal (Light Mode)
        const baseBorderColor = '#5CC8C2';

        setConcernData({
          labels: labels,
          datasets: [
            {
              label: 'Frequency',
              data: data,
              backgroundColor: baseBackgroundColor,
              borderColor: baseBorderColor,
              borderWidth: 1,
              borderRadius: 5,
            },
          ],
        });
        console.log("Processed concern frequency data:", sortedConcerns);
      } catch (err) {
        console.error('Error processing concern data:', err);
        setError('Failed to process concern frequency data.');
      } finally {
        setLoading(false);
      }
    };

    processConcerns();
  }, [entries]);

  if (loading) {
    return <div className="font-inter text-gray-700 dark:text-gray-300 text-center">Loading concerns chart...</div>;
  }

  if (error) {
    return <div className="font-inter text-[#FF8A7A] text-center">{error}</div>;
  }
  
  if (concernData.labels.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center font-inter text-gray-700 dark:text-gray-300">
        No concerns detected yet. Journal more to see your patterns!
      </div>
    );
  }

  // Define chartOptions here, and then dynamically adjust based on theme
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Most Frequent Journal Concerns',
        font: { family: 'Poppins', size: 20, weight: '600' },
        color: '#1E1A3E', // Default dark text for light mode
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                label += context.parsed.y + ' entries';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Concern Category', font: { family: 'Inter', size: 14 }, color: 'rgb(75, 85, 99)' },
        ticks: { color: 'rgb(75, 85, 99)', font: { family: 'Inter' } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Number of Entries', font: { family: 'Inter', size: 14 }, color: 'rgb(75, 85, 99)' },
        ticks: {
            color: 'rgb(75, 85, 99)',
            font: { family: 'Inter' },
            stepSize: 1,
            callback: function(value) { if (value % 1 === 0) return value; }
        },
        grid: { color: 'rgba(200, 200, 200, 0.2)' },
      },
    },
  };

  // Create a mutable copy of concernData.datasets to adjust colors
  // This is important because chartData needs to be a new object for React Chart.js to react to changes
  const adjustedDatasets = concernData.datasets.map(dataset => ({ ...dataset }));

  const rootElement = document.documentElement;
  if (rootElement.classList.contains('dark')) {
    // Adjust options colors for dark mode
    chartOptions.plugins.title.color = '#E0E0E0';
    chartOptions.scales.x.title.color = '#E0E0E0';
    chartOptions.scales.x.ticks.color = '#E0E0E0';
    chartOptions.scales.y.title.color = '#E0E0E0';
    chartOptions.scales.y.ticks.color = '#E0E0E0';
    chartOptions.scales.y.grid.color = 'rgba(100, 100, 100, 0.2)';
    
    // ⭐ FIX: Apply dataset color changes directly to adjustedDatasets ⭐
    if (adjustedDatasets.length > 0) {
      adjustedDatasets[0].backgroundColor = '#B399D4'; // Change bar color for dark mode
      adjustedDatasets[0].borderColor = '#B399D4';
    }
  }

  // Now create the final chartData object using the potentially adjusted datasets
  const chartData = {
    labels: concernData.labels,
    datasets: adjustedDatasets // Use the adjusted datasets
  };

  return (
    <div className="h-80 w-full">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

export default ConcernFrequencyChart;
