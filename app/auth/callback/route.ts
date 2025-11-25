import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Pega os dados da URL que o Google mandou
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // CORREÇÃO: Usando 'await' para funcionar no Next.js 15
    const cookieStore = await cookies()

    // Cria o cliente Supabase temporário para validar o código
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    
    // Troca o código por uma sessão real de usuário
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Se deu tudo certo, manda o usuário pra Home logado
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Se der erro, manda pra uma tela de erro
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}