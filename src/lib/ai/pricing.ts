import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VehicleForPricing {
  make: string;
  model: string;
  year: number;
  transmission: string;
  fuelType: string;
  seats: number;
  features: string[];
  city: string;
  mileage?: number;
}

export interface MarketData {
  avgCompetitorPrice?: number;
  minCompetitorPrice?: number;
  maxCompetitorPrice?: number;
  competitorCount?: number;
}

export interface DemandData {
  seasonalFactor: number; // 0.5 - 2.0
  demandLevel: "low" | "medium" | "high";
  upcomingEvents?: string[];
}

export interface PriceSuggestion {
  suggestedPrice: number; // in cents per day
  confidence: number; // 0 - 1
  reasoning: {
    competitorAnalysis: string;
    demandLevel: string;
    seasonalFactor: string;
    vehicleFactors: string;
  };
  priceRange: {
    low: number;
    optimal: number;
    high: number;
  };
}

export async function suggestVehiclePrice(
  vehicle: VehicleForPricing,
  marketData?: MarketData,
  demandData?: DemandData
): Promise<PriceSuggestion> {
  const prompt = `
Analiza y sugiere un precio diario de alquiler (en pesos uruguayos) para el siguiente vehículo:

VEHÍCULO:
- Marca: ${vehicle.make}
- Modelo: ${vehicle.model}
- Año: ${vehicle.year}
- Transmisión: ${vehicle.transmission}
- Combustible: ${vehicle.fuelType}
- Asientos: ${vehicle.seats}
- Características: ${vehicle.features.join(", ")}
- Ciudad: ${vehicle.city}
- Kilometraje: ${vehicle.mileage || "No especificado"}

${
  marketData
    ? `
DATOS DE MERCADO:
- Precio promedio competidores: $${marketData.avgCompetitorPrice || "N/A"}
- Rango de precios: $${marketData.minCompetitorPrice || "N/A"} - $${marketData.maxCompetitorPrice || "N/A"}
- Competidores analizados: ${marketData.competitorCount || 0}
`
    : ""
}

${
  demandData
    ? `
DATOS DE DEMANDA:
- Factor estacional: ${demandData.seasonalFactor}
- Nivel de demanda: ${demandData.demandLevel}
- Eventos próximos: ${demandData.upcomingEvents?.join(", ") || "Ninguno"}
`
    : ""
}

Responde SOLO en formato JSON con esta estructura:
{
  "suggestedPrice": <número entero en pesos uruguayos SIN centavos>,
  "confidence": <número entre 0 y 1>,
  "reasoning": {
    "competitorAnalysis": "<análisis breve de precios competitivos>",
    "demandLevel": "<descripción del nivel de demanda>",
    "seasonalFactor": "<cómo afecta la temporada>",
    "vehicleFactors": "<factores específicos del vehículo>"
  },
  "priceRange": {
    "low": <precio mínimo recomendado>,
    "optimal": <precio óptimo>,
    "high": <precio máximo recomendado>
  }
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un experto en pricing de alquiler de vehículos. Responde siempre en JSON válido.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(
      response.choices[0]?.message?.content || "{}"
    );

    // Convert to cents
    return {
      suggestedPrice: (result.suggestedPrice || 2000) * 100,
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || {
        competitorAnalysis: "Sin datos suficientes",
        demandLevel: "Moderada",
        seasonalFactor: "Normal",
        vehicleFactors: "Vehículo estándar",
      },
      priceRange: {
        low: (result.priceRange?.low || 1500) * 100,
        optimal: (result.priceRange?.optimal || 2000) * 100,
        high: (result.priceRange?.high || 2500) * 100,
      },
    };
  } catch (error) {
    console.error("Error generating price suggestion:", error);

    // Return fallback values
    return {
      suggestedPrice: 200000, // $2000 in cents
      confidence: 0.3,
      reasoning: {
        competitorAnalysis: "No disponible",
        demandLevel: "No disponible",
        seasonalFactor: "No disponible",
        vehicleFactors: "Precio estimado basado en categoría del vehículo",
      },
      priceRange: {
        low: 150000,
        optimal: 200000,
        high: 250000,
      },
    };
  }
}

export async function generateVehicleDescription(
  vehicle: VehicleForPricing
): Promise<string> {
  const prompt = `
Genera una descripción atractiva para un vehículo en alquiler:

- ${vehicle.make} ${vehicle.model} ${vehicle.year}
- Transmisión: ${vehicle.transmission}
- Combustible: ${vehicle.fuelType}
- ${vehicle.seats} asientos
- Características: ${vehicle.features.join(", ")}

La descripción debe:
- Ser en español
- Tener entre 100 y 200 palabras
- Destacar las mejores características
- Ser atractiva para potenciales rentadores
- Mencionar para qué tipo de viajes es ideal
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Eres un redactor de anuncios de vehículos. Crea descripciones atractivas y profesionales.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "";
}
