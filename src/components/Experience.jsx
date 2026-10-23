"use client";
import { useAITeacher } from "@/hooks/useAITeacher";
import {
  CameraControls,
  Environment,
  Float,
  Gltf,
  Html,
  Loader,
  useGLTF,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Controllers, Hands, XR, useXR } from "@react-three/xr";
import { Leva, button, useControls } from "leva";
import { Suspense, useEffect, useRef } from "react";
import { degToRad } from "three/src/math/MathUtils";
import { BoardSettings } from "./BoardSettings";
import { MessagesList } from "./MessagesList";
import { Teacher } from "./Teacher";
import { TypingBox } from "./TypingBox";
import { VRBoard } from "./VRBoard";
import { VRModeButton } from "./VRModeButton";
import { VRVoiceButton } from "./VRVoiceButton";

const itemPlacement = {
  default: {
    classroom: {
      position: [0.2, -1.7, -2],
    },
    teacher: {
      position: [-1, -1.7, -3],
    },
    board: {
      position: [0.45, 0.382, -6],
    },
  },
  alternative: {
    classroom: {
      position: [0.3, -1.7, -1.5],
      rotation: [0, degToRad(-90), 0],
      scale: 0.4,
    },
    teacher: { position: [-1, -1.7, -3] },
    board: { position: [1.4, 0.84, -8] },
  },
};

export const Experience = () => {
  const vrMode = useAITeacher((state) => state.vrMode);
  const isPresenting = useAITeacher((state) => state.isPresenting);
  const isVR = isPresenting || vrMode;

  return (
    <>
      {/* Prominent VR Mode toggle button */}
      <VRModeButton />

      {/* Desktop typing box: only rendered when in regular classroom mode */}
      {!isVR && (
        <div className="z-10 md:justify-center fixed bottom-4 left-4 right-4 flex gap-3 flex-wrap justify-stretch transition-opacity duration-300">
          <TypingBox />
        </div>
      )}

      <Leva hidden />
      <Loader />
      <Canvas
        camera={{
          position: [0, 0, 0.0001],
        }}
      >
        <XR>
          <XRBridge />
          <SceneContent />
        </XR>
      </Canvas>
    </>
  );
};

// Syncs WebXR state with global store so UI outside Canvas can access it safely
const XRBridge = () => {
  const { isPresenting } = useXR();
  const setIsPresenting = useAITeacher((state) => state.setIsPresenting);

  useEffect(() => {
    setIsPresenting(isPresenting);
  }, [isPresenting, setIsPresenting]);

  return null;
};

const SceneContent = () => {
  const teacher = useAITeacher((state) => state.teacher);
  const classroom = useAITeacher((state) => state.classroom);
  const vrMode = useAITeacher((state) => state.vrMode);
  const { isPresenting } = useXR();

  const isVR = isPresenting || vrMode;

  return (
    <>
      <Controllers />
      <Hands />
      <CameraManager />

      <Suspense>
        <Float speed={0.5} floatIntensity={0.2} rotationIntensity={0.1}>
          {/* 1. Normal 3D Classroom Mode: 2D HTML Board & Controls */}
          {!isVR && (
            <Html
              transform
              {...itemPlacement[classroom].board}
              distanceFactor={1}
            >
              <MessagesList />
              <BoardSettings />
            </Html>
          )}

          {/* 2. VR Classroom Mode: 3D Blackboard */}
          {isVR && <VRBoard {...itemPlacement[classroom].board} />}

          {/* 3. VR Classroom Mode: 3D Assistance Voice Button on desk */}
          {isVR && <VRVoiceButton position={[0, -0.65, -1.2]} />}

          <Environment preset="sunset" />
          <ambientLight intensity={0.8} color="pink" />

          <Gltf
            src={`/models/classroom_${classroom}.glb`}
            {...itemPlacement[classroom].classroom}
          />
          <Teacher
            teacher={teacher}
            key={teacher}
            {...itemPlacement[classroom].teacher}
            scale={1.5}
            rotation-y={degToRad(20)}
          />
        </Float>
      </Suspense>
    </>
  );
};

const CAMERA_POSITIONS = {
  default: [0, 6.123233995736766e-21, 0.0001],
  loading: [
    0.00002621880610890309, 0.00000515037441056466, 0.00009636414192870058,
  ],
  speaking: [0, -1.6481333940859815e-7, 0.00009999846226827279],
};

const CAMERA_ZOOMS = {
  default: 1,
  loading: 1.3,
  speaking: 2.1204819420055387,
};

const CameraManager = () => {
  const controls = useRef();
  const loading = useAITeacher((state) => state.loading);
  const currentMessage = useAITeacher((state) => state.currentMessage);
  const { isPresenting } = useXR();

  useEffect(() => {
    // When inside a real WebXR VR session, the headset takes 100% charge of camera
    if (isPresenting) return;

    if (loading) {
      controls.current?.setPosition(...CAMERA_POSITIONS.loading, true);
      controls.current?.zoomTo(CAMERA_ZOOMS.loading, true);
    } else if (currentMessage) {
      controls.current?.setPosition(...CAMERA_POSITIONS.speaking, true);
      controls.current?.zoomTo(CAMERA_ZOOMS.speaking, true);
    }
  }, [loading, isPresenting, currentMessage]);

  useControls("Helper", {
    getCameraPosition: button(() => {
      const position = controls.current.getPosition();
      const zoom = controls.current.camera.zoom;
      console.log([...position], zoom);
    }),
  });

  // When presenting in real WebXR, disable CameraControls to allow free 6-DoF head movement
  if (isPresenting) {
    return null;
  }

  return (
    <CameraControls
      ref={controls}
      minZoom={1}
      maxZoom={3}
      polarRotateSpeed={-0.3} // REVERSE FOR NATURAL EFFECT
      azimuthRotateSpeed={-0.3} // REVERSE FOR NATURAL EFFECT
      mouseButtons={{
        left: 1, //ACTION.ROTATE
        wheel: 16, //ACTION.ZOOM
      }}
      touches={{
        one: 32, //ACTION.TOUCH_ROTATE
        two: 512, //ACTION.TOUCH_ZOOM
      }}
    />
  );
};

useGLTF.preload("/models/classroom_default.glb");
useGLTF.preload("/models/classroom_alternative.glb");
