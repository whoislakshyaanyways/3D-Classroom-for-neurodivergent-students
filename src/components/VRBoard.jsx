"use client";
import { LESSON_1_STEPS } from "@/data/lessons";
import { useAITeacher } from "@/hooks/useAITeacher";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Safe rounded rectangle that works reliably across all WebXR and browser engines
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// Multi-line and paragraph text wrapping with boundary safety
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxY = 1100) {
  if (!text) return y;
  const paragraphs = String(text).split("\n");
  let currentY = y;

  for (let p = 0; p < paragraphs.length; p++) {
    const paragraph = paragraphs[p].trim();
    if (!paragraph) {
      currentY += lineHeight * 0.4;
      continue;
    }
    const words = paragraph.split(/\s+/);
    let line = "";

    for (let n = 0; n < words.length; n++) {
      if (currentY > maxY) break;
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (currentY <= maxY && line.trim()) {
      ctx.fillText(line.trim(), x, currentY);
      currentY += lineHeight;
    }
  }
  return currentY;
}

export const VRBoard = (props) => {
  const mode = useAITeacher((state) => state.mode);
  const lessonStep = useAITeacher((state) => state.lessonStep);
  const currentMessage = useAITeacher((state) => state.currentMessage);
  const messages = useAITeacher((state) => state.messages);
  const loading = useAITeacher((state) => state.loading);
  const speechLoading = useAITeacher((state) => state.speechLoading);
  const ttsLoading = useAITeacher((state) => state.ttsLoading);
  const isSpeaking = useAITeacher((state) => state.isSpeaking);

  const { invalidate } = useThree();
  const needsUpdateRef = useRef(true);
  const canvasRef = useRef(null);
  const [texture, setTexture] = useState(null);

  // Latest message prioritizes currentMessage, falling back to last in array
  const latestMessage =
    currentMessage || (messages.length > 0 ? messages[messages.length - 1] : null);

  // Client-safe canvas and texture initialization (prevents SSR null hydration issues)
  useEffect(() => {
    if (typeof document === "undefined") return;

    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1152;
    canvasRef.current = canvas;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;

    setTexture(tex);
    needsUpdateRef.current = true;
    invalidate();

    return () => {
      tex.dispose();
    };
  }, [invalidate]);

  // Sync texture updates with the Three.js / WebXR animation loop
  useFrame(() => {
    if (needsUpdateRef.current && texture) {
      texture.needsUpdate = true;
      needsUpdateRef.current = false;
    }
  });

  // Re-draw chalkboard content whenever state, mode, or step changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !texture) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Draw Chalkboard Slate Background
    ctx.fillStyle = "#0c1a13";
    ctx.fillRect(0, 0, width, height);

    // Chalkboard subtle border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // Subtle chalkboard vignette
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      300,
      width / 2,
      height / 2,
      950
    );
    grad.addColorStop(0, "rgba(255, 255, 255, 0.03)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    ctx.fillStyle = grad;
    ctx.fillRect(28, 28, width - 56, height - 56);

    const margin = 80;
    const contentWidth = width - margin * 2;
    const topY = 75;

    // ========================================================
    // MODE A: LESSON 1 (OUR FIVE SENSES)
    // ========================================================
    if (mode === "lesson1") {
      const step = LESSON_1_STEPS[lessonStep] || LESSON_1_STEPS[0];
      const totalSteps = LESSON_1_STEPS.length;

      // Header Bar
      ctx.textAlign = "left";
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#6ee7b7";
      ctx.fillText(
        `LESSON 1: OUR FIVE SENSES  •  PART ${lessonStep + 1} OF ${totalSteps}`,
        margin,
        topY
      );

      // Status indicator on top right
      if (isSpeaking) {
        ctx.textAlign = "right";
        ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#34d399";
        ctx.fillText("🔊 Teacher Naoki is speaking...", width - margin, topY);
      } else if (ttsLoading) {
        ctx.textAlign = "right";
        ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#60a5fa";
        ctx.fillText("🎙️ Preparing lesson audio...", width - margin, topY);
      } else {
        ctx.textAlign = "right";
        ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText("📚 Lesson Mode Active", width - margin, topY);
      }

      // Step Progress Dots
      const dotSpacing = contentWidth / totalSteps;
      for (let s = 0; s < totalSteps; s++) {
        const dotX = margin + s * dotSpacing + dotSpacing / 2;
        const dotY = topY + 28;
        ctx.fillStyle =
          s === lessonStep
            ? "#fde047"
            : s < lessonStep
            ? "#34d399"
            : "rgba(255, 255, 255, 0.2)";
        ctx.beginPath();
        ctx.arc(dotX, dotY, s === lessonStep ? 9 : 6, 0, Math.PI * 2);
        ctx.fill();
      }

      let curY = 170;
      ctx.textAlign = "left";

      // Lesson Title with Sense Icon
      ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#fef08a";
      curY = wrapText(
        ctx,
        `${step.icon}  ${step.boardTitle}`,
        margin,
        curY,
        contentWidth,
        66
      );

      curY += 15;

      // Divider line
      ctx.fillStyle = "rgba(52, 211, 153, 0.4)";
      ctx.fillRect(margin, curY, contentWidth, 3);
      curY += 40;

      // Main Summary Card Box
      const boxStartY = curY;
      const boxPadding = 26;
      ctx.font = "34px system-ui, -apple-system, sans-serif";

      // Measure summary lines
      const words = step.summary.split(/\s+/);
      let line = "";
      let lineCount = 1;
      for (let w = 0; w < words.length; w++) {
        const test = line + words[w] + " ";
        if (ctx.measureText(test).width > contentWidth - boxPadding * 2 && w > 0) {
          line = words[w] + " ";
          lineCount++;
        } else {
          line = test;
        }
      }

      const hasExample = Boolean(step.example);
      const boxHeight = lineCount * 46 + (hasExample ? 110 : 0) + boxPadding * 2;

      // Card background
      ctx.fillStyle = "rgba(6, 78, 59, 0.55)";
      ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, margin, boxStartY, contentWidth, boxHeight, 18);
      ctx.fill();
      ctx.stroke();

      // Card summary text
      ctx.fillStyle = "#ecfdf5";
      curY = wrapText(
        ctx,
        step.summary,
        margin + boxPadding,
        boxStartY + boxPadding + 34,
        contentWidth - boxPadding * 2,
        46
      );

      // Card example box
      if (step.example) {
        curY += 16;
        const exY = curY;
        const exHeight = 60;
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.strokeStyle = "rgba(253, 224, 71, 0.3)";
        ctx.lineWidth = 1.5;
        drawRoundedRect(
          ctx,
          margin + boxPadding,
          exY,
          contentWidth - boxPadding * 2,
          exHeight,
          12
        );
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#fef08a";
        ctx.fillText("💡 Example: " + step.example, margin + boxPadding + 20, exY + 41);
        curY = exY + exHeight;
      }

      curY = boxStartY + boxHeight + 35;

      // Key Takeaway Points
      if (step.points && step.points.length > 0 && curY < height - 100) {
        ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#93c5fd";
        ctx.fillText("KEY POINTS:", margin, curY);
        curY += 38;

        ctx.font = "28px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#f8fafc";

        for (let i = 0; i < step.points.length; i++) {
          if (curY > height - 80) break;
          const pt = step.points[i];
          curY = wrapText(
            ctx,
            `✓  ${pt}`,
            margin + 16,
            curY,
            contentWidth - 32,
            38,
            height - 70
          );
          curY += 6;
        }
      }

      // Bottom Helper Note
      ctx.textAlign = "center";
      ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.fillText(
        "💡 Tap the desk mic orb anytime to answer the question or ask Teacher Naoki anything!",
        width / 2,
        height - 35
      );

      texture.needsUpdate = true;
      needsUpdateRef.current = true;
      invalidate();
      return;
    }

    // ========================================================
    // MODE B: NORMAL AI ASSISTANCE (FREE-FORM Q&A)
    // ========================================================
    ctx.textAlign = "left";
    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillText("AI CLASSROOM TUTOR", 80, topY);

    if (isSpeaking) {
      ctx.textAlign = "right";
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#34d399";
      ctx.fillText("🔊 Teacher Naoki is speaking...", width - 80, topY);
    } else if (ttsLoading) {
      ctx.textAlign = "right";
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#60a5fa";
      ctx.fillText("🎙️ Generating voice audio...", width - 80, topY);
    } else if (loading) {
      ctx.textAlign = "right";
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText("⚡ Thinking...", width - 80, topY);
    } else if (speechLoading) {
      ctx.textAlign = "right";
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText("🎤 Transcribing speech...", width - 80, topY);
    }

    ctx.textAlign = "left";

    // CASE 1: No message yet (Initial Welcome Screen)
    if (!latestMessage && !speechLoading) {
      ctx.textAlign = "center";

      ctx.font = "bold 96px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("AI Classroom", width / 2, height / 2 - 120);

      ctx.font = "bold 54px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#6ee7b7";
      ctx.fillText("Interactive VR Tutor", width / 2, height / 2 - 25);

      ctx.font = "42px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#fde047";
      ctx.fillText(
        "Tap the glowing Mic orb on your desk to speak!",
        width / 2,
        height / 2 + 80
      );

      ctx.font = "32px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.fillText(
        "Ask questions about science, math, history, coding, or switch to Lesson 1",
        width / 2,
        height / 2 + 150
      );

      texture.needsUpdate = true;
      needsUpdateRef.current = true;
      invalidate();
      return;
    }

    // CASE 2: Transcribing speech
    if (speechLoading && !latestMessage) {
      ctx.textAlign = "center";

      ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#fde047";
      ctx.fillText("Listening to your voice...", width / 2, height / 2 - 40);

      ctx.font = "42px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#93c5fd";
      ctx.fillText("Transcribing with AI Whisper...", width / 2, height / 2 + 40);

      texture.needsUpdate = true;
      needsUpdateRef.current = true;
      invalidate();
      return;
    }

    // CASE 3: Active Message / Answer
    if (latestMessage) {
      let curY = 140;

      // Question Tag Badge
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#60a5fa";
      ctx.fillText("QUESTION", margin, curY);
      curY += 45;

      // Question Text
      ctx.font = "bold 50px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#fef08a";
      curY = wrapText(
        ctx,
        `"${latestMessage.question}"`,
        margin,
        curY,
        contentWidth,
        60,
        320
      );

      curY += 15;

      // Golden accent divider line
      ctx.fillStyle = "rgba(253, 224, 71, 0.4)";
      ctx.fillRect(margin, curY, contentWidth, 3);
      curY += 40;

      const answer = latestMessage.answer;

      // If AI answer is still loading/generating
      if (loading || !answer) {
        ctx.textAlign = "center";
        ctx.font = "bold 54px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#60a5fa";
        ctx.fillText(
          "Teacher Naoki is preparing your answer...",
          width / 2,
          curY + 120
        );

        ctx.font = "36px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillText(
          "Formulating a step-by-step explanation",
          width / 2,
          curY + 190
        );

        texture.needsUpdate = true;
        needsUpdateRef.current = true;
        invalidate();
        return;
      }

      // Safe extraction of answer fields
      let answerText = "";
      let explanationText = "";
      let steps = [];

      if (typeof answer === "string") {
        answerText = answer;
      } else if (answer && typeof answer === "object") {
        answerText =
          answer.answer ||
          answer.text ||
          answer.response ||
          answer.message ||
          "";
        explanationText = answer.explanation || answer.details || "";
        steps = Array.isArray(answer.steps) ? answer.steps : [];
      }

      // 1. Core Direct Answer
      if (answerText) {
        ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#ffffff";
        curY = wrapText(ctx, answerText, margin, curY, contentWidth, 58, 600);
        curY += 20;
      }

      // 2. Explanation Box
      if (explanationText && curY < height - 260) {
        const boxStartY = curY;
        const boxPadding = 26;

        ctx.font = "32px system-ui, -apple-system, sans-serif";

        const words = explanationText.split(/\s+/);
        let line = "";
        let lineCount = 1;
        for (let w = 0; w < words.length; w++) {
          const test = line + words[w] + " ";
          if (ctx.measureText(test).width > contentWidth - boxPadding * 2 && w > 0) {
            line = words[w] + " ";
            lineCount++;
          } else {
            line = test;
          }
        }
        const boxHeight = Math.min(
          lineCount * 44 + boxPadding * 2 + 10,
          height - boxStartY - 180
        );

        ctx.fillStyle = "rgba(6, 78, 59, 0.55)";
        ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, margin, boxStartY, contentWidth, boxHeight, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#d1fae5";
        wrapText(
          ctx,
          explanationText,
          margin + boxPadding,
          boxStartY + boxPadding + 32,
          contentWidth - boxPadding * 2,
          44,
          boxStartY + boxHeight - boxPadding
        );

        curY = boxStartY + boxHeight + 25;
      }

      // 3. Key Takeaways / Steps
      if (steps.length > 0 && curY < height - 120) {
        ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#93c5fd";
        ctx.fillText("KEY TAKEAWAYS:", margin, curY);
        curY += 38;

        ctx.font = "28px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#f8fafc";

        for (let i = 0; i < Math.min(steps.length, 3); i++) {
          if (curY > height - 50) break;
          const stepText = `${i + 1}. ${steps[i]}`;
          curY = wrapText(
            ctx,
            stepText,
            margin + 16,
            curY,
            contentWidth - 32,
            38,
            height - 40
          );
          curY += 6;
        }
      }
    }

    texture.needsUpdate = true;
    needsUpdateRef.current = true;
    invalidate();
  }, [
    texture,
    mode,
    lessonStep,
    latestMessage,
    loading,
    speechLoading,
    ttsLoading,
    isSpeaking,
    invalidate,
  ]);

  return (
    <group {...props}>
      {/* Wooden blackboard frame */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[4.42, 2.56, 0.04]} />
        <meshStandardMaterial color="#2d1c13" roughness={0.7} />
      </mesh>

      {/* Chalkboard Slate Plane with live high-res CanvasTexture */}
      {texture && (
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[4.26, 2.4]} />
          <meshBasicMaterial
            map={texture}
            toneMapped={false}
            side={THREE.DoubleSide}
            polygonOffset={true}
            polygonOffsetFactor={-1}
          />
        </mesh>
      )}
    </group>
  );
};
