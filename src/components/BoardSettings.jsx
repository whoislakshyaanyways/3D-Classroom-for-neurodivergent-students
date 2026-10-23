import { useAITeacher } from "@/hooks/useAITeacher";

export const BoardSettings = () => {
  const classroom = useAITeacher((state) => state.classroom);
  const setClassroom = useAITeacher((state) => state.setClassroom);

  return (
    <div className="absolute left-0 bottom-full flex flex-row gap-2 mb-20">
      <button
        className={` ${
          classroom === "default"
            ? "text-white bg-slate-900/40 "
            : "text-white/45 bg-slate-700/20 "
        } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md`}
        onClick={() => setClassroom("default")}
      >
        Default classroom
      </button>
      <button
        className={` ${
          classroom === "alternative"
            ? "text-white bg-slate-900/40 "
            : "text-white/45 bg-slate-700/20 "
        } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md`}
        onClick={() => setClassroom("alternative")}
      >
        Alternative classroom
      </button>
    </div>
  );
};
