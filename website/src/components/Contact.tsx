import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParallax } from '../hooks/useParallax';

interface ContactProps {
  isGreek: boolean;
}

const Contact: React.FC<ContactProps> = ({ isGreek }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const parallaxY = useParallax(0.3);

  const translations = {
    subtitle: isGreek ? 'Επικοινωνία' : 'Contact',
    title: isGreek ? 'Ας Μιλήσουμε' : 'Let\'s Talk',
    description: isGreek 
      ? 'Έχετε ερωτήσεις για το Pathly; Θέλετε να μάθετε περισσότερα; Επικοινωνήστε μαζί μας και θα σας απαντήσουμε το συντομότερο δυνατό.'
      : 'Have questions about Pathly? Want to learn more? Get in touch with us and we\'ll get back to you as soon as possible.',
    form: {
      name: isGreek ? 'Όνομα' : 'Name',
      email: isGreek ? 'Email' : 'Email',
      subject: isGreek ? 'Θέμα' : 'Subject',
      message: isGreek ? 'Μήνυμα' : 'Message',
      namePlaceholder: isGreek ? 'Το όνομά σας' : 'Your name',
      emailPlaceholder: isGreek ? 'your@email.com' : 'your@email.com',
      subjectPlaceholder: isGreek ? 'Περιγράψτε το θέμα' : 'Describe the subject',
      messagePlaceholder: isGreek ? 'Γράψτε το μήνυμά σας εδώ...' : 'Write your message here...',
      submit: isGreek ? 'Αποστολή Μηνύματος' : 'Send Message',
      submitting: isGreek ? 'Αποστολή...' : 'Sending...',
      success: isGreek ? 'Ευχαριστούμε! Θα σας απαντήσουμε σύντομα.' : 'Thank you! We\'ll get back to you soon.',
      error: isGreek ? 'Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία' : 'Please fill in all required fields'
    },
    contactInfo: {
      title: isGreek ? 'Πληροφορίες Επικοινωνίας' : 'Contact Information',
      email: 'hello@pathly.app',
      phone: isGreek ? 'Τηλέφωνο' : 'Phone',
      address: isGreek ? 'Διεύθυνση' : 'Address',
      location: isGreek ? 'Αθήνα, Ελλάδα' : 'Athens, Greece'
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert(translations.form.error);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    }, 2000);
  };

  return (
    <section id="contact" className="min-h-screen bg-primary-black py-20 relative overflow-hidden">
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
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          {/* Yellow Subtitle */}
          <motion.div 
            className="text-primary-yellow text-sm uppercase tracking-widest font-medium mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {translations.subtitle}
          </motion.div>

          {/* Main Heading */}
          <motion.h2 
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary-white font-display mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 1.2, 
              delay: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            viewport={{ once: true }}
          >
            {translations.title}
          </motion.h2>

          {/* Description */}
          <motion.p 
            className="text-lg text-primary-gray leading-relaxed max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            {translations.description}
          </motion.p>
        </motion.div>

        {/* Contact Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Contact Form */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50">
              <h3 className="text-2xl font-bold text-primary-white mb-6">
                {isGreek ? 'Στείλτε μας μήνυμα' : 'Send us a message'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-primary-gray text-sm font-medium mb-2">
                      {translations.form.name} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={translations.form.namePlaceholder}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-primary-white placeholder-primary-gray focus:outline-none focus:border-primary-neon focus:ring-2 focus:ring-primary-neon/20 transition-all duration-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-primary-gray text-sm font-medium mb-2">
                      {translations.form.email} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={translations.form.emailPlaceholder}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-primary-white placeholder-primary-gray focus:outline-none focus:border-primary-neon focus:ring-2 focus:ring-primary-neon/20 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-primary-gray text-sm font-medium mb-2">
                    {translations.form.subject} *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder={translations.form.subjectPlaceholder}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-primary-white placeholder-primary-gray focus:outline-none focus:border-primary-neon focus:ring-2 focus:ring-primary-neon/20 transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-primary-gray text-sm font-medium mb-2">
                    {translations.form.message} *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={translations.form.messagePlaceholder}
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-primary-white placeholder-primary-gray focus:outline-none focus:border-primary-neon focus:ring-2 focus:ring-primary-neon/20 transition-all duration-300 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-pill bg-primary-neon text-primary-black font-semibold py-4 hover:bg-green-400 disabled:opacity-50 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-primary-black border-t-transparent rounded-full animate-spin"></div>
                      <span>{translations.form.submitting}</span>
                    </div>
                  ) : (
                    translations.form.submit
                  )}
                </button>
              </form>

              {isSubmitted && (
                <motion.div 
                  className="mt-6 bg-green-500/20 border border-green-500/30 text-green-300 px-6 py-4 rounded-xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{translations.form.success}</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-br from-primary-neon/10 to-primary-yellow/10 backdrop-blur-sm rounded-3xl p-8 border border-primary-neon/20">
              <h3 className="text-2xl font-bold text-primary-white mb-6">
                {translations.contactInfo.title}
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-neon/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-primary-white font-semibold mb-1">Email</h4>
                    <p className="text-primary-gray">{translations.contactInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-yellow/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-primary-white font-semibold mb-1">{translations.contactInfo.phone}</h4>
                    <p className="text-primary-gray">+30 210 123 4567</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-neon/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-primary-white font-semibold mb-1">{translations.contactInfo.address}</h4>
                    <p className="text-primary-gray">{translations.contactInfo.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30">
              <h4 className="text-xl font-bold text-primary-white mb-4">
                {isGreek ? 'Γρήγορη Απάντηση' : 'Quick Response'}
              </h4>
              <p className="text-primary-gray leading-relaxed mb-4">
                {isGreek 
                  ? 'Συνήθως απαντάμε εντός 24 ωρών. Για επείγοντα θέματα, μπορείτε να μας καλέσετε απευθείας.'
                  : 'We usually respond within 24 hours. For urgent matters, you can call us directly.'
                }
              </p>
              <div className="flex items-center space-x-2 text-primary-neon">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">
                  {isGreek ? '24 ώρες απάντηση' : '24h response time'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
