import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { Facebook, Twitter, Linkedin, Mail } from "lucide-react";
import BotCheck from '@/components/auth/BotCheck';
import { loginFields, registerFields } from '../../shared/validation';
import { useAuth } from '@/controllers/useAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setFormError('');
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const protection = { website: String(formData.get('website') ?? ''), turnstileToken, acceptedTerms: formData.get('terms') === 'on' };
    const result = loginFields.safeParse({ email, password });
    if (!result.success) { setFormError(result.error.issues[0].message); return; }
    if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) { setFormError('Complete the security check first.'); return; }

    setIsLoading(true);

    try {
      await signIn(result.data.email, password, protection);
      toast.success("Successfully logged in!");
      navigate('/');
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Unable to sign in.");
      toast.error(error instanceof Error ? error.message : "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
      setTurnstileToken('');
      setResetKey(value => value + 1);
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
    <main id="main-content" tabIndex={-1} className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        className="glass-card p-5 sm:p-8 max-w-md w-full mx-auto rounded-2xl"
        initial={false}
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

        <motion.form aria-describedby={formError ? "form-error" : undefined} onSubmit={handleSubmit} className="space-y-6" variants={itemVariants}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email" name="email" autoComplete="email" maxLength={254}
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
                to="/help"
                className="text-ev-blue text-sm hover:underline"
              >
                Need help signing in?
              </Link>
            </div>
            <Input
              id="password" name="password" autoComplete="current-password" maxLength={256}
              type="password"
              placeholder="••••••••"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <BotCheck action="login" onToken={setTurnstileToken} resetKey={resetKey} />
          {formError && <p id="form-error" role="alert" className="text-sm text-red-300">{formError}</p>}
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
        © {new Date().getFullYear()} Evee. All rights reserved.
      </motion.p>
    </main>
  );
};

export default Login;
