import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ELM327HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ELM327HelpModal({ visible, onClose }: ELM327HelpModalProps): React.JSX.Element {
  const openTroubleshootingGuide = () => {
    // In a real app, this would open a web page or in-app guide
    Linking.openURL('https://example.com/elm327-troubleshooting');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Como Conectar ELM327</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="settings" size={24} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Preparação</Text>
            </View>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                Conecte o dongle ELM327 na porta OBD-II do seu veículo (geralmente localizada abaixo do volante)
              </Text>
            </View>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                Ligue a ignição do veículo (não precisa ligar o motor)
              </Text>
            </View>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                Aguarde o LED do ELM327 parar de piscar (indica que está pronto)
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="bluetooth" size={24} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Pareamento</Text>
            </View>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>
                Certifique-se de que o Bluetooth do celular está ativado
              </Text>
            </View>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>5</Text>
              <Text style={styles.stepText}>
                Toque em "Buscar Dispositivos" no aplicativo
              </Text>
            </View>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>6</Text>
              <Text style={styles.stepText}>
                Selecione seu dispositivo ELM327 na lista (pode aparecer como "ELM327", "OBDII" ou similar)
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="warning" size={24} color="#FF9800" />
              <Text style={styles.sectionTitle}>Problemas Comuns</Text>
            </View>
            
            <View style={styles.troubleItem}>
              <Text style={styles.troubleTitle}>Dispositivo não aparece na lista</Text>
              <Text style={styles.troubleText}>
                • Verifique se o ELM327 está conectado corretamente{'\n'}
                • Certifique-se de que a ignição está ligada{'\n'}
                • Tente reiniciar o Bluetooth do celular
              </Text>
            </View>

            <View style={styles.troubleItem}>
              <Text style={styles.troubleTitle}>Falha na conexão</Text>
              <Text style={styles.troubleText}>
                • Aproxime o celular do dongle ELM327{'\n'}
                • Verifique se não há outros dispositivos conectados ao ELM327{'\n'}
                • Tente desconectar e reconectar o dongle
              </Text>
            </View>

            <View style={styles.troubleItem}>
              <Text style={styles.troubleTitle}>Erro de comunicação OBD-II</Text>
              <Text style={styles.troubleText}>
                • Verifique se o veículo suporta OBD-II (carros fabricados após 2010){'\n'}
                • Certifique-se de que o motor está funcionando{'\n'}
                • Tente outro dongle ELM327 se disponível
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="info" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>Informações Técnicas</Text>
            </View>
            <Text style={styles.infoText}>
              O KMBio é compatível com dongles ELM327 v1.5 ou superior que suportam Bluetooth Low Energy (BLE).
              {'\n\n'}
              Protocolos suportados: ISO9141-2, KWP2000, CAN (11-bit e 29-bit).
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.troubleshootButton}
            onPress={openTroubleshootingGuide}
          >
            <Icon name="help" size={20} color="#2E7D32" />
            <Text style={styles.troubleshootButtonText}>Guia Completo de Solução de Problemas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  troubleItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  troubleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  troubleText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  troubleshootButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  troubleshootButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});