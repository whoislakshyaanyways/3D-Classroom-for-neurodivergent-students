"use client";
import { useAITeacher } from "@/hooks/useAITeacher";
import { Text } from "@react-three/drei";

export const VRBoard = (props) => {
  const currentMessage = useAITeacher((state) => state.currentMessage);
  const messages = useAITeacher((state) => state.messages);
  const latestMessage = currentMessage || messages[messages.length - 1];

  return (
    <group {...props}>
      {/* Blackboard Slate Background */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[4.8, 2.7, 0.08]} />
        <meshStandardMaterial color="#1a251e" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Outer Wooden / Metallic Frame */}
      <mesh position={[0, 0, -0.07]}>
        <boxGeometry args={[5.0, 2.9, 0.06]} />
        <meshStandardMaterial color="#402d20" roughness={0.6} />
      </mesh>

      {!latestMessage ? (
        <group position={[0, 0, 0.02]}>
          <Text
            fontSize={0.24}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            position={[0, 0.35, 0]}
            maxWidth={4.2}
            textAlign="center"
          >
            AI Classroom
          </Text>
          <Text
            fontSize={0.15}
            color="#8ce99a"
            anchorX="center"
            anchorY="middle"
            position={[0, 0.0, 0]}
            maxWidth={4.2}
            textAlign="center"
          >
            Interactive VR Tutor
          </Text>
          <Text
            fontSize={0.11}
            color="#cccccc"
            anchorX="center"
            anchorY="middle"
            position={[0, -0.4, 0]}
            maxWidth={4.2}
            textAlign="center"
          >
            Press the glowing Mic button on the desk to speak your question!
          </Text>
        </group>
      ) : (
        <group position={[0, 0, 0.02]}>
          {/* Question Banner */}
          <Text
            fontSize={0.12}
            color="#ffd43b"
            anchorX="center"
            anchorY="top"
            position={[0, 1.15, 0]}
            maxWidth={4.4}
            textAlign="center"
          >
            {`Q: "${latestMessage.question}"`}
          </Text>

          {/* Core Answer */}
          <Text
            fontSize={0.12}
            color="#ffffff"
            anchorX="center"
            anchorY="top"
            position={[0, 0.85, 0]}
            maxWidth={4.4}
            textAlign="center"
          >
            {latestMessage.answer?.answer || ""}
          </Text>

          {/* Explanation */}
          <Text
            fontSize={0.095}
            color="#b2f2bb"
            anchorX="center"
            anchorY="top"
            position={[0, 0.45, 0]}
            maxWidth={4.4}
            textAlign="left"
          >
            {latestMessage.answer?.explanation || ""}
          </Text>

          {/* Steps */}
          {latestMessage.answer?.steps && latestMessage.answer.steps.length > 0 && (
            <group position={[-2.1, -0.1, 0]}>
              <Text
                fontSize={0.09}
                color="#74c0fc"
                anchorX="left"
                anchorY="top"
                position={[0, 0, 0]}
              >
                Key Steps:
              </Text>
              {latestMessage.answer.steps.slice(0, 3).map((step, idx) => (
                <Text
                  key={idx}
                  fontSize={0.08}
                  color="#ffffff"
                  anchorX="left"
                  anchorY="top"
                  position={[0.1, -0.13 * (idx + 1), 0]}
                  maxWidth={4.0}
                  textAlign="left"
                >
                  {`${idx + 1}. ${step}`}
                </Text>
              ))}
            </group>
          )}
        </group>
      )}
    </group>
  );
};
