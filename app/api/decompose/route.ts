import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Inicializa o Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { task } = await req.json();

    if (!task) return NextResponse.json({ error: "Tarefa necessária" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Atue como um especialista em produtividade para TDAH e Função Executiva.
      O usuário tem uma tarefa complexa: "${task}".
      
      Sua missão:
      1. Identifique a "ONE THING" (a única coisa que importa agora).
      2. Quebre isso em 3 a 5 passos táticos, EXTREMAMENTE pequenos e acionáveis.
      3. Defina um "Call to Action" motivador estilo cyberpunk/militar.

      RETORNE APENAS UM JSON VÁLIDO (sem markdown, sem crase) neste formato:
      {
        "one_thing": "Título curto e direto da missão",
        "steps": [
          {"description": "Passo 1 (ex: Abrir o arquivo)", "time": 5},
          {"description": "Passo 2", "time": 10}
        ],
        "call_to_action": "Frase curta de impacto"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpeza básica para garantir que é JSON puro
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const json = JSON.parse(text);

    return NextResponse.json(json);

  } catch (error) {
    console.error("Erro AI:", error);
    return NextResponse.json({ error: "Falha ao processar inteligência." }, { status: 500 });
  }
}