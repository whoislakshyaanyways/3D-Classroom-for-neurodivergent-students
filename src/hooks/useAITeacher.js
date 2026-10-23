import { create } from "zustand";

export const teachers = ["Naoki"];

export const useAITeacher = create((set, get) => ({
  messages: [],
  currentMessage: null,
  teacher: "Naoki",
  setTeacher: (teacher) => {
    set(() => ({
      teacher,
      messages: get().messages.map((message) => {
        message.audioPlayer = null;
        return message;
      }),
    }));
  },
  classroom: "default",
  setClassroom: (classroom) => set(() => ({ classroom })),
  vrMode: false,
  setVrMode: (vrMode) => set(() => ({ vrMode })),
  isPresenting: false,
  setIsPresenting: (isPresenting) => set(() => ({ isPresenting })),
  loading: false,
  recording: false,
  setRecording: (recording) => set(() => ({ recording })),
  speechLoading: false,
  ttsLoading: false,

  askAI: async (question) => {
    if (!question || !question.trim()) return;

    const message = {
      question: question.trim(),
      id: get().messages.length,
      answer: null,
    };

    // Immediately register message so the board shows the question in real time
    set((state) => ({
      currentMessage: message,
      messages: [...state.messages, message],
      loading: true,
    }));

    try {
      const res = await fetch(`/api/ai?question=${encodeURIComponent(question.trim())}`);
      if (!res.ok) {
        throw new Error(`AI request failed with status ${res.status}`);
      }
      const data = await res.json();
      message.answer = data;

      // Update message with final answer and turn loading off immediately!
      set((state) => ({
        currentMessage: message,
        messages: state.messages.map((m) => (m.id === message.id ? message : m)),
        loading: false,
      }));

      // Play audio response asynchronously
      get().playMessage(message);
    } catch (err) {
      console.error("Failed to ask AI:", err);
      message.answer = {
        answer: "I couldn't fetch an answer right now.",
        explanation: "Please check your network connection and try again.",
        steps: [],
      };
      set((state) => ({
        currentMessage: message,
        messages: state.messages.map((m) => (m.id === message.id ? message : m)),
        loading: false,
      }));
    }
  },

  // Transcribe an audio Blob using the STT API route
  transcribeAudio: async (audioBlob) => {
    if (!audioBlob || audioBlob.size === 0) return "";
    set(() => ({ speechLoading: true }));

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const res = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `STT request failed: ${res.status}`);
      }

      const data = await res.json();
      set(() => ({ speechLoading: false }));
      return (data.text || "").trim();
    } catch (err) {
      console.error("Failed to transcribe audio:", err);
      set(() => ({ speechLoading: false }));
      throw err;
    }
  },

  // Accepts speech as input: either an audio Blob or a recognized speech transcript string
  askAISpeech: async (speechInput) => {
    if (!speechInput) return "";

    if (typeof speechInput === "string") {
      await get().askAI(speechInput);
      return speechInput;
    }

    try {
      const transcript = await get().transcribeAudio(speechInput);
      if (transcript && transcript.trim()) {
        await get().askAI(transcript.trim());
        return transcript.trim();
      } else {
        console.warn("No transcript returned from STT");
        return "";
      }
    } catch (err) {
      console.error("Failed to process speech input:", err);
      throw err;
    }
  },

  playMessage: async (message) => {
    set(() => ({ currentMessage: message }));

    if (!message.audioPlayer) {
      set(() => ({ ttsLoading: true }));

      try {
        const textToSpeak =
          [message.answer?.answer, message.answer?.explanation]
            .filter(Boolean)
            .join(" ") ||
          message.question ||
          "";

        const audioRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacher: get().teacher, text: textToSpeak }),
        });
        if (!audioRes.ok) throw new Error(`TTS request failed: ${audioRes.status}`);

        const audio = await audioRes.blob();
        const visemesHeader = audioRes.headers.get("visemes");
        const visemes = visemesHeader ? JSON.parse(visemesHeader) : [];
        const audioPlayer = new Audio(URL.createObjectURL(audio));

        message.visemes = visemes;
        message.audioPlayer = audioPlayer;
        message.audioPlayer.onended = () => {
          set(() => ({ currentMessage: null }));
        };

        set(() => ({
          ttsLoading: false,
          messages: get().messages.map((m) => (m.id === message.id ? message : m)),
        }));
      } catch (err) {
        console.error("Failed to load TTS audio:", err);
        set(() => ({ ttsLoading: false }));
      }
    }

    if (message.audioPlayer) {
      message.audioPlayer.currentTime = 0;
      message.audioPlayer.play().catch((err) => {
        console.log("Audio playback not started:", err?.message || err);
      });
    }
  },

  stopMessage: (message) => {
    if (message.audioPlayer) message.audioPlayer.pause();
    set(() => ({ currentMessage: null }));
  },
}));
