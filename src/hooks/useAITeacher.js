const { create } = require("zustand");

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
  setClassroom: (classroom) => {
    set(() => ({
      classroom,
    }));
  },
  vrMode: false,
  setVrMode: (vrMode) => {
    set(() => ({
      vrMode,
    }));
  },
  isPresenting: false,
  setIsPresenting: (isPresenting) => {
    set(() => ({
      isPresenting,
    }));
  },
  loading: false,
  askAI: async (question) => {
    if (!question) {
      return;
    }
    const message = {
      question,
      id: get().messages.length,
    };
    set(() => ({
      loading: true,
    }));

    try {
      // Ask AI
      const res = await fetch(`/api/ai?question=${encodeURIComponent(question)}`);
      const data = await res.json();
      message.answer = data;

      set(() => ({
        currentMessage: message,
      }));

      set((state) => ({
        messages: [...state.messages, message],
        loading: false,
      }));
      get().playMessage(message);
    } catch (err) {
      console.error("Failed to ask AI:", err);
      set(() => ({
        loading: false,
      }));
    }
  },
  playMessage: async (message) => {
    set(() => ({
      currentMessage: message,
    }));

    if (!message.audioPlayer) {
      set(() => ({
        loading: true,
      }));

      try {
        // Get TTS using the new answer text
        const textToSpeak = message.answer?.answer || message.question || "";
        const audioRes = await fetch(
          `/api/tts?teacher=${get().teacher}&text=${encodeURIComponent(textToSpeak)}`
        );
        const audio = await audioRes.blob();
        const visemesHeader = audioRes.headers.get("visemes");
        const visemes = visemesHeader ? JSON.parse(visemesHeader) : [];
        const audioUrl = URL.createObjectURL(audio);
        const audioPlayer = new Audio(audioUrl);

        message.visemes = visemes;
        message.audioPlayer = audioPlayer;
        message.audioPlayer.onended = () => {
          set(() => ({
            currentMessage: null,
          }));
        };

        set(() => ({
          loading: false,
          messages: get().messages.map((m) => {
            if (m.id === message.id) {
              return message;
            }
            return m;
          }),
        }));
      } catch (err) {
        console.error("Failed to load TTS audio:", err);
        set(() => ({
          loading: false,
        }));
      }
    }

    if (message.audioPlayer) {
      message.audioPlayer.currentTime = 0;
      message.audioPlayer.play().catch((err) => {
        // Empty audio stub or autoplay restrictions
        console.log("Audio playback not started:", err?.message || err);
      });
    }
  },
  stopMessage: (message) => {
    if (message.audioPlayer) {
      message.audioPlayer.pause();
    }
    set(() => ({
      currentMessage: null,
    }));
  },
}));
