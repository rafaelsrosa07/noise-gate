import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    // 1. Verificar Autenticação
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
          remove(name: string, options: CookieOptions) { cookieStore.delete({ name, ...options }) },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Receber o Input
    const { task } = await req.json();
    if (!task) return NextResponse.json({ error: "Tarefa necessária" }, { status: 400 });

    // 3. Chamar a IA (Noise Gate)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
      systemInstruction: {
        parts: [{ text: `Você é o Noise Gate Operator, um Agente de Execução Estratégica.
        
        SUA MISSÃO: Receber a 'Única Coisa' do usuário e decompô-la em 4 ou 5 passos que sejam:
        1. Extremamente objetivos e sem ambiguidades.
        2. Citados em linguagem simples, direta e de ação imediata (fácil de começar).
        3. Focar em passos que tornem a execução mais fluida.
        
        REGRAS:
        1. O output deve ser APENAS o JSON.
        2. Não adicione introduções, explicações ou notas.
        
        OUTPUT JSON OBRIGATÓRIO:
        {
          "one_thing": "Título da Tarefa Refinado (Focado)",
          "steps": [
            { "text": "Passo 1: [Ação simples e imediata]...", "checked": false },
            { "text": "Passo 2: [Ação simples e imediata]...", "checked": false }
          ],
          "call_to_action": "Frase curta estilo cyberpunk (Ex: Execução é o único idioma)."
        }` }],
        role: "model"
      },
      generationConfig: { responseMimeType: "application/json" }
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(task);
    const plan = JSON.parse(result.response.text());

    // 4. SALVAR NO BANCO DE DADOS (Persistência)
    
    // 4.1 Criar a Tarefa Principal
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: plan.one_thing,
        status: 'pending'
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // 4.2 Criar os Passos (Checklist)
    const stepsToInsert = plan.steps.map((step: any, index: number) => ({
      task_id: taskData.id,
      description: step.text,
      position: index,
      is_completed: false
    }));

    const { error: stepsError } = await supabase
      .from('steps')
      .insert(stepsToInsert);

    if (stepsError) throw stepsError;

    // Retorna o plano para o front (agora salvo!)
    return NextResponse.json(plan);

  } catch (error) {
    console.error("Erro no Noise Gate:", error); 
    return NextResponse.json({ error: "Falha ao processar" }, { status: 500 });
  }
}