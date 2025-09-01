// Script para verificar se o trigger está funcionando
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrigger() {
  console.log('🔍 Verificando trigger e função...');
  
  try {
    // Verificar se a função handle_new_user existe
    console.log('📋 Verificando função handle_new_user...');
    const { data: functions, error: funcError } = await supabase.rpc('sql', {
      query: `
        SELECT 
          proname as function_name,
          prosrc as function_body
        FROM pg_proc 
        WHERE proname = 'handle_new_user'
      `
    });
    
    if (funcError) {
      console.log('⚠️  Não foi possível verificar funções (normal com RLS)');
    } else if (functions && functions.length > 0) {
      console.log('✅ Função handle_new_user encontrada');
    } else {
      console.log('❌ Função handle_new_user não encontrada');
    }
    
    // Verificar triggers
    console.log('📋 Verificando triggers...');
    const { data: triggers, error: triggerError } = await supabase.rpc('sql', {
      query: `
        SELECT 
          trigger_name, 
          event_manipulation, 
          action_timing, 
          event_object_table
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
          AND trigger_schema = 'public'
      `
    });
    
    if (triggerError) {
      console.log('⚠️  Não foi possível verificar triggers (normal com RLS)');
    } else if (triggers && triggers.length > 0) {
      console.log('✅ Triggers encontrados:', triggers);
    } else {
      console.log('❌ Nenhum trigger encontrado na tabela users');
    }
    
    // Verificar usuários na tabela auth.users
    console.log('📋 Verificando usuários em auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('⚠️  Não foi possível acessar auth.users (precisa de service_role key)');
    } else {
      console.log(`📊 Total de usuários em auth.users: ${authUsers.users.length}`);
      if (authUsers.users.length > 0) {
        console.log('👤 Último usuário criado:', {
          id: authUsers.users[authUsers.users.length - 1].id,
          email: authUsers.users[authUsers.users.length - 1].email,
          created_at: authUsers.users[authUsers.users.length - 1].created_at
        });
      }
    }
    
    console.log('\n🔧 DIAGNÓSTICO:');
    console.log('- Tabela public.users: ✅ Existe');
    console.log('- Registros em public.users: ❌ 0 registros');
    console.log('- Trigger: ❓ Precisa ser verificado/criado no Supabase Dashboard');
    console.log('\n💡 SOLUÇÃO:');
    console.log('Execute o script database/fix-rls-policy.sql no Supabase Dashboard');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

checkTrigger();