# 🎚️ Noise Gate

**Noise Gate** é uma aplicação web que usa IA para separar e filtrar ruídos de áudio, permitindo isolar vozes ou músicas de gravações com interferências.

## 🚀 Tecnologias

- **Next.js 16** - Framework React
- **Supabase** - Autenticação e backend
- **Google Gemini AI** - Processamento de áudio com IA
- **Tailwind CSS** - Estilização
- **TypeScript** - Tipagem estática

## 📋 Pré-requisitos

- Node.js 20+ instalado
- Conta no [Supabase](https://supabase.com)
- Conta no [Google Cloud](https://console.cloud.google.com) (para autenticação OAuth)
- Chave API do [Google Gemini](https://makersuite.google.com/app/apikey) (opcional)

## ⚙️ Configuração

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd noise-gate
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` e adicione suas chaves:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
GEMINI_API_KEY=sua-chave-gemini-aqui
```

### 4. Configure a autenticação do Google

⚠️ **IMPORTANTE**: Para usar o login com Google, siga o guia completo:

👉 **[GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md)** - Guia passo a passo detalhado

**Resumo rápido:**
1. Habilite o provider Google no Dashboard do Supabase
2. Crie credenciais OAuth no Google Cloud Console
3. Conecte as credenciais ao Supabase
4. Configure as URLs permitidas

## 🏃 Executando o projeto

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## 🔐 Autenticação

O projeto suporta dois métodos de autenticação:

1. **Email/Senha** - Cadastro tradicional com Supabase Auth
2. **Google OAuth** - Login social com conta Google

## 🛠️ Scripts disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Cria build de produção
npm start        # Inicia servidor de produção
npm run lint     # Executa linter
```

## 📁 Estrutura do projeto

```
noise-gate/
├── app/
│   ├── api/              # API routes
│   ├── auth/             # Rotas de autenticação
│   │   ├── callback/     # Callback OAuth
│   │   └── auth-code-error/  # Página de erro
│   ├── page.tsx          # Página de login
│   └── layout.tsx        # Layout principal
├── components/           # Componentes React
├── lib/
│   └── supabase/        # Cliente Supabase
└── public/              # Arquivos estáticos
```

## 🐛 Solução de problemas

### Login com Google não funciona

Se você está tendo problemas com autenticação do Google, consulte:

- 📖 **[GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md)** - Guia completo de configuração
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o provider Google está habilitado no Supabase
- Verifique a URL de callback no Google Cloud Console

### Outros problemas comuns

- **Erro ao iniciar**: Verifique se todas as dependências foram instaladas (`npm install`)
- **Erro de build**: Execute `npm run build` para ver erros de TypeScript
- **Variáveis de ambiente não carregadas**: Reinicie o servidor após alterar `.env.local`

## 📝 Licença

Este projeto é privado e proprietário.

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
2. Commit suas mudanças (`git commit -m 'feat: Adiciona MinhaFeature'`)
3. Push para a branch (`git push origin feature/MinhaFeature`)
4. Abra um Pull Request

## 📚 Recursos úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini AI](https://ai.google.dev/gemini-api/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
