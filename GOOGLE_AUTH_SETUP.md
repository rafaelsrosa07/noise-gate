# Configuração da Autenticação Google

Este guia explica como configurar a autenticação do Google no Noise Gate.

## Pré-requisitos

1. Projeto Supabase criado
2. Conta Google Cloud Platform (GCP)

## Passo 1: Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```

2. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)

3. Vá em **Settings** → **API** e copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Cole os valores no arquivo `.env.local`

## Passo 2: Habilitar Google Provider no Supabase

1. No Dashboard do Supabase, vá em **Authentication** → **Providers**

2. Encontre **Google** na lista e clique em **Enable**

3. Você verá dois campos:
   - **Authorized Client IDs** (vamos preencher no próximo passo)
   - **Redirect URL** - Copie esta URL, você vai precisar dela

   A Redirect URL será algo como:
   ```
   https://seu-projeto.supabase.co/auth/v1/callback
   ```

## Passo 3: Criar Credenciais OAuth no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)

2. Crie um novo projeto ou selecione um existente

3. Vá em **APIs & Services** → **Credentials**

4. Clique em **+ CREATE CREDENTIALS** → **OAuth client ID**

5. Se for a primeira vez, configure a **OAuth consent screen**:
   - Escolha **External**
   - Preencha os campos obrigatórios (App name, User support email, Developer contact)
   - Adicione os scopes: `email`, `profile`, `openid`
   - Salve

6. Volte para criar as credenciais:
   - Application type: **Web application**
   - Name: "Noise Gate" (ou o nome que preferir)

7. Em **Authorized redirect URIs**, adicione:
   - A URL do callback do Supabase (que você copiou no Passo 2)
   - URLs de desenvolvimento (se necessário):
     ```
     http://localhost:3000/auth/callback
     http://127.0.0.1:3000/auth/callback
     ```

8. Clique em **CREATE**

9. Copie o **Client ID** e o **Client Secret** que aparecerem

## Passo 4: Conectar Google OAuth ao Supabase

1. Volte ao Dashboard do Supabase → **Authentication** → **Providers** → **Google**

2. Cole as credenciais:
   - **Client ID** (do Google Cloud)
   - **Client Secret** (do Google Cloud)

3. Em **Authorized Client IDs**, adicione o mesmo Client ID

4. Clique em **Save**

## Passo 5: Configurar URLs Permitidas

1. No Supabase, vá em **Authentication** → **URL Configuration**

2. Adicione as URLs do seu site em **Site URL**:
   ```
   http://localhost:3000
   ```

3. Em **Redirect URLs**, adicione:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000
   ```

   Para produção, adicione também:
   ```
   https://seu-dominio.com
   https://seu-dominio.com/auth/callback
   ```

## Passo 6: Testar a Autenticação

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse `http://localhost:3000`

3. Clique em **ENTRAR COM GOOGLE**

4. Você será redirecionado para a página de login do Google

5. Após fazer login, será redirecionado de volta para o app

## Solução de Problemas

### Erro: "Access blocked: This app's request is invalid"

**Causa:** OAuth consent screen não está configurado corretamente

**Solução:**
- Verifique se configurou o OAuth consent screen
- Adicione os scopes necessários (`email`, `profile`, `openid`)
- Se em desenvolvimento, adicione seu email como "Test user"

### Erro: "redirect_uri_mismatch"

**Causa:** A URL de callback não está na lista de URIs autorizadas

**Solução:**
- Verifique se a URL do callback do Supabase está exatamente igual no Google Cloud Console
- Não esqueça de incluir `https://` ou `http://`
- Verifique se não há espaços ou caracteres extras

### Erro: "Invalid provider"

**Causa:** Provider Google não está habilitado no Supabase ou credenciais estão incorretas

**Solução:**
- Verifique se o provider Google está enabled no Supabase
- Confirme que Client ID e Secret estão corretos
- Salve as configurações no Supabase

### Login com Google não redireciona

**Causa:** Variáveis de ambiente não carregadas ou URL de callback incorreta

**Solução:**
- Reinicie o servidor Next.js após alterar `.env.local`
- Verifique se o arquivo `.env.local` existe na raiz do projeto
- Confirme que as variáveis começam com `NEXT_PUBLIC_` para serem acessíveis no cliente

### Erro de CORS

**Causa:** Domínio não está na lista de URLs permitidas do Supabase

**Solução:**
- Adicione seu domínio em Authentication → URL Configuration
- Inclua tanto a Site URL quanto a Redirect URL

## Verificação do Console

Para depurar problemas, abra o Console do navegador (F12) e procure por:
- Logs de "Iniciando OAuth Google..." (indica que o botão funciona)
- Erros de autenticação do Supabase
- Problemas de redirecionamento

## Referências

- [Documentação Supabase - Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)
