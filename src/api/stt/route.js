import OpenAI from "openai";

export const runtime = "nodejs";

/**
 * Speech-to-Text (STT) Core Handler
 * Compatible with Next.js App Router and Node handlers.
 */
export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let audioFile = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      audioFile = formData.get("file") || formData.get("audio");
    } else {
      const arrayBuffer = await req.arrayBuffer();
      if (arrayBuffer.byteLength > 0) {
        const mimeType = contentType.split(";")[0] || "audio/webm";
        const extension = mimeType.includes("wav")
          ? "wav"
          : mimeType.includes("mp4")
          ? "mp4"
          : mimeType.includes("ogg")
          ? "ogg"
          : "webm";
        audioFile = new File([arrayBuffer], `recording.${extension}`, {
          type: mimeType,
        });
      }
    }

    if (!audioFile) {
      return Response.json(
        { error: "No audio file provided in request." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const isGroq = Boolean(process.env.GROQ_API_KEY);

    if (!apiKey) {
      console.warn("STT: No GROQ_API_KEY or OPENAI_API_KEY configured.");
      return Response.json({
        text: "How do plants make food?",
        warning: "No API key configured. Returned mock transcription.",
      });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: isGroq ? "https://api.groq.com/openai/v1" : undefined,
    });

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: isGroq ? "whisper-large-v3-turbo" : "whisper-1",
      language: "en",
    });

    const text = (transcription.text || "").trim();

    return Response.json({ text });
  } catch (err) {
    console.error("STT error:", err);
    return Response.json(
      { error: "STT transcription failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export default POST;
