import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function AddVehicleScreen(): React.JSX.Element {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Adicionar Veículo</Text>
        <Text style={styles.subtitle}>
          Preencha as informações do seu veículo
        </Text>
        
        {/* TODO: Add form inputs */}
        <View style={styles.form}>
          <View style={styles.inputPlaceholder}>
            <Text style={styles.inputLabel}>Nome do veículo</Text>
          </View>
          <View style={styles.inputPlaceholder}>
            <Text style={styles.inputLabel}>Marca</Text>
          </View>
          <View style={styles.inputPlaceholder}>
            <Text style={styles.inputLabel}>Modelo</Text>
          </View>
          <View style={styles.inputPlaceholder}>
            <Text style={styles.inputLabel}>Ano</Text>
          </View>
          <View style={styles.inputPlaceholder}>
            <Text style={styles.inputLabel}>Tipo de combustível</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Salvar Veículo</Text>
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
    color: '#999',
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