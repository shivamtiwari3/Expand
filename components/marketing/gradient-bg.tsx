"use client";

import { GrainGradient } from "@paper-design/shaders-react";

export function GradientBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        colorBack="#141312"
        softness={0.85}
        intensity={0.35}
        noise={0.02}
        shape="corners"
        offsetX={0}
        offsetY={0}
        scale={1.2}
        rotation={45}
        speed={0.4}
        colors={["#3e3937", "#282524", "#343b46"]}
      />
    </div>
  );
}
