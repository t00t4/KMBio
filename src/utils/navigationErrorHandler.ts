import { Alert } from 'react-native';

export interface NavigationError extends Error {
  code?: string;
  context?: string;
}

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  allowRetry?: boolean;
  onRetry?: () => void;
  fallback?: () => void;
  context?: string;
}

/**
 * Handles navigation errors with user-friendly messages and retry options
 */
export const handleNavigationError = (
  error: Error | NavigationError,
  options: ErrorHandlerOptions = {}
): void => {
  const {
    showAlert = true,
    allowRetry = false,
    onRetry,
    fallback,
    context = 'navegação'
  } = options;

  // Log the error for debugging
  console.error(`❌ Navigation error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    code: (error as NavigationError).code,
    context: (error as NavigationError).context || context
  });

  if (!showAlert) {
    return;
  }

  // Determine user-friendly error message
  const getUserFriendlyMessage = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('navigation') || message.includes('navigate')) {
      return 'Erro ao navegar entre telas. Verifique sua conexão e tente novamente.';
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Problema de conexão. Verifique sua internet e tente novamente.';
    }
    
    if (message.includes('timeout')) {
      return 'A operação demorou muito para responder. Tente novamente.';
    }
    
    if (message.includes('permission')) {
      return 'Permissão necessária não foi concedida. Verifique as configurações do app.';
    }
    
    return `Erro inesperado durante ${context}. Tente novamente.`;
  };

  const userMessage = getUserFriendlyMessage(error);
  const buttons: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }> = [];

  // Add retry button if allowed and callback provided
  if (allowRetry && onRetry) {
    buttons.push({
      text: 'Tentar Novamente',
      onPress: () => {
        console.log(`🔄 User requested retry for ${context}`);
        onRetry();
      }
    });
  }

  // Add fallback button if provided
  if (fallback) {
    buttons.push({
      text: 'Alternativa',
      onPress: () => {
        console.log(`🔀 User chose fallback for ${context}`);
        fallback();
      }
    });
  }

  // Always add cancel/ok button
  buttons.push({
    text: buttons.length > 0 ? 'Cancelar' : 'OK',
    style: 'cancel',
    onPress: () => console.log(`❌ User dismissed error dialog for ${context}`)
  });

  Alert.alert(
    'Erro de Navegação',
    userMessage,
    buttons
  );
};

/**
 * Handles authentication errors with specific messaging
 */
export const handleAuthError = (
  error: Error,
  options: Omit<ErrorHandlerOptions, 'context'> = {}
): void => {
  console.error('❌ Authentication error:', error);

  const getUserFriendlyAuthMessage = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid_credentials') || message.includes('invalid login')) {
      return 'Email ou senha incorretos. Verifique suas credenciais.';
    }
    
    if (message.includes('email_not_confirmed')) {
      return 'Email não confirmado. Verifique sua caixa de entrada.';
    }
    
    if (message.includes('too_many_requests')) {
      return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Problema de conexão. Verifique sua internet e tente novamente.';
    }
    
    return 'Erro durante autenticação. Tente novamente.';
  };

  const userMessage = getUserFriendlyAuthMessage(error);
  
  handleNavigationError(error, {
    ...options,
    context: 'autenticação'
  });
};

/**
 * Wraps async navigation functions with error handling
 */
export const withNavigationErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: ErrorHandlerOptions = {}
) => {
  return async (...args: T): Promise<R | void> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleNavigationError(
        error instanceof Error ? error : new Error(String(error)),
        options
      );
    }
  };
};

/**
 * Creates a debounced version of a function to prevent rapid successive calls
 */
export const debounceNavigation = <T extends any[]>(
  fn: (...args: T) => void | Promise<void>,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let isExecuting = false;

  return (...args: T): void => {
    // If already executing, ignore the call
    if (isExecuting) {
      console.log('⚠️ Navigation call ignored - already executing');
      return;
    }

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(async () => {
      try {
        isExecuting = true;
        await fn(...args);
      } catch (error) {
        console.error('❌ Debounced navigation error:', error);
      } finally {
        isExecuting = false;
      }
    }, delay);
  };
};