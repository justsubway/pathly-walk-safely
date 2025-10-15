import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface FeaturesProps {
  isGreek: boolean;
}

const Features: React.FC<FeaturesProps> = ({ isGreek }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<(HTMLDivElement | null)[]>([]);

  const features = [
    {
      id: 'ai-feedback',
      title: isGreek ? 'AI Powered Feedback' : 'AI Powered Feedback',
      description: isGreek 
        ? 'Το Pathly χρησιμοποιεί τεχνητή νοημοσύνη για να αναλύει τα δεδομένα ασφαλείας σε πραγματικό χρόνο και να παρέχει προσωποποιημένες συστάσεις για τις ασφαλέστερες διαδρομές.'
        : 'Pathly uses artificial intelligence to analyze safety data in real-time and provide personalized recommendations for the safest routes.',
      image: '/feature-ai.gif'
    },
    {
      id: 'customizable',
      title: isGreek ? 'Customizable Time and Location' : 'Customizable Time and Location',
      description: isGreek 
        ? 'Προσαρμόστε το Pathly στις ανάγκες σας επιλέγοντας συγκεκριμένες ώρες και τοποθεσίες. Το σύστημα προσαρμόζεται στις προτιμήσεις σας για μέγιστη ασφάλεια.'
        : 'Customize Pathly to your needs by selecting specific times and locations. The system adapts to your preferences for maximum safety.',
      image: '/feature-customizable.gif'
    },
    {
      id: 'real-data',
      title: isGreek ? 'Real World Data' : 'Real World Data',
      description: isGreek 
        ? 'Βασισμένο σε πραγματικά δεδομένα από αστυνομικές αναφορές και ποινικά μητρώα. Το Pathly παρέχει ακριβείς πληροφορίες ασφαλείας για κάθε περιοχή.'
        : 'Based on real data from police reports and criminal records. Pathly provides accurate safety information for every area.',
      image: '/feature-data.gif'
    }
  ];

         useEffect(() => {
           features.forEach((_, index) => {
             const featureElement = featuresRef.current[index];
             if (!featureElement) return;

             const textElements = featureElement.querySelectorAll('.feature-text');
             
             // Set initial state - all letters invisible
             textElements.forEach(textEl => {
               const letters = textEl.querySelectorAll('[data-letter]');
               gsap.set(letters, { 
                 opacity: 0,
                 color: "#FFFFFF",
                 textShadow: "none"
               });
             });

             // Create scroll trigger for each feature
             ScrollTrigger.create({
               trigger: featureElement,
               start: "top 90%",
               end: "top 10%",
               scrub: true, // Smooth scroll-driven animation
               onUpdate: (self) => {
                 const progress = self.progress; // 0 to 1 based on scroll position
                 
                 textElements.forEach(textEl => {
                   const letters = textEl.querySelectorAll('[data-letter]');
                   const totalLetters = letters.length;
                   
                   letters.forEach((letter, letterIndex) => {
                     // Faster animation - letters appear more quickly
                     const letterProgress = (letterIndex + 1) / totalLetters;
                     const letterAnimationProgress = Math.max(0, Math.min(1, (progress - (letterIndex / totalLetters)) * (totalLetters * 0.6)));
                     
                     if (letterAnimationProgress > 0) {
                       // Stage 1: Invisible to Neon Green (faster)
                       if (letterAnimationProgress <= 0.2) {
                         const neonProgress = letterAnimationProgress / 0.2;
                         gsap.set(letter, {
                           opacity: neonProgress,
                           color: "#9DFF00",
                           textShadow: `0 0 ${neonProgress * 10}px #9DFF00, 0 0 ${neonProgress * 20}px #9DFF00`
                         });
                       }
                       // Stage 2: Neon Green to Normal White (faster)
                       else if (letterAnimationProgress <= 0.4) {
                         const transitionProgress = (letterAnimationProgress - 0.2) / 0.2;
                         gsap.set(letter, {
                           opacity: 1,
                           color: `rgb(${Math.round(157 + (255 - 157) * transitionProgress)}, ${Math.round(255 + (255 - 255) * transitionProgress)}, ${Math.round(0 + (255 - 0) * transitionProgress)})`,
                           textShadow: `0 0 ${(1 - transitionProgress) * 10}px #9DFF00`
                         });
                       }
                       // Stage 3: Normal White (final state)
                       else {
                         gsap.set(letter, {
                           opacity: 1,
                           color: "#FFFFFF",
                           textShadow: "none"
                         });
                       }
                     } else {
                       // Letter not yet reached by scroll
                       gsap.set(letter, {
                         opacity: 0,
                         color: "#FFFFFF",
                         textShadow: "none"
                       });
                     }
                   });
                 });
               }
             });
           });

           return () => {
             ScrollTrigger.getAll().forEach(trigger => trigger.kill());
           };
         }, [isGreek]);

  return (
    <section id="features" className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-neon/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-yellow/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div ref={containerRef} className="relative z-10">
        {/* Header */}
        <div className="pt-16 pb-8 text-center">
          <div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight" style={{ fontFamily: 'Quicksand, sans-serif' }}>
              {isGreek 
                ? 'Φανταστείτε την ασφάλεια προσαρμοσμένη, όπου κάθε βήμα σας προστατεύεται από την τεχνητή νοημοσύνη'
                : 'Imagine safety, personalized, where every step is protected by Artifial Intelligence'
              }
            </h2>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {features.map((feature, index) => (
            <div 
              key={feature.id} 
              ref={el => { featuresRef.current[index] = el; }}
              className="h-[70vh] flex items-center py-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                {/* Text Content */}
                <div className={`${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'} relative`}>
                  <div className="space-y-4 break-words max-w-full" style={{ minWidth: 0 }}>
                           {/* Feature Number */}
                           <div className="text-6xl font-bold text-primary-neon/20 feature-text">
                             {String(index + 1).padStart(2, '0').split('').map((char, charIndex) => (
                               <span key={charIndex} data-letter={charIndex} className="inline-block whitespace-pre-wrap">
                                 {char === ' ' ? '\u00A0' : char}
                               </span>
                             ))}
                           </div>

                           {/* Feature Title */}
                           <h3 className="text-4xl sm:text-5xl font-bold text-white feature-text" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                             {feature.title.split(' ').map((word, wordIndex) => (
                               <span key={wordIndex} className="inline-block mr-1">
                                 {word.split('').map((char, charIndex) => (
                                   <span key={charIndex} data-letter={`${wordIndex}-${charIndex}`} className="inline-block">
                                     {char}
                                   </span>
                                 ))}
                                 {wordIndex < feature.title.split(' ').length - 1 && <span className="inline-block w-1"></span>}
                               </span>
                             ))}
                           </h3>

                           {/* Feature Description */}
                           <p className="text-lg text-gray-300 leading-relaxed feature-text" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                             {feature.description.split(' ').map((word, wordIndex) => (
                               <span key={wordIndex} className="inline-block mr-1">
                                 {word.split('').map((char, charIndex) => (
                                   <span key={charIndex} data-letter={`${wordIndex}-${charIndex}`} className="inline-block">
                                     {char}
                                   </span>
                                 ))}
                                 {wordIndex < feature.description.split(' ').length - 1 && <span className="inline-block w-1"></span>}
                               </span>
                             ))}
                           </p>
                         </div>
                </div>

                {/* Image/Video Content */}
                <div className={`${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'} relative`}>
                  <div className="relative">
                    <div className="w-full h-96 rounded-2xl overflow-hidden border border-gray-700 bg-black">
                      {feature.id === 'ai-feedback' ? (
                        <video
                          src="/Real_Time_City_Data_Visualization.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                          style={{ objectPosition: '100% 0%' }}
                        />
                      ) : feature.id === 'customizable' ? (
                        <video
                          src="/Cinematic_App_Video_With_Time_Transitions.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={feature.image}
                          alt={feature.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Green overlay when in view */}
                    <div className="absolute inset-0 bg-primary-neon/10 rounded-2xl opacity-0 transition-opacity duration-500" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Features;
