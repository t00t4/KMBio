import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useVehicleStore } from '../../stores/vehicles';
import { FuelType } from '../../types/entities';

const getFuelTypeLabel = (fuelType: FuelType): string => {
  const labels = {
    gasoline: 'Gasolina',
    ethanol: 'Etanol',
    diesel: 'Diesel',
    flex: 'Flex',
  };
  return labels[fuelType] || fuelType;
};

export default function VehicleManagementScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { 
    vehicles, 
    loading, 
    error, 
    fetchVehicles, 
    deleteVehicle, 
    setActiveVehicle,
    clearError 
  } = useVehicleStore();

  // Fetch vehicles when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchVehicles();
    }, [fetchVehicles])
  );

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleAddVehicle = () => {
    (navigation as any).navigate('AddVehicle');
  };

  const handleEditVehicle = (vehicleId: string) => {
    (navigation as any).navigate('EditVehicle', { vehicleId });
  };

  const handleSetActiveVehicle = async (vehicleId: string) => {
    try {
      await setActiveVehicle(vehicleId);
    } catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error ? error.message : 'Erro ao definir veículo ativo'
      );
    }
  };

  const handleDeleteVehicle = (vehicleId: string, vehicleName: string) => {
    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja remover o veículo "${vehicleName}"? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicleId);
              Alert.alert('Sucesso', 'Veículo removido com sucesso!');
            } catch (error) {
              Alert.alert(
                'Erro',
                error instanceof Error ? error.message : 'Erro ao remover veículo'
              );
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    fetchVehicles();
  };

  // Show error if exists
  if (error && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={handleRefresh}
          colors={['#2E7D32']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Meus Veículos</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddVehicle}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {vehicles.map((vehicle) => (
        <View key={vehicle.id} style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleIcon}>
              <Icon name="directions-car" size={24} color="#2E7D32" />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehicleDetails}>
                {vehicle.make} {vehicle.model} • {vehicle.year}
              </Text>
              <Text style={styles.vehicleSpecs}>
                {getFuelTypeLabel(vehicle.fuelType)} • {vehicle.engineSize}L
              </Text>
            </View>
            {vehicle.isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Ativo</Text>
              </View>
            )}
          </View>
          
          <View style={styles.vehicleActions}>
            {!vehicle.isActive && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleSetActiveVehicle(vehicle.id)}
              >
                <Icon name="radio-button-unchecked" size={16} color="#2E7D32" />
                <Text style={[styles.actionText, { color: '#2E7D32' }]}>Ativar</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditVehicle(vehicle.id)}
            >
              <Icon name="edit" size={16} color="#666" />
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteVehicle(vehicle.id, vehicle.name)}
            >
              <Icon name="delete" size={16} color="#F44336" />
              <Text style={[styles.actionText, { color: '#F44336' }]}>Remover</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {vehicles.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Icon name="directions-car" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum veículo cadastrado</Text>
          <Text style={styles.emptySubtext}>
            Adicione um veículo para começar a usar o KMBio
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAddVehicle}>
            <Text style={styles.primaryButtonText}>Adicionar Veículo</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  vehicleSpecs: {
    fontSize: 12,
    color: '#999',
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  vehicleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});