export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordFormData {
  email: string;
}

export interface FormValidationErrors {
  [key: string]: string;
}

export interface AuthFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export type AuthScreens = 'login' | 'signup' | 'reset-password' | 'onboarding';