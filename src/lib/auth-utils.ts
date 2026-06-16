// --- Domain Validation ---

export const ALLOWED_DOMAINS = ['agenticdream.com', 'goavanto.com'] as const;
export type AllowedDomain = (typeof ALLOWED_DOMAINS)[number];

export function extractDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

export function isAllowedDomain(email: string): boolean {
  const domain = extractDomain(email);
  return ALLOWED_DOMAINS.includes(domain as AllowedDomain);
}

export function getDomainError(email: string): string | null {
  if (!email) return 'Email is required';
  if (!email.includes('@')) return 'Please enter a valid email address';
  if (!isAllowedDomain(email)) {
    return 'Access is restricted to authorized organization emails only (@agenticdream.com or @goavanto.com).';
  }
  return null;
}

// --- Password Validation ---

export interface PasswordValidation {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export function validatePassword(password: string): PasswordValidation {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  return {
    isValid: hasMinLength && hasUppercase && hasNumber && hasSpecialChar,
    hasMinLength,
    hasUppercase,
    hasNumber,
    hasSpecialChar,
  };
}

// --- Microsoft OAuth Domain Check ---

export function isMicrosoftDomain(email: string): boolean {
  return extractDomain(email) === 'goavanto.com';
}

// --- Supabase Error Message Mapping ---

export function getAuthErrorMessage(error: { message: string; status?: number }): string {
  const msg = error.message.toLowerCase();

  if (msg.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please verify your email address before logging in. Check your inbox for the confirmation link.';
  }
  if (msg.includes('user already registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (msg.includes('signup is not allowed') || msg.includes('signups not allowed')) {
    return 'Registration is currently disabled. Please contact your administrator.';
  }
  if (msg.includes('password')) {
    return 'Password does not meet the requirements. Please check and try again.';
  }

  return error.message || 'An unexpected error occurred. Please try again.';
}

// --- Session Helpers ---

export const SESSION_WARNING_MINUTES = 5;

export function getSessionExpiryTime(session: { expires_at?: number } | null): Date | null {
  if (!session?.expires_at) return null;
  return new Date(session.expires_at * 1000);
}

export function getTimeUntilExpiry(session: { expires_at?: number } | null): number {
  const expiry = getSessionExpiryTime(session);
  if (!expiry) return Infinity;
  return expiry.getTime() - Date.now();
}

export function isSessionExpiringSoon(session: { expires_at?: number } | null): boolean {
  const msRemaining = getTimeUntilExpiry(session);
  return msRemaining <= SESSION_WARNING_MINUTES * 60 * 1000 && msRemaining > 0;
}
