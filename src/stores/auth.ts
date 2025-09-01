import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
// Removed unused imports

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  preferences: UserPreferences;
  consentGiven: boolean;
  telemetryEnabled: boolean;
}

interface UserPreferences {
  fuelUnit: 'L/100km' | 'km/L';
  language: 'pt-BR' | 'en-US';
  notifications: NotificationSettings;
}

interface NotificationSettings {
  realTimeAlerts: boolean;
  weeklyReports: boolean;
  tips: boolean;
  maintenance: boolean;
  sound: boolean;
  vibration: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  error: string | null;
}

interface AuthActions {
  // Basic state management
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  
  // Authentication methods
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  
  // Session management
  initialize: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // User profile management
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

type AuthStore = AuthState & AuthActions;

const defaultPreferences: UserPreferences = {
  fuelUnit: 'L/100km',
  language: 'pt-BR',
  notifications: {
    realTimeAlerts: true,
    weeklyReports: true,
    tips: true,
    maintenance: true,
    sound: true,
    vibration: true,
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasCompletedOnboarding: false,
      error: null,

      // Basic state management
      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      setOnboardingCompleted: (completed) => set({ hasCompletedOnboarding: completed }),
      
      // Authentication methods
      signUp: async (email: string, password: string, name: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                preferences: defaultPreferences,
                consent_given: false,
                telemetry_enabled: true,
              },
            },
          });

          if (error) {
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Create user profile in database
            const { error: profileError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                name,
                preferences: defaultPreferences,
                consent_given: false,
                telemetry_enabled: true,
              });

            if (profileError) {
              console.error('Error creating user profile:', profileError);
            }

            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              name,
              createdAt: new Date(data.user.created_at),
              preferences: defaultPreferences,
              consentGiven: false,
              telemetryEnabled: true,
            };

            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              error: null 
            });
          }

          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Fetch user profile from database
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError) {
              console.error('Error fetching user profile:', profileError);
            }

            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              name: profile?.name || data.user.user_metadata?.name || '',
              createdAt: new Date(data.user.created_at),
              preferences: profile?.preferences || defaultPreferences,
              consentGiven: profile?.consent_given || false,
              telemetryEnabled: profile?.telemetry_enabled ?? true,
            };

            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              error: null 
            });
          }

          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true });
          
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            console.error('Error signing out:', error);
          }

          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            hasCompletedOnboarding: false,
            error: null 
          });
        } catch (error) {
          console.error('Error during sign out:', error);
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          });
        }
      },

      resetPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'kmbio://reset-password',
          });

          if (error) {
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
          }

          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      initialize: async () => {
        try {
          set({ isLoading: true });
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            set({ isLoading: false, isAuthenticated: false, user: null });
            return;
          }

          if (session?.user) {
            // Fetch user profile from database
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error('Error fetching user profile:', profileError);
            }

            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              name: profile?.name || session.user.user_metadata?.name || '',
              createdAt: new Date(session.user.created_at),
              preferences: profile?.preferences || defaultPreferences,
              consentGiven: profile?.consent_given || false,
              telemetryEnabled: profile?.telemetry_enabled ?? true,
            };

            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              error: null 
            });
          } else {
            set({ 
              isLoading: false,
              isAuthenticated: false,
              user: null 
            });
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ 
            isLoading: false, 
            isAuthenticated: false, 
            user: null,
            error: error instanceof Error ? error.message : 'Erro de inicialização'
          });
        }
      },

      refreshSession: async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.error('Error refreshing session:', error);
            return;
          }

          if (data.session?.user) {
            // Update user data if needed
            await get().initialize();
          }
        } catch (error) {
          console.error('Error refreshing session:', error);
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        try {
          const { user } = get();
          if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
          }

          set({ isLoading: true, error: null });

          // Update in Supabase database
          const { error } = await supabase
            .from('users')
            .update({
              name: updates.name,
              preferences: updates.preferences,
              consent_given: updates.consentGiven,
              telemetry_enabled: updates.telemetryEnabled,
            })
            .eq('id', user.id);

          if (error) {
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
          }

          // Update local state
          const updatedUser = { ...user, ...updates };
          set({ user: updatedUser, isLoading: false });

          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);

// Set up auth state listener
supabase.auth.onAuthStateChange((event) => {
  const { initialize } = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    initialize();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ 
      user: null, 
      isAuthenticated: false, 
      isLoading: false,
      error: null 
    });
  }
});