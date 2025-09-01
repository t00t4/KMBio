# 🐛 Guia de Debug - KMBio

## Problema: App Carregando Infinitamente no Android

### 🔍 **Passos de Diagnóstico**

#### 1. **Verificar Logs do Metro**
Quando você executa `npx expo start`, observe o terminal para:
- ✅ "Metro waiting on exp://[IP]:[PORT]"
- ❌ Erros de bundling
- ❌ Erros de dependências
- ❌ Timeouts de rede

#### 2. **Verificar Conectividade de Rede**
```bash
# Verificar se o IP está acessível do celular
ping [IP_DO_COMPUTADOR]

# Exemplo: se o Metro mostra "exp://192.168.1.100:8081"
ping 192.168.1.100
```

#### 3. **Verificar Firewall**
- Windows Defender pode estar bloqueando a porta 8081
- Roteador pode ter restrições de rede

#### 4. **Verificar Versão do Expo Go**
- Atualize o Expo Go no celular
- Versões incompatíveis causam travamentos

### 🛠️ **Soluções Comuns**

#### **Solução 1: Usar Tunnel Mode**
```bash
npx expo start --tunnel
```
- Funciona mesmo com firewall/NAT
- Mais lento, mas mais confiável

#### **Solução 2: Especificar Host**
```bash
npx expo start --host lan
# ou
npx expo start --host localhost
```

#### **Solução 3: Limpar Cache**
```bash
npx expo start --clear
```

#### **Solução 4: Verificar Dependências**
```bash
npm install
npx expo install --fix
```

#### **Solução 5: Usar Desenvolvimento Local**
```bash
npx expo start --localhost
```
- Funciona apenas com emulador no mesmo PC

### 🔧 **Debug Avançado**

#### **Verificar Bundle**
```bash
# Gerar bundle para verificar erros
npx expo export --platform android
```

#### **Logs Detalhados**
```bash
# Executar com logs verbosos
npx expo start --verbose
```

#### **Verificar Porta**
```bash
# Windows: verificar se porta 8081 está livre
netstat -an | findstr :8081

# Se ocupada, usar porta diferente
npx expo start --port 8082
```

### 📱 **Alternativas de Teste**

#### **1. Emulador Android**
```bash
# Instalar Android Studio
# Criar AVD (Android Virtual Device)
npx expo start --android
```

#### **2. Expo Development Build**
```bash
# Criar build de desenvolvimento
npx expo run:android
```

#### **3. Web Browser**
```bash
# Testar no navegador primeiro
npx expo start --web
```

### 🚨 **Problemas Específicos e Soluções**

#### **"Network response timed out"**
```bash
# Solução: usar tunnel
npx expo start --tunnel
```

#### **"Unable to resolve module"**
```bash
# Solução: limpar cache e reinstalar
rm -rf node_modules
npm install
npx expo start --clear
```

#### **"Metro bundler crashed"**
```bash
# Solução: verificar memória e reiniciar
npx expo start --reset-cache
```

#### **"Expo Go keeps loading"**
```bash
# Soluções em ordem:
1. Fechar e reabrir Expo Go
2. Reiniciar Metro (Ctrl+C e npx expo start)
3. Usar tunnel mode
4. Verificar firewall
5. Usar emulador
```

### 📊 **Checklist de Debug**

- [ ] Metro bundler iniciou sem erros
- [ ] IP/porta acessível do celular
- [ ] Firewall não está bloqueando
- [ ] Expo Go atualizado
- [ ] Mesma rede WiFi
- [ ] Cache limpo
- [ ] Dependências atualizadas

### 🎯 **Solução Rápida Recomendada**

```bash
# 1. Parar o servidor atual (Ctrl+C)
# 2. Limpar cache e usar tunnel
npx expo start --tunnel --clear

# 3. Escanear o novo QR code
# 4. Se ainda não funcionar, testar no navegador:
npx expo start --web
```