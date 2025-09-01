import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function PrivacyScreen(): React.JSX.Element {
  const [telemetryEnabled, setTelemetryEnabled] = React.useState(true);
  const [crashReporting, setCrashReporting] = React.useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Privacidade</Text>
        <Text style={styles.subtitle}>
          Controle como seus dados são coletados e utilizados
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coleta de Dados</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Telemetria</Text>
            <Text style={styles.settingDescription}>
              Permite coleta de dados de uso para melhorar o app
            </Text>
          </View>
          <Switch
            value={telemetryEnabled}
            onValueChange={setTelemetryEnabled}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Relatórios de Erro</Text>
            <Text style={styles.settingDescription}>
              Envia relatórios automáticos quando o app falha
            </Text>
          </View>
          <Switch
            value={crashReporting}
            onValueChange={setCrashReporting}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Seus Dados</Text>
        
        <TouchableOpacity style={styles.actionItem}>
          <Icon name="download" size={20} color="#2E7D32" />
          <Text style={styles.actionText}>Exportar Meus Dados</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Icon name="delete-forever" size={20} color="#F44336" />
          <Text style={[styles.actionText, { color: '#F44336' }]}>
            Excluir Todos os Dados
          </Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informações Legais</Text>
        
        <TouchableOpacity style={styles.actionItem}>
          <Icon name="description" size={20} color="#666" />
          <Text style={styles.actionText}>Política de Privacidade</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Icon name="gavel" size={20} color="#666" />
          <Text style={styles.actionText}>Termos de Uso</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
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
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
    flex: 1,
  },
});