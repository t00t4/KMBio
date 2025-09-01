# Guia de Segurança - KMBio

## 📋 Visão Geral

Este documento descreve as práticas de segurança implementadas no projeto KMBio e como manter informações sensíveis protegidas.

## 🔒 Informações Sensíveis Protegidas

### Arquivos Ignorados pelo Git

O projeto está configurado para **NUNCA** commitar os seguintes tipos de arquivos:

#### 🔑 Credenciais e Chaves
- `.env` - Variáveis de ambiente com chaves de API
- `*.secret` - Arquivos de segredos
- `api-keys.json` - Chaves de API
- `credentials.json` - Credenciais de serviços
- `*.pem`, `*.key`, `*.crt` - Certificados e chaves privadas

#### 📱 Configurações Nativas
- `android/keystore.properties` - Configurações de keystore Android
- `android/gradle.properties` - Propriedades do Gradle (podem conter senhas)
- `*.jks`, `*.keystore` - Keystores Android
- `*.mobileprovision`, `*.p8`, `*.p12` - Certificados iOS

#### 🗄️ Dados Locais
- `*.db`, `*.sqlite` - Bancos de dados locais
- `uploads/`, `user-data/` - Dados de usuário
- `logs/` - Arquivos de log que podem conter dados sensíveis

## 🛡️ Configuração de Segurança

### Variáveis de Ambiente

Todas as informações sensíveis devem ser configuradas através de variáveis de ambiente:

```bash
# Supabase (Backend)
EXPO_PUBLIC_SUPABASE_URL=sua_url_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima

# APIs Externas
EXPO_PUBLIC_API_BASE_URL=sua_api_url

# Configurações de Desenvolvimento
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_MOCK_BLE_DATA=false
```

### Arquivo .env.example

Use o arquivo `.env.example` como template:

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite com suas credenciais reais
nano .env
```

## ⚠️ O que NUNCA Fazer

### ❌ Não Commitar
- Chaves de API diretamente no código
- Senhas ou tokens de acesso
- Certificados ou keystores
- Dados de usuário reais
- Logs com informações pessoais

### ❌ Exemplos de Código Inseguro
```typescript
// NUNCA faça isso:
const API_KEY = "sk-1234567890abcdef"; // ❌ Hardcoded
const SUPABASE_URL = "https://xyz.supabase.co"; // ❌ Hardcoded

// SEMPRE faça isso:
const API_KEY = process.env.EXPO_PUBLIC_API_KEY; // ✅ Variável de ambiente
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL; // ✅ Variável de ambiente
```

## ✅ Boas Práticas Implementadas

### 1. Separação de Ambientes
```typescript
// config.ts - Configuração segura
export const APP_CONFIG = {
  API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000'),
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
};
```

### 2. Validação de Variáveis
```typescript
// Sempre valide variáveis críticas
if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  throw new Error('SUPABASE_URL is required');
}
```

### 3. Logs Seguros
```typescript
// ✅ Log seguro
console.log('User authenticated successfully');

// ❌ Log inseguro
console.log('User token:', userToken); // Nunca logue tokens
```

## 🔧 Configuração do Ambiente de Desenvolvimento

### 1. Configuração Inicial
```bash
# Clone o repositório
git clone <repo-url>
cd KMBio

# Copie o arquivo de ambiente
cp .env.example .env

# Instale dependências
npm install
```

### 2. Configuração do .env
Edite o arquivo `.env` com suas credenciais:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# App Configuration
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_DEBUG_MODE=true
```

### 3. Verificação de Segurança
```bash
# Verifique se .env não está sendo rastreado
git status

# .env deve aparecer em "Untracked files" ou não aparecer
# Se aparecer em "Changes to be committed", remova:
git rm --cached .env
```

## 🚨 Procedimentos de Emergência

### Se Credenciais Foram Commitadas

1. **Remova imediatamente do repositório:**
```bash
git rm --cached .env
git commit -m "Remove sensitive environment file"
git push
```

2. **Revogue as credenciais comprometidas:**
   - Regenere chaves de API no Supabase
   - Atualize tokens de acesso
   - Notifique a equipe

3. **Limpe o histórico (se necessário):**
```bash
# Para remover completamente do histórico
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch .env' \
--prune-empty --tag-name-filter cat -- --all
```

### Verificação de Segurança Regular

Execute periodicamente:

```bash
# Verifique arquivos rastreados
git ls-files | grep -E "\.(env|key|pem|jks|p12)$"

# Deve retornar vazio ou apenas .env.example

# Verifique o .gitignore
cat .gitignore | grep -E "(\.env|secret|key)"
```

## 📞 Contato de Segurança

Se você descobrir uma vulnerabilidade de segurança:

1. **NÃO** abra uma issue pública
2. Entre em contato diretamente com a equipe
3. Forneça detalhes da vulnerabilidade
4. Aguarde confirmação antes de divulgar

## 📚 Recursos Adicionais

- [Expo Security Guidelines](https://docs.expo.dev/guides/security/)
- [React Native Security](https://reactnative.dev/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security-testing-guide/)

---

**Lembre-se:** A segurança é responsabilidade de todos. Sempre revise seu código antes de commitar e mantenha suas credenciais seguras! 🔐