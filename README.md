# KMBio MVP

KMBio é um aplicativo Android que conecta via Bluetooth Low Energy (BLE) a um dongle OBD-II (ELM327) para coletar dados básicos do veículo e fornecer feedback de direção personalizado através de inteligência artificial baseada em regras simples.

## 🚀 Tecnologias

- **React Native** (Expo bare workflow)
- **TypeScript** para type safety
- **Zustand** para gerenciamento de estado
- **React Navigation** para navegação
- **Supabase** para backend e autenticação
- **react-native-ble-plx** para comunicação BLE
- **ESLint + Prettier** para qualidade de código

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── common/          # Componentes genéricos
│   ├── charts/          # Gráficos e visualizações
│   └── forms/           # Formulários e inputs
├── screens/             # Telas da aplicação
│   ├── auth/           # Login, onboarding
│   ├── pairing/        # Pareamento OBD-II
│   ├── dashboard/      # Dashboard principal
│   ├── reports/        # Relatórios e histórico
│   ├── tips/           # Dicas da IA
│   └── settings/       # Configurações
├── services/           # Camada de serviços
│   ├── ble/           # Comunicação BLE
│   ├── obd/           # Protocolos OBD-II
│   ├── ai/            # Engine de regras IA
│   ├── telemetry/     # Coleta e processamento
│   └── sync/          # Sincronização dados
├── stores/            # Estado global (Zustand)
├── types/             # Definições TypeScript
├── utils/             # Utilitários e helpers
└── constants/         # Constantes da aplicação
```

## 🛠️ Setup de Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Android Studio (para desenvolvimento Android)
- Expo CLI

### Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```

4. Execute o projeto:
   ```bash
   # Para Android
   npm run android
   
   # Para desenvolvimento
   npm start
   ```

## 📝 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run android` - Executa no Android
- `npm run ios` - Executa no iOS
- `npm run web` - Executa na web
- `npm run lint` - Executa o linter
- `npm run lint:fix` - Corrige problemas de lint automaticamente
- `npm run format` - Formata o código com Prettier
- `npm run type-check` - Verifica tipos TypeScript

## 🔧 Configuração

### Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

- `EXPO_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- Outras configurações conforme necessário

### Path Mapping

O projeto está configurado com path mapping para imports mais limpos:

```typescript
import { User } from '@/types/entities';
import { BLEService } from '@/services/ble';
import { formatConsumption } from '@/utils/formatters';
```

## 🏗️ Arquitetura

O projeto segue os princípios de Clean Architecture com separação clara de responsabilidades:

- **Presentation Layer**: Screens e Components
- **Application Layer**: Hooks, State Management e Services
- **Domain Layer**: Entities, Use Cases e Repository Interfaces
- **Infrastructure Layer**: BLE Service, Supabase Client e Storage

## 📱 Funcionalidades Principais

- Pareamento com dongles OBD-II ELM327 via BLE
- Coleta de dados em tempo real do veículo
- Cálculo de consumo de combustível
- Dashboard com métricas em tempo real
- Relatórios semanais de desempenho
- Dicas personalizadas de economia
- Modo offline durante viagens
- Compliance com LGPD

## 🧪 Testes

O projeto está configurado para testes com Jest e React Native Testing Library:

```bash
npm test
```

## 📄 Licença

Este projeto está sob a licença MIT.