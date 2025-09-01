# 🔧 Como Resolver o Problema do Trigger

## 🎯 Problema
- Usuário consegue criar conta ✅
- Mas o perfil não aparece na tabela `users` ❌
- Trigger do banco não está funcionando

## 🚀 Solução Rápida (2 minutos)

### **Passo 1: Acessar Supabase**
1. Acesse [supabase.com](https://supabase.com)
2. Entre no seu projeto KMBio
3. Clique em **"SQL Editor"** no menu lateral

### **Passo 2: Executar Script**
1. Clique em **"New Query"**
2. Cole o conteúdo do arquivo `database/quick-fix.sql`
3. Clique em **"Run"** (botão verde)
4. Deve aparecer: "Setup completo! Trigger e função RPC criados."

### **Passo 3: Testar**
1. Recarregue o app no Expo Go
2. Tente fazer login com a conta que você criou
3. O perfil será criado automaticamente

## 🔍 Verificar se Funcionou

Execute no terminal:
```bash
cd KMBio
node scripts/check-database.js
```

Deve mostrar: "Total de usuários na tabela: 1" (ou mais)

## 🛠️ O que o Script Faz

1. **Cria função RPC**: Permite ao app criar perfil manualmente se o trigger falhar
2. **Recria o trigger**: Garante que novos usuários tenham perfil criado automaticamente
3. **Corrige permissões**: Permite que usuários autenticados usem a função

## 🎉 Resultado

Depois de executar o script:
- ✅ Novos usuários terão perfil criado automaticamente
- ✅ Usuários existentes terão perfil criado no próximo login
- ✅ Sistema funciona mesmo se o trigger falhar

---

**💡 Dica:** Execute apenas o arquivo `quick-fix.sql` - ele resolve tudo de uma vez!