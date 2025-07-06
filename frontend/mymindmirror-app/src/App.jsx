import React from 'react';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center p-4
                            bg-gradient-to-br from-[#F8F9FA] to-[#E0E0E0]
                            dark:from-[#1E1A3E] dark:to-[#3A355C]
                            text-gray-800 dark:text-gray-200
                            transition-colors duration-500"> 
      
      <header className="w-full max-w-4xl flex justify-between items-center py-4 px-6 mb-8 rounded-xl
                                 bg-white/50 dark:bg-black/20 backdrop-blur-md shadow-lg border border-white/30 dark:border-white/10
                                 transition-all duration-500">
        <h1 className="text-3xl font-poppins font-bold text-[#B399D4] dark:text-[#5CC8C2]">
          MyMindMirror
        </h1>
        <ThemeToggle />
      </header>

      <main className="w-full max-w-4xl flex-grow p-6 rounded-xl
                               bg-white/70 dark:bg-black/30 backdrop-blur-md shadow-lg border border-white/30 dark:border-white/10
                               transition-all duration-500">
        <p className="font-inter text-lg text-center">
          Authentication and Journaling components will go here.
        </p>
      </main>

      <footer className="w-full max-w-4xl text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
        &copy; {new Date().getFullYear()} MyMindMirror. All rights reserved.
      </footer>
    </div>
  );
}

export default App;