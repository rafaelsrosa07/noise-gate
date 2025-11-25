"use client";

import { createClient } from "@/lib/supabase/client";
import { LogIn } from "lucide-react";

export default function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient();
    
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-emerald-900/50 px-6 py-3 rounded-md transition-all font-mono text-sm uppercase tracking-wider hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
    >
      <LogIn size={18} />
      Identificar Usuário
    </button>
  );
}
