import { useAITeacher } from "@/hooks/useAITeacher";
import { useEffect, useRef } from "react";

export const MessagesList = () => {
  const messages = useAITeacher((state) => state.messages);
  const playMessage = useAITeacher((state) => state.playMessage);
  const stopMessage = useAITeacher((state) => state.stopMessage);
  const currentMessage = useAITeacher((state) => state.currentMessage);
  const classroom = useAITeacher((state) => state.classroom);

  const container = useRef();

  useEffect(() => {
    container.current?.scrollTo({
      top: container.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  return (
    <div
      className={`${
        classroom === "default"
          ? "w-[1288px] h-[676px]"
          : "w-[2528px] h-[856px]"
      } p-8 overflow-y-auto flex flex-col space-y-8 bg-transparent opacity-80`}
      ref={container}
    >
      {messages.length === 0 && (
        <div className="h-full w-full grid place-content-center text-center">
          <h2 className="text-8xl font-bold text-white/90 italic">
            AI Classroom
            <br />
            Interactive Tutor
          </h2>
          <p className="text-4xl text-white/60 mt-4">
            Ask any question below to begin your lesson!
          </p>
        </div>
      )}

      {messages.map((message, i) => (
        <div key={i} className="flex flex-col space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-grow">
              <div className="flex items-center gap-3">
                <span className="text-white/90 text-2xl font-bold uppercase px-4 py-1 rounded-full bg-indigo-600">
                  Question
                </span>
                <p className="text-4xl inline-block px-2 rounded-sm font-bold bg-clip-text text-transparent bg-gradient-to-br from-blue-300/90 to-white/90">
                  {message.question}
                </p>
              </div>

              <div className="mt-4 text-white font-bold text-4xl leading-relaxed">
                {message.answer?.answer}
              </div>
            </div>

            {currentMessage === message ? (
              <button
                className="text-white/65 hover:text-white transition-colors"
                onClick={() => stopMessage(message)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-16 h-16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 0 1 9 14.437V9.564Z"
                  />
                </svg>
              </button>
            ) : (
              <button
                className="text-white/65 hover:text-white transition-colors"
                onClick={() => playMessage(message)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-16 h-16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z"
                  />
                </svg>
              </button>
            )}
          </div>

          {message.answer && (
            <div className="p-6 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-white/10 rounded-2xl backdrop-blur-sm">
              <span className="italic bg-clip-text text-transparent bg-gradient-to-b from-white/90 to-white/70 text-3xl font-bold uppercase inline-block mb-2">
                Explanation
              </span>
              <p className="text-white/90 text-3xl leading-relaxed">
                {message.answer.explanation}
              </p>

              {message.answer.steps && message.answer.steps.length > 0 && (
                <div className="mt-6">
                  <span className="text-pink-300/90 font-bold text-2xl uppercase tracking-wider block mb-3">
                    Key Steps / Takeaways
                  </span>
                  <div className="grid gap-3">
                    {message.answer.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-start gap-4"
                      >
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/30 text-indigo-200 flex items-center justify-center font-bold text-xl">
                          {idx + 1}
                        </span>
                        <p className="text-white/90 text-2xl leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
