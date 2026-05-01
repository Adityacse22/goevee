/**
 * VIEW — Password strength indicator.
 * Extracted from SignUp.tsx (lines 161-180).
 * Pure presentation — evaluates strength via model function.
 */

import React from 'react';
import {
  evaluatePasswordStrength,
  PASSWORD_STRENGTH_LABELS,
  PASSWORD_STRENGTH_COLORS,
  PASSWORD_STRENGTH_TEXT_COLORS,
} from '@/models/auth.model';

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  if (!password) return null;

  const strength = evaluatePasswordStrength(password);

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs text-white/70">Password strength:</div>
        <div className={`text-xs ${PASSWORD_STRENGTH_TEXT_COLORS[strength]}`}>
          {PASSWORD_STRENGTH_LABELS[strength]}
        </div>
      </div>
      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${PASSWORD_STRENGTH_COLORS[strength]}`}
          style={{ width: `${strength * 33}%` }}
        />
      </div>
    </div>
  );
};

export default PasswordStrength;
