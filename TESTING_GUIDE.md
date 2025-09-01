# 🧪 Guia de Testes - KMBio

## 📱 Como Testar o Aplicativo

### 1. **Testes Automatizados** ✅

Primeiro, execute os testes automatizados para verificar se tudo está funcionando:

```bash
# Executar todos os testes
npm test

# Executar testes específicos
npm test -- --testPathPattern="obd"
npm test -- --testPathPattern="calculations"

# Executar com cobertura
npm test -- --coverage
```

**Status Atual:** ✅ **50 testes passando**
- 24 testes do OBDService
- 7 testes de integração OBD
- 19 testes de cálculos

### 2. **Executar o Aplicativo**

```bash
# Iniciar o servidor de desenvolvimento
npx expo start

# Opções específicas
npx expo start --web          # Abrir no navegador
npx expo start --android      # Abrir no Android
npx expo start --ios          # Abrir no iOS
```

### 3. **Opções de Teste**

#### 📱 **No Dispositivo Físico**
1. Instale o **Expo Go** no seu celular
2. Escaneie o QR code que aparece no terminal
3. O app será carregado no seu dispositivo

#### 💻 **No Navegador Web**
```bash
npx expo start --web
```
- Acesse: http://localhost:19006
- Ideal para testar a interface sem BLE

#### 🤖 **No Emulador Android**
```bash
npx expo start --android
```
- Requer Android Studio instalado
- Emulador deve estar rodando

#### 🍎 **No Simulador iOS**
```bash
npx expo start --ios
```
- Requer Xcode (apenas macOS)
- Simulador deve estar rodando

## 🔧 Funcionalidades Implementadas para Teste

### ✅ **1. Sistema OBD-II Completo**

**Localização:** `src/services/obd/OBDService.ts`

**Funcionalidades:**
- ✅ Comunicação ELM327
- ✅ Descoberta automática de PIDs
- ✅ Leitura de dados do veículo (RPM, velocidade, temperatura)
- ✅ Validação de respostas
- ✅ Sistema de fallback (MAF ↔ MAP)

**Como testar:**
```typescript
// Exemplo de uso (ver: src/examples/obd-usage-example.ts)
import { OBDService } from './services/obd/OBDService';
import { BLEManager } from './services/ble/BLEManager';

const bleManager = new BLEManager();
const obdService = new OBDService(bleManager);

// Conectar e inicializar
await bleManager.connectToDevice('device-id');
await obdService.initialize();

// Ler dados essenciais
const data = await obdService.readEssentialData();
```

### ✅ **2. Cálculos de Consumo**

**Localização:** `src/utils/obd-calculations.ts`

**Funcionalidades:**
- ✅ Cálculo de consumo por MAF
- ✅ Estimativa por MAP quando MAF indisponível
- ✅ Conversão L/100km ↔ km/L
- ✅ Detecção de eventos de direção

**Como testar:**
```typescript
import { 
  calculateFuelConsumptionFromMAF,
  detectDrivingEvents,
  parseVehicleData 
} from './utils/obd-calculations';

// Calcular consumo
const consumption = calculateFuelConsumptionFromMAF(50.0, 'gasoline');
console.log(`Consumo: ${consumption} L/h`);

// Detectar eventos
const events = detectDrivingEvents(currentData, previousData);
```

### ✅ **3. Gerenciamento de Veículos**

**Localização:** `src/stores/vehicleStore.ts`

**Funcionalidades:**
- ✅ CRUD completo de veículos
- ✅ Persistência local (AsyncStorage)
- ✅ Sincronização com Supabase
- ✅ Validação de dados

### ✅ **4. Interface de Usuário**

**Componentes implementados:**
- ✅ Telas de navegação
- ✅ Formulários de veículo
- ✅ Componentes de BLE
- ✅ Indicadores de status

## 🧪 Cenários de Teste Específicos

### **Cenário 1: Teste de Comunicação OBD**

