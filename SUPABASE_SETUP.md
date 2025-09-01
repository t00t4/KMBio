# 🔧 Setup do Supabase - KMBio

## 📋 Passos para Configurar o Banco de Dados

### 1. **Acessar o Supabase Dashboard**
1. Acesse [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto KMBio

### 2. **Executar Scripts SQL**

#### **Passo 1: Criar/Verificar Tabela Users**
1. No dashboard, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New Query"**
3. Cole o conteúdo do arquivo `database/create-users-table.sql`
4. Clique em **"Run"** para executar

#### **Passo 2: Corrigir Políticas RLS (se necessário)**
1. No SQL Editor, crie uma nova query
2. Cole o conteúdo do arquivo `database/fix-rls-policy.sql`
3. Clique em **"Run"** para executar

### 3. **Verificar se Está Funcionando**

#### **Verificar Tabela**
```sql
-- Execute esta query no SQL Editor
SELECT * FROM public.users LIMIT 5;
```

#### **Verificar Trigger**
```sql
-- Execute esta query para verificar se o trigger existe
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND trigger_schema = 'public';
```

#### **Verificar Políticas RLS**
```sql
-- Execute esta query para ver as políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users';
```

### 4. **Testar no App**

Depois de executar os scripts:

1. **Recarregue o app** no Expo Go
2. **Tente criar uma nova conta**
3. **Verifique se não há mais erros**

### 🚨 **Problemas Comuns**

#### **Erro: "relation 'users' does not exist"**
- Execute o script `create-users-table.sql`

#### **Erro: "new row violates row-level security policy"**
- Execute o script `fix-rls-policy.sql`

#### **Erro: "Cannot coerce the result to a single JSON object"**
- O trigger não está funcionando
- Execute o script `fix-rls-policy.sql` que recria o trigger

### 📊 **Status Atual**

- ✅ Conexão com Supabase: OK
- ✅ Tabela users: Existe
- ❓ Trigger: Precisa verificar
- ❓ Políticas RLS: Podem precisar de ajuste

### 🔍 **Debug**

Para verificar se tudo está funcionando, execute no terminal:

```bash
cd KMBio
node scripts/check-database.js
```

Este script verifica:
- Conexão com Supabase
- Existência da tabela users
- Quantidade de usuários cadastrados

---

**💡 Dica:** Sempre execute os scripts na ordem: primeiro `create-users-table.sql`, depois `fix-rls-policy.sql` se necessário.