import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export async function generateNutritionalInfo(
  composition: string
): Promise<NutritionalInfo> {
  try {
    // Update model name to the current available version
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
    });

    const prompt = `
Analisis komposisi makanan berikut dan berikan informasi nutrisi per porsi dalam format JSON yang tepat:

Komposisi: ${composition}

Berikan response dalam format JSON berikut (hanya JSON murni, tanpa markdown atau teks tambahan):
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar": number
}

Panduan estimasi:
- Nasi 200g = sekitar 260 kalori, 5g protein, 53g karbo
- Telur 1 butir (50g) = sekitar 70 kalori, 6g protein, 0.5g karbo, 5g lemak
- Ayam 50g = sekitar 80 kalori, 15g protein, 0g karbo, 2g lemak
- Udang 30g = sekitar 25 kalori, 5g protein, 0g karbo, 0.3g lemak
- Kecap manis 1 sdm = sekitar 15 kalori, 0.5g protein, 3g karbo
- Minyak 1 sdm = sekitar 120 kalori, 0g protein, 0g karbo, 14g lemak

Berikan nilai nutrisi total yang realistis untuk makanan Indonesia.
Gunakan angka bulat untuk kalori, desimal 1 digit untuk yang lain.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response text - remove markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/```json\s*/, "").replace(/```\s*$/, "");
    }
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/```\s*/, "").replace(/```\s*$/, "");
    }

    // Parse JSON response dari AI
    const nutritionalInfo = JSON.parse(cleanText);

    // Validasi dan sanitasi data
    const result_data = {
      calories: Math.round(Number(nutritionalInfo.calories) || 0),
      protein: Math.round((Number(nutritionalInfo.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(nutritionalInfo.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(nutritionalInfo.fat) || 0) * 10) / 10,
      fiber: Math.round((Number(nutritionalInfo.fiber) || 0) * 10) / 10,
      sugar: Math.round((Number(nutritionalInfo.sugar) || 0) * 10) / 10,
    };

    return result_data;
  } catch (error) {
    console.error("Error generating nutritional info:", error);

    const fallbackData = generateFallbackNutrition(composition);
    console.log("🔄 Using fallback nutritional info:", fallbackData);
    return fallbackData;
  }
}

function generateFallbackNutrition(composition: string): NutritionalInfo {
  const lower = composition.toLowerCase();
  let calories = 200;
  let protein = 8.0;
  let carbs = 25.0;
  let fat = 6.0;
  let fiber = 2.0;
  let sugar = 3.0;

  // Estimasi berdasarkan bahan yang terdeteksi
  if (lower.includes("nasi") || lower.includes("rice")) {
    calories += 200;
    carbs += 40;
    protein += 4;
  }

  if (lower.includes("ayam") || lower.includes("chicken")) {
    calories += 100;
    protein += 15;
    fat += 3;
  }

  if (lower.includes("telur") || lower.includes("egg")) {
    calories += 70;
    protein += 6;
    fat += 5;
  }

  if (lower.includes("udang") || lower.includes("shrimp")) {
    calories += 30;
    protein += 6;
    fat += 0.5;
  }

  if (lower.includes("minyak") || lower.includes("oil")) {
    calories += 100;
    fat += 12;
  }

  if (lower.includes("sayur") || lower.includes("vegetable")) {
    calories += 20;
    fiber += 3;
    carbs += 5;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    fiber: Math.round(fiber * 10) / 10,
    sugar: Math.round(sugar * 10) / 10,
  };
}

export async function testGeminiModels() {
  try {
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Test");
        return modelName;
      } catch (error) {
        console.log(`❌ Model ${modelName} is not available`);
      }
    }
    throw new Error("No available models found");
  } catch (error) {
    console.error("Error testing models:", error);
    return null;
  }
}
