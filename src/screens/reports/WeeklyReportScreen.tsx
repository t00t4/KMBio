import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function WeeklyReportScreen(): React.JSX.Element {

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatório Semanal</Text>
        <Text style={styles.subtitle}>15 - 21 de Janeiro, 2024</Text>
      </View>

      {/* Overall Performance */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Performance Geral</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>82</Text>
          <Text style={styles.scoreLabel}>Pontuação de Eficiência</Text>
          <View style={styles.scoreChange}>
            <Icon name="trending-up" size={16} color="#4CAF50" />
            <Text style={styles.scoreChangeText}>+5 pontos vs. semana anterior</Text>
          </View>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Métricas Principais</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Icon name="straighten" size={24} color="#2E7D32" />
            <Text style={styles.metricValue}>156.8 km</Text>
            <Text style={styles.metricLabel}>Distância Total</Text>
            <Text style={styles.metricChange}>+12.5 km</Text>
          </View>
          <View style={styles.metricItem}>
            <Icon name="local-gas-station" size={24} color="#2E7D32" />
            <Text style={styles.metricValue}>8.2 L/100km</Text>
            <Text style={styles.metricLabel}>Consumo Médio</Text>
            <Text style={styles.metricChange}>-0.4 L/100km</Text>
          </View>
          <View style={styles.metricItem}>
            <Icon name="schedule" size={24} color="#2E7D32" />
            <Text style={styles.metricValue}>4h 32min</Text>
            <Text style={styles.metricLabel}>Tempo Dirigindo</Text>
            <Text style={styles.metricChange}>+45min</Text>
          </View>
          <View style={styles.metricItem}>
            <Icon name="directions-car" size={24} color="#2E7D32" />
            <Text style={styles.metricValue}>12</Text>
            <Text style={styles.metricLabel}>Viagens</Text>
            <Text style={styles.metricChange}>+2</Text>
          </View>
        </View>
      </View>

      {/* Fuel Economy */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Economia de Combustível</Text>
        <View style={styles.economyContainer}>
          <Text style={styles.economyValue}>R$ 18,50</Text>
          <Text style={styles.economyLabel}>Economia estimada esta semana</Text>
          <Text style={styles.economyDescription}>
            Comparado ao consumo médio da sua região
          </Text>
        </View>
      </View>

      {/* Driving Events */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Eventos de Direção</Text>
        <View style={styles.eventSummary}>
          <View style={styles.eventItem}>
            <Icon name="warning" size={20} color="#FF9800" />
            <Text style={styles.eventCount}>3</Text>
            <Text style={styles.eventLabel}>Acelerações Bruscas</Text>
          </View>
          <View style={styles.eventItem}>
            <Icon name="warning" size={20} color="#F44336" />
            <Text style={styles.eventCount}>1</Text>
            <Text style={styles.eventLabel}>Frenagens Bruscas</Text>
          </View>
          <View style={styles.eventItem}>
            <Icon name="info" size={20} color="#2196F3" />
            <Text style={styles.eventCount}>5</Text>
            <Text style={styles.eventLabel}>RPM Alto</Text>
          </View>
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recomendações</Text>
        <View style={styles.recommendation}>
          <Icon name="lightbulb" size={20} color="#FF9800" />
          <Text style={styles.recommendationText}>
            Continue mantendo acelerações suaves - você melhorou 15% esta semana!
          </Text>
        </View>
        <View style={styles.recommendation}>
          <Icon name="lightbulb" size={20} color="#FF9800" />
          <Text style={styles.recommendationText}>
            Tente manter RPM abaixo de 2500 em velocidades constantes para economizar mais.
          </Text>
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
    fontSize: 24,
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
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 8,
  },
  scoreChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreChangeText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  economyContainer: {
    alignItems: 'center',
  },
  economyValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  economyLabel: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  economyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  eventSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  eventItem: {
    alignItems: 'center',
  },
  eventCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  eventLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  recommendationText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
});