# 🔧 Como Resolver: "Acesso bloqueado: a solicitação desse app é inválida"

Este guia resolve o erro específico que você está vendo ao tentar fazer login com Google.

## 🎯 O Problema

Quando você clica em "ENTRAR COM GOOGLE", o Google mostra:
```
Acesso bloqueado: a solicitação desse app é inválida
```

**Por que isso acontece?**
- O OAuth Consent Screen não está configurado corretamente
- Seu email não foi adicionado como usuário de teste
- Faltam informações obrigatórias na configuração

## ✅ Solução Passo a Passo

### PASSO 1: Acessar o Google Cloud Console

1. Abra seu navegador
2. Acesse: https://console.cloud.google.com/
3. Faça login com sua conta Google (`rafaelsrosa0@gmail.com`)

### PASSO 2: Selecionar ou Criar Projeto

**Se você JÁ TEM um projeto:**
1. No topo da página, clique no nome do projeto (ao lado de "Google Cloud")
2. Selecione o projeto que você criou para o Noise Gate

**Se você NÃO TEM projeto ainda:**
1. No topo da página, clique em "Select a project"
2. Clique em "NEW PROJECT"
3. Nome do projeto: `NoiseGate` (ou o nome que preferir)
4. Clique em "CREATE"
5. Aguarde alguns segundos até o projeto ser criado
6. Selecione o projeto recém-criado

### PASSO 3: Configurar OAuth Consent Screen (IMPORTANTE!)

Esta é a parte mais importante para resolver o erro.

1. No menu lateral esquerdo, clique em "APIs & Services"
2. Clique em "OAuth consent screen"

#### 3.1 - User Type

Você verá duas opções:

- **Internal** (apenas para Google Workspace)
- **External** (para qualquer conta Google) ✅

**Selecione "External"** e clique em "CREATE"

#### 3.2 - App Information (Tela 1)

Preencha os seguintes campos:

**Campos OBRIGATÓRIOS:**

| Campo | O que colocar |
|-------|---------------|
| **App name** | `Noise Gate` |
| **User support email** | `rafaelsrosa0@gmail.com` (seu email) |
| **App logo** | Pode deixar em branco por enquanto |
| **App domain** | Deixe em branco por enquanto |
| **Authorized domains** | Deixe em branco por enquanto |
| **Developer contact information** | `rafaelsrosa0@gmail.com` |

**Clique em "SAVE AND CONTINUE"**

#### 3.3 - Scopes (Tela 2)

1. Clique em "ADD OR REMOVE SCOPES"
2. Na lista que aparecer, marque as seguintes opções:
   - ✅ `.../auth/userinfo.email`
   - ✅ `.../auth/userinfo.profile`
   - ✅ `openid`

3. Role até o final da lista e clique em "UPDATE"
4. Clique em "SAVE AND CONTINUE"

#### 3.4 - Test Users (Tela 3) - MUITO IMPORTANTE!

**Este é o passo que resolve seu erro!**

1. Clique em "+ ADD USERS"
2. Digite seu email: `rafaelsrosa0@gmail.com`
3. Clique em "ADD"
4. Clique em "SAVE AND CONTINUE"

#### 3.5 - Summary (Tela 4)

1. Revise as informações
2. Clique em "BACK TO DASHBOARD"

✅ **Pronto! OAuth Consent Screen configurado!**

### PASSO 4: Criar Credenciais OAuth

Agora vamos criar as credenciais que o Supabase precisa.

1. No menu lateral, clique em "Credentials"
2. No topo, clique em "+ CREATE CREDENTIALS"
3. Selecione "OAuth client ID"

#### 4.1 - Configurar Client ID

| Campo | O que colocar |
|-------|---------------|
| **Application type** | Web application |
| **Name** | `Noise Gate Web Client` |

#### 4.2 - Authorized JavaScript origins

Clique em "+ Add URI" e adicione:

```
http://localhost:3000
```

Se você tiver um domínio de produção, adicione também:
```
https://seu-dominio.com
```

#### 4.3 - Authorized redirect URIs

**IMPORTANTE:** Você precisa pegar a URL de callback do Supabase.

**Como pegar a URL de callback do Supabase:**

1. Abra uma nova aba no navegador
2. Acesse: https://supabase.com/dashboard
3. Selecione seu projeto Noise Gate
4. No menu lateral, clique em "Authentication"
5. Clique em "Providers"
6. Encontre "Google" na lista
7. Expanda clicando na setinha
8. Copie a URL que aparece em "Callback URL (for OAuth)"
   - Será algo como: `https://xxxxxxx.supabase.co/auth/v1/callback`

**Volte para o Google Cloud Console** e:

1. Clique em "+ ADD URI" em "Authorized redirect URIs"
2. Cole a URL do callback do Supabase
3. Clique em "+ ADD URI" novamente e adicione também:
   ```
   http://localhost:3000/auth/callback
   ```

