# Troubleshooting - Botão "Conectar Dispositivo" Não Funciona

## Problema Identificado
O botão "Conectar Dispositivo" no Dashboard não estava navegando para a tela de pareamento.

## Causa Raiz
1. **Falta de navegação**: O componente DashboardScreen não estava usando o hook `useNavigation`
2. **Tipos incorretos**: Os tipos de navegação não estavam configurados corretamente
3. **Falta de feedback visual**: Não havia indicação de que o botão foi pressionado

## Soluções Implementadas

### 1. Adicionada Navegação Correta
```typescript
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const navigation = useNavigation<NavigationProp>();

const handleConnectOBD = () => {
  console.log('Connect OBD button pressed - navigating to Pairing screen');
  try {
    navigation.navigate('Pairing');
    console.log('Navigation to Pairing screen initiated');
  } catch (error) {
    console.error('Navigation error:', error);
  }
};
```

### 2. Integração com Store BLE
```typescript
import { useBLEConnectionState, useBLEConnectedDevice } from '../../stores/ble';

const connectionState = useBLEConnectionState();
const connectedDevice = useBLEConnectedDevice();
```

### 3. Status Dinâmico da Conexão
```typescript
const getConnectionStatus = () => {
  if (connectionState.isConnecting) {
    return {
      text: 'Conectando...',
      color: '#FF9800',
      icon: 'bluetooth-searching'
    };
  } else if (connectionState.isConnected && connectedDevice) {
    return {
      text: `Conectado: ${connectedDevice.name || 'Dispositivo OBD-II'}`,
      color: '#4CAF50',
      icon: 'bluetooth-connected'
    };
  } else {
    return {
      text: 'Dispositivo OBD-II não conectado',
      color: '#666',
      icon: 'bluetooth-disabled'
    };
  }
};
```

### 4. Interface Melhorada
- Botão desabilitado durante conexão
- Feedback visual do status
- Ícones dinâmicos baseados no estado
- Botão diferente quando conectado

## Como Testar

### 1. Teste Básico de Navegação
1. Abra o app no Dashboard
2. Clique no botão "Conectar Dispositivo"
3. Deve navegar para a tela de Pairing
4. Verifique os logs no console

### 2. Teste com Componente de Debug
Um componente de teste foi adicionado temporariamente ao Dashboard:
- Botão "Testar Navegação para Pairing"
- Botão "Testar Inicialização BLE"
- Status em tempo real do BLE

### 3. Verificar Logs
```bash
# No terminal do Metro bundler, procure por:
Connect OBD button pressed - navigating to Pairing screen
Navigation to Pairing screen initiated

# Se houver erro:
Navigation error: [detalhes do erro]
```

## Comandos de Debug

### 1. Verificar Estado da Navegação
```javascript
// No React DevTools ou console
console.log('Navigation state:', navigation.getState());
```

### 2. Verificar Store BLE
```javascript
// No console
console.log('BLE State:', useBLEStore.getState());
```

### 3. Testar Navegação Manual
```javascript
// No console do app
navigation.navigate('Pairing');
```

## Possíveis Problemas Adicionais

### 1. Permissões
Se a tela de Pairing não funcionar:
- Verificar permissões de Bluetooth
- Verificar permissões de localização
- Testar em dispositivo físico (não emulador)

### 2. Dependências
Verificar se todas as dependências estão instaladas:
```bash
npm install
# ou
expo install
```

### 3. Cache
Limpar cache se houver problemas:
```bash
npm run reset
# ou
expo start --clear
```

## Estrutura de Navegação

```
RootNavigator
├── Auth (Stack)
│   ├── OnboardingWelcome
│   ├── Login
│   └── Register
└── Main (Tabs)
    ├── Dashboard ← Você está aqui
    ├── Reports
    ├── Tips
    └── Settings
└── Pairing (Modal) ← Destino do botão
└── TripDetails
```

## Próximos Passos

1. **Remover componente de debug** após confirmar que funciona
2. **Implementar lógica de trip** no botão "Iniciar Viagem"
3. **Adicionar persistência** do estado de conexão
4. **Implementar reconexão automática**

## Verificação Final

Para confirmar que o problema foi resolvido:

1. ✅ Botão "Conectar Dispositivo" navega para Pairing
2. ✅ Status da conexão é mostrado dinamicamente
3. ✅ Logs aparecem no console
4. ✅ Interface responde ao estado BLE
5. ✅ Não há erros de navegação

Se algum item não estiver funcionando, verifique:
- Logs de erro no console
- Estado do store BLE
- Configuração de navegação
- Permissões do dispositivo