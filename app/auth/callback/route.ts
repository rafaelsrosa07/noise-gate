import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Pega os dados da URL que o Google mandou
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('🔄 Callback OAuth recebido');
  console.log('📝 Code presente:', code ? 'SIM' : 'NÃO');

  if (code) {
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
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('❌ Erro ao definir cookie:', name, error);
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.delete({ name, ...options })
            } catch (error) {
              console.error('❌ Erro ao remover cookie:', name, error);
            }
          },
        },
      }
    )

    // Troca o código por uma sessão real de usuário
    console.log('🔄 Trocando código por sessão...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      console.log('✅ Sessão criada com sucesso!');
      console.log('👤 Usuário:', data.session.user.email);

      // Força refresh da página para garantir que a sessão seja carregada
      const response = NextResponse.redirect(`${origin}${next}`)
      return response
    } else {
      console.error('❌ Erro ao criar sessão:', error);
    }
  } else {
    console.error('❌ Código OAuth não encontrado na URL');
  }

  // Se der erro, manda pra uma tela de erro
  console.log('⚠️ Redirecionando para página de erro');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}