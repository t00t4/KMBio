import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ReportsListScreen({ navigation }: any): React.JSX.Element {
  const handleWeeklyReport = () => {
    navigation.navigate('WeeklyReport', { weekStart: '2024-01-15' });
  };

  const handleTripHistory = () => {
    navigation.navigate('TripHistory');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios</Text>
        <Text style={styles.subtitle}>Acompanhe seu desempenho</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Esta Semana</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>156 km</Text>
            <Text style={styles.statLabel}>Distância</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8.2 L/100km</Text>
            <Text style={styles.statLabel}>Consumo Médio</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Viagens</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>-5%</Text>
            <Text style={styles.statLabel}>vs. Semana Anterior</Text>
          </View>
        </View>
      </View>

      {/* Report Options */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Relatórios Disponíveis</Text>
        
        <TouchableOpacity style={styles.reportOption} onPress={handleWeeklyReport}>
          <View style={styles.reportIcon}>
            <Icon name="assessment" size={24} color="#2E7D32" />
          </View>
          <View style={styles.reportContent}>
            <Text style={styles.reportTitle}>Relatório Semanal</Text>
            <Text style={styles.reportDescription}>
              Análise detalhada do seu desempenho semanal
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.reportOption} onPress={handleTripHistory}>
          <View style={styles.reportIcon}>
            <Icon name="history" size={24} color="#2E7D32" />
          </View>
          <View style={styles.reportContent}>
            <Text style={styles.reportTitle}>Histórico de Viagens</Text>
            <Text style={styles.reportDescription}>
              Visualize todas as suas viagens anteriores
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Performance Trends */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tendências de Performance</Text>
        <View style={styles.trendItem}>
          <Icon name="trending-down" size={20} color="#4CAF50" />
          <Text style={styles.trendText}>Consumo diminuiu 5% esta semana</Text>
        </View>
        <View style={styles.trendItem}>
          <Icon name="trending-up" size={20} color="#FF9800" />
          <Text style={styles.trendText}>Eventos de frenagem brusca aumentaram</Text>
        </View>
        <View style={styles.trendItem}>
          <Icon name="trending-flat" size={20} color="#666" />
          <Text style={styles.trendText}>Velocidade média mantida estável</Text>
        </View>
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
    paddingTop: 20,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
});