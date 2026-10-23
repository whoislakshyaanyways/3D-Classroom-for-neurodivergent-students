"use client";
import { useAITeacher } from "@/hooks/useAITeacher";

export const BoardSettings = () => {
  const mode = useAITeacher((state) => state.mode);
  const setMode = useAITeacher((state) => state.setMode);

  return (
    <div className="absolute left-0 bottom-full flex flex-row gap-4 mb-20">
      <button
        className={`flex items-center gap-3 py-4 px-10 text-4xl font-bold rounded-full transition-all duration-300 backdrop-blur-md cursor-pointer ${
          mode === "normal"
            ? "text-white bg-indigo-600/90 shadow-2xl shadow-indigo-500/40 border-2 border-indigo-400/60 scale-105"
            : "text-white/60 bg-slate-900/60 hover:text-white hover:bg-slate-800/80 border border-white/20"
        }`}
        onClick={() => setMode("normal")}
      >
        <span>🤖</span>
        <span>Normal AI Assistance</span>
      </button>

      <button
        className={`flex items-center gap-3 py-4 px-10 text-4xl font-bold rounded-full transition-all duration-300 backdrop-blur-md cursor-pointer ${
          mode === "lesson1"
            ? "text-white bg-emerald-600/90 shadow-2xl shadow-emerald-500/40 border-2 border-emerald-400/60 scale-105"
            : "text-white/60 bg-slate-900/60 hover:text-white hover:bg-slate-800/80 border border-white/20"
        }`}
        onClick={() => setMode("lesson1")}
      >
        <span>📚</span>
        <span>Lesson 1: Five Senses</span>
      </button>
    </div>
  );
};
