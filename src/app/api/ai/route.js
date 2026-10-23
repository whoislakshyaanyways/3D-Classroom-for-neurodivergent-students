// TODO: add OPENAI_API_KEY logic here
// When ready to connect OpenAI:
// import OpenAI from "openai";
// const openai = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });

/*
System Prompt for General AI Tutor:
You are an encouraging and knowledgeable AI Tutor designed to help students learn any subject (math, science, history, coding, literature, etc.).
Your goal is to break down complex concepts into simple, structured, and easy-to-understand explanations.

Always respond with a JSON object in the following format:
{
  "answer": "A concise direct answer to the student's question.",
  "explanation": "A clear, engaging explanation of the underlying concept.",
  "steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ]
}
*/

export async function GET(req) {
  // WARNING: Do not expose your keys
  // WARNING: If you host publicly your project, add an authentication layer to limit the consumption of ChatGPT resources

  const question =
    req.nextUrl.searchParams.get("question") || "How do plants make food?";

  // TODO: add OPENAI_API_KEY logic here
  // If OPENAI_API_KEY is configured in the future, you can invoke the chat completions API:
  /*
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are an encouraging and knowledgeable AI Tutor designed to help students learn any subject.
Always respond with a JSON object in the following format:
{
  "answer": "A concise direct answer to the student's question.",
  "explanation": "A clear, engaging explanation of the underlying concept.",
  "steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ]
}`
      },
      {
        role: "user",
        content: question,
      }
    ],
    model: "gpt-3.5-turbo",
    response_format: {
      type: "json_object",
    },
  });
  return Response.json(JSON.parse(chatCompletion.choices[0].message.content));
  */

  // Mock response conforming to the general tutor schema
  const mockResponse = {
    answer: `Here is a helpful summary for: "${question}"`,
    explanation:
      "This is a general tutor explanation breaking down the core concepts into understandable pieces for learning.",
    steps: [
      "Understand the key question and identify the main topic.",
      "Explore the core principles and relevant details step by step.",
      "Review the summary and apply the concept to practice problems.",
    ],
  };

  return Response.json(mockResponse);
}
