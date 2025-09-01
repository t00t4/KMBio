import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Vehicle, FuelType } from '../types/entities';
import { 
  CreateVehicleRequest, 
  UpdateVehicleRequest
} from '../types/api/vehicles';
import { supabase } from '../services/supabase';

interface VehicleState {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  loading: boolean;
  error: string | null;
}

interface VehicleActions {
  // CRUD operations
  fetchVehicles: () => Promise<void>;
  createVehicle: (vehicleData: CreateVehicleRequest) => Promise<Vehicle>;
  updateVehicle: (vehicleId: string, updates: UpdateVehicleRequest) => Promise<Vehicle>;
  deleteVehicle: (vehicleId: string) => Promise<void>;
  
  // Active vehicle management
  setActiveVehicle: (vehicleId: string) => Promise<void>;
  getActiveVehicle: () => Vehicle | null;
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type VehicleStore = VehicleState & VehicleActions;

export const useVehicleStore = create<VehicleStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    vehicles: [],
    activeVehicle: null,
    loading: false,
    error: null,

    // Actions
    setLoading: (loading: boolean) => set({ loading }),
    setError: (error: string | null) => set({ error }),
    clearError: () => set({ error: null }),

    fetchVehicles: async () => {
      try {
        set({ loading: true, error: null });
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        const vehicles: Vehicle[] = (data || []).map(vehicle => ({
          id: vehicle.id,
          userId: vehicle.user_id,
          name: vehicle.name,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          fuelType: vehicle.fuel_type as FuelType,
          engineSize: vehicle.engine_size,
          supportedPIDs: vehicle.supported_pids || [],
          isActive: vehicle.is_active || false,
          createdAt: new Date(vehicle.created_at),
          updatedAt: new Date(vehicle.updated_at),
        }));

        const activeVehicle = vehicles.find(v => v.isActive) || null;

        set({ 
          vehicles, 
          activeVehicle,
          loading: false 
        });
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch vehicles',
          loading: false 
        });
      }
    },

    createVehicle: async (vehicleData: CreateVehicleRequest) => {
      try {
        set({ loading: true, error: null });
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // If this is the first vehicle, make it active
        const { vehicles } = get();
        const isFirstVehicle = vehicles.length === 0;

        const { data, error } = await supabase
          .from('vehicles')
          .insert({
            user_id: user.id,
            name: vehicleData.name,
            year: vehicleData.year,
            make: vehicleData.make,
            model: vehicleData.model,
            fuel_type: vehicleData.fuelType,
            engine_size: vehicleData.engineSize,
            supported_pids: [],
            is_active: isFirstVehicle,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        const newVehicle: Vehicle = {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          year: data.year,
          make: data.make,
          model: data.model,
          fuelType: data.fuel_type as FuelType,
          engineSize: data.engine_size,
          supportedPIDs: data.supported_pids || [],
          isActive: data.is_active || false,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };

        set(state => ({
          vehicles: [newVehicle, ...state.vehicles],
          activeVehicle: isFirstVehicle ? newVehicle : state.activeVehicle,
          loading: false,
        }));

        return newVehicle;
      } catch (error) {
        console.error('Error creating vehicle:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create vehicle';
        set({ 
          error: errorMessage,
          loading: false 
        });
        throw new Error(errorMessage);
      }
    },

    updateVehicle: async (vehicleId: string, updates: UpdateVehicleRequest) => {
      try {
        set({ loading: true, error: null });

        const updateData: Record<string, unknown> = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.year !== undefined) updateData.year = updates.year;
        if (updates.make !== undefined) updateData.make = updates.make;
        if (updates.model !== undefined) updateData.model = updates.model;
        if (updates.fuelType !== undefined) updateData.fuel_type = updates.fuelType;
        if (updates.engineSize !== undefined) updateData.engine_size = updates.engineSize;
        if (updates.supportedPIDs !== undefined) updateData.supported_pids = updates.supportedPIDs;
        if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

        const { data, error } = await supabase
          .from('vehicles')
          .update(updateData)
          .eq('id', vehicleId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        const updatedVehicle: Vehicle = {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          year: data.year,
          make: data.make,
          model: data.model,
          fuelType: data.fuel_type as FuelType,
          engineSize: data.engine_size,
          supportedPIDs: data.supported_pids || [],
          isActive: data.is_active || false,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };

        set(state => ({
          vehicles: state.vehicles.map(v => v.id === vehicleId ? updatedVehicle : v),
          activeVehicle: updatedVehicle.isActive ? updatedVehicle : state.activeVehicle,
          loading: false,
        }));

        return updatedVehicle;
      } catch (error) {
        console.error('Error updating vehicle:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update vehicle';
        set({ 
          error: errorMessage,
          loading: false 
        });
        throw new Error(errorMessage);
      }
    },

    deleteVehicle: async (vehicleId: string) => {
      try {
        set({ loading: true, error: null });

        const { error } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', vehicleId);

        if (error) {
          throw error;
        }

        set(state => {
          const updatedVehicles = state.vehicles.filter(v => v.id !== vehicleId);
          const wasActive = state.activeVehicle?.id === vehicleId;
          
          // If we deleted the active vehicle, set the first remaining vehicle as active
          let newActiveVehicle = state.activeVehicle;
          if (wasActive && updatedVehicles.length > 0) {
            newActiveVehicle = updatedVehicles[0];
            // Update the first vehicle to be active in the database
            supabase
              .from('vehicles')
              .update({ is_active: true })
              .eq('id', newActiveVehicle.id)
              .then(() => {
                // Update local state
                set(currentState => ({
                  vehicles: currentState.vehicles.map(v => 
                    v.id === newActiveVehicle!.id ? { ...v, isActive: true } : v
                  ),
                  activeVehicle: { ...newActiveVehicle!, isActive: true }
                }));
              });
          } else if (wasActive) {
            newActiveVehicle = null;
          }

          return {
            vehicles: updatedVehicles,
            activeVehicle: newActiveVehicle,
            loading: false,
          };
        });
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete vehicle';
        set({ 
          error: errorMessage,
          loading: false 
        });
        throw new Error(errorMessage);
      }
    },

    setActiveVehicle: async (vehicleId: string) => {
      try {
        set({ loading: true, error: null });

        // First, set all vehicles to inactive
        const { error: deactivateError } = await supabase
          .from('vehicles')
          .update({ is_active: false })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

        if (deactivateError) {
          throw deactivateError;
        }

        // Then set the selected vehicle as active
        const { data, error } = await supabase
          .from('vehicles')
          .update({ is_active: true })
          .eq('id', vehicleId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        const activeVehicle: Vehicle = {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          year: data.year,
          make: data.make,
          model: data.model,
          fuelType: data.fuel_type as FuelType,
          engineSize: data.engine_size,
          supportedPIDs: data.supported_pids || [],
          isActive: true,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };

        set(state => ({
          vehicles: state.vehicles.map(v => ({
            ...v,
            isActive: v.id === vehicleId
          })),
          activeVehicle,
          loading: false,
        }));
      } catch (error) {
        console.error('Error setting active vehicle:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to set active vehicle';
        set({ 
          error: errorMessage,
          loading: false 
        });
        throw new Error(errorMessage);
      }
    },

    getActiveVehicle: () => {
      return get().activeVehicle;
    },
  }))
);