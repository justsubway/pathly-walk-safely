import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { emailService } from '../lib/supabase';
import { useParallax } from '../hooks/useParallax';

interface HomeProps {
  isGreek: boolean;
}

const Home: React.FC<HomeProps> = ({ isGreek }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const parallaxY = useParallax(0.3);
  // Removed unused isVisible state

  const translations = {
    subtitle: isGreek ? 'Ανακαλύψτε τις Ασφαλέστερες Διαδρομές' : 'Discover the Safest Paths',
    title: isGreek ? 'Γνωρίστε το Pathly: Ο' : 'Experience Pathly: Your',
    titleEnd: isGreek ? 'Προσωπικός Βοηθός Ασφαλείας' : 'Personal Safety Assistant',
    description: isGreek 
      ? 'Το Pathly είναι περισσότερο από μια εφαρμογή πλοήγησης — είναι ένα εργαλείο που σας βοηθά να μένετε ασφαλείς και ασφαλισμένοι στην πόλη, ακόμα και μετά το ηλιοβασίλεμα.'
      : 'Pathly is more than just a navigation app — it\'s a tool that helps you stay safe and secure in the city, even after the sun goes down.',
    earlyAccess: isGreek ? 'Πρόωρη Πρόσβαση' : 'Early Access',
    subscribeButton: isGreek ? 'Εγγραφή για Πρόωρη Πρόσβαση' : 'Get Early Access',
    emailPlaceholder: isGreek ? 'Διεύθυνση email σας' : 'Your email address',
    successMessage: isGreek ? 'Ευχαριστούμε! Θα σας ενημερώσουμε όταν το app είναι έτοιμο!' : 'Thank you! We\'ll notify you when the app is ready!',
    errorMessage: isGreek ? 'Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email' : 'Please enter a valid email address'
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      alert(translations.errorMessage);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await emailService.subscribeEmail(email, isGreek ? 'greek' : 'english');
      
      if (result.success) {
        setIsSubscribed(true);
        setEmail('');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(isGreek ? 'Σφάλμα κατά την εγγραφή. Παρακαλώ δοκιμάστε ξανά.' : 'Error during subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="home" className="min-h-screen bg-primary-black flex items-center py-12 relative overflow-hidden">
      {/* Parallax Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-neon/20 rounded-full blur-3xl animate-pulse"
          style={{ y: parallaxY * 0.5 }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-yellow/20 rounded-full blur-3xl animate-pulse" 
          style={{ 
            animationDelay: '2s',
            y: parallaxY * -0.3
          }}
        ></motion.div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Side - Text Block */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Yellow Subtitle */}
            <motion.div 
              className="text-primary-yellow text-sm uppercase tracking-widest font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {translations.subtitle}
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-white font-display leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 1.2, 
                delay: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth deceleration
              }}
            >
              <span className="text-primary-white">
                {translations.title}
              </span>
              <br />
              <span className="text-primary-neon">
                {translations.titleEnd}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              className="text-lg text-primary-gray leading-relaxed max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {translations.description}
            </motion.p>

            {/* Development Status & Early Access */}
            <motion.div 
              className="pt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-primary-white mb-3">
                  {translations.earlyAccess}
                </h3>
                <p className="text-base text-primary-yellow/80 leading-relaxed max-w-2xl font-medium">
                  {isGreek 
                    ? 'Το Pathly βρίσκεται σε εξέλιξη. Εγγραφείτε για να λάβετε ειδικές ενημερώσεις και πρόωρη πρόσβαση.'
                    : 'Pathly is currently in development. Sign up to receive exclusive updates and early access.'
                  }
                </p>
              </div>
              
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={translations.emailPlaceholder}
                  className="flex-1 px-6 py-4 bg-gray-900/50 border border-gray-700 rounded-full text-primary-white placeholder-primary-gray focus:outline-none focus:border-primary-neon focus:ring-2 focus:ring-primary-neon/20 transition-all duration-300"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-pill bg-primary-neon text-primary-black font-semibold px-8 py-4 hover:bg-green-400 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-primary-black border-t-transparent rounded-full animate-spin"></div>
                      <span>{isGreek ? 'Εγγραφή...' : 'Subscribing...'}</span>
                    </div>
                  ) : (
                    translations.subscribeButton
                  )}
                </button>
              </form>

              {isSubscribed && (
                <motion.div 
                  className="mt-4 bg-green-500/20 border border-green-500/30 text-green-300 px-6 py-4 rounded-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{translations.successMessage}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Right Side - Phone Image (Higher) */}
          <motion.div 
            className="flex justify-center lg:justify-end -mt-28 lg:-mt-36"
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ 
              duration: 1.4, 
              delay: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth deceleration
            }}
            style={{ y: parallaxY * 0.2 }}
          >
            <div className="relative">
              {/* Phone Mockup */}
              <div className="w-96 h-[650px] lg:w-[550px] lg:h-[750px] rounded-3xl overflow-hidden">
                <img 
                  src="/logo-intro.png" 
                  alt={isGreek ? 'Pathly App - Ασφαλής Πλοήγηση' : 'Pathly App - Safe Navigation'}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Home;
