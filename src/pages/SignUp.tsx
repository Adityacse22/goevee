import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { Facebook, Twitter, Linkedin, Mail, CheckCircle } from "lucide-react";
import { useAuth } from '@/controllers/useAuth';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill all required fields");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, name);
      toast.success("Account created successfully! Please check your email to verify your account.");
      navigate('/');
    } catch (error: unknown) {
      console.error("Signup error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        damping: 12
      }
    }
  };

  // Password strength indicators
  const passwordStrength = password.length === 0 
    ? 0 
    : password.length < 6 
      ? 1 
      : password.length < 10 
        ? 2 
        : 3;
        
  const passwordStrengthText = [
    "No password",
    "Weak",
    "Medium",
    "Strong"
  ];
  
  const passwordStrengthColor = [
    "bg-transparent",
    "bg-red-500",
    "bg-yellow-500",
    "bg-green-500"
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        className="glass-card p-8 max-w-md w-full mx-auto rounded-2xl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Link to="/" className="block mb-8 text-center">
          <motion.div 
            className="inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <h2 className="text-2xl font-bold gradient-text">Evee</h2>
          </motion.div>
        </Link>

        <motion.h1 
          className="text-3xl font-bold text-center mb-8 text-white"
          variants={itemVariants}
        >
          Create Account
        </motion.h1>
        
        <motion.form onSubmit={handleSubmit} className="space-y-5" variants={itemVariants}>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              className="glass-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="glass-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            {password && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs text-white/70">Password strength:</div>
                  <div className={`text-xs ${
                    passwordStrength === 1 ? "text-red-400" : 
                    passwordStrength === 2 ? "text-yellow-400" : 
                    passwordStrength === 3 ? "text-green-400" : ""
                  }`}>
                    {passwordStrengthText[passwordStrength]}
                  </div>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${passwordStrengthColor[passwordStrength]}`} 
                    style={{ width: `${passwordStrength * 33}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="glass-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            
            {confirmPassword && password === confirmPassword && (
              <div className="flex items-center mt-1 text-green-400 text-xs">
                <CheckCircle size={12} className="mr-1" />
                <span>Passwords match</span>
              </div>
            )}
            
            {confirmPassword && password !== confirmPassword && (
              <div className="text-red-400 text-xs mt-1">
                Passwords do not match
              </div>
            )}
          </div>
          
          <div className="flex items-start space-x-2 text-sm">
            <input 
              type="checkbox" 
              id="terms" 
              className="mt-1"
              required
            />
            <label htmlFor="terms" className="text-white/70">
              I agree to the <Link to="/terms" className="text-ev-blue hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-ev-blue hover:underline">Privacy Policy</Link>
            </label>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-ev-blue to-ev-green hover:opacity-90 font-medium py-2 rounded-full transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
                <span>Creating Account...</span>
              </div>
            ) : (
              "Sign Up"
            )}
          </Button>
        </motion.form>
        
        <motion.div 
          className="mt-8 text-center"
          variants={itemVariants}
        >
          <p className="text-white/70 mb-4">Or sign up with</p>
          
          <div className="flex justify-center space-x-4">
            {[
              { icon: <Facebook size={18} />, name: "Facebook" },
              { icon: <Twitter size={18} />, name: "Twitter" },
              { icon: <Linkedin size={18} />, name: "LinkedIn" },
              { icon: <Mail size={18} />, name: "Google" },
            ].map((provider) => (
              <motion.button
                key={provider.name}
                className="glass-button w-10 h-10 flex items-center justify-center rounded-full"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Sign up with ${provider.name}`}
                onClick={() => toast.info(`${provider.name} signup coming soon!`)}
              >
                {provider.icon}
              </motion.button>
            ))}
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-8 text-center" 
          variants={itemVariants}
        >
          <p className="text-white/70">
            Already have an account?{" "}
            <Link to="/login" className="text-ev-blue hover:underline">
              Sign In
            </Link>
          </p>
        </motion.div>
      </motion.div>
      
      <motion.p 
        className="mt-8 text-white/40 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        © 2025 Evee. All rights reserved.
      </motion.p>
    </div>
  );
};

export default SignUp;
