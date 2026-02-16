import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatbotContext {
  userName?: string;
  userRole?: string;
  currentPage?: string;
  bookingContext?: {
    id: string;
    status: string;
    vehicleName?: string;
  };
  vehicleContext?: {
    id: string;
    name: string;
    make: string;
    model: string;
  };
}

export async function getChatbotResponse(
  messages: ChatMessage[],
  context: ChatbotContext = {}
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "";
}

function buildSystemPrompt(context: ChatbotContext): string {
  let prompt = `Eres el asistente virtual de Vehire, la plataforma líder de alquiler de vehículos en Uruguay.

Tu objetivo es ayudar a los usuarios con:
- Información sobre cómo funciona la plataforma
- Proceso de reserva y pagos
- Políticas de cancelación
- Precios y tarifas
- Problemas técnicos comunes
- Preguntas sobre vehículos

Instrucciones:
- Responde de forma amigable y concisa
- Si no sabes algo, indícalo honestamente
- Si el problema es complejo o requiere revisar un caso específico, sugiere contactar al equipo de soporte
- Si hay una disputa o problema legal, deriva al equipo humano
- Habla siempre en español`;

  if (context.userName) {
    prompt += `\n\nEl usuario se llama ${context.userName}.`;
  }

  if (context.userRole) {
    prompt += `\nEl rol del usuario es: ${context.userRole}.`;
  }

  if (context.currentPage) {
    prompt += `\nEl usuario está en la página: ${context.currentPage}.`;
  }

  if (context.bookingContext) {
    prompt += `\n\nContexto de reserva activa:
- ID: ${context.bookingContext.id}
- Estado: ${context.bookingContext.status}
${context.bookingContext.vehicleName ? `- Vehículo: ${context.bookingContext.vehicleName}` : ""}`;
  }

  if (context.vehicleContext) {
    prompt += `\n\nContexto de vehículo:
- ${context.vehicleContext.name} (${context.vehicleContext.make} ${context.vehicleContext.model})`;
  }

  return prompt;
}

export function needsHumanEscalation(message: string): boolean {
  const escalationKeywords = [
    "disputa",
    "reclamo legal",
    "accidente",
    "robo",
    "daño mayor",
    "quiero hablar con una persona",
    "necesito un humano",
    "problema grave",
    "denuncia",
  ];

  const lowerMessage = message.toLowerCase();
  return escalationKeywords.some((keyword) => lowerMessage.includes(keyword));
}
