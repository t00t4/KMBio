import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function TipsScreen(): React.JSX.Element {
  // Mock data - TODO: Replace with actual data from store
  const tips: Tip[] = [
    {
      id: '1',
      title: 'Acelere Gradualmente',
      content: 'Acelerações bruscas podem aumentar o consumo em até 40%. Acelere de forma suave e gradual.',
      category: 'Aceleração',
      isRead: false,
      priority: 'high',
    },
    {
      id: '2',
      title: 'Mantenha RPM Baixo',
      content: 'Tente manter o RPM abaixo de 2500 em velocidades constantes para melhor eficiência.',
      category: 'RPM',
      isRead: false,
      priority: 'medium',
    },
    {
      id: '3',
      title: 'Antecipe as Frenagens',
      content: 'Observe o trânsito à frente e reduza a velocidade gradualmente em vez de frear bruscamente.',
      category: 'Frenagem',
      isRead: true,
      priority: 'medium',
    },
  ];

  const unreadTips = tips.filter(tip => !tip.isRead);
  const readTips = tips.filter(tip => tip.isRead);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'remove';
      case 'low': return 'keyboard-arrow-down';
      default: return 'help';
    }
  };

  const renderTip = (tip: Tip) => (
    <TouchableOpacity key={tip.id} style={[styles.tipCard, !tip.isRead && styles.unreadTip]}>
      <View style={styles.tipHeader}>
        <View style={styles.tipTitleRow}>
          <Text style={[styles.tipTitle, !tip.isRead && styles.unreadTitle]}>
            {tip.title}
          </Text>
          {!tip.isRead && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.tipMeta}>
          <Icon 
            name={getPriorityIcon(tip.priority)} 
            size={16} 
            color={getPriorityColor(tip.priority)} 
          />
          <Text style={[styles.tipCategory, { color: getPriorityColor(tip.priority) }]}>
            {tip.category}
          </Text>
        </View>
      </View>
      <Text style={styles.tipContent}>{tip.content}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dicas da IA</Text>
        <Text style={styles.subtitle}>
          Dicas personalizadas baseadas no seu estilo de direção
        </Text>
      </View>

      {unreadTips.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="fiber-new" size={24} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Novas Dicas ({unreadTips.length})</Text>
          </View>
          {unreadTips.map(renderTip)}
        </View>
      )}

      {readTips.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="done-all" size={24} color="#666" />
            <Text style={styles.sectionTitle}>Dicas Lidas</Text>
          </View>
          {readTips.map(renderTip)}
        </View>
      )}

      {tips.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="lightbulb-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhuma dica disponível</Text>
          <Text style={styles.emptySubtext}>
            Faça algumas viagens para receber dicas personalizadas
          </Text>
        </View>
      )}
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
    paddingTop: 60,
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
  section: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  tipCard: {
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
  unreadTip: {
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  tipHeader: {
    marginBottom: 12,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
    marginLeft: 8,
  },
  tipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCategory: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  tipContent: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});