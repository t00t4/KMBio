import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { useAuthStore } from '../../stores/auth';

interface OnboardingScreenProps {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps): React.JSX.Element {
  const [consentGiven, setConsentGiven] = useState(false);
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);

  const { user, updateProfile, setOnboardingCompleted } = useAuthStore();

  const handleComplete = async () => {
    if (!consentGiven) {
      Alert.alert(
        'Consentimento necessário',
        'É necessário aceitar os termos de uso e política de privacidade para continuar.'
      );
      return;
    }

    if (user) {
      // Update user profile with consent and telemetry preferences
      const result = await updateProfile({
        ...user,
        consentGiven: true,
        telemetryEnabled,
      });

      if (result.success) {
        setOnboardingCompleted(true);
        navigation.replace('Main');
      } else {
        Alert.alert('Erro', 'Erro ao salvar preferências. Tente novamente.');
      }
    } else {
      // If no user (shouldn't happen), just mark onboarding as complete
      setOnboardingCompleted(true);
      navigation.replace('Main');
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Pular onboarding?',
      'Você pode configurar suas preferências depois nas configurações.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pular',
          onPress: () => {
            setOnboardingCompleted(true);
            navigation.replace('Main');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo ao KMBio</Text>
        <Text style={styles.subtitle}>
          Monitore seu consumo de combustível e receba dicas personalizadas para economizar
        </Text>

        <View style={styles.features}>
          <Text style={styles.feature}>🚗 Conecte ao seu veículo via OBD-II</Text>
          <Text style={styles.feature}>📊 Monitore consumo em tempo real</Text>
          <Text style={styles.feature}>💡 Receba dicas inteligentes</Text>
          <Text style={styles.feature}>📈 Acompanhe sua evolução</Text>
        </View>

        <View style={styles.consentSection}>
          <Text style={styles.sectionTitle}>Termos e Privacidade</Text>

          <View style={styles.consentItem}>
            <View style={styles.consentTextContainer}>
              <Text style={styles.consentText}>
                Aceito os termos de uso e política de privacidade do KMBio
              </Text>
              <Text style={styles.consentSubtext}>
                Necessário para usar o aplicativo
              </Text>
            </View>
            <Switch
              value={consentGiven}
              onValueChange={setConsentGiven}
              trackColor={{ false: '#ddd', true: '#81c784' }}
              thumbColor={consentGiven ? '#2E7D32' : '#f4f3f4'}
            />
          </View>

          <View style={styles.consentItem}>
            <View style={styles.consentTextContainer}>
              <Text style={styles.consentText}>
                Permitir coleta de dados de telemetria
              </Text>
              <Text style={styles.consentSubtext}>
                Ajuda a melhorar o aplicativo (opcional)
              </Text>
            </View>
            <Switch
              value={telemetryEnabled}
              onValueChange={setTelemetryEnabled}
              trackColor={{ false: '#ddd', true: '#81c784' }}
              thumbColor={telemetryEnabled ? '#2E7D32' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, !consentGiven && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={!consentGiven}
        >
          <Text style={styles.buttonText}>Começar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Pular por agora</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  feature: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    paddingLeft: 8,
  },
  consentSection: {
    alignSelf: 'stretch',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  consentTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  consentText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  consentSubtext: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});