import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function DashboardScreen(): React.JSX.Element {
  const handleStartTrip = () => {
    // TODO: Navigate to pairing if not connected, or start trip
    console.log('Start trip pressed');
  };

  const handleConnectOBD = () => {
    // TODO: Navigate to pairing screen
    console.log('Connect OBD pressed');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Bem-vindo de volta!</Text>
      </View>

      {/* Connection Status */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="bluetooth" size={24} color="#666" />
          <Text style={styles.cardTitle}>Status da Conexão</Text>
        </View>
        <Text style={styles.statusText}>Dispositivo OBD-II não conectado</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleConnectOBD}>
          <Text style={styles.secondaryButtonText}>Conectar Dispositivo</Text>
        </TouchableOpacity>
      </View>

      {/* Current Trip */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="directions-car" size={24} color="#666" />
          <Text style={styles.cardTitle}>Viagem Atual</Text>
        </View>
        <Text style={styles.statusText}>Nenhuma viagem ativa</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleStartTrip}>
          <Text style={styles.primaryButtonText}>Iniciar Viagem</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estatísticas Rápidas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Consumo Médio</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Viagens</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Economia</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Distância</Text>
          </View>
        </View>
      </View>

      {/* Recent Tips */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="lightbulb-outline" size={24} color="#666" />
          <Text style={styles.cardTitle}>Dicas Recentes</Text>
        </View>
        <Text style={styles.emptyText}>
          Conecte seu dispositivo OBD-II e faça algumas viagens para receber dicas personalizadas
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});