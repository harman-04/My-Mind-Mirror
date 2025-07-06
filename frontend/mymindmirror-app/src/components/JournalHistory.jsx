import React from 'react';

function JournalHistory({ entries }) {
  // Sort entries by date in descending order (most recent first)
  const sortedEntries = [...entries].sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));

  // Helper function to get a readable mood label
  const getMoodLabel = (score) => {
    if (score === null || score === undefined) return 'N/A';
    if (score > 0.5) return 'Very Positive';
    if (score > 0.1) return 'Positive';
    if (score < -0.5) return 'Very Negative';
    if (score < -0.1) return 'Negative';
    return 'Neutral';
  };

  // Helper function to get mood color
  const getMoodColor = (score) => {
    if (score === null || score === undefined) return 'text-gray-500';
    if (score > 0.5) return 'text-green-500'; // Positive
    if (score > 0.1) return 'text-lime-500'; // Slightly Positive
    if (score < -0.5) return 'text-red-500'; // Negative
    if (score < -0.1) return 'text-orange-500'; // Slightly Negative
    return 'text-gray-500'; // Neutral
  };

  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-2xl font-poppins font-semibold text-[#B399D4] dark:text-[#5CC8C2]">
        Your Journal History
      </h2>
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
                  .sort(([, scoreA], [, scoreB]) => scoreB - scoreA) // Sort by score descending
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
