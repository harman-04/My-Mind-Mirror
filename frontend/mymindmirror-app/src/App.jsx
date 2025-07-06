import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ThemeToggle from './components/ThemeToggle';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JournalPage from './pages/JournalPage'; // Import the new JournalPage

// A simple component for a protected route
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('jwtToken'); // Check if token exists
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col items-center p-4
                      bg-gradient-to-br from-[#F8F9FA] to-[#E0E0E0]
                      dark:from-[#1E1A3E] dark:to-[#3A355C]
                      text-gray-800 dark:text-gray-200">
        
        {/* Header/Navbar Area */}
        <header className="w-full max-w-4xl flex justify-between items-center py-4 px-6 mb-8 rounded-xl
                           bg-white/50 dark:bg-black/20 backdrop-blur-md shadow-lg border border-white/30 dark:border-white/10
                           transition-all duration-500">
          <h1 className="text-3xl font-poppins font-bold text-[#B399D4] dark:text-[#5CC8C2]">
            MyMindMirror
          </h1>
          <ThemeToggle />
        </header>

        {/* Main Content Area - Renders components based on route */}
        <main className="w-full max-w-4xl flex-grow flex items-center justify-center">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* Protected Route for Journal Page */}
            <Route
              path="/journal"
              element={
                <PrivateRoute>
                  <JournalPage /> {/* Now using the actual JournalPage */}
                </PrivateRoute>
              }
            />
            {/* Redirect root to login page by default */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="w-full max-w-4xl text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} MyMindMirror. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;
