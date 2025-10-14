import React from 'react';
import { motion } from 'framer-motion';

interface AboutProps {
  isGreek: boolean;
}

const About: React.FC<AboutProps> = ({ isGreek }) => {
  const translations = {
    subtitle: isGreek ? 'Σχετικά με το Pathly' : 'About Pathly',
    title: isGreek ? 'Ο Προσωπικός σας Βοηθός Ασφαλείας' : 'Your Personal Safety Assistant',
    description: isGreek 
      ? 'Το Pathly είναι περισσότερο από μια εφαρμογή πλοήγησης — είναι ένα εργαλείο που σας βοηθά να μένετε ασφαλείς και ασφαλισμένοι στην πόλη, ακόμα και μετά το ηλιοβασίλεμα.'
      : 'Pathly is more than just a navigation app — it\'s a tool that helps you stay safe and secure in the city, even after the sun goes down.',
    screen1: isGreek ? 'Αίτημα Διαδρομής' : 'Route Request',
    screen2: isGreek ? 'Χάρτης Ασφαλείας' : 'Safety Map',
    screen3: isGreek ? 'Προστασία' : 'Protection'
  };

  return (
    <section id="about" className="py-20 bg-gray-900/30 relative overflow-hidden">
      {/* Parallax Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-primary-neon/30 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-primary-yellow/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>
      
      {/* Divider */}
      <motion.div 
        className="h-px bg-gradient-to-r from-transparent via-primary-neon to-transparent mb-20 relative z-10"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        viewport={{ once: true }}
      ></motion.div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Centered Layout */}
        <motion.div 
          className="text-center space-y-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          {/* Subtitle */}
          <motion.div 
            className="text-primary-yellow text-sm uppercase tracking-widest font-medium"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {translations.subtitle}
          </motion.div>

          {/* Main Heading */}
          <motion.h2 
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary-white font-display"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 1.2, 
              delay: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth deceleration
            }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {translations.title}
          </motion.h2>

          {/* Description */}
          <motion.p 
            className="text-lg text-primary-gray leading-relaxed max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            {translations.description}
          </motion.p>

          {/* App Preview - Three Phone Mockups */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pt-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            viewport={{ once: true }}
          >
            {/* Left Phone - Route Request */}
            <motion.div 
              className="group"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 1.0, 
                delay: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth deceleration
              }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <div className="w-64 h-80 mx-auto bg-gray-800 rounded-3xl p-4 hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-gradient-to-br from-primary-neon/20 to-primary-yellow/20 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-neon rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">😊</span>
                    </div>
                    <h3 className="text-primary-white font-semibold text-lg mb-2">
                      {translations.screen1}
                    </h3>
                    <p className="text-primary-gray text-sm">
                      {isGreek ? 'Αναζήτηση ασφαλούς διαδρομής' : 'Search for safe route'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Center Phone - Map */}
            <motion.div 
              className="group"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 1.0, 
                delay: 0.9,
                ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth deceleration
              }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <div className="w-64 h-80 mx-auto bg-gray-800 rounded-3xl p-4 hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-gradient-to-br from-primary-black to-gray-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  {/* Map-like pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full bg-gradient-to-br from-primary-neon/10 to-transparent"></div>
                    <div className="absolute top-4 left-4 w-2 h-2 bg-primary-neon rounded-full"></div>
                    <div className="absolute top-8 right-8 w-2 h-2 bg-primary-yellow rounded-full"></div>
                    <div className="absolute bottom-8 left-8 w-2 h-2 bg-primary-neon rounded-full"></div>
                    <div className="absolute bottom-4 right-4 w-2 h-2 bg-primary-yellow rounded-full"></div>
                  </div>
                  <div className="text-center z-10">
                    <div className="w-16 h-16 bg-primary-neon rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🗺️</span>
                    </div>
                    <h3 className="text-primary-white font-semibold text-lg mb-2">
                      {translations.screen2}
                    </h3>
                    <p className="text-primary-gray text-sm">
                      {isGreek ? 'Ασφαλείς διαδρομές σε πραγματικό χρόνο' : 'Real-time safe routes'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Phone - Protection */}
            <motion.div 
              className="group"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 1.0, 
                delay: 1.0,
                ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth deceleration
              }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <div className="w-64 h-80 mx-auto bg-gray-800 rounded-3xl p-4 hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-gradient-to-br from-primary-yellow/20 to-primary-neon/20 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🛡️</span>
                    </div>
                    <h3 className="text-primary-white font-semibold text-lg mb-2">
                      {translations.screen3}
                    </h3>
                    <p className="text-primary-gray text-sm">
                      {isGreek ? 'Συνεχής προστασία και παρακολούθηση' : 'Continuous protection & monitoring'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
