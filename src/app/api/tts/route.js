import { PassThrough } from "stream";

export async function GET(req) {
  // WARNING: Do not expose your keys
  // WARNING: If you host publicly your project, add an authentication layer to limit the consumption of Azure resources

  const teacher = req.nextUrl.searchParams.get("teacher") || "Naoki";
  const text =
    req.nextUrl.searchParams.get("text") || "Welcome to your AI classroom!";

  // TODO: add SPEECH_KEY / SPEECH_REGION logic here
  // When ready to connect Azure Speech SDK:
  /*
  const sdk = require("microsoft-cognitiveservices-speech-sdk");
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env["SPEECH_KEY"],
    process.env["SPEECH_REGION"]
  );
  speechConfig.speechSynthesisVoiceName = `en-US-${teacher}Neural`;
  const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
  ...
  */

  // Stubbed response: empty visemes and empty audio stream
  const visemes = [];
  const bufferStream = new PassThrough();
  bufferStream.end(Buffer.from([]));

  return new Response(bufferStream, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `inline; filename=tts.mp3`,
      Visemes: JSON.stringify(visemes),
    },
  });
}
