// Script para verificar se a tabela users existe no Supabase
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

async function checkDatabase() {
  console.log('🔍 Verificando conexão com Supabase...');
  
  try {
    // Testar conexão básica
    const { data, error } = await supabase.auth.getSession();
    if (error && error.message !== 'Auth session missing!') {
      console.error('❌ Erro de conexão:', error);
      return;
    }
    
    console.log('✅ Conexão com Supabase OK');
    
    // Verificar se a tabela users existe
    console.log('🔍 Verificando tabela users...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Erro ao acessar tabela users:', usersError);
      console.log('💡 Execute o script SQL em KMBio/database/create-users-table.sql no Supabase');
      return;
    }
    
    console.log('✅ Tabela users existe e está acessível');
    
    // Verificar se há usuários
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total de usuários na tabela: ${count || 0}`);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

checkDatabase();