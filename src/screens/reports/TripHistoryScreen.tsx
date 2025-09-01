import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Trip {
  id: string;
  date: string;
  time: string;
  distance: number;
  duration: string;
  consumption: number;
  efficiency: 'excellent' | 'good' | 'average' | 'poor';
}

export default function TripHistoryScreen({ navigation }: any): React.JSX.Element {
  // Mock data - TODO: Replace with actual data from store
  const trips: Trip[] = [
    {
      id: '1',
      date: '21 Jan',
      time: '14:30',
      distance: 32.5,
      duration: '45min',
      consumption: 8.2,
      efficiency: 'good',
    },
    {
      id: '2',
      date: '20 Jan',
      time: '08:15',
      distance: 18.7,
      duration: '28min',
      consumption: 7.8,
      efficiency: 'excellent',
    },
    {
      id: '3',
      date: '19 Jan',
      time: '17:45',
      distance: 45.2,
      duration: '1h 12min',
      consumption: 9.1,
      efficiency: 'average',
    },
    {
      id: '4',
      date: '18 Jan',
      time: '12:00',
      distance: 12.3,
      duration: '22min',
      consumption: 10.5,
      efficiency: 'poor',
    },
  ];

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'average': return '#FF9800';
      case 'poor': return '#F44336';
      default: return '#666';
    }
  };

  const getEfficiencyIcon = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'star';
      case 'good': return 'thumb-up';
      case 'average': return 'remove';
      case 'poor': return 'thumb-down';
      default: return 'help';
    }
  };

  const handleTripPress = (tripId: string) => {
    navigation.navigate('TripDetail', { tripId });
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <TouchableOpacity 
      style={styles.tripCard}
      onPress={() => handleTripPress(item.id)}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripDate}>
          <Text style={styles.dateText}>{item.date}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <View style={[styles.efficiencyBadge, { backgroundColor: getEfficiencyColor(item.efficiency) }]}>
          <Icon name={getEfficiencyIcon(item.efficiency)} size={16} color="#fff" />
        </View>
      </View>
      
      <View style={styles.tripStats}>
        <View style={styles.statItem}>
          <Icon name="straighten" size={16} color="#666" />
          <Text style={styles.statText}>{item.distance} km</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.statText}>{item.duration}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="local-gas-station" size={16} color="#666" />
          <Text style={styles.statText}>{item.consumption} L/100km</Text>
        </View>
      </View>
      
      <View style={styles.tripFooter}>
        <Text style={styles.efficiencyText}>
          Eficiência: {item.efficiency === 'excellent' ? 'Excelente' : 
                      item.efficiency === 'good' ? 'Boa' :
                      item.efficiency === 'average' ? 'Média' : 'Ruim'}
        </Text>
        <Icon name="chevron-right" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico de Viagens</Text>
        <Text style={styles.subtitle}>Últimas {trips.length} viagens</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="filter-list" size={20} color="#666" />
          <Text style={styles.filterText}>Filtrar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="sort" size={20} color="#666" />
          <Text style={styles.filterText}>Ordenar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={trips}
        renderItem={renderTrip}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripDate: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  efficiencyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  efficiencyText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});