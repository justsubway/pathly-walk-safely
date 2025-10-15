import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './components/Home';
import Features from './components/Features';
import Contact from './components/Contact';
import SmoothScrollProvider from './components/SmoothScrollProvider';

function App() {
  const [isGreek, setIsGreek] = useState(true);

  useEffect(() => {
    // Check localStorage for saved language preference
    const savedLanguage = localStorage.getItem('pathly-language');
    if (savedLanguage) {
      setIsGreek(savedLanguage === 'greek');
    } else {
      // Simple location detection - in a real app you'd use a proper geolocation service
      const userLanguage = navigator.language || navigator.languages[0];
      const isGreece = userLanguage.startsWith('el');
      setIsGreek(isGreece);
    }
  }, []);

  const toggleLanguage = () => {
    const newLanguage = !isGreek;
    setIsGreek(newLanguage);
    localStorage.setItem('pathly-language', newLanguage ? 'greek' : 'english');
  };

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-primary-black text-primary-white">
        <Header isGreek={isGreek} onLanguageToggle={toggleLanguage} />
        <Home isGreek={isGreek} />
        <Features isGreek={isGreek} />
        <Contact isGreek={isGreek} />
      </div>
    </SmoothScrollProvider>
  );
}

export default App;
