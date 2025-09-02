# Guia de Otimização para Expo Go

## Problema: Lentidão com --tunnel

O modo `--tunnel` é necessário para usar o Expo Go, mas pode ser lento devido a:
- Latência da rede
- Tamanho do bundle
- Cache desatualizado
- Configurações não otimizadas

## Soluções Implementadas

### 1. Scripts Otimizados

```bash
# Para desenvolvimento normal com Expo Go
npm run start:expo-go

# Para desenvolvimento mais rápido (sem dev tools)
npm run start:tunnel:fast

# Para limpar cache e reiniciar
npm run reset
```

### 2. Configurações Otimizadas

- **Metro Config**: Excluir arquivos desnecessários do bundle
- **App.json**: Configurações de update otimizadas
- **Cache**: Sistema de cache melhorado

### 3. Comandos de Diagnóstico

```bash
# Verificar performance
node scripts/diagnose-performance.js

# Limpar todos os caches
npm run clean

# Reset completo
npm run reset
```

## Passos para Resolver Lentidão

### 1. Limpeza Completa
```bash
npm run reset
```

### 2. Verificar Conexão
- Use WiFi estável
- Feche outras aplicações que usam rede
- Teste em horários de menor tráfego

### 3. Usar Modo Otimizado
```bash
npm run start:expo-go
```

### 4. Monitorar Performance
- Observe o tempo de bundle no terminal
- Verifique se o cache está sendo usado
- Monitore o tamanho do bundle

## Dicas Adicionais

### Para Desenvolvimento Mais Rápido:
1. **Use modo production**: `npm run start:tunnel:fast`
2. **Mantenha o Metro rodando**: Não feche o terminal
3. **Evite mudanças grandes**: Faça alterações incrementais
4. **Use Fast Refresh**: Salve arquivos individuais

### Para Debugging:
1. **Use modo dev**: `npm run start:tunnel`
2. **Ative source maps**: Configurado automaticamente
3. **Use React DevTools**: Disponível no Expo Go

### Troubleshooting:

#### Se ainda estiver lento:
```bash
# 1. Verificar se há problemas de rede
ping 8.8.8.8

# 2. Limpar cache do npm
npm cache clean --force

# 3. Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# 4. Reset completo do Expo
npx expo install --fix
```

#### Se o bundle for muito grande:
1. Verifique dependências desnecessárias
2. Use import dinâmico para componentes pesados
3. Otimize imagens e assets
4. Use lazy loading

## Métricas de Performance

### Tempos Esperados:
- **Primeiro build**: 30-60 segundos
- **Hot reload**: 1-3 segundos
- **Bundle size**: < 5MB para desenvolvimento

### Sinais de Problema:
- Bundle > 10MB
- Hot reload > 10 segundos
- Primeiro build > 2 minutos

## Alternativas ao Tunnel

Se a lentidão persistir, considere:

1. **Expo Dev Build**: Mais rápido que Expo Go
2. **USB Debugging**: Conexão direta via cabo
3. **Emulador Local**: Android Studio ou iOS Simulator
4. **Expo Web**: Para testes de UI/UX

## Comandos Úteis

```bash
# Verificar status do Expo
npx expo doctor

# Verificar dependências
npm audit

# Analisar bundle
npx expo export --dump-assetmap

# Verificar cache
ls -la .metro-cache/

# Monitorar rede (Windows)
netstat -an | findstr :19000
```