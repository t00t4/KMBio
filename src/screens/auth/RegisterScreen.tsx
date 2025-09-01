import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function RegisterScreen({ navigation }: any): React.JSX.Element {
  const handleRegister = () => {
    // TODO: Implement actual registration logic
    console.log('Register pressed');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Crie sua conta KMBio</Text>
      </View>

      <View style={styles.form}>
        {/* TODO: Add actual form inputs */}
        <View style={styles.inputPlaceholder}>
          <Text style={styles.inputLabel}>Nome completo</Text>
        </View>
        
        <View style={styles.inputPlaceholder}>
          <Text style={styles.inputLabel}>Email</Text>
        </View>
        
        <View style={styles.inputPlaceholder}>
          <Text style={styles.inputLabel}>Senha</Text>
        </View>
        
        <View style={styles.inputPlaceholder}>
          <Text style={styles.inputLabel}>Confirmar senha</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Criar Conta</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Já tem uma conta? </Text>
        <TouchableOpacity onPress={handleLogin}>
          <Text style={styles.linkText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  inputPlaceholder: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  inputLabel: {
    color: '#999',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  linkText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '500',
  },
});