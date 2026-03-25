
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import SearchBar from "../ui/SearchBar";
import { Menu, User, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { Link } from 'react-router-dom';

interface NavbarProps {
  hasScrolled?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: () => void;
  isSearching?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ 
  hasScrolled = false,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  isSearching
}) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
<<<<<<< HEAD
        <SearchBar 
          value={searchQuery}
          onChange={onSearchChange}
          onSubmit={onSearchSubmit}
          isLoading={isSearching}
        />
=======
        <SearchBar />
        <Link to="/booking">
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 whitespace-nowrap"
            size="sm"
          >
            Book Now
          </Button>
        </Link>
>>>>>>> origin/main
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
          <Link to="/login">
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
        
        {/* Menu Button (Mobile) */}
        <motion.div 
          className="md:hidden"
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

      {/* Mobile menu */}
      {isMenuOpen && (
        <motion.div 
          className="absolute top-full left-0 right-0 glass-card mt-2 p-4 flex flex-col gap-2 md:hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <Link to="/" className="text-white hover:text-ev-blue transition-colors p-2">Home</Link>
          <Link to="/stations" className="text-white hover:text-ev-blue transition-colors p-2">Station Finder</Link>
          <Link to="/booking" className="text-white hover:text-ev-blue transition-colors p-2">Booking</Link>
          <Link to="/pricing" className="text-white hover:text-ev-blue transition-colors p-2">Pricing</Link>
          <Link to="/login" className="text-white hover:text-ev-blue transition-colors p-2">Login / Sign Up</Link>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
