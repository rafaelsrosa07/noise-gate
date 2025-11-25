import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import LoginButton from "@/components/LoginButton";
import NoiseGateInterface from "@/components/NoiseGateInterface";
import { Zap } from 'lucide-react';

export default async function Home() {
  // 1. Await cookies (Padrão Next.js 15+)
  const cookieStore = await cookies()

  // 2. Configurar Supabase no modo "Read-Only" (Seguro para Server Components)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // O PULO DO GATO: Blindamos o 'set' e 'remove' com try/catch.
        // Se o Supabase tentar escrever, o erro é ignorado silenciosamente,
        // evitando que a página quebre.
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // O Next.js proíbe setar cookies aqui. 
            // Ignoramos porque a atualização de sessão deve ser feita via Middleware
            // ou na rota de Auth, não na renderização da Home.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            // Mesmo motivo acima.
          }
        },
      },
    }
  )

  // 3. Verificar Sessão
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Renderização Condicional
  return (
    <>
      {user ? (
        <NoiseGateInterface user={user} />
      ) : (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
           {/* Background decorativo sutil */}
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-black to-black"></div>
           
           <div className="mb-10 text-center animate-in fade-in zoom-in duration-1000 relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white flex items-center justify-center gap-3 mb-4" style={{textShadow: "0 0 30px rgba(16, 185, 129, 0.4)"}}>
              <Zap size={36} className="text-emerald-500" fill="currentColor" /> NOISE GATE
            </h1>
            <p className="text-neutral-500 font-mono text-xs tracking-[0.3em] uppercase">Acesso Restrito a Operadores</p>
          </div>
          
          <div className="relative z-10 scale-110">
            <LoginButton />
          </div>
        </main>
      )}
    </>
  );
}