#### 4.4 - Criar

1. Clique em "CREATE"
2. Uma janela vai aparecer com:
   - **Client ID** (algo como: 123456-abc.apps.googleusercontent.com)
   - **Client Secret** (algo como: GOCSPX-abc123...)

3. **COPIE E GUARDE AMBOS!** Você vai precisar no próximo passo.

### PASSO 5: Conectar Google ao Supabase

Agora vamos conectar as credenciais do Google ao Supabase.

1. Volte para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em "Authentication" → "Providers"
4. Encontre "Google" e clique para expandir
5. Ative o toggle "Enable Sign in with Google"

Preencha:

| Campo | O que colocar |
|-------|---------------|
| **Authorized Client IDs** | Cole o Client ID que você copiou |
| **Client ID (for OAuth)** | Cole o mesmo Client ID |
| **Client Secret (for OAuth)** | Cole o Client Secret que você copiou |

6. Clique em "SAVE"

### PASSO 6: Configurar URLs no Supabase

Ainda no Supabase:

1. Vá em "Authentication" → "URL Configuration"
2. Em **Site URL**, coloque:
   ```
   http://localhost:3000
   ```

3. Em **Redirect URLs**, adicione (clique em + para cada uma):
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

4. Clique em "SAVE"

### PASSO 7: Configurar Variáveis de Ambiente

No seu computador, na pasta do projeto:

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env.local
   ```

2. Abra o arquivo `.env.local` em um editor de texto

3. Preencha as variáveis:

**Para pegar as credenciais do Supabase:**
- Vá em https://supabase.com/dashboard
- Selecione seu projeto
- Clique em "Settings" (ícone de engrenagem)
- Clique em "API"
- Copie:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Seu arquivo `.env.local` deve ficar assim:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3BxcnN0IiJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNDQ0MDAwMCwiZXhwIjoxOTQwMDE2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=sua-chave-gemini-aqui
```

### PASSO 8: Testar

1. **Reinicie o servidor** (IMPORTANTE!):
   ```bash
   # Se estiver rodando, pare com Ctrl+C
   npm run dev
   ```

2. Abra o navegador em: http://localhost:3000

3. Clique em "ENTRAR COM GOOGLE"

4. Você será redirecionado para a página de login do Google

5. **Importante:** Use o email que você adicionou como Test User (`rafaelsrosa0@gmail.com`)

6. Após fazer login, você será redirecionado de volta para o app

## 🔍 Checklist de Verificação

Use este checklist para garantir que tudo está configurado:

- [ ] Projeto criado no Google Cloud Console
- [ ] OAuth Consent Screen configurado (External)
- [ ] Email `rafaelsrosa0@gmail.com` adicionado como Test User
- [ ] Scopes configurados (email, profile, openid)
- [ ] Credenciais OAuth criadas (Client ID e Secret)
- [ ] URL de callback do Supabase adicionada no Google
- [ ] Provider Google habilitado no Supabase
- [ ] Client ID e Secret configurados no Supabase
- [ ] URLs configuradas no Supabase (Site URL e Redirect URLs)
- [ ] Arquivo `.env.local` criado e preenchido
- [ ] Servidor reiniciado

## ❓ Ainda com Problemas?

### Erro persiste após seguir todos os passos

1. **Limpe o cache do navegador:**
   - Chrome/Edge: `Ctrl + Shift + Delete` → Limpar tudo
   - Ou use uma janela anônima/privada

2. **Verifique o console do navegador:**
   - Pressione `F12`
   - Vá na aba "Console"
   - Procure por mensagens de erro em vermelho
   - Tire uma print e me mostre

3. **Teste com outro navegador:**
   - Às vezes o cache pode causar problemas

### Erro "redirect_uri_mismatch"

Significa que a URL de callback não está correta. Verifique:

1. No Google Cloud Console, em Credentials → OAuth Client ID
2. A URL de callback do Supabase deve estar **exatamente** igual
3. Não pode ter espaços, barras extras, etc.

### Erro "Access denied"

Significa que seu email não está na lista de Test Users.

1. Volte no OAuth Consent Screen
2. Vá em "Test users"
3. Adicione seu email novamente
4. Salve

## 📸 Precisa de Ajuda Visual?

Se precisar de prints das telas, me avise! Posso criar um vídeo ou prints detalhadas de cada passo.

## 💡 Dica Final

Quando o app estiver funcionando e você quiser liberar para outros usuários (não apenas você), você precisará:

1. Voltar no OAuth Consent Screen
2. Clicar em "PUBLISH APP"
3. Isso permite que qualquer pessoa com conta Google faça login

Mas por enquanto, mantenha em modo "Testing" para desenvolver com segurança.
