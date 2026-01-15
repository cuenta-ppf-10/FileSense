import { NextResponse } from "next/server";

/* ===============================
   PERFIL ESTADÍSTICO DEL DATASET
================================ */
function generateDatasetProfile(data: any[]) {
  if (!Array.isArray(data) || data.length === 0) return null;

  const headers = Object.keys(data[0]);
  const rowCount = data.length;
  const profile: Record<string, any> = {};

  headers.forEach((header) => {
    const values = data
      .map((row) => row[header])
      .filter((v) => v !== null && v !== undefined && v !== "");

    const numericValues = values.map(Number).filter(v => !isNaN(v));
    const isNumeric = numericValues.length === values.length && values.length > 0;

    if (isNumeric) {
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const avg = sum / numericValues.length;

      profile[header] = {
        type: "numeric",
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        avg: Number(avg.toFixed(2)),
        missing: rowCount - values.length
      };
    } else {
      const frequency: Record<string, number> = {};

      values.forEach((v) => {
        const val = String(v);
        frequency[val] = (frequency[val] || 0) + 1;
      });

      const topValues = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(
          ([val, count]) =>
            `${val} (${Math.round((count / rowCount) * 100)}%)`
        );

      profile[header] = {
        type: "categorical",
        uniqueCount: Object.keys(frequency).length,
        topValues,
        missing: rowCount - values.length
      };
    }
  });

  return { rowCount, columns: profile };
}

/* ===============================
   ENDPOINT
================================ */
export async function POST(req: Request) {
  console.log("--- NUEVA PETICIÓN RECIBIDA ---");
  try {
    const { data, fileName, language = "Español" } = await req.json();
    console.log("Analizando archivo:", fileName, "con", data?.length, "filas", "en idioma:", language);

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Dataset vacío o inválido." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY no configurada." },
        { status: 500 }
      );
    }

    console.log("Usando API Key:", apiKey.substring(0, 10) + "...");

    const stats = generateDatasetProfile(data);
    const sampleRows = JSON.stringify(data.slice(0, 5), null, 2);

    const prompt = `
Eres un Científico de Datos Senior experto en Business Intelligence.

Idioma del reporte: EL REPORTE DEBE ESTAR COMPLETAMENTE EN ${language.toUpperCase()}.

Archivo: "${fileName}"

ESTADÍSTICAS DEL DATASET COMPLETO:
${JSON.stringify(stats, null, 2)}

MUESTRA DE FORMATO (primeras 5 filas):
${sampleRows}

Genera un reporte estratégico y detallado. Busca correlaciones, tendencias y anomalías.
Responde EXCLUSIVAMENTE con este JSON (sin markdown) en idioma ${language}:

{
  "analysisTitle": "Título profesional y específico",
  "summary": "Resumen ejecutivo profundo",
  "kpis": [
    { "title": "Nombre KPI", "value": "Valor", "subValue": "Contexto", "trend": "up/down/neutral", "color": "green/red/blue" }
  ],
  "charts": [
    {
      "title": "Título del Gráfico",
      "type": "bar | line | pie | area",
      "description": "Explicación de la tendencia",
      "data": [
        { "label": "Categoría", "value": 100 }
      ]
    }
  ],
  "recommendations": [
    { "title": "Acción Crítica", "text": "Recomendación detallada", "impact": "high | medium" }
  ]
}
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "FileSense"
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "system",
              content:
                "Eres una API que SOLO devuelve JSON válido. No incluyas texto adicional."
            },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("ERROR DETALLADO DE OPENROUTER:", JSON.stringify(result, null, 2));
      return NextResponse.json(
        { error: result?.error?.message || "Error en OpenRouter" },
        { status: response.status }
      );
    }

    const content = result?.choices?.[0]?.message?.content;
    console.log("AI Raw Content:", content);

    if (!content) {
      throw new Error("Respuesta vacía del modelo.");
    }

    return NextResponse.json(JSON.parse(content));

  } catch (err: any) {
    console.error("Error en AI:", err);
    return NextResponse.json(
      { error: err.message || "Error analizando datos." },
      { status: 500 }
    );
  }
}
