import OpenAI from "openai";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an encouraging and knowledgeable AI Tutor designed to help students learn any subject (math, science, history, coding, literature, etc.).
Break down complex concepts into simple, structured, easy-to-understand explanations.
Keep "answer" and "explanation" short and natural, since they will be read aloud.

Always respond with ONLY a JSON object in this format:
{
  "answer": "A concise direct answer to the student's question.",
  "explanation": "A clear, engaging explanation of the underlying concept.",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}`;

export async function GET(req) {
  const question =
    req.nextUrl.searchParams.get("question") || "How do plants make food?";

  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY is missing. Check .env.local and restart the dev server.");
    return Response.json({ error: "GROQ_API_KEY missing" }, { status: 500 });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const completion = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question },
      ],
      response_format: { type: "json_object" },
    });

    const raw = (completion.choices[0].message.content || "")
      .replace(/```json|```/g, "")
      .trim();

    return Response.json(JSON.parse(raw));
  } catch (err) {
    console.error("Groq error:", err?.status, err?.message);
    return Response.json(
      { error: "Groq failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}