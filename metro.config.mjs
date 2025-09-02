// Learn more https://docs.expo.io/guides/customizing-metro
import { getDefaultConfig } from 'expo/metro-config';

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(import.meta.url);

// Otimizações específicas para Expo Go + Tunnel
config.resolver.platforms = ['ios', 'android', 'native'];

// Configurações de cache otimizadas
config.cacheStores = [
  {
    name: 'filesystem',
    options: {
      cacheDirectory: '.metro-cache',
    },
  },
];

// Otimizar para desenvolvimento com Expo Go
config.transformer = {
  ...config.transformer,
  // Acelerar transformações
  asyncRequireModulePath: require.resolve('metro-runtime/src/modules/asyncRequire'),
  // Otimizar minificação apenas quando necessário
  minifierConfig: {
    mangle: false, // Desabilitar para debug mais fácil
    output: {
      ascii_only: true,
      quote_keys: true,
    },
    sourceMap: {
      includeSources: true, // Manter para debugging
    },
    toplevel: false,
    warnings: false,
  },
};

// Excluir arquivos desnecessários do bundle para reduzir tamanho
config.resolver.blockList = [
  // Arquivos de teste
  /.*\/__tests__\/.*/,
  /.*\.test\.(js|jsx|ts|tsx)$/,
  /.*\.spec\.(js|jsx|ts|tsx)$/,
  /.*\.stories\.(js|jsx|ts|tsx)$/,
  
  // Diretórios de teste em node_modules
  /node_modules\/.*\/test\/.*/,
  /node_modules\/.*\/tests\/.*/,
  /node_modules\/.*\/__tests__\/.*/,
  
  // Arquivos de documentação
  /.*\.md$/,
  /.*\.markdown$/,
  
  // Arquivos de configuração desnecessários
  /.*\.config\.(js|ts)$/,
  /.*rc\.(js|json)$/,
];

// Otimizar resolução de módulos
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Configurações específicas para melhor performance com tunnel
config.server = {
  ...config.server,
  // Aumentar timeout para conexões tunnel
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setTimeout(30000); // 30 segundos
      return middleware(req, res, next);
    };
  },
};

export default config;
