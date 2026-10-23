"use client";
import { useAITeacher } from "@/hooks/useAITeacher";
import { useEffect, useRef, useState } from "react";

export const TypingBox = () => {
  const askAI = useAITeacher((state) => state.askAI);
  const askAISpeech = useAITeacher((state) => state.askAISpeech);
  const loading = useAITeacher((state) => state.loading);
  const speechLoading = useAITeacher((state) => state.speechLoading);
  const recording = useAITeacher((state) => state.recording);
  const setRecording = useAITeacher((state) => state.setRecording);

  const [question, setQuestion] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const ask = () => {
    if (!question.trim() || loading || speechLoading || recording) return;
    askAI(question.trim());
    setQuestion("");
  };

  const startRecording = async () => {
    setErrorMessage("");
    if (!navigator?.mediaDevices?.getUserMedia) {
      setErrorMessage("Microphone is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Pick supported mime type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blobType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: blobType });

        if (audioBlob.size > 0) {
          try {
            const transcript = await askAISpeech(audioBlob);
            if (transcript) {
              setQuestion(transcript);
            }
          } catch (err) {
            console.error("Speech processing failed:", err);
            setErrorMessage("Could not transcribe audio. Please try again.");
          }
        }
        setRecording(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Microphone permission denied. Please allow mic access.");
      } else {
        setErrorMessage("Could not access microphone.");
      }
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      setRecording(false);
    }
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup stream if component unmounts while recording
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const isBusy = loading || speechLoading;

  return (
    <div className="z-10 max-w-[620px] w-full flex space-y-4 flex-col bg-gradient-to-tr from-slate-900/60 via-slate-800/60 to-slate-900/70 p-5 backdrop-blur-xl rounded-2xl border-slate-100/20 border shadow-2xl">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-xl flex items-center gap-2">
            <span>Ask your AI Tutor</span>
            {recording && (
              <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Recording Voice...
              </span>
            )}
            {speechLoading && (
              <span className="text-xs text-amber-300 font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                Transcribing...
              </span>
            )}
          </h2>
        </div>
        <p className="text-white/60 text-sm mt-1">
          Type or use the record button to speak your question in real time!
        </p>
      </div>

      {errorMessage && (
        <div className="text-rose-300 text-xs bg-rose-950/60 border border-rose-800/50 p-2.5 rounded-lg">
          ⚠️ {errorMessage}
        </div>
      )}

      {isBusy && !recording ? (
        <div className="flex justify-center items-center py-2 gap-3 text-white/80 text-sm font-medium">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500"></span>
          </span>
          <span>{speechLoading ? "Listening & transcribing..." : "AI Tutor is thinking..."}</span>
        </div>
      ) : (
        <div className="gap-2.5 flex items-center">
          {/* Input field */}
          <input
            className="focus:outline-none focus:ring-2 focus:ring-indigo-400/70 flex-grow bg-slate-950/70 py-2.5 px-4 rounded-full text-white placeholder:text-white/40 shadow-inner border border-white/10 text-sm"
            placeholder={recording ? "Listening to your voice..." : "e.g. How does photosynthesis work?"}
            value={question}
            disabled={recording || isBusy}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                ask();
              }
            }}
          />

          {/* Voice Record Button */}
          <button
            type="button"
            className={`p-2.5 px-3.5 rounded-full flex items-center gap-1.5 font-medium text-sm transition-all duration-300 border cursor-pointer ${
              recording
                ? "bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-900/50 animate-pulse"
                : "bg-slate-700/60 hover:bg-slate-700 text-white/90 border-white/10 hover:border-white/30"
            }`}
            onClick={toggleRecording}
            disabled={isBusy && !recording}
            title={recording ? "Click to stop recording and send" : "Click to record voice"}
          >
            {recording ? (
              <>
                {/* Stop icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-white"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                <span>Stop</span>
              </>
            ) : (
              <>
                {/* Microphone icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-indigo-400"
                >
                  <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
                  <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7.002 7.002 0 0 0 6 6.93V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A7.002 7.002 0 0 0 19 10Z" />
                </svg>
                <span className="hidden sm:inline">Voice</span>
              </>
            )}
          </button>

          {/* Ask Button */}
          <button
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 px-5 rounded-full text-white font-semibold text-sm transition-colors border border-indigo-400/40 cursor-pointer shadow-lg shadow-indigo-950/40"
            onClick={ask}
            disabled={!question.trim() || isBusy || recording}
          >
            Ask
          </button>
        </div>
      )}
    </div>
  );
};
