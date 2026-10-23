import { create } from "zustand";
import { LESSON_1_STEPS } from "@/data/lessons";

export const teachers = ["Naoki"];

export const useAITeacher = create((set, get) => ({
  mode: "normal", // "normal" | "lesson1"
  setMode: (mode) => {
    // If switching mode, stop current audio
    const current = get().currentMessage;
    if (current?.audioPlayer) {
      current.audioPlayer.pause();
    }
    set(() => ({ mode, isSpeaking: false, ttsLoading: false }));
    if (mode === "lesson1") {
      get().playLessonStep(0);
    }
  },
  lessonStep: 0,
  lessonAudioCache: {},
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
      const isLesson = get().mode === "lesson1";
      const url = `/api/ai?question=${encodeURIComponent(question.trim())}${
        isLesson ? "&context=lesson1_fivesenses" : ""
      }`;
      const res = await fetch(url);
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

    const textToSpeak =
      [message.answer?.answer, message.answer?.explanation]
        .filter(Boolean)
        .join(" ") ||
      message.question ||
      "";

    if (!message.audioPlayer) {
      set(() => ({ ttsLoading: true }));

      try {
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
        console.warn("Server TTS error, attempting browser speech synthesis fallback:", err);
        if (typeof window !== "undefined" && window.speechSynthesis) {
          try {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.rate = 0.95;
            utterance.pitch = 1.05;
            utterance.onstart = () => {
              set(() => ({
                ttsLoading: false,
                isSpeaking: true,
                currentMessage: message,
              }));
            };
            utterance.onend = () => {
              set(() => ({ isSpeaking: false }));
            };
            utterance.onerror = () => {
              set(() => ({ ttsLoading: false, isSpeaking: false }));
            };
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
            return;
          } catch (synthErr) {
            console.error("SpeechSynthesis error:", synthErr);
          }
        }
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

  playLessonStep: async (stepIndex) => {
    const step = LESSON_1_STEPS[stepIndex];
    if (!step) return;

    // Stop currently playing audio
    const current = get().currentMessage;
    if (current?.audioPlayer) {
      current.audioPlayer.pause();
    }

    set(() => ({
      lessonStep: stepIndex,
      mode: "lesson1",
      ttsLoading: !get().lessonAudioCache[step.id],
      isSpeaking: false,
    }));

    try {
      let cached = get().lessonAudioCache[step.id];

      if (!cached) {
        const audioRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacher: get().teacher, text: step.spokenText }),
        });
        if (!audioRes.ok) throw new Error(`TTS request failed: ${audioRes.status}`);

        const audio = await audioRes.blob();
        const visemesHeader = audioRes.headers.get("visemes");
        const visemes = visemesHeader ? JSON.parse(visemesHeader) : [];
        const audioPlayer = new Audio(URL.createObjectURL(audio));

        cached = { audioPlayer, visemes };
        set((state) => ({
          lessonAudioCache: { ...state.lessonAudioCache, [step.id]: cached },
        }));
      }

      const lessonMessage = {
        isLesson: true,
        step,
        visemes: cached.visemes,
        audioPlayer: cached.audioPlayer,
      };

      cached.audioPlayer.onended = () => {
        set(() => ({ isSpeaking: false }));
      };

      set(() => ({
        ttsLoading: false,
        isSpeaking: true,
        currentMessage: lessonMessage,
      }));

      cached.audioPlayer.currentTime = 0;
      cached.audioPlayer.play().catch((err) => {
        console.log("Audio playback could not auto-start:", err?.message || err);
        set(() => ({ isSpeaking: false }));
      });
    } catch (err) {
      console.warn("Server lesson TTS error, falling back to browser speech synthesis:", err);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
          const utterance = new SpeechSynthesisUtterance(step.spokenText);
          utterance.rate = 0.95;
          utterance.pitch = 1.05;
          utterance.onstart = () => {
            set(() => ({
              ttsLoading: false,
              isSpeaking: true,
              currentMessage: { isLesson: true, step },
            }));
          };
          utterance.onend = () => {
            set(() => ({ isSpeaking: false }));
          };
          utterance.onerror = () => {
            set(() => ({ ttsLoading: false, isSpeaking: false }));
          };
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
          return;
        } catch (synthErr) {
          console.error("SpeechSynthesis error:", synthErr);
        }
      }
      set(() => ({ ttsLoading: false, isSpeaking: false }));
    }
  },

  nextLessonStep: () => {
    const nextIdx = get().lessonStep + 1;
    if (nextIdx < LESSON_1_STEPS.length) {
      get().playLessonStep(nextIdx);
    }
  },

  prevLessonStep: () => {
    const prevIdx = get().lessonStep - 1;
    if (prevIdx >= 0) {
      get().playLessonStep(prevIdx);
    }
  },

  replayLessonStep: () => {
    get().playLessonStep(get().lessonStep);
  },
}));
