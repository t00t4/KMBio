import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function PreferencesScreen(): React.JSX.Element {
  const [notifications, setNotifications] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [vibrationEnabled, setVibrationEnabled] = React.useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Preferências</Text>
        <Text style={styles.subtitle}>
          Personalize como o app funciona para você
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Unidades</Text>
        
        <TouchableOpacity style={styles.preferenceItem}>
          <Text style={styles.preferenceTitle}>Consumo de Combustível</Text>
          <View style={styles.preferenceValue}>
            <Text style={styles.valueText}>L/100km</Text>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.preferenceItem}>
          <Text style={styles.preferenceTitle}>Distância</Text>
          <View style={styles.preferenceValue}>
            <Text style={styles.valueText}>Quilômetros</Text>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.preferenceItem}>
          <Text style={styles.preferenceTitle}>Temperatura</Text>
          <View style={styles.preferenceValue}>
            <Text style={styles.valueText}>Celsius</Text>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notificações</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Notificações Push</Text>
            <Text style={styles.settingDescription}>
              Receber alertas e dicas do app
            </Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Som</Text>
            <Text style={styles.settingDescription}>
              Tocar som nas notificações
            </Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Vibração</Text>
            <Text style={styles.settingDescription}>
              Vibrar durante alertas importantes
            </Text>
          </View>
          <Switch
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Interface</Text>
        
        <TouchableOpacity style={styles.preferenceItem}>
          <Text style={styles.preferenceTitle}>Tema</Text>
          <View style={styles.preferenceValue}>
            <Text style={styles.valueText}>Claro</Text>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.preferenceItem}>
          <Text style={styles.preferenceTitle}>Idioma</Text>
          <View style={styles.preferenceValue}>
            <Text style={styles.valueText}>Português (BR)</Text>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </View>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
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
    padding: 20,
    paddingBottom: 0,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceTitle: {
    fontSize: 16,
    color: '#333',
  },
  preferenceValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});