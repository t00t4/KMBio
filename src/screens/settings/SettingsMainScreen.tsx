import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function SettingsMainScreen({ navigation }: any): React.JSX.Element {
  const settingsOptions = [
    {
      title: 'Gerenciar Veículos',
      subtitle: 'Adicionar, editar ou remover veículos',
      icon: 'directions-car',
      onPress: () => navigation.navigate('VehicleManagement'),
    },
    {
      title: 'Preferências',
      subtitle: 'Unidades, idioma e notificações',
      icon: 'tune',
      onPress: () => navigation.navigate('Preferences'),
    },
    {
      title: 'Privacidade',
      subtitle: 'Controle seus dados e privacidade',
      icon: 'security',
      onPress: () => navigation.navigate('Privacy'),
    },
    {
      title: 'Sobre',
      subtitle: 'Versão do app e informações',
      icon: 'info',
      onPress: () => navigation.navigate('About'),
    },
  ];

  const renderSettingOption = (option: typeof settingsOptions[0]) => (
    <TouchableOpacity
      key={option.title}
      style={styles.settingOption}
      onPress={option.onPress}
    >
      <View style={styles.settingIcon}>
        <Icon name={option.icon} size={24} color="#2E7D32" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{option.title}</Text>
        <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Personalize sua experiência</Text>
      </View>

      {/* User Info */}
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Icon name="person" size={32} color="#fff" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>João Silva</Text>
            <Text style={styles.userEmail}>joao.silva@email.com</Text>
          </View>
        </View>
      </View>

      {/* Settings Options */}
      <View style={styles.card}>
        {settingsOptions.map(renderSettingOption)}
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ações Rápidas</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="sync" size={20} color="#2E7D32" />
          <Text style={styles.actionText}>Sincronizar Dados</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="backup" size={20} color="#2E7D32" />
          <Text style={styles.actionText}>Fazer Backup</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="help" size={20} color="#2E7D32" />
          <Text style={styles.actionText}>Central de Ajuda</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.logoutButton}>
          <Icon name="logout" size={20} color="#F44336" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
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
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoutText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '500',
    marginLeft: 8,
  },
});