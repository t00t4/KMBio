import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function TripDetailsScreen({ route }: any): React.JSX.Element {
  const { tripId } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tripId}>Viagem #{tripId}</Text>
        <Text style={styles.date}>Hoje, 14:30 - 15:15</Text>
      </View>

      {/* Trip Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo da Viagem</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Icon name="schedule" size={20} color="#666" />
            <Text style={styles.summaryLabel}>Duração</Text>
            <Text style={styles.summaryValue}>45 min</Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="straighten" size={20} color="#666" />
            <Text style={styles.summaryLabel}>Distância</Text>
            <Text style={styles.summaryValue}>32.5 km</Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="local-gas-station" size={20} color="#666" />
            <Text style={styles.summaryLabel}>Consumo</Text>
            <Text style={styles.summaryValue}>8.2 L/100km</Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="speed" size={20} color="#666" />
            <Text style={styles.summaryLabel}>Vel. Média</Text>
            <Text style={styles.summaryValue}>43 km/h</Text>
          </View>
        </View>
      </View>

      {/* Performance Score */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pontuação de Eficiência</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>85</Text>
          <Text style={styles.scoreLabel}>Muito Bom</Text>
        </View>
      </View>

      {/* Events */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Eventos da Viagem</Text>
        <View style={styles.eventItem}>
          <Icon name="warning" size={20} color="#FF9800" />
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>Aceleração Brusca</Text>
            <Text style={styles.eventTime}>14:45 - Av. Paulista</Text>
          </View>
        </View>
        <View style={styles.eventItem}>
          <Icon name="info" size={20} color="#2196F3" />
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>RPM Alto Sustentado</Text>
            <Text style={styles.eventTime}>15:02 - Marginal Tietê</Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dicas para Esta Viagem</Text>
        <Text style={styles.tip}>
          💡 Evite acelerações bruscas para economizar até 15% de combustível
        </Text>
        <Text style={styles.tip}>
          💡 Mantenha RPM abaixo de 2500 em velocidades constantes
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
    paddingTop: 20,
  },
  tripId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  date: {
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
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
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventContent: {
    marginLeft: 12,
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tip: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
});