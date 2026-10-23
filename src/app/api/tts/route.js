export const runtime = "nodejs";

const VOICES = {
  Naoki: process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb",
};

export async function POST(req) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY missing");
    return Response.json({ error: "ELEVENLABS_API_KEY missing" }, { status: 500 });
  }

  try {
    const { teacher = "Naoki", text = "Welcome to your AI classroom!" } =
      await req.json();
    const voiceId = VOICES[teacher] || VOICES.Naoki;

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.slice(0, 2500),
          model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("ElevenLabs error:", res.status, body);
      return Response.json(
        { error: "TTS failed", status: res.status, body },
        { status: 500 }
      );
    }

    const audioBuffer = await res.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        Visemes: JSON.stringify([]),
      },
    });
  } catch (err) {
    console.error("TTS route crashed:", err);
    return Response.json(
      { error: "TTS crashed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}