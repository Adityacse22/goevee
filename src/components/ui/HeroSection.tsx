import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const HeroSection: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();
  
  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Staggered text animation
  const headlineWords = "Building India's One-Stop Solution for Ev Vehicles".split(" ");
  
  return (
    <motion.div 
      className="relative h-screen flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Animated background layers with parallax effect */}
      {/* Removed the broken background image elements */}
      {/*
      <motion.div 
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(30, 174, 219, 0.1) 0%, rgba(0,0,0,0) 70%)',
          transform: `scale(1.1) translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)`
        }}
      />
      
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-[40vh] z-0 bg-cover bg-bottom opacity-20"
        style={{ 
          backgroundImage: 'url("https://i.imgur.com/NhGUdKa.png")',
          transform: `translateY(${scrollY * 0.1}px) translateX(${mousePosition.x * -10}px)`
        }}
      />
      
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[25vh] z-1 bg-contain bg-bottom bg-no-repeat opacity-40"
        style={{ 
          backgroundImage: 'url("https://i.imgur.com/CZGnZ8i.png")',
          transform: `translateY(${scrollY * 0.05}px) translateX(${mousePosition.x * -30}px)`
        }}
      />
      */}
      
      {/* Light beams (optional - keep or remove as desired) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[1px] h-[80vh] bg-gradient-to-b from-transparent via-ev-blue to-transparent opacity-30"
            style={{ 
              left: `${15 + i * 20}%`,
              transform: `rotate(${5 - i * 2}deg)`
            }}
            animate={{
              height: ["70vh", "80vh", "70vh"],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>

      {/* Foreground content */}
      <div className="relative z-30 text-center px-4 max-w-5xl flex flex-col items-center mt-24">
        {/* Staggered headline animation */}
        <div className="overflow-hidden mb-6">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-7xl font-bold text-white flex flex-wrap justify-center gap-x-4 gap-y-2"
            initial="hidden"
            animate="visible"
          >
            {headlineWords.map((word, i) => {
              const isHighlight = word === "One-Stop" || word === "Solution";
              return (
                <motion.span
                  key={i}
                  className={isHighlight ? "text-transparent bg-clip-text bg-gradient-to-r from-ev-blue to-ev-green" : ""}
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: 0.5 + i * 0.1,
                    type: "spring",
                    damping: 12
                  }}
                >
                  {word}
                </motion.span>
              );
            })}
          </motion.h1>
        </div>
        
        <motion.p 
          className="text-white/70 text-lg md:text-xl mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          Discover and book the nearest charging stations for your electric vehicle with our innovative platform.
        </motion.p>
        {/* Animated CTA button */}
        <motion.button
          onClick={() => navigate('/ev-charger-station')}
          className="relative px-8 py-3 text-lg font-medium rounded-full bg-gradient-to-r from-ev-blue to-ev-green text-white overflow-hidden group"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            delay: 1.5,
            type: "spring",
            stiffness: 400,
            damping: 10
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Inner glow effect */}
          <motion.span 
            className="absolute inset-0 bg-white opacity-0 rounded-full"
            animate={{ 
              opacity: [0, 0.2, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
          
          {/* Button content */}
          <span className="relative z-10 flex items-center gap-2">
            Locate Chargers
            <motion.span
              animate={{ 
                y: [0, -5, 0],
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop"
              }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.span>
          </span>
          
          {/* Hover effect */}
          <motion.span 
            className="absolute inset-0 bg-gradient-to-r from-ev-green to-ev-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </motion.button>
      </div>

      <motion.div 
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <motion.img
          src="/images/tata_harrier_ev_transparent.png"
          alt="Tata Harrier EV"
          className="w-48 object-contain"
          style={{ filter: 'drop-shadow(0 0 10px rgba(30, 174, 219, 0.5))' }}
          animate={{ 
            y: [0, 8, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 2.5,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut"
          }}
        />
      </motion.div>
      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-ev-blue rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 50 - 25],
            y: [0, Math.random() * 50 - 25],
            opacity: [0, 0.6, 0],
            scale: [0, Math.random() * 2 + 1, 0]
          }}
          transition={{
            duration: Math.random() * 4 + 6,
            repeat: Infinity,
            repeatType: "loop",
            delay: Math.random() * 5
          }}
        />
      ))}
    </motion.div>
  );
};

export default HeroSection;
