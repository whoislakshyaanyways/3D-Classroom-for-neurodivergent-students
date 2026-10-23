"use client";
import { useAITeacher } from "@/hooks/useAITeacher";
import { toggleSession } from "@react-three/xr";
import { useEffect, useState } from "react";

export const VRModeButton = () => {
  const isPresenting = useAITeacher((state) => state.isPresenting);
  const vrMode = useAITeacher((state) => state.vrMode);
  const setVrMode = useAITeacher((state) => state.setVrMode);
  const [hasWebXR, setHasWebXR] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.xr) {
      navigator.xr
        .isSessionSupported("immersive-vr")
        .then((supported) => setHasWebXR(supported))
        .catch(() => setHasWebXR(false));
    }
  }, []);

  const handleClick = async () => {
    if (isPresenting) {
      await toggleSession("immersive-vr");
      return;
    }

    if (hasWebXR) {
      try {
        await toggleSession("immersive-vr");
        return;
      } catch (err) {
        console.warn("Could not start WebXR session, falling back to desktop VR view:", err);
      }
    }

    // Toggle desktop VR adaptation mode
    setVrMode(!vrMode);
  };

  const isVRActive = isPresenting || vrMode;

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
      <button
        onClick={handleClick}
        className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-bold text-lg shadow-xl backdrop-blur-md transition-all duration-300 cursor-pointer ${
          isVRActive
            ? "bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/50 shadow-rose-900/40"
            : "bg-indigo-600/90 hover:bg-indigo-500 text-white border border-indigo-400/40 shadow-indigo-950/50"
        }`}
      >
        <span className="text-2xl">🥽</span>
        <span>
          {isPresenting
            ? "Exit VR"
            : vrMode
            ? "Exit VR Mode"
            : hasWebXR
            ? "Enter VR"
            : "VR Mode"}
        </span>
      </button>

      {/* Info popover toggle */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white font-bold flex items-center justify-center border border-white/20 backdrop-blur-md transition cursor-pointer shadow-lg"
        title="VR Mode Guide"
      >
        ?
      </button>

      {showInfo && (
        <div className="absolute right-0 top-16 w-84 p-5 bg-slate-900/95 border border-white/20 text-white rounded-2xl shadow-2xl backdrop-blur-xl text-sm space-y-3 z-50">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="font-bold text-base text-indigo-300">
              🥽 VR Classroom Guide
            </span>
            <button
              onClick={() => setShowInfo(false)}
              className="text-white/60 hover:text-white cursor-pointer text-lg font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-white/80 leading-relaxed">
            <strong>Normal Classroom:</strong> The standard interactive 3D classroom with the digital board and typing box.
          </p>
          <p className="text-white/80 leading-relaxed">
            <strong>VR Mode:</strong> Adapts the classroom for VR by switching to a 3D blackboard and placing a 3D voice assistance orb on the desk.
          </p>
          <div className="p-3 bg-indigo-950/60 rounded-xl border border-indigo-500/30 text-indigo-200 text-xs">
            💡 <strong>On Meta Quest:</strong> Connect via USB or Wi-Fi, open <code>http://localhost:3000</code> in Quest Browser, and tap <strong>VR Mode</strong> for full 360° head tracking!
          </div>
        </div>
      )}
    </div>
  );
};
