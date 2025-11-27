"use client";

import { useRouter } from "next/navigation";
import Image from 'next/image';
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export default function AuthCodeErrorPage() {
  const router = useRouter();
  const [errorDetails, setErrorDetails] = useState<string>("");

  useEffect(() => {
    // Tenta capturar detalhes do erro da URL
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error || errorDescription) {
      setErrorDetails(errorDescription || error || "Erro desconhecido");
    }
  }, []);

  return (
    <main className="min-h-screen bg-black text-neutral-200 flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden selection:bg-red-500/30 selection:text-red-100">

      {/* Fundo Cyberpunk */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgb(239 68 68)' stroke-width='0.5'%3E%3Cpath d='M10 10 H 30 V 30 H 50' /%3E%3Cpath d='M60 10 V 40 H 90' /%3E%3Cpath d='M10 60 V 80 H 30 L 50 100' /%3E%3Cpath d='M60 60 H 90 V 90' /%3E%3Ccircle cx='10' cy='10' r='1.5' fill='rgb(239 68 68)' /%3E%3Ccircle cx='50' cy='30' r='1.5' fill='rgb(239 68 68)' /%3E%3Ccircle cx='90' cy='40' r='1.5' fill='rgb(239 68 68)' /%3E%3Ccircle cx='10' cy='60' r='1.5' fill='rgb(239 68 68)' /%3E%3Ccircle cx='90' cy='90' r='1.5' fill='rgb(239 68 68)' /%3E%3C/g%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '150px 150px'
      }}></div>
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-red-600/20 rounded-full blur-[150px] -translate-x-1/3 -translate-y-1/3 pointer-events-none z-0"></div>

      {/* Container Central */}
      <div className="w-full max-w-md bg-neutral-900/60 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.1)] animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20">
              <AlertTriangle size={48} className="text-red-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tighter text-white mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            <span className="text-white">ERRO DE </span>
            <span className="text-red-400">AUTENTICAÇÃO</span>
          </h1>
          <p className="text-neutral-500 text-xs tracking-[0.3em] uppercase font-medium">
            Falha na Validação de Credenciais
          </p>
        </div>

        {/* Mensagem de Erro */}
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-4 rounded-lg space-y-2">
          <p className="font-bold text-sm">Não foi possível completar o login com Google.</p>

          {errorDetails && (
            <p className="text-xs text-neutral-400 font-mono break-words">
              Detalhes: {errorDetails}
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-red-500/20 text-xs text-neutral-400 space-y-1">
            <p className="font-semibold text-red-300">Possíveis causas:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Variáveis de ambiente não configuradas</li>
              <li>Provider Google não habilitado no Supabase</li>
              <li>URL de callback não autorizada</li>
              <li>Credenciais OAuth inválidas</li>
            </ul>
          </div>
        </div>

        {/* Instruções */}
        <div className="mb-6 bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 text-xs text-neutral-300 space-y-2">
          <p className="font-bold text-emerald-400">📋 O que fazer:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Verifique o arquivo <code className="bg-black/50 px-1 py-0.5 rounded text-emerald-400">.env.local</code></li>
            <li>Consulte o guia <code className="bg-black/50 px-1 py-0.5 rounded text-emerald-400">GOOGLE_AUTH_SETUP.md</code></li>
            <li>Confirme as configurações no Dashboard do Supabase</li>
            <li>Verifique as credenciais no Google Cloud Console</li>
          </ol>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-lg transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95 tracking-wider flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> TENTAR NOVAMENTE
          </button>

          <button
            onClick={() => router.back()}
            className="w-full bg-transparent border border-neutral-700 hover:border-red-500/60 text-neutral-300 hover:text-red-300 hover:bg-red-500/5 font-bold py-4 rounded-lg transition-all active:scale-95 tracking-wider flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} /> VOLTAR
          </button>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-[10px] text-neutral-600 tracking-widest uppercase">
        Sistema de Segurança - Acesso Negado
      </div>
    </main>
  );
}
