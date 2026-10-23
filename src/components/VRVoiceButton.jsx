"use client";
import { useAITeacher } from "@/hooks/useAITeacher";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Interactive } from "@react-three/xr";
import { useRef, useState } from "react";

export const VRVoiceButton = (props) => {
  const askAI = useAITeacher((state) => state.askAI);
  const loading = useAITeacher((state) => state.loading);

  const [isListening, setIsListening] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const recognitionRef = useRef(null);
  const meshRef = useRef();

  const toggleListening = () => {
    if (loading) return;

    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setErrorMsg("Mic not supported in this browser");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setErrorMsg(null);
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          askAI(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setErrorMsg("Mic permission needed");
          setTimeout(() => setErrorMsg(null), 3000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition could not start:", err);
      setIsListening(false);
      setErrorMsg("Click to try again");
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (isListening) {
        meshRef.current.rotation.y += delta * 3;
      } else if (hovered) {
        meshRef.current.rotation.y += delta * 1.5;
      }
    }
  });

  const buttonColor = errorMsg
    ? "#fa5252"
    : isListening
    ? "#ff6b6b"
    : loading
    ? "#fcc419"
    : hovered
    ? "#38d9a9"
    : "#20c997";

  const statusText = errorMsg
    ? errorMsg
    : isListening
    ? "Listening... Speak now"
    : loading
    ? "Thinking..."
    : "Tap Mic to Ask";

  return (
    <group {...props}>
      {/* 3D Interactive XR Button */}
      <Interactive
        onSelect={toggleListening}
        onHover={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <group
          onClick={toggleListening}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          {/* Base pedestal */}
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.2, 0.22, 0.05, 32]} />
            <meshStandardMaterial color="#343a40" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Glowing Mic Orb */}
          <mesh ref={meshRef} position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.13, 32, 32]} />
            <meshStandardMaterial
              color={buttonColor}
              emissive={buttonColor}
              emissiveIntensity={isListening ? 0.9 : hovered ? 0.5 : 0.25}
              roughness={0.3}
            />
          </mesh>

          {/* Status Label in 3D Space */}
          <Text
            position={[0, 0.28, 0]}
            fontSize={0.065}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {statusText}
          </Text>
        </group>
      </Interactive>
    </group>
  );
};
