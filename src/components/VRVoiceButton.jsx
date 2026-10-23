"use client";
import { useAITeacher } from "@/hooks/useAITeacher";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Interactive } from "@react-three/xr";
import { useRef, useState } from "react";

export const VRVoiceButton = (props) => {
  const askAISpeech = useAITeacher((state) => state.askAISpeech);
  const loading = useAITeacher((state) => state.loading);
  const speechLoading = useAITeacher((state) => state.speechLoading);

  const [isRecording, setIsRecording] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const autoStopTimeoutRef = useRef(null);
  const lastActionTimeRef = useRef(0);
  const meshRef = useRef();

  const startRecording = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      showTemporaryStatus("Mic not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
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
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const blobType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: blobType });

        setIsRecording(false);

        if (audioBlob.size > 0) {
          try {
            setStatusMessage("Transcribing...");
            const transcript = await askAISpeech(audioBlob);
            if (!transcript) {
              showTemporaryStatus("No speech detected. Try again");
            } else {
              setStatusMessage(null);
            }
          } catch (err) {
            console.error("VR voice recording processing failed:", err);
            showTemporaryStatus("Failed to transcribe. Try again");
          }
        } else {
          showTemporaryStatus("No audio recorded");
        }
      };

      // Request data chunks every 250ms so audio buffer is populated continuously
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setStatusMessage(null);

      // Automatically finalize and send after 12 seconds max if user forgets to tap again
      if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 12000);
    } catch (err) {
      console.error("Mic access error in VR:", err);
      setIsRecording(false);
      showTemporaryStatus("Microphone permission needed");
    }
  };

  const stopRecording = () => {
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
    }
  };

  const showTemporaryStatus = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 3500);
  };

  const handleToggle = () => {
    const now = Date.now();
    // Debounce to prevent simultaneous onSelect and onClick triggers
    if (now - lastActionTimeRef.current < 400) return;
    lastActionTimeRef.current = now;

    if (loading || speechLoading) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (isRecording) {
        meshRef.current.rotation.y += delta * 3;
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.08;
        meshRef.current.scale.set(pulse, pulse, pulse);
      } else if (hovered) {
        meshRef.current.rotation.y += delta * 1.5;
        meshRef.current.scale.set(1.05, 1.05, 1.05);
      } else {
        meshRef.current.scale.set(1, 1, 1);
      }
    }
  });

  const isBusy = loading || speechLoading;

  const buttonColor = isRecording
    ? "#ff4d4f"
    : isBusy
    ? "#ffd43b"
    : statusMessage?.includes("No") || statusMessage?.includes("Failed") || statusMessage?.includes("permission")
    ? "#ff8787"
    : hovered
    ? "#38d9a9"
    : "#20c997";

  const displayLabel = statusMessage
    ? statusMessage
    : isRecording
    ? "Recording... Tap to send"
    : speechLoading
    ? "Transcribing voice..."
    : loading
    ? "Thinking..."
    : "Tap Mic to Ask";

  return (
    <group {...props}>
      <Interactive
        onSelect={handleToggle}
        onHover={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <group
          onClick={handleToggle}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          {/* Base pedestal on desk */}
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.2, 0.22, 0.05, 32]} />
            <meshStandardMaterial color="#212529" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Glowing Mic Orb */}
          <mesh ref={meshRef} position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.13, 32, 32]} />
            <meshStandardMaterial
              color={buttonColor}
              emissive={buttonColor}
              emissiveIntensity={isRecording ? 1.0 : isBusy ? 0.7 : hovered ? 0.5 : 0.25}
              roughness={0.3}
            />
          </mesh>

          {/* 3D Floating Status Label */}
          <Text
            position={[0, 0.28, 0]}
            fontSize={0.07}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {displayLabel}
          </Text>
        </group>
      </Interactive>
    </group>
  );
};
