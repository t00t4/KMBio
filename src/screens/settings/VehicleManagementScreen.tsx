import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function VehicleManagementScreen({ navigation }: any): React.JSX.Element {
  // Mock data - TODO: Replace with actual data from store
  const vehicles = [
    {
      id: '1',
      name: 'Honda Civic 2020',
      make: 'Honda',
      model: 'Civic',
      year: 2020,
      fuelType: 'flex',
      isActive: true,
    },
  ];

  const handleAddVehicle = () => {
    navigation.navigate('AddVehicle');
  };

  const handleEditVehicle = (vehicleId: string) => {
    navigation.navigate('EditVehicle', { vehicleId });
  };

  return (
    <ScrollView style={styles.container}>
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
                {vehicle.year} • {vehicle.fuelType === 'flex' ? 'Flex' : vehicle.fuelType}
              </Text>
            </View>
            {vehicle.isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Ativo</Text>
              </View>
            )}
          </View>
          
          <View style={styles.vehicleActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditVehicle(vehicle.id)}
            >
              <Icon name="edit" size={16} color="#666" />
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="delete" size={16} color="#F44336" />
              <Text style={[styles.actionText, { color: '#F44336' }]}>Remover</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {vehicles.length === 0 && (
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
    alignItems: 'center',
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
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});