"use client";
import { useAITeacher } from "@/hooks/useAITeacher";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export const VRBoard = (props) => {
  const currentMessage = useAITeacher((state) => state.currentMessage);
  const messages = useAITeacher((state) => state.messages);
  const loading = useAITeacher((state) => state.loading);
  const speechLoading = useAITeacher((state) => state.speechLoading);

  const latestMessage = currentMessage || messages[messages.length - 1];

  // In-memory high-res canvas for 100% reliable WebXR rendering without external font/worker dependencies
  const canvas = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 2048;
    c.height = 1152;
    return c;
  }, []);

  const texture = useMemo(() => {
    if (!canvas) return null;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [canvas]);

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    if (!text) return y;
    const words = String(text).split(" ");
    let line = "";
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
    return currentY + lineHeight;
  };

  useEffect(() => {
    if (!canvas || !texture) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Draw Chalkboard Background
    ctx.fillStyle = "#112016";
    ctx.fillRect(0, 0, width, height);

    // Inner chalkboard subtle border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 8;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    // Subtle chalkboard vignette/texture
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      300,
      width / 2,
      height / 2,
      900
    );
    grad.addColorStop(0, "rgba(255, 255, 255, 0.03)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.fillStyle = grad;
    ctx.fillRect(36, 36, width - 72, height - 72);

    ctx.textAlign = "left";

    // CASE 1: No message yet (Initial Welcome Screen)
    if (!latestMessage && !speechLoading) {
      ctx.textAlign = "center";

      ctx.font = "bold 96px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("AI Classroom", width / 2, height / 2 - 120);

      ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#6ee7b7";
      ctx.fillText("Interactive VR Tutor", width / 2, height / 2 - 20);

      ctx.font = "42px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#fde047";
      ctx.fillText(
        "Tap the glowing Mic orb on your desk to speak!",
        width / 2,
        height / 2 + 90
      );

      ctx.font = "32px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillText(
        "Ask any question about science, math, history, or coding",
        width / 2,
        height / 2 + 160
      );

      texture.needsUpdate = true;
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
      ctx.fillText("Transcribing with AI...", width / 2, height / 2 + 40);

      texture.needsUpdate = true;
      return;
    }

    // CASE 3: Active Message / Answer
    if (latestMessage) {
      let curY = 120;
      const margin = 100;
      const contentWidth = width - margin * 2;

      // Question Tag
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#93c5fd";
      ctx.fillText("QUESTION", margin, curY);
      curY += 50;

      // Question Title
      ctx.font = "bold 52px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#fef08a";
      curY = wrapText(
        ctx,
        `"${latestMessage.question}"`,
        margin,
        curY,
        contentWidth,
        64
      );

      curY += 20;

      // Golden accent divider line
      ctx.fillStyle = "rgba(253, 224, 71, 0.35)";
      ctx.fillRect(margin, curY, contentWidth, 4);
      curY += 45;

      const answer = latestMessage.answer;

      // If AI is still thinking
      if (loading || !answer) {
        ctx.textAlign = "center";
        ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
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
        return;
      }

      // Safe extraction of answer text (supports object or string)
      const answerText =
        typeof answer === "string"
          ? answer
          : answer.answer ||
            answer.text ||
            answer.response ||
            answer.message ||
            "";

      const explanationText =
        typeof answer === "object"
          ? answer.explanation || answer.details || ""
          : "";

      const steps = Array.isArray(answer?.steps) ? answer.steps : [];

      // Render Core Answer
      if (answerText) {
        ctx.font = "bold 46px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#ffffff";
        curY = wrapText(ctx, answerText, margin, curY, contentWidth, 60);
        curY += 25;
      }

      // Render Explanation Card Box
      if (explanationText && curY < height - 220) {
        const boxStartY = curY;
        const boxPadding = 30;

        ctx.font = "34px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#a7f3d0";

        // Measure lines to draw rounded background box
        const words = explanationText.split(" ");
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
        const boxHeight = lineCount * 46 + boxPadding * 2 + 10;

        // Draw card background
        ctx.fillStyle = "rgba(6, 78, 59, 0.45)";
        ctx.strokeStyle = "rgba(52, 211, 153, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(margin, boxStartY, contentWidth, boxHeight, 16);
        ctx.fill();
        ctx.stroke();

        // Draw explanation text
        ctx.fillStyle = "#ccfbf1";
        curY = wrapText(
          ctx,
          explanationText,
          margin + boxPadding,
          boxStartY + boxPadding + 32,
          contentWidth - boxPadding * 2,
          46
        );

        curY = boxStartY + boxHeight + 30;
      }

      // Render Key Takeaways / Steps
      if (steps.length > 0 && curY < height - 120) {
        ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#93c5fd";
        ctx.fillText("KEY TAKEAWAYS:", margin, curY);
        curY += 45;

        ctx.font = "30px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#f8fafc";

        for (let i = 0; i < Math.min(steps.length, 3); i++) {
          if (curY > height - 60) break;
          const stepText = `${i + 1}. ${steps[i]}`;
          curY = wrapText(ctx, stepText, margin + 15, curY, contentWidth - 30, 42);
          curY += 8;
        }
      }
    }

    texture.needsUpdate = true;
  }, [canvas, texture, latestMessage, loading, speechLoading]);

  return (
    <group {...props}>
      {/* Wooden blackboard frame behind */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[4.96, 2.86, 0.06]} />
        <meshStandardMaterial color="#2d1c13" roughness={0.7} />
      </mesh>

      {/* Chalkboard Slate Plane with live high-res CanvasTexture */}
      {texture && (
        <mesh position={[0, 0, 0.08]}>
          <planeGeometry args={[4.8, 2.7]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};
