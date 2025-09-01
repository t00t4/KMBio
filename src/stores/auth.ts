import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasCompletedOnboarding: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setOnboardingCompleted: (completed) => set({ hasCompletedOnboarding: completed }),
      
      login: (user) => set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false 
      }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        hasCompletedOnboarding: false 
      }),
      
      initialize: async () => {
        try {
          set({ isLoading: true });
          
          // TODO: Check if user session exists in Supabase
          // For now, just set loading to false
          await new Promise(resolve => global.setTimeout(resolve, 1000)); // Simulate async check
          
          const { user } = get();
          set({ 
            isLoading: false,
            isAuthenticated: !!user 
          });
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ 
            isLoading: false, 
            isAuthenticated: false, 
            user: null 
          });
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