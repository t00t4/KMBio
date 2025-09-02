# 🚀 Guia de Otimização de Performance - KMBio

## Problema: Lentidão no Expo Go com --tunnel

### Principais Causas:
1. **Tunnel overhead**: O modo tunnel adiciona latência extra
2. **Bundle size**: Aplicação com muitas dependências
3. **Metro cache**: Cache desatualizado ou corrompido
4. **Network issues**: Conexão instável ou lenta

## ✅ Soluções Implementadas

### 1. **Metro Config Otimizado**
- Cache filesystem habilitado
- Exclusão de arquivos de teste do bundle
- Minificação otimizada
- Plataformas específicas configuradas

### 2. **App.json Otimizado**
- Hermes engine habilitado (iOS e Android)
- Asset bundle patterns específicos
- TypeScript paths experimentais
- Configuração do packager

### 3. **Scripts Adicionais**
```bash
# Diferentes modos de conexão
npm run start:tunnel    # Modo tunnel (mais lento, mas funciona com firewall)
npm run start:lan       # Modo LAN (recomendado)
npm run start:localhost # Modo local (mais rápido)
npm run start:clear     # Limpa cache e reinicia

# Limpeza completa
npm run clean           # Reinstala dependências e limpa cache
```

## 🔧 Comandos para Resolver Lentidão

### Solução Rápida (Recomendada):
```bash
# 1. Pare o servidor atual (Ctrl+C)
# 2. Limpe o cache
npm run start:clear

# 3. Use modo LAN em vez de tunnel
npm run start:lan
```

### Solução Completa:
```bash
# 1. Limpeza total
npm run clean

# 2. Verificar diagnóstico
node scripts/diagnose-performance.js

# 3. Iniciar com modo otimizado
npm run start:lan
```

## 📊 Modos de Conexão - Performance

| Modo | Velocidade | Compatibilidade | Uso Recomendado |
|------|------------|-----------------|------------------|
| `--localhost` | ⚡⚡⚡ | Limitada | Desenvolvimento local |
| `--lan` | ⚡⚡ | Boa | **Recomendado** |
| `--tunnel` | ⚡ | Máxima | Apenas se necessário |

## 🎯 Otimizações Específicas

### Para Desenvolvimento:
```bash
# Modo mais rápido para desenvolvimento
npm run start:localhost

# Se precisar acessar de outro dispositivo
npm run start:lan
```

### Para Testes:
```bash
# Limpar cache antes de testar
npm run start:clear

# Usar modo LAN para testes em dispositivos
npm run start:lan
```

### Para Problemas de Rede:
```bash
# Apenas se LAN não funcionar
npm run start:tunnel
```

## 🔍 Diagnóstico de Problemas

### Executar Diagnóstico:
```bash
node scripts/diagnose-performance.js
```

### Verificar Status:
1. **Metro Cache**: Deve existir pasta `.metro-cache`
2. **Node Modules**: Verificar se não há conflitos
3. **Expo CLI**: Versão atualizada
4. **Conexão**: WiFi estável

## ⚠️ Troubleshooting

### Se ainda estiver lento:

1. **Verificar Rede**:
   ```bash
   # Testar conectividade
   ping 8.8.8.8
   ```

2. **Limpar Tudo**:
   ```bash
   # Remover node_modules e reinstalar
   rm -rf node_modules
   npm install
   npm run start:clear
   ```

3. **Verificar Expo CLI**:
   ```bash
   # Atualizar Expo CLI
   npm install -g @expo/cli@latest
   ```

4. **Usar USB Debugging** (Android):
   ```bash
   # Conectar via USB e usar ADB
   adb reverse tcp:8081 tcp:8081
   npm run start:localhost
   ```

## 📱 Configurações do Dispositivo

### Android:
- Habilitar "Desenvolvedor"
- Ativar "USB Debugging"
- Conectar via USB quando possível

### iOS:
- Mesmo WiFi que o computador
- Verificar firewall do macOS

## 🎉 Resultados Esperados

Após as otimizações:
- ⚡ **Startup**: 30-60 segundos (vs 3+ minutos)
- 🔄 **Hot Reload**: 1-3 segundos
- 📦 **Bundle Size**: Reduzido em ~20%
- 🚀 **Performance**: Melhor responsividade

## 📝 Próximos Passos

1. **Sempre usar `npm run start:lan`** para desenvolvimento
2. **Limpar cache regularmente** com `npm run start:clear`
3. **Monitorar performance** com o script de diagnóstico
4. **Considerar EAS Build** para builds de produção

---

**💡 Dica**: Se o problema persistir, considere usar o **Expo Dev Client** em vez do Expo Go para melhor performance.