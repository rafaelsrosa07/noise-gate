#!/usr/bin/env node

/**
 * Script de Verificação de Configuração do Noise Gate
 *
 * Este script verifica se todas as configurações necessárias
 * estão corretas antes de iniciar o aplicativo.
 *
 * Uso: node check-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verificando configuração do Noise Gate...\n');

let hasErrors = false;
let hasWarnings = false;

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function printSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
  hasErrors = true;
}

function printWarning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
  hasWarnings = true;
}

function printInfo(message) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`);
}

// Verifica se o arquivo .env.local existe
console.log(`${colors.blue}1. Verificando arquivo .env.local${colors.reset}`);
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  printError('Arquivo .env.local não encontrado');
  printInfo('   Execute: cp .env.example .env.local');
  printInfo('   Depois edite o arquivo com suas credenciais');
} else {
  printSuccess('Arquivo .env.local encontrado');

  // Lê o arquivo .env.local
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Verifica cada variável
  console.log(`\n${colors.blue}2. Verificando variáveis de ambiente${colors.reset}`);

  const requiredVars = [
    {
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      pattern: /NEXT_PUBLIC_SUPABASE_URL=(.+)/,
      validation: (value) => value && value.includes('supabase.co'),
      errorMsg: 'URL do Supabase não configurada ou inválida',
      hint: 'Deve ser algo como: https://xxxxx.supabase.co'
    },
    {
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      pattern: /NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/,
      validation: (value) => value && value.length > 50,
      errorMsg: 'Chave anon do Supabase não configurada ou inválida',
      hint: 'Deve ser uma chave JWT longa (começa com eyJ...)'
    },
  ];

  requiredVars.forEach(varConfig => {
    const match = envContent.match(varConfig.pattern);
    const value = match ? match[1].trim() : null;

    if (!value || value.includes('sua-chave') || value.includes('seu-projeto')) {
      printError(`${varConfig.name}: ${varConfig.errorMsg}`);
      printInfo(`   ${varConfig.hint}`);
    } else if (varConfig.validation && !varConfig.validation(value)) {
      printError(`${varConfig.name}: ${varConfig.errorMsg}`);
      printInfo(`   ${varConfig.hint}`);
    } else {
      printSuccess(`${varConfig.name}: Configurada`);
    }
  });

  // Verifica Gemini API (opcional)
  const geminiMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
  const geminiValue = geminiMatch ? geminiMatch[1].trim() : null;

  if (!geminiValue || geminiValue.includes('sua-chave')) {
    printWarning('GEMINI_API_KEY: Não configurada (opcional, mas necessária para funcionalidade de IA)');
  } else {
    printSuccess('GEMINI_API_KEY: Configurada');
  }
}

// Verifica node_modules
console.log(`\n${colors.blue}3. Verificando dependências${colors.reset}`);
const nodeModulesPath = path.join(__dirname, 'node_modules');

if (!fs.existsSync(nodeModulesPath)) {
  printError('Dependências não instaladas');
  printInfo('   Execute: npm install');
} else {
  printSuccess('Dependências instaladas');

  // Verifica pacotes específicos
  const requiredPackages = [
    '@supabase/supabase-js',
    '@supabase/ssr',
    'next',
    'react',
  ];

  requiredPackages.forEach(pkg => {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (!fs.existsSync(pkgPath)) {
      printWarning(`Pacote ${pkg} não encontrado`);
      printInfo('   Execute: npm install');
    }
  });
}

// Verifica estrutura de arquivos
console.log(`\n${colors.blue}4. Verificando estrutura do projeto${colors.reset}`);

const requiredFiles = [
  'app/page.tsx',
  'app/auth/callback/route.ts',
  'lib/supabase/client.ts',
  'package.json',
  'next.config.ts',
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    printError(`Arquivo ${file} não encontrado`);
  } else {
    printSuccess(`Arquivo ${file} existe`);
  }
});

// Resumo final
console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log(`\n${colors.red}❌ Existem problemas que precisam ser corrigidos!${colors.reset}`);
  console.log(`\n${colors.cyan}📖 Consulte os guias:${colors.reset}`);
  console.log('   - RESOLVER_ERRO_GOOGLE.md (para configurar Google OAuth)');
  console.log('   - GOOGLE_AUTH_SETUP.md (guia completo de configuração)');
  console.log('   - README.md (instruções gerais)');
  process.exit(1);
} else if (hasWarnings) {
  console.log(`\n${colors.yellow}⚠️  Configuração básica OK, mas existem avisos${colors.reset}`);
  console.log(`\n${colors.green}Você pode iniciar o servidor com: npm run dev${colors.reset}`);
  process.exit(0);
} else {
  console.log(`\n${colors.green}✅ Tudo configurado corretamente!${colors.reset}`);
  console.log(`\n${colors.green}Você pode iniciar o servidor com: npm run dev${colors.reset}`);
  process.exit(0);
}
