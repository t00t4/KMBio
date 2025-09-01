// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Password validation
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

// Name validation
export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

// Vehicle year validation
export const isValidVehicleYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear + 1;
};

// Form validation helpers
export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 6) return 'weak';
  if (password.length < 8) return 'medium';
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (criteriaCount >= 3) return 'strong';
  if (criteriaCount >= 2) return 'medium';
  return 'weak';
};

// Error message helpers
export const getEmailErrorMessage = (email: string): string | null => {
  if (!email) return 'Email é obrigatório';
  if (!validateEmail(email)) return 'Email inválido';
  return null;
};

export const getPasswordErrorMessage = (password: string): string | null => {
  if (!password) return 'Senha é obrigatória';
  if (!validatePassword(password)) return 'Senha deve ter pelo menos 6 caracteres';
  return null;
};

export const getNameErrorMessage = (name: string): string | null => {
  if (!name) return 'Nome é obrigatório';
  if (!validateName(name)) return 'Nome deve ter pelo menos 2 caracteres';
  return null;
};

export const getConfirmPasswordErrorMessage = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Confirmação de senha é obrigatória';
  if (password !== confirmPassword) return 'Senhas não coincidem';
  return null;
};

// Legacy exports for backward compatibility
export const isValidEmail = validateEmail;

// Vehicle validators
export * from './vehicleValidators';
