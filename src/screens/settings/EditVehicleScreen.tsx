import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function EditVehicleScreen({ route }: any): React.JSX.Element {
  const { vehicleId } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Editar Veículo</Text>
        <Text style={styles.subtitle}>
          Veículo ID: {vehicleId}
        </Text>
        
        {/* TODO: Add form inputs with current values */}
        <View style={styles.form}>
          <View style={styles.inputPlaceholder}>
            <Text style={styles.inputLabel}>Honda Civic 2020</Text>
          </View>
          <View style={styles.inputPlaceholder}>
            <Text style={styles.inputLabel}>Honda</Text>
          </View>
          <View style={styles.inputPlaceholder}>
            <Text style={styles.inputLabel}>Civic</Text>
          </View>
          <View style={styles.inputPlaceholder}>
            <Text style={styles.inputLabel}>2020</Text>
          </View>
          <View style={styles.inputPlaceholder}>
            <Text style={styles.inputLabel}>Flex</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Salvar Alterações</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  form: {
    marginBottom: 32,
  },
  inputPlaceholder: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  inputLabel: {
    color: '#333',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});