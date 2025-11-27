"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { LogIn, UserPlus, AlertTriangle, Terminal, Mail, Lock, Chrome } from "lucide-react";
import NoiseGateInterface from "@/components/NoiseGateInterface";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // Verifica autenticação ao carregar a página
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Erro ao verificar usuário:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleAuth = async (action: 'login' | 'signup' | 'google') => {
    setAuthLoading(true);
    setErrorMessage(null);

    try {
      // --- LOGIN COM GOOGLE ---
      if (action === 'google') {
        console.log("Iniciando OAuth Google...");

        // Verifica se as variáveis de ambiente estão configuradas
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.error("Erro: Variáveis de ambiente do Supabase não configuradas!");
          setErrorMessage("Configuração do Supabase ausente. Verifique o arquivo .env.local");
          setAuthLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
            console.error("Erro OAuth:", error);
            setErrorMessage(`Erro ao conectar com Google: ${error.message}`);
            setAuthLoading(false);
            return;
        }

        console.log("Redirecionando para Google OAuth...", data);
        return;
      }

      // --- VALIDAÇÃO BÁSICA PARA EMAIL/SENHA ---
      if (!email || !password) {
        setErrorMessage("Preencha e-mail e senha.");
        setAuthLoading(false);
        return;
      }

      let error;
      if (action === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        error = signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });
        error = signUpError;
        if (!error) {
            setErrorMessage("Verifique seu e-mail para confirmar o cadastro.");
            setAuthLoading(false);
            return;
        }
      }

      if (error) {
        setErrorMessage(error.message || "Erro na autenticação.");
      } else {
        // Após login bem-sucedido, o useEffect vai detectar a mudança e atualizar o user
        router.refresh();
      }
    } catch (err: any) {
      console.error("Erro Geral:", err);
      setErrorMessage(err.message || "Ocorreu um erro inesperado.");
    } finally {
      if (action !== 'google') {
          setAuthLoading(false);
      }
    }
  };

  // Loading inicial
  if (loading) {
    return (
      <main className="min-h-screen bg-black text-neutral-200 flex items-center justify-center font-mono">
        <div className="flex items-center gap-2 text-emerald-400 animate-pulse">
          <Terminal size={20} />
          <span>VERIFICANDO CREDENCIAIS...</span>
        </div>
      </main>
    );
  }

  // Se usuário está autenticado, mostra a interface principal
  if (user) {
    return <NoiseGateInterface user={user} />;
  }

  // Se não está autenticado, mostra a tela de login
  const TerminalLoader = () => (
    <div className="flex items-center gap-2 text-emerald-400 animate-pulse font-mono text-sm justify-center">
        <Terminal size={16} />
        <span>PROCESSANDO DADOS...</span>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-neutral-200 flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-100">

      {/* --- FUNDO CYBERPUNK --- */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgb(16 185 129)' stroke-width='0.5'%3E%3Cpath d='M10 10 H 30 V 30 H 50' /%3E%3Cpath d='M60 10 V 40 H 90' /%3E%3Cpath d='M10 60 V 80 H 30 L 50 100' /%3E%3Cpath d='M60 60 H 90 V 90' /%3E%3Ccircle cx='10' cy='10' r='1.5' fill='rgb(16 185 129)' /%3E%3Ccircle cx='50' cy='30' r='1.5' fill='rgb(16 185 129)' /%3E%3Ccircle cx='90' cy='40' r='1.5' fill='rgb(16 185 129)' /%3E%3Ccircle cx='10' cy='60' r='1.5' fill='rgb(16 185 129)' /%3E%3Ccircle cx='90' cy='90' r='1.5' fill='rgb(16 185 129)' /%3E%3C/g%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '150px 150px'
      }}></div>
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-emerald-600/20 rounded-full blur-[150px] -translate-x-1/3 -translate-y-1/3 pointer-events-none z-0"></div>

      {/* --- CONTAINER CENTRAL --- */}
      <div className="w-full max-w-md bg-neutral-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-8 relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.1)] animate-in fade-in zoom-in-95 duration-500">

        {/* LOGO E TÍTULO */}
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tighter text-white flex items-center justify-center gap-3 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <Image
                src="/noise-gate-funnel-icon.png"
                alt="Noise Gate Funnel Icon"
                width={40}
                height={40}
                className="h-10 w-auto drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]"
            /><span className="text-white">NOISE</span><span className="text-emerald-400">GATE</span>
            </h1>
            <p className="text-neutral-500 text-xs tracking-[0.3em] uppercase font-medium">Acesso Restrito a Operadores</p>
        </div>

        {errorMessage && (
            <div className="mb-6 bg-orange-500/10 border border-orange-500/20 text-orange-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm animate-in slide-in-from-top-2">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
            </div>
        )}

        {/* --- FORMULÁRIO (EMAIL/SENHA) --- */}
        <div className="space-y-4 mb-8">
            <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input
                    type="email"
                    placeholder="E-mail do Operador"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/50 border border-neutral-800 rounded-lg py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-white placeholder:text-neutral-600 transition-all"
                    disabled={authLoading}
                />
            </div>
            <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input
                    type="password"
                    placeholder="Senha de Acesso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAuth('login')}
                    className="w-full bg-black/50 border border-neutral-800 rounded-lg py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-white placeholder:text-neutral-600 transition-all"
                    disabled={authLoading}
                />
            </div>
        </div>

        {/* --- ÁREA DE BOTÕES --- */}
        <div className="space-y-3">
            {authLoading ? (
                <TerminalLoader />
            ) : (
                <>
                {/* 1. ACESSAR SISTEMA (Botão Principal - Sólido) */}
                <button
                    type="button"
                    onClick={() => handleAuth('login')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold py-4 rounded-lg transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 tracking-wider flex items-center justify-center gap-2"
                >
                    <LogIn size={18} /> ACESSAR SISTEMA
                </button>

                <div className="relative flex py-1 items-center justify-center opacity-50">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-600">Ou use</span>
                </div>

                {/* 2. ENTRAR COM GOOGLE (Botão Secundário - Estilo Dark/Tech) */}
                <button
                    type="button"
                    onClick={() => handleAuth('google')}
                    className="w-full bg-neutral-900/80 border border-neutral-700 hover:border-emerald-500/50 hover:bg-neutral-800 text-white font-bold py-4 rounded-lg transition-all active:scale-95 tracking-wide flex items-center justify-center gap-3 group shadow-lg"
                >
                     {/* Ícone Chrome branco ou colorido sutilmente */}
                    <Chrome size={18} className="text-emerald-400 group-hover:scale-110 transition-transform"/>
                    <span>ENTRAR COM GOOGLE</span>
                </button>

                {/* 3. NOVO CADASTRO (Botão Terciário - Outline Discreto) */}
                <button
                    type="button"
                    onClick={() => handleAuth('signup')}
                    className="w-full bg-transparent border border-emerald-500/20 hover:border-emerald-500/60 text-emerald-600 hover:text-emerald-300 font-bold py-3 rounded-lg transition-all active:scale-95 tracking-wider flex items-center justify-center gap-2 text-xs uppercase mt-2"
                >
                    <UserPlus size={16} /> Criar Nova Conta
                </button>
                </>
            )}
        </div>

      </div>

      <div className="absolute bottom-6 text-[10px] text-neutral-600 tracking-widest uppercase">
        Protocolo de Segurança Ativo v1.0.7
      </div>
    </main>
  );
}
