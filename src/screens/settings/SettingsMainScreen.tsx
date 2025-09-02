import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../../stores/auth';
import { handleAuthError, debounceNavigation } from '../../utils/navigationErrorHandler';
import { logButtonPress, logAuthEvent, logAuthError, logUserInteraction } from '../../utils/debugLogger';

export default function SettingsMainScreen({ navigation }: any): React.JSX.Element {
  const { signOut, user, isLoading, isAuthenticated } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Debug logging for auth state
  React.useEffect(() => {
    console.log('🔍 SettingsScreen - Auth state check:', {
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      isLoading,
      hasSignOutFunction: typeof signOut === 'function'
    });
  }, [isAuthenticated, user, isLoading, signOut]);
  const handleLogout = async () => {
    const context = { screen: 'Settings', component: 'LogoutButton' };
    
    logButtonPress('Logout', context, {
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      isLoading,
      isLoggingOut
    });
    
    // Prevent multiple logout attempts
    if (isLoggingOut || isLoading) {
      logUserInteraction('Duplicate logout attempt blocked', context);
      return;
    }

    logUserInteraction('Showing logout confirmation dialog', context);
    
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            logUserInteraction('User cancelled logout', context);
          }
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            logUserInteraction('User confirmed logout', context);
            logAuthEvent('Logout initiated', context);
            
            try {
              setIsLoggingOut(true);
              logUserInteraction('Logout loading state set', context);
              
              // Verify auth store is available
              if (!signOut) {
                throw new Error('Auth store signOut function not available');
              }

              logAuthEvent('Calling signOut function', context);
              await signOut();
              logAuthEvent('SignOut completed successfully', context);
              
              // The auth store should handle navigation automatically
              // via the auth state listener in the navigation container
              
            } catch (error) {
              const authError = error instanceof Error ? error : new Error(String(error));
              
              logAuthError(authError, context, {
                operation: 'logout',
                hasSignOutFunction: typeof signOut === 'function'
              });
              
              handleAuthError(authError, {
                allowRetry: true,
                onRetry: () => {
                  logUserInteraction('User requested logout retry', context);
                  setTimeout(() => handleLogout(), 100);
                }
              });
            } finally {
              setIsLoggingOut(false);
              logUserInteraction('Logout loading state cleared', context);
            }
          },
        },
      ]
    );
  };

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
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>
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
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            console.log('Sync button pressed');
            Alert.alert('Sincronizar', 'Funcionalidade em desenvolvimento');
          }}
        >
          <Icon name="sync" size={20} color="#2E7D32" />
          <Text style={styles.actionText}>Sincronizar Dados</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            console.log('Backup button pressed');
            Alert.alert('Backup', 'Funcionalidade em desenvolvimento');
          }}
        >
          <Icon name="backup" size={20} color="#2E7D32" />
          <Text style={styles.actionText}>Fazer Backup</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            console.log('Help button pressed');
            Alert.alert('Ajuda', 'Funcionalidade em desenvolvimento');
          }}
        >
          <Icon name="help" size={20} color="#2E7D32" />
          <Text style={styles.actionText}>Central de Ajuda</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.card}>
        <TouchableOpacity 
          style={[
            styles.logoutButton,
            (isLoggingOut || isLoading) && styles.disabledButton
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut || isLoading}
          activeOpacity={0.7}
        >
          <View style={styles.logoutContent}>
            {(isLoggingOut || isLoading) && (
              <ActivityIndicator size="small" color="#F44336" style={styles.logoutLoader} />
            )}
            <Icon name="logout" size={20} color="#F44336" />
            <Text style={styles.logoutText}>
              {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
            </Text>
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
  disabledButton: {
    opacity: 0.6,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLoader: {
    marginRight: 8,
  },
});