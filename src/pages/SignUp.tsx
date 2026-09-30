import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { Facebook, Twitter, Linkedin, Mail, CheckCircle } from "lucide-react";
import BotCheck from '@/components/auth/BotCheck';
import { loginFields, registerFields } from '../../shared/validation';
import { useAuth } from '@/controllers/useAuth';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setFormError('');
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const protection = { website: String(formData.get('website') ?? ''), turnstileToken, acceptedTerms: formData.get('terms') === 'on' };
    const result = registerFields.safeParse({ fullName: name, email, password, ...protection });
    if (!result.success) { setFormError(result.error.issues[0].message); return; }
    if (password !== confirmPassword) { setFormError('Passwords do not match.'); return; }
    if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) { setFormError('Complete the security check first.'); return; }

    setIsLoading(true);

    try {
      await signUp(result.data.email, password, result.data.fullName, protection);
      toast.success("Account created successfully!");
      navigate('/');
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Unable to create your account.");
      toast.error(error instanceof Error ? error.message : "Failed to create account. Please try again.");
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
          Create Account
        </motion.h1>

        <motion.form aria-describedby={formError ? "form-error" : undefined} onSubmit={handleSubmit} className="space-y-5" variants={itemVariants}>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Full Name</Label>
            <Input
              id="name" name="fullName" autoComplete="name" minLength={2} maxLength={100}
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
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password" name="password" autoComplete="new-password" maxLength={72} minLength={12} aria-describedby="password-help"
              type="password"
              placeholder="••••••••"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <p id="password-help" className="text-sm text-slate-300">Use at least 12 characters. A long, unique passphrase works well.</p>
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
              id="confirmPassword" name="confirmPassword" autoComplete="new-password" minLength={12} maxLength={72}
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
              id="terms" name="terms"
              className="mt-1"
              required
            />
            <label htmlFor="terms" className="text-white/70">
              I am at least 18 and agree to the <Link to="/terms" className="text-ev-blue hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-ev-blue hover:underline">Privacy Policy</Link>
            </label>
          </div>

          <BotCheck action="register" onToken={setTurnstileToken} resetKey={resetKey} />
          {formError && <p id="form-error" role="alert" className="text-sm text-red-300">{formError}</p>}
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
        © {new Date().getFullYear()} Evee. All rights reserved.
      </motion.p>
    </main>
  );
};

export default SignUp;
