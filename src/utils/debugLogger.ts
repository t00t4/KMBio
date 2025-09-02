/**
 * Debug logging utility for tracking user interactions and navigation
 */

export interface LogContext {
  screen?: string;
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

class DebugLogger {
  private sessionId: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = __DEV__; // Only enable in development
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const sessionInfo = `[${this.sessionId}]`;
    const contextInfo = context ? `[${context.screen || 'Unknown'}/${context.component || 'Unknown'}]` : '';
    
    return `${timestamp} ${level} ${sessionInfo} ${contextInfo} ${message}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, data?: any): void {
    if (!this.isEnabled) return;

    const formattedMessage = this.formatLog(level, message, context);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.log(`🔍 ${formattedMessage}`, data || '');
        break;
      case LogLevel.INFO:
        console.info(`ℹ️ ${formattedMessage}`, data || '');
        break;
      case LogLevel.WARN:
        console.warn(`⚠️ ${formattedMessage}`, data || '');
        break;
      case LogLevel.ERROR:
        console.error(`❌ ${formattedMessage}`, data || '');
        break;
    }
  }

  /**
   * Log button press events
   */
  logButtonPress(buttonName: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, `Button pressed: ${buttonName}`, context, {
      buttonName,
      ...metadata
    });
  }

  /**
   * Log navigation events
   */
  logNavigation(from: string, to: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, `Navigation: ${from} -> ${to}`, context, {
      from,
      to,
      ...metadata
    });
  }

  /**
   * Log navigation errors
   */
  logNavigationError(error: Error, context: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, `Navigation error: ${error.message}`, context, {
      error: error.message,
      stack: error.stack,
      ...metadata
    });
  }

  /**
   * Log authentication events
   */
  logAuthEvent(event: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, `Auth event: ${event}`, context, {
      event,
      ...metadata
    });
  }

  /**
   * Log authentication errors
   */
  logAuthError(error: Error, context: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, `Auth error: ${error.message}`, context, {
      error: error.message,
      stack: error.stack,
      ...metadata
    });
  }

  /**
   * Log user interactions
   */
  logUserInteraction(interaction: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, `User interaction: ${interaction}`, context, {
      interaction,
      ...metadata
    });
  }

  /**
   * Log state changes
   */
  logStateChange(stateName: string, oldValue: any, newValue: any, context: LogContext): void {
    this.log(LogLevel.DEBUG, `State change: ${stateName}`, context, {
      stateName,
      oldValue,
      newValue,
      changed: oldValue !== newValue
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, context: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, `Performance: ${operation} took ${duration}ms`, context, {
      operation,
      duration,
      ...metadata
    });
  }

  /**
   * Create a performance timer
   */
  createTimer(operation: string, context: LogContext): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.logPerformance(operation, duration, context);
    };
  }

  /**
   * Log general debug information
   */
  debug(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log general information
   */
  info(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log errors
   */
  error(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Export singleton instance
export const debugLogger = new DebugLogger();

// Export convenience functions
export const logButtonPress = (buttonName: string, context: LogContext, metadata?: Record<string, any>) => 
  debugLogger.logButtonPress(buttonName, context, metadata);

export const logNavigation = (from: string, to: string, context: LogContext, metadata?: Record<string, any>) => 
  debugLogger.logNavigation(from, to, context, metadata);

export const logNavigationError = (error: Error, context: LogContext, metadata?: Record<string, any>) => 
  debugLogger.logNavigationError(error, context, metadata);

export const logAuthEvent = (event: string, context: LogContext, metadata?: Record<string, any>) => 
  debugLogger.logAuthEvent(event, context, metadata);

export const logAuthError = (error: Error, context: LogContext, metadata?: Record<string, any>) => 
  debugLogger.logAuthError(error, context, metadata);

export const logUserInteraction = (interaction: string, context: LogContext, metadata?: Record<string, any>) => 
  debugLogger.logUserInteraction(interaction, context, metadata);

export const createPerformanceTimer = (operation: string, context: LogContext) => 
  debugLogger.createTimer(operation, context);