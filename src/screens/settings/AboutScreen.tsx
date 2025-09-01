import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function AboutScreen(): React.JSX.Element {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Icon name="eco" size={48} color="#2E7D32" />
        </View>
        <Text style={styles.appName}>KMBio</Text>
        <Text style={styles.version}>Versão 1.0.0 (MVP)</Text>
        <Text style={styles.description}>
          Monitor inteligente de consumo de combustível
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informações do App</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Versão</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Build</Text>
          <Text style={styles.infoValue}>2024.01.001</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Última Atualização</Text>
          <Text style={styles.infoValue}>21 de Janeiro, 2024</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Suporte</Text>
        
        <TouchableOpacity style={styles.actionItem}>
          <Icon name="help" size={20} color="#2E7D32" />
          <Text style={styles.actionText}>Central de Ajuda</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Icon name="feedback" size={20} color="#2E7D32" />
          <Text style={styles.actionText}>Enviar Feedback</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Icon name="bug-report" size={20} color="#2E7D32" />
          <Text style={styles.actionText}>Reportar Bug</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Legal</Text>
        
        <TouchableOpacity style={styles.actionItem}>
          <Icon name="description" size={20} color="#666" />
          <Text style={styles.actionText}>Termos de Uso</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Icon name="security" size={20} color="#666" />
          <Text style={styles.actionText}>Política de Privacidade</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Icon name="copyright" size={20} color="#666" />
          <Text style={styles.actionText}>Licenças</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Desenvolvido com ❤️ para motoristas conscientes
        </Text>
        <Text style={styles.copyright}>
          © 2024 KMBio. Todos os direitos reservados.
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
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
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
  footer: {
    alignItems: 'center',
    padding: 40,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});