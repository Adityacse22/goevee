import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { Facebook, Twitter, Linkedin, Mail } from "lucide-react";
import { useAuth } from '@/controllers/useAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email, password);
      toast.success("Successfully logged in!");
      navigate('/');
    } catch (error: unknown) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to login. Please try again.");
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
          Welcome Back
        </motion.h1>
        
        <motion.form onSubmit={handleSubmit} className="space-y-6" variants={itemVariants}>
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
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Link 
                to="/reset-password" 
                className="text-ev-blue text-sm hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-ev-blue to-ev-green hover:opacity-90 font-medium py-2 rounded-full transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
                <span>Logging in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </motion.form>
        
        <motion.div 
          className="mt-8 text-center"
          variants={itemVariants}
        >
          <p className="text-white/70 mb-4">Or continue with</p>
          
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
                aria-label={`Sign in with ${provider.name}`}
                onClick={() => toast.info(`${provider.name} login coming soon!`)}
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
            Don't have an account?{" "}
            <Link to="/signup" className="text-ev-blue hover:underline">
              Sign Up
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

export default Login;
