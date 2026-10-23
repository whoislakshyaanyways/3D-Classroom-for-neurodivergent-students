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

  askAI: async (question) => {
    if (!question) return;

    const message = {
      question,
      id: get().messages.length,
    };
    set(() => ({ loading: true }));

    try {
      const res = await fetch(`/api/ai?question=${encodeURIComponent(question)}`);
      const data = await res.json();
      message.answer = data;

      set((state) => ({
        currentMessage: message,
        messages: [...state.messages, message],
        loading: false,
      }));
      get().playMessage(message);
    } catch (err) {
      console.error("Failed to ask AI:", err);
      set(() => ({ loading: false }));
    }
  },

  playMessage: async (message) => {
    set(() => ({ currentMessage: message }));

    if (!message.audioPlayer) {
      set(() => ({ loading: true }));

      try {
        // Speak the answer + explanation
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
          loading: false,
          messages: get().messages.map((m) => (m.id === message.id ? message : m)),
        }));
      } catch (err) {
        console.error("Failed to load TTS audio:", err);
        set(() => ({ loading: false }));
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