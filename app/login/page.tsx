"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { LogIn, UserPlus, AlertTriangle, Terminal, Mail, Lock } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (action: 'login' | 'signup') => {
    if (!email || !password) {
        setErrorMessage("Preencha e-mail e senha.");
        return;
    }
    setLoading(true);
    setErrorMessage(null);

    try {
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
            emailRedirectTo: `${location.origin}/auth/callback`,
          }
        });
        error = signUpError;
        if (!error) {
            setErrorMessage("Verifique seu e-mail para confirmar o cadastro.");
            setLoading(false);
            return;
        }
      }

      if (error) {
        setErrorMessage(error.message || "Erro na autenticação.");
      } else {
        router.refresh();
        router.push("/"); // Redireciona para a home após sucesso
      }
    } catch (err) {
      setErrorMessage("Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  // --- COMPONENTE VISUAL: Loader ---
  const TerminalLoader = () => (
    <div className="flex items-center gap-2 text-emerald-400 animate-pulse font-mono text-sm">
        <Terminal size={16} />
        <span>PROCESSANDO CREDENCIAIS...</span>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-neutral-200 flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-100">

      {/* --- FUNDO CYBERPUNK (Mesmo da Interface Principal) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgb(16 185 129)' stroke-width='0.5'%3E%3Cpath d='M10 10 H 30 V 30 H 50' /%3E%3Cpath d='M60 10 V 40 H 90' /%3E%3Cpath d='M10 60 V 80 H 30 L 50 100' /%3E%3Cpath d='M60 60 H 90 V 90' /%3E%3Ccircle cx='10' cy='10' r='1.5' fill='rgb(16 185 129)' /%3E%3Ccircle cx='50' cy='30' r='1.5' fill='rgb(16 185 129)' /%3E%3Ccircle cx='90' cy='40' r='1.5' fill='rgb(16 185 129)' /%3E%3Ccircle cx='10' cy='60' r='1.5' fill='rgb(16 185 129)' /%3E%3Ccircle cx='90' cy='90' r='1.5' fill='rgb(16 185 129)' /%3E%3C/g%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '150px 150px'
      }}></div>
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-emerald-600/20 rounded-full blur-[150px] -translate-x-1/3 -translate-y-1/3 pointer-events-none z-0"></div>

      {/* --- CONTAINER CENTRAL DE AUTH --- */}
      <div className="w-full max-w-md bg-neutral-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-8 relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.1)] animate-in fade-in zoom-in-95 duration-500">
        
        {/* HEADER DO CARD */}
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

        {/* FORMULÁRIO */}
        <div className="space-y-4">
            <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input
                    type="email"
                    placeholder="E-mail do Operador"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/50 border border-neutral-800 rounded-lg py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-white placeholder:text-neutral-600 transition-all"
                    disabled={loading}
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
                    disabled={loading}
                />
            </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="mt-8 space-y-3">
            {loading ? (
                <div className="flex justify-center py-4">
                    <TerminalLoader />
                </div>
            ) : (
                <>
                {/* Botão de Login (Principal) */}
                <button
                    onClick={() => handleAuth('login')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold py-4 rounded-lg transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 tracking-wider flex items-center justify-center gap-2"
                >
                    <LogIn size={18} /> ACESSAR SISTEMA
                </button>

                {/* Botão de Cadastro (Secundário) */}
                <button
                    onClick={() => handleAuth('signup')}
                    className="w-full bg-transparent border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 font-bold py-4 rounded-lg transition-all active:scale-95 tracking-wider flex items-center justify-center gap-2"
                >
                    <UserPlus size={18} /> NOVO CADASTRO
                </button>
                </>
            )}
        </div>

      </div>
      
      {/* Footer simples */}
      <div className="absolute bottom-6 text-[10px] text-neutral-600 tracking-widest uppercase">
        Protocolo de Segurança Ativo v1.0.4
      </div>
    </main>
  );
}
