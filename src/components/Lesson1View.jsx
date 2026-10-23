"use client";
import { LESSON_1_STEPS } from "@/data/lessons";
import { useAITeacher } from "@/hooks/useAITeacher";

export const Lesson1View = () => {
  const lessonStep = useAITeacher((state) => state.lessonStep);
  const playLessonStep = useAITeacher((state) => state.playLessonStep);
  const nextLessonStep = useAITeacher((state) => state.nextLessonStep);
  const prevLessonStep = useAITeacher((state) => state.prevLessonStep);
  const replayLessonStep = useAITeacher((state) => state.replayLessonStep);
  const isSpeaking = useAITeacher((state) => state.isSpeaking);
  const ttsLoading = useAITeacher((state) => state.ttsLoading);

  const step = LESSON_1_STEPS[lessonStep] || LESSON_1_STEPS[0];
  const totalSteps = LESSON_1_STEPS.length;

  return (
    <div className="h-full flex flex-col justify-between p-4 text-white">
      {/* Top Header & Step Progress Bar */}
      <div>
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold uppercase px-4 py-1.5 rounded-full bg-emerald-600 text-white shadow-lg">
              Lesson 1
            </span>
            <span className="text-4xl font-bold text-emerald-300">
              Our Five Senses
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isSpeaking && (
              <span className="text-2xl font-bold px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 animate-pulse flex items-center gap-2">
                <span>🔊</span>
                <span>Teacher Naoki is speaking...</span>
              </span>
            )}
            {ttsLoading && (
              <span className="text-2xl font-bold px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 animate-pulse flex items-center gap-2">
                <span>🎙️</span>
                <span>Preparing audio...</span>
              </span>
            )}
            <span className="text-2xl font-semibold text-white/60">
              Part {lessonStep + 1} of {totalSteps}
            </span>
          </div>
        </div>

        {/* Step Selector Pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {LESSON_1_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => playLessonStep(idx)}
              className={`px-4 py-2 rounded-xl text-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                lessonStep === idx
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105"
                  : "bg-slate-800/60 text-white/70 hover:bg-slate-700/80 hover:text-white"
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.senseName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow my-6 flex flex-col justify-center space-y-5 overflow-y-auto max-h-[380px] pr-2">
        <div className="flex items-center gap-4">
          <span className="text-6xl p-3 bg-white/10 rounded-2xl shadow-inner">
            {step.icon}
          </span>
          <div>
            <h2 className="text-5xl font-extrabold text-yellow-300 tracking-wide">
              {step.boardTitle}
            </h2>
            {step.subtitle && (
              <p className="text-2xl text-emerald-200 mt-1">{step.subtitle}</p>
            )}
          </div>
        </div>

        {/* Key Summary Box */}
        <div className="p-5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
          <p className="text-3xl font-medium leading-relaxed text-emerald-50">
            {step.summary}
          </p>
          {step.example && (
            <div className="mt-3 p-3 bg-black/40 rounded-xl border border-white/10 flex items-center gap-3">
              <span className="text-3xl">💡</span>
              <p className="text-2xl text-amber-200 font-semibold">
                {step.example}
              </p>
            </div>
          )}
        </div>

        {/* Bullet Points */}
        {step.points && step.points.length > 0 && (
          <div className="grid gap-2.5">
            {step.points.map((pt, i) => (
              <div
                key={i}
                className="p-3 bg-slate-900/60 border border-white/10 rounded-xl flex items-center gap-3"
              >
                <span className="w-7 h-7 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-lg flex items-center justify-center flex-shrink-0">
                  ✓
                </span>
                <p className="text-2xl text-white/90 leading-snug">{pt}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between border-t border-white/15 pt-4">
        <button
          onClick={prevLessonStep}
          disabled={lessonStep === 0}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-full text-2xl font-bold transition-all cursor-pointer ${
            lessonStep === 0
              ? "opacity-30 cursor-not-allowed bg-slate-800 text-white/40"
              : "bg-slate-800 hover:bg-slate-700 text-white shadow-lg"
          }`}
        >
          <span>◀</span>
          <span>Previous</span>
        </button>

        <button
          onClick={replayLessonStep}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full text-2xl font-bold bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-lg transition-all cursor-pointer"
        >
          <span>🔁</span>
          <span>Replay Teacher</span>
        </button>

        <button
          onClick={nextLessonStep}
          disabled={lessonStep === totalSteps - 1}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-full text-2xl font-bold transition-all cursor-pointer ${
            lessonStep === totalSteps - 1
              ? "opacity-30 cursor-not-allowed bg-slate-800 text-white/40"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/40"
          }`}
        >
          <span>Next</span>
          <span>▶</span>
        </button>
      </div>
    </div>
  );
};
