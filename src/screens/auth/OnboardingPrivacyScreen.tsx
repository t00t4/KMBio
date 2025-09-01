import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
interface OnboardingPrivacyScreenProps {
  navigation: any;
}

export default function OnboardingPrivacyScreen({ navigation }: OnboardingPrivacyScreenProps): React.JSX.Element {
  const [consentGiven, setConsentGiven] = useState(false);
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);

  const handleNext = () => {
    if (!consentGiven) {
      Alert.alert(
        'Consentimento Necessário',
        'Para continuar, é necessário aceitar os termos de uso e política de privacidade.',
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.navigate('OnboardingPreferences', {
      consentGiven,
      telemetryEnabled,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleViewTerms = () => {
    Alert.alert(
      'Termos de Uso',
      'Esta é uma versão resumida dos termos de uso. A versão completa estará disponível no aplicativo final.',
      [{ text: 'OK' }]
    );
  };

  const handleViewPrivacy = () => {
    Alert.alert(
      'Política de Privacidade',
      'Esta é uma versão resumida da política de privacidade. A versão completa estará disponível no aplicativo final.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacidade e Dados</Text>
          <Text style={styles.subtitle}>
            Sua privacidade é nossa prioridade. Entenda como tratamos seus dados.
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔒 Seus Dados, Seu Controle</Text>
            <Text style={styles.sectionText}>
              • Todos os dados são criptografados e armazenados com segurança{'\n'}
              • Você pode exportar ou excluir seus dados a qualquer momento{'\n'}
              • Nunca compartilhamos dados pessoais com terceiros{'\n'}
              • Conformidade total com a LGPD (Lei Geral de Proteção de Dados)
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Dados Coletados</Text>
            <Text style={styles.sectionText}>
              • Dados do veículo (consumo, RPM, velocidade){'\n'}
              • Padrões de direção para gerar dicas personalizadas{'\n'}
              • Informações de uso do aplicativo (opcional){'\n'}
              • Localização apenas durante viagens (se permitido)
            </Text>
          </View>

          <View style={styles.consentSection}>
            <View style={styles.consentItem}>
              <View style={styles.consentTextContainer}>
                <Text style={styles.consentText}>
                  Aceito os termos de uso e política de privacidade
                </Text>
                <View style={styles.linkContainer}>
                  <TouchableOpacity onPress={handleViewTerms}>
                    <Text style={styles.linkText}>Ver termos</Text>
                  </TouchableOpacity>
                  <Text style={styles.linkSeparator}> • </Text>
                  <TouchableOpacity onPress={handleViewPrivacy}>
                    <Text style={styles.linkText}>Ver política</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.requiredText}>* Obrigatório</Text>
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
                  Ajuda a melhorar o aplicativo e desenvolver novos recursos
                </Text>
                <Text style={styles.optionalText}>Opcional - pode ser alterado depois</Text>
              </View>
              <Switch
                value={telemetryEnabled}
                onValueChange={setTelemetryEnabled}
                trackColor={{ false: '#ddd', true: '#81c784' }}
                thumbColor={telemetryEnabled ? '#2E7D32' : '#f4f3f4'}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.nextButton, !consentGiven && styles.nextButtonDisabled]} 
            onPress={handleNext}
            disabled={!consentGiven}
          >
            <Text style={styles.nextButtonText}>Próximo</Text>
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  consentSection: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  consentTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  consentText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 6,
  },
  consentSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  linkText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  linkSeparator: {
    fontSize: 14,
    color: '#666',
  },
  requiredText: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
  },
  optionalText: {
    fontSize: 12,
    color: '#666',
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
  nextButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});