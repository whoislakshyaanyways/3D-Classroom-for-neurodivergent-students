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
  isSpeaking: false,

  askAI: async (question) => {
    if (!question || !question.trim()) return;

    const initialMessage = {
      question: question.trim(),
      id: get().messages.length,
      answer: null,
    };

    // Immediately register message so the board shows the question in real time
    set((state) => ({
      currentMessage: initialMessage,
      messages: [...state.messages, initialMessage],
      loading: true,
    }));

    try {
      const res = await fetch(`/api/ai?question=${encodeURIComponent(question.trim())}`);
      if (!res.ok) {
        throw new Error(`AI request failed with status ${res.status}`);
      }
      const data = await res.json();

      // Create a brand-new immutable message object so React and Zustand detect state change immediately!
      const completedMessage = {
        ...initialMessage,
        answer: data,
      };

      set((state) => ({
        currentMessage: completedMessage,
        messages: state.messages.map((m) =>
          m.id === initialMessage.id ? completedMessage : m
        ),
        loading: false,
      }));

      // Play audio response asynchronously
      get().playMessage(completedMessage);
    } catch (err) {
      console.error("Failed to ask AI:", err);
      const errorMessage = {
        ...initialMessage,
        answer: {
          answer: "I couldn't fetch an answer right now.",
          explanation: "Please check your network connection and try again.",
          steps: [],
        },
      };
      set((state) => ({
        currentMessage: errorMessage,
        messages: state.messages.map((m) =>
          m.id === initialMessage.id ? errorMessage : m
        ),
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
    if (!message || !message.answer) return;

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

        const speakingMessage = {
          ...message,
          visemes,
          audioPlayer,
        };

        speakingMessage.audioPlayer.onended = () => {
          // When speaking finishes, keep the text on the board! Just mark speaking as false.
          set(() => ({ isSpeaking: false }));
        };

        set((state) => ({
          ttsLoading: false,
          isSpeaking: true,
          currentMessage: speakingMessage,
          messages: state.messages.map((m) =>
            m.id === message.id ? speakingMessage : m
          ),
        }));

        speakingMessage.audioPlayer.currentTime = 0;
        speakingMessage.audioPlayer.play().catch((err) => {
          console.log("Audio playback not started:", err?.message || err);
          set(() => ({ isSpeaking: false }));
        });
      } catch (err) {
        console.error("Failed to load TTS audio:", err);
        set(() => ({ ttsLoading: false, isSpeaking: false }));
      }
    } else {
      set(() => ({ isSpeaking: true }));
      message.audioPlayer.currentTime = 0;
      message.audioPlayer.play().catch((err) => {
        console.log("Audio playback not started:", err?.message || err);
        set(() => ({ isSpeaking: false }));
      });
    }
  },

  stopMessage: (message) => {
    if (message?.audioPlayer) message.audioPlayer.pause();
    set(() => ({ isSpeaking: false }));
  },
}));
