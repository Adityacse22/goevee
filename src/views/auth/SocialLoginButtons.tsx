/**
 * VIEW — Auth social login buttons.
 * Extracted from the duplicate JSX in Login.tsx (lines 144-161)
 * and SignUp.tsx (lines 244-261). Zero business logic.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Linkedin, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface SocialLoginButtonsProps {
  mode: 'login' | 'signup';
}

const providers = [
  { icon: <Facebook size={18} />, name: 'Facebook' },
  { icon: <Twitter size={18} />, name: 'Twitter' },
  { icon: <Linkedin size={18} />, name: 'LinkedIn' },
  { icon: <Mail size={18} />, name: 'Google' },
];

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ mode }) => {
  const verb = mode === 'login' ? 'Sign in' : 'Sign up';
  const label = mode === 'login' ? 'Or continue with' : 'Or sign up with';

  return (
    <div className="mt-8 text-center">
      <p className="text-white/70 mb-4">{label}</p>
      <div className="flex justify-center space-x-4">
        {providers.map((provider) => (
          <motion.button
            key={provider.name}
            className="glass-button w-10 h-10 flex items-center justify-center rounded-full"
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`${verb} with ${provider.name}`}
            onClick={() => toast.info(`${provider.name} ${mode} coming soon!`)}
          >
            {provider.icon}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SocialLoginButtons;
