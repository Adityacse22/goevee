
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import SearchBar from "../SearchBar";
import { Menu, User, Sun, Moon } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from 'react-router-dom';
import { useAuth } from '@/controllers/useAuth';

interface NavbarProps {
  hasScrolled?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ 
  hasScrolled = false
}) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    // Check system preference or saved preference when component mounts
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.classList.toggle('light-mode', savedTheme !== 'dark');
    } else {
      // Default to dark mode as our app is designed for it
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    
    // Update CSS variables or classes if needed for actual theme change
    document.documentElement.classList.toggle('light-mode', !newMode);
    
    // Show feedback to user
    toast.success(`${newMode ? 'Dark' : 'Light'} mode activated`);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const navVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 20,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 ${
        hasScrolled 
          ? 'glass-card bg-black/40 backdrop-blur-lg border-b border-white/10' 
          : 'bg-transparent backdrop-blur-none'
      } px-4 py-3 mx-0 md:mx-4 md:mt-4 flex items-center justify-between transition-all duration-500`}
      initial="hidden"
      animate="visible"
      variants={navVariants}
    >
      <motion.div className="flex items-center" variants={itemVariants}>
        <motion.div 
          className="mr-3"
          whileHover={{ 
            rotate: [0, -10, 10, -10, 0],
            transition: { duration: 0.5 }
          }}
        >
          <motion.svg 
            className="w-8 h-8" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              delay: 0.2
            }}
          >
            <motion.path 
              d="M8 3V8M16 3V8M7 16H9M15 16H17M11 11H13M11 15H13M7 12H9M15 12H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" 
              className="stroke-ev-blue" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </motion.svg>
        </motion.div>
        <motion.h1 
          className="text-lg font-bold gradient-text hidden sm:block"
          variants={itemVariants}
        >
          Evee
        </motion.h1>
      </motion.div>
      
      <motion.div 
        className="hidden md:flex items-center gap-4 flex-grow max-w-md mx-4"
        variants={itemVariants}
      >
        <SearchBar />
      </motion.div>
      
      <motion.div 
        className="flex items-center gap-3"
        variants={itemVariants}
      >
        {/* Dark Mode Toggle */}
        <motion.div
          className="relative"
        >
          <motion.button
            className="glass-button rounded-full w-10 h-10 flex items-center justify-center"
            onClick={toggleDarkMode}
            whileHover={{ 
              boxShadow: isDarkMode 
                ? "0 0 15px 5px rgba(30, 174, 219, 0.4)" 
                : "0 0 15px 5px rgba(255, 166, 0, 0.4)" 
            }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isDarkMode ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-white" />
              ) : (
                <Sun className="h-5 w-5 text-white" />
              )}
            </motion.div>
          </motion.button>
        </motion.div>
        
        {/* User Button */}
        <motion.div whileTap={{ scale: 0.9 }}>
          <Link to={user ? "/profile" : "/login"}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="glass-button rounded-full w-10 h-10"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <User className="h-5 w-5 text-white" />
              </motion.div>
            </Button>
          </Link>
        </motion.div>
        
        <motion.div 
          className="flex items-center"
          whileTap={{ scale: 0.9 }}
        >
          <Button 
            variant="ghost" 
            size="icon"
            className="glass-button rounded-full w-10 h-10"
            onClick={toggleMenu}
          >
            <motion.div
              animate={{ rotate: isMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ 
                rotate: [0, 10, -10, 0],
                transition: { duration: 0.3 }
              }}
            >
              <Menu className="h-5 w-5 text-white" />
            </motion.div>
          </Button>
        </motion.div>
      </motion.div>

      {/* Hamburger / Mobile menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div 
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsMenuOpen(false)}
          />
          <motion.div 
            className="absolute top-full right-0 bg-zinc-950 border border-white/10 mt-2 p-4 flex flex-col gap-4 z-[101] max-h-[85vh] w-full max-w-[300px] overflow-y-auto origin-top-right rounded-2xl shadow-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          {/* User Section */}
          {user ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-ev-blue/20 flex items-center justify-center border border-ev-blue/30">
                <User className="w-5 h-5 text-ev-blue" />
              </div>
              <div className="flex flex-col overflow-hidden text-left">
                <span className="text-sm font-bold text-white truncate">{user.fullName || 'User'}</span>
                <span className="text-xs text-white/50 truncate">{user.email}</span>
              </div>
            </div>
          ) : (
            <Link 
              to="/login" 
              onClick={toggleMenu}
              className="flex items-center gap-3 p-3 rounded-xl bg-ev-blue/10 border border-ev-blue/20 text-ev-blue"
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-bold">Login / Sign Up</span>
            </Link>
          )}

          {/* DISCOVERY Section */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-1 text-left">Discovery</span>
            <Link to="/" onClick={toggleMenu} className="flex items-center gap-3 text-white hover:text-ev-blue transition-colors p-3 rounded-xl hover:bg-white/5">
              <Sun className="w-5 h-5 opacity-70" />
              <span className="text-sm">Home / Map</span>
            </Link>
            <Link to="/search" onClick={toggleMenu} className="flex items-center gap-3 text-white hover:text-ev-blue transition-colors p-3 rounded-xl hover:bg-white/5">
              <motion.svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></motion.svg>
              <span className="text-sm">Find Chargers</span>
            </Link>
          </div>

          {/* ACTIVITY Section */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-1 text-left">Activity</span>
            <Link to="/bookings" onClick={toggleMenu} className="flex items-center gap-3 text-white hover:text-ev-blue transition-colors p-3 rounded-xl hover:bg-white/5">
              <motion.svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3V8M16 3V8M3 10H21M5 5H19C20.1 5 21 5.9 21 7V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V7C3 5.9 3.9 5 5 5Z" /></motion.svg>
              <span className="text-sm">My Bookings</span>
            </Link>
            <Link to="/favorites" onClick={toggleMenu} className="flex items-center gap-3 text-white hover:text-ev-blue transition-colors p-3 rounded-xl hover:bg-white/5">
              <motion.svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 0 0-7.7 7.8l1.1 1 7.7 7.8 7.7-7.8 1.1-1a5.5 5.5 0 0 0 0-7.8Z" /></motion.svg>
              <span className="text-sm">Favorites</span>
            </Link>
          </div>

          {/* ACCOUNT Section */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-1 text-left">Account</span>
            <Link to="/profile" onClick={toggleMenu} className="flex items-center gap-3 text-white hover:text-ev-blue transition-colors p-3 rounded-xl hover:bg-white/5">
              <User className="w-5 h-5 opacity-70" />
              <span className="text-sm">My Profile</span>
            </Link>
            <Link to="/settings" onClick={toggleMenu} className="flex items-center gap-3 text-white hover:text-ev-blue transition-colors p-3 rounded-xl hover:bg-white/5">
              <motion.svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.2 2h-.4a2 2 0 0 0-1.9 1.5l-.2 1.2a7.7 7.7 0 0 1-1.2.5l-1.1-.5a2 2 0 0 0-2.4.5l-.3.3a2 2 0 0 0-.5 2.4l.5 1.1a7.7 7.7 0 0 1-.5 1.2l-1.2.2A2 2 0 0 0 2 11.8v.4a2 2 0 0 0 1.5 1.9l1.2.2a7.7 7.7 0 0 1 .5 1.2l-.5 1.1a2 2 0 0 0 .5 2.4l.3.3a2 2 0 0 0 2.4.5l1.1-.5a7.7 7.7 0 0 1 1.2.5l.2 1.2A2 2 0 0 0 11.8 22h.4a2 2 0 0 0 1.9-1.5l.2-1.2a7.7 7.7 0 0 1 1.2-.5l1.1.5a2 2 0 0 0 2.4-.5l.3-.3a2 2 0 0 0 .5-2.4l-.5-1.1a7.7 7.7 0 0 1 .5-1.2l1.2-.2a2 2 0 0 0 1.5-1.9v-.4a2 2 0 0 0-1.5-1.9l-1.2-.2a7.7 7.7 0 0 1-.5-1.2l.5-1.1a2 2 0 0 0-.5-2.4l-.3-.3a2 2 0 0 0-2.4-.5l-1.1.5a7.7 7.7 0 0 1-1.2-.5l-.2-1.2A2 2 0 0 0 12.2 2z" /><circle cx="12" cy="12" r="3" /></motion.svg>
              <span className="text-sm">Settings</span>
            </Link>
          </div>

          {/* AUTH Section */}
          {user && (
            <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
              <button 
                onClick={() => { signOut(); toggleMenu(); }} 
                className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors p-3 rounded-xl hover:bg-red-500/10 text-left w-full"
              >
                <motion.svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></motion.svg>
                <span className="text-sm font-bold">Logout</span>
              </button>
            </div>
          )}
        </motion.div>
      </>
    )}
    </motion.nav>
  );
};

export default Navbar;
