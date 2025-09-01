#!/usr/bin/env node

/**
 * Script de teste rápido para o KMBio
 * Execute: node scripts/quick-test.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 === TESTE RÁPIDO KMBIO ===\n');

// Verificar se estamos no diretório correto
if (!fs.existsSync('package.json')) {
  console.error('❌ Execute este script no diretório raiz do projeto KMBio');
  process.exit(1);
}

// Função para executar comandos
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ Sucesso!\n');
    return true;
  } catch (error) {
    console.error(`❌ Falhou: ${error.message}\n`);
    return false;
  }
}

// Função para verificar arquivos
function checkFile(filePath, description) {
  console.log(`📁 Verificando ${description}...`);
  if (fs.existsSync(filePath)) {
    console.log('✅ Arquivo encontrado!\n');
    return true;
  } else {
    console.log('❌ Arquivo não encontrado!\n');
    return false;
  }
}

// Executar testes
async function runTests() {
  let allPassed = true;

  // 1. Verificar estrutura do projeto
  console.log('🔍 === VERIFICAÇÃO DA ESTRUTURA ===');
  
  const criticalFiles = [
    ['src/services/obd/OBDService.ts', 'Serviço OBD'],
    ['src/utils/obd-calculations.ts', 'Utilitários de cálculo'],
    ['src/constants/pids.ts', 'Constantes PID'],
    ['src/types/ble/index.ts', 'Tipos BLE'],
    ['.env.example', 'Exemplo de ambiente'],
    ['SECURITY.md', 'Guia de segurança'],
    ['TESTING_GUIDE.md', 'Guia de testes']
  ];

  for (const [file, desc] of criticalFiles) {
    if (!checkFile(file, desc)) {
      allPassed = false;
    }
  }

  // 2. Verificar dependências
  console.log('📦 === VERIFICAÇÃO DE DEPENDÊNCIAS ===');
  if (!runCommand('npm list --depth=0', 'Verificando dependências instaladas')) {
    allPassed = false;
  }

  // 3. Executar testes automatizados
  console.log('🧪 === TESTES AUTOMATIZADOS ===');
  if (!runCommand('npm test -- --watchAll=false --verbose=false', 'Executando testes')) {
    allPassed = false;
  }

  // 4. Verificar build
  console.log('🔨 === VERIFICAÇÃO DE BUILD ===');
  if (!runCommand('npx tsc --noEmit', 'Verificando TypeScript')) {
    allPassed = false;
  }

  // 5. Verificar linting
  console.log('🔍 === VERIFICAÇÃO DE CÓDIGO ===');
  if (!runCommand('npx eslint src --ext .ts,.tsx --max-warnings 0', 'Verificando ESLint')) {
    console.log('⚠️  Avisos de linting encontrados (não crítico)\n');
  }

  // 6. Relatório final
  console.log('📊 === RELATÓRIO FINAL ===');
  
  if (allPassed) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ O aplicativo está pronto para ser testado');
    console.log('\n📱 Para testar o app:');
    console.log('   npx expo start');
    console.log('\n🌐 Para testar no navegador:');
    console.log('   npx expo start --web');
    console.log('\n📚 Consulte TESTING_GUIDE.md para mais detalhes');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM');
    console.log('🔧 Verifique os erros acima e corrija antes de prosseguir');
  }

  return allPassed;
}

// Executar
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Erro inesperado:', error);
  process.exit(1);
});