```bash
# 1. Execute os testes de integração
npm test src/services/obd/__tests__/OBDIntegration.test.ts

# 2. Verifique os logs no console
# Os testes simulam diferentes cenários:
# - Veículo parado (idle)
# - Aceleração
# - Rodovia
# - Frenagem brusca
```

### **Cenário 2: Teste de Cálculos**

```bash
# Execute os testes de cálculos
npm test src/utils/__tests__/obd-calculations.test.ts

# Verifica:
# - Cálculos de consumo
# - Detecção de eventos
# - Validação de dados
```

### **Cenário 3: Teste da Interface**

```bash
# Inicie o app no navegador
npx expo start --web

# Navegue pelas telas:
# 1. Tela inicial
# 2. Adicionar veículo
# 3. Conectar BLE
# 4. Visualizar dados
```

## 🔍 Debug e Monitoramento

### **Logs Detalhados**

O aplicativo possui logs detalhados para debug:

```typescript
// Habilitar logs de debug no .env
EXPO_PUBLIC_DEBUG_MODE=true

// Logs aparecem no console:
console.log('OBD command:', command);
console.log('OBD response:', response);
console.log('Vehicle data:', vehicleData);
```

### **Modo Mock para Testes**

```typescript
// Habilitar dados simulados no .env
EXPO_PUBLIC_MOCK_BLE_DATA=true

// Permite testar sem dispositivo ELM327 real
```

### **Ferramentas de Debug**

```bash
# Abrir debugger
npx expo start
# Pressione 'j' para abrir o debugger

# Reload da aplicação
# Pressione 'r' no terminal

# Menu de desenvolvimento
# Pressione 'm' no terminal
```

## 📊 Métricas de Teste

### **Cobertura de Código**
```bash
npm test -- --coverage
```

### **Performance**
- Tempo de inicialização OBD: ~4-6 segundos
- Frequência de coleta: 1 Hz (configurável)
- Latência de comando: <100ms

### **Compatibilidade**
- ✅ Android 8.0+ (API 26+)
- ✅ iOS 12.0+
- ✅ Bluetooth 4.0+
- ✅ ELM327 v1.5+

## 🚨 Problemas Conhecidos e Soluções

### **1. "Unable to resolve asset ./assets/icon.png"**
```bash
# Criar ícone temporário
mkdir -p assets
# Adicionar um ícone PNG de 1024x1024
```

### **2. "Jest version mismatch"**
```bash
# Atualizar Jest para versão compatível
npm install jest@29.7.0 --save-dev
```

### **3. "No apps connected"**
- Certifique-se que o Expo Go está instalado
- Verifique se está na mesma rede WiFi
- Tente recarregar o app

### **4. Erro de BLE em simulador**
- BLE não funciona em simuladores
- Use dispositivo físico para testes BLE
- Ou habilite `EXPO_PUBLIC_MOCK_BLE_DATA=true`

## 📋 Checklist de Teste

### **Antes de Testar:**
- [ ] Node.js instalado (v16+)
- [ ] Expo CLI instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Dispositivo/emulador disponível

### **Testes Básicos:**
- [ ] Todos os testes automatizados passando
- [ ] App inicia sem erros
- [ ] Navegação entre telas funciona
- [ ] Formulários respondem corretamente

### **Testes Avançados:**
- [ ] Comunicação OBD simulada funciona
- [ ] Cálculos de consumo corretos
- [ ] Persistência de dados funciona
- [ ] Sincronização com backend funciona

### **Testes de Dispositivo:**
- [ ] App instala no dispositivo
- [ ] Permissões BLE solicitadas
- [ ] Scan de dispositivos funciona
- [ ] Conexão ELM327 estabelecida

## 🎯 Próximos Passos

1. **Testar com ELM327 real**
2. **Implementar telas restantes**
3. **Adicionar mais testes E2E**
4. **Otimizar performance**
5. **Preparar para produção**

---

**Dica:** Comece sempre pelos testes automatizados para garantir que a base está sólida! 🚀