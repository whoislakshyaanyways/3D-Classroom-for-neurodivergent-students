export const runtime = "nodejs";

const VOICES = {
  Naoki: process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb",
};

// Safely splits text into chunks strictly under maxLen (140 chars) to prevent Google TTS 400 Bad Request
function splitTextIntoSafeChunks(text, maxLen = 140) {
  if (!text) return [];
  const words = text.replace(/[\r\n]+/g, " ").split(/\s+/).filter(Boolean);
  const chunks = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length <= maxLen) {
      current = (current + " " + word).trim();
    } else {
      if (current) chunks.push(current);
      current = word.slice(0, maxLen);
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// Generates free, high-speed fallback MP3 audio using Google TTS when ElevenLabs quota is exceeded
async function getGoogleTTS(text) {
  const chunks = splitTextIntoSafeChunks(text, 140);
  if (chunks.length === 0) chunks.push("Hello");

  const buffers = [];

  for (const chunk of chunks) {
    const url =
      "https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=" +
      encodeURIComponent(chunk);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (res.ok) {
      const buf = await res.arrayBuffer();
      buffers.push(Buffer.from(buf));
    } else {
      console.warn(`Google TTS chunk failed with status ${res.status}: "${chunk}"`);
    }
  }

  if (buffers.length === 0) {
    throw new Error("No audio chunks could be fetched from Google TTS");
  }

  return Buffer.concat(buffers);
}

// Generate natural speech visemes for 3D teacher mouth movement
function generateVisemes(text, wordCount) {
  const visemes = [];
  const words = text.split(/\s+/).filter(Boolean).length || wordCount || 10;
  // Average speaking rate: ~350ms per word
  const totalMs = words * 360;
  const stepMs = 125;
  const mouthShapes = [1, 2, 4, 6, 7, 10, 11, 13, 15]; // Natural open and vowel mouth targets

  for (let ms = 0; ms < totalMs; ms += stepMs) {
    const shape = mouthShapes[Math.floor(Math.random() * mouthShapes.length)];
    visemes.push([ms, shape]);
  }
  return visemes;
}

export async function POST(req) {
  let text = "Welcome to your AI classroom!";
  let teacher = "Naoki";

  try {
    const json = await req.json();
    text = json.text || text;
    teacher = json.teacher || teacher;
  } catch (err) {
    // Keep defaults
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;

  // 1. Try ElevenLabs TTS first if API key is present
  if (apiKey) {
    try {
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

      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        const visemes = generateVisemes(text);
        return new Response(audioBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            Visemes: JSON.stringify(visemes),
          },
        });
      }

      const body = await res.text();
      console.warn("ElevenLabs returned error (falling back to Free TTS):", res.status, body);
    } catch (elevenErr) {
      console.warn("ElevenLabs connection error (falling back to Free TTS):", elevenErr.message);
    }
  }

  // 2. Fallback to free Google TTS (100% quota-free, unlimited, fast)
  try {
    const fallbackBuffer = await getGoogleTTS(text);
    const visemes = generateVisemes(text);

    return new Response(fallbackBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        Visemes: JSON.stringify(visemes),
      },
    });
  } catch (fallbackErr) {
    console.error("Fallback TTS error:", fallbackErr);
    return Response.json(
      { error: "TTS failed", details: String(fallbackErr?.message || fallbackErr) },
      { status: 500 }
    );
  }
}
