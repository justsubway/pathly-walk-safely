import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  isGreek: boolean;
  onLanguageToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ isGreek, onLanguageToggle }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const translations = {
    home: isGreek ? 'Αρχική' : 'Home',
    features: isGreek ? 'Χαρακτηριστικά' : 'Features',
    contact: isGreek ? 'Επικοινωνία' : 'Contact'
  };

  return (
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-auto">
      <div className="bg-gray-800/20 backdrop-blur-lg rounded-2xl px-6 py-3 border border-gray-700/30">
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/Pathly_NoBG.png" 
              alt="Pathly Logo" 
              className="w-12 h-12"
            />
          </div>

          {/* Desktop Navigation - Simplified */}
          <nav className="hidden lg:flex items-center space-x-6">
            <a 
              href="#home" 
              className="text-white text-sm font-medium hover:text-gray-300 transition-colors duration-300"
            >
              {translations.home}
            </a>
            <a 
              href="#features" 
              className="text-white text-sm font-medium hover:text-gray-300 transition-colors duration-300"
            >
              {translations.features}
            </a>
            <a 
              href="#contact" 
              className="text-white text-sm font-medium hover:text-gray-300 transition-colors duration-300"
            >
              {translations.contact}
            </a>
          </nav>

          {/* Language Toggle */}
          <div className="hidden lg:flex items-center">
            <button
              onClick={onLanguageToggle}
              className="text-white text-sm font-medium hover:text-gray-300 transition-colors duration-300"
            >
              {isGreek ? 'EN' : 'GR'}
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-white hover:text-gray-300 transition-colors duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div 
            className="lg:hidden mt-4 pt-4 border-t border-gray-700/50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="flex flex-col space-y-4">
              <a 
                href="#home" 
                className="text-white text-sm font-medium hover:text-gray-300 transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {translations.home}
              </a>
              <a 
                href="#features" 
                className="text-white text-sm font-medium hover:text-gray-300 transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {translations.features}
              </a>
              <a 
                href="#contact" 
                className="text-white text-sm font-medium hover:text-gray-300 transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {translations.contact}
              </a>
              <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                <button
                  onClick={onLanguageToggle}
                  className="text-white text-sm font-medium hover:text-gray-300 transition-colors duration-300"
                >
                  {isGreek ? 'Switch to English' : 'Αλλαγή σε Ελληνικά'}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;
