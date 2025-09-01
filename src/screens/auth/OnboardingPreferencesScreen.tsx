import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/auth';
import type { UserPreferences } from '../../types/entities/user';

interface OnboardingPreferencesScreenProps {
  navigation: any;
  route: {
    params: {
      consentGiven: boolean;
      telemetryEnabled: boolean;
    };
  };
}

export default function OnboardingPreferencesScreen({ navigation, route }: OnboardingPreferencesScreenProps): React.JSX.Element {
  const { consentGiven, telemetryEnabled } = route.params;
  const { user, updateProfile, setOnboardingCompleted } = useAuthStore();

  const [fuelUnit, setFuelUnit] = useState<'L/100km' | 'km/L'>('L/100km');
  const [language, setLanguage] = useState<'pt-BR' | 'en-US'>('pt-BR');
  const [notifications, setNotifications] = useState({
    realTimeAlerts: true,
    weeklyReports: true,
    tips: true,
    maintenance: true,
    sound: true,
    vibration: true,
  });

  const handleComplete = async () => {
    try {
      if (user) {
        const preferences: UserPreferences = {
          fuelUnit,
          language,
          notifications,
        };

        const result = await updateProfile({
          ...user,
          preferences,
          consentGiven,
          telemetryEnabled,
        });

        if (result.success) {
          setOnboardingCompleted(true);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } else {
          Alert.alert('Erro', 'Erro ao salvar preferências. Tente novamente.');
        }
      } else {
        // If no user (shouldn't happen), just mark onboarding as complete
        setOnboardingCompleted(true);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch {
      Alert.alert('Erro', 'Erro inesperado. Tente novamente.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Preferências</Text>
          <Text style={styles.subtitle}>
            Configure suas preferências iniciais. Você pode alterá-las depois nas configurações.
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⛽ Unidade de Consumo</Text>
            <Text style={styles.sectionDescription}>
              Escolha como deseja visualizar o consumo de combustível
            </Text>
            
            <View style={styles.optionGroup}>
              <TouchableOpacity
                style={[styles.option, fuelUnit === 'L/100km' && styles.optionSelected]}
                onPress={() => setFuelUnit('L/100km')}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, fuelUnit === 'L/100km' && styles.optionTitleSelected]}>
                    Litros por 100km
                  </Text>
                  <Text style={[styles.optionSubtitle, fuelUnit === 'L/100km' && styles.optionSubtitleSelected]}>
                    Padrão europeu (ex: 8.5 L/100km)
                  </Text>
                </View>
                <View style={[styles.radio, fuelUnit === 'L/100km' && styles.radioSelected]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.option, fuelUnit === 'km/L' && styles.optionSelected]}
                onPress={() => setFuelUnit('km/L')}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, fuelUnit === 'km/L' && styles.optionTitleSelected]}>
                    Quilômetros por litro
                  </Text>
                  <Text style={[styles.optionSubtitle, fuelUnit === 'km/L' && styles.optionSubtitleSelected]}>
                    Padrão brasileiro (ex: 12 km/L)
                  </Text>
                </View>
                <View style={[styles.radio, fuelUnit === 'km/L' && styles.radioSelected]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌐 Idioma</Text>
            <Text style={styles.sectionDescription}>
              Selecione o idioma do aplicativo
            </Text>
            
            <View style={styles.optionGroup}>
              <TouchableOpacity
                style={[styles.option, language === 'pt-BR' && styles.optionSelected]}
                onPress={() => setLanguage('pt-BR')}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, language === 'pt-BR' && styles.optionTitleSelected]}>
                    Português (Brasil)
                  </Text>
                </View>
                <View style={[styles.radio, language === 'pt-BR' && styles.radioSelected]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.option, language === 'en-US' && styles.optionSelected]}
                onPress={() => setLanguage('en-US')}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, language === 'en-US' && styles.optionTitleSelected]}>
                    English (US)
                  </Text>
                </View>
                <View style={[styles.radio, language === 'en-US' && styles.radioSelected]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 Notificações</Text>
            <Text style={styles.sectionDescription}>
              Escolha que tipos de notificações deseja receber
            </Text>
            
            <View style={styles.notificationGroup}>
              <TouchableOpacity
                style={styles.notificationItem}
                onPress={() => toggleNotification('realTimeAlerts')}
              >
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Alertas durante viagem</Text>
                  <Text style={styles.notificationSubtitle}>
                    Dicas em tempo real sobre seu estilo de direção
                  </Text>
                </View>
                <View style={[styles.checkbox, notifications.realTimeAlerts && styles.checkboxSelected]}>
                  {notifications.realTimeAlerts && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.notificationItem}
                onPress={() => toggleNotification('weeklyReports')}
              >
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Relatórios semanais</Text>
                  <Text style={styles.notificationSubtitle}>
                    Resumo semanal do seu desempenho
                  </Text>
                </View>
                <View style={[styles.checkbox, notifications.weeklyReports && styles.checkboxSelected]}>
                  {notifications.weeklyReports && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.notificationItem}
                onPress={() => toggleNotification('tips')}
              >
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Dicas personalizadas</Text>
                  <Text style={styles.notificationSubtitle}>
                    Sugestões baseadas no seu histórico
                  </Text>
                </View>
                <View style={[styles.checkbox, notifications.tips && styles.checkboxSelected]}>
                  {notifications.tips && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Text style={styles.completeButtonText}>Finalizar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionGroup: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#2E7D32',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#2E7D32',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  optionSubtitleSelected: {
    color: '#2E7D32',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  radioSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#2E7D32',
  },
  notificationGroup: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#2E7D32',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#2E7D32',
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});