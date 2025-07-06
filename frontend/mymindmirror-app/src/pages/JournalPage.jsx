        import React, { useState, useEffect } from 'react';
        import axios from 'axios';
        import JournalInput from '../components/JournalInput';
        import MoodChart from '../components/MoodChart';
        import JournalHistory from '../components/JournalHistory';
        import { useNavigate } from 'react-router-dom';
        import { jwtDecode } from 'jwt-decode'; // Import jwt-decode library

        // Install this: npm install jwt-decode
        // You might need to adjust vite.config.js for jwt-decode if it throws errors:
        // Add `define: { global: 'window' }` to vite.config.js if you get 'global is not defined'

        function JournalPage() {
          const [journalEntries, setJournalEntries] = useState([]);
          const [loading, setLoading] = useState(true);
          const [error, setError] = useState('');
          const [username, setUsername] = useState(''); // State for username
          const navigate = useNavigate();

          // Function to fetch journal entries and mood data
          const fetchJournalData = async () => {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
              navigate('/login'); // Redirect to login if no token
              return;
            }

            // Decode JWT to get username
            try {
              const decodedToken = jwtDecode(token);
              setUsername(decodedToken.sub); // 'sub' claim usually holds the subject (username)
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
            <div className="w-full max-w-4xl flex-grow p-6 rounded-xl
                            bg-white/70 dark:bg-black/30 backdrop-blur-md shadow-lg border border-white/30 dark:border-white/10
                            transition-all duration-500 flex flex-col space-y-8">
              
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-poppins font-semibold text-[#B399D4] dark:text-[#5CC8C2]">
                  Welcome, {username}!
                </h2>
                <button 
                  onClick={handleLogout} 
                  className="py-2 px-4 rounded-full font-poppins font-semibold text-white
                             bg-[#B399D4] hover:bg-[#9E7BBF] active:bg-[#8A67A8]
                             shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#B399D4] focus:ring-opacity-75
                             transition-all duration-300"
                >
                  Logout
                </button>
              </div>

              <JournalInput onNewEntry={fetchJournalData} />

              <div className="bg-white/60 dark:bg-black/40 p-6 rounded-lg shadow-inner transition-all duration-500">
                <MoodChart entries={journalEntries} />
              </div>

              <div className="bg-white/60 dark:bg-black/40 p-6 rounded-lg shadow-inner transition-all duration-500">
                <JournalHistory entries={journalEntries} />
              </div>
            </div>
          );
        }

        export default JournalPage;
        