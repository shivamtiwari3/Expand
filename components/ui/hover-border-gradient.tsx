"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

const movingMap: Record<Direction, string> = {
  TOP: "radial-gradient(20.7% 50% at 50% 0%, #ced7e3 0%, rgba(206, 215, 227, 0) 100%)",
  LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, #ced7e3 0%, rgba(206, 215, 227, 0) 100%)",
  BOTTOM:
    "radial-gradient(20.7% 50% at 50% 100%, #ced7e3 0%, rgba(206, 215, 227, 0) 100%)",
  RIGHT:
    "radial-gradient(16.2% 41.2% at 100% 50%, #ced7e3 0%, rgba(206, 215, 227, 0) 100%)",
};

const highlight =
  "radial-gradient(75% 181.16% at 50% 50%, #ced7e3 0%, rgba(206, 215, 227, 0) 100%)";

function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
}: {
  children: React.ReactNode;
  containerClassName?: string;
  className?: string;
  as?: string;
  duration?: number;
  clockwise?: boolean;
}) {
  const Comp = Tag as any;
  const [hovered, setHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>("BOTTOM");

  const rotateDirection = (currentDirection: Direction): Direction => {
    const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
    const currentIndex = directions.indexOf(currentDirection);
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length;
    return directions[nextIndex];
  };

  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [hovered, duration, clockwise]);

  return (
    <Comp
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex h-min w-fit flex-col flex-nowrap content-center items-center justify-center gap-10 overflow-visible rounded-full border bg-black/40 box-decoration-clone p-px backdrop-blur-sm transition duration-500 hover:bg-black/60 dark:bg-white/20",
        containerClassName,
      )}
    >
      <div
        className={cn(
          "z-10 w-auto rounded-[inherit] bg-black px-4 py-2 text-white",
          className,
        )}
      >
        {children}
      </div>
      <motion.div
        className={cn(
          "absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]",
        )}
        style={{
          filter: "blur(2px)",
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered
            ? [movingMap[direction], highlight]
            : movingMap[direction],
        }}
        transition={{ ease: "linear", duration: duration ?? 1 }}
      />
      <div className="absolute inset-0.5 z-[1] flex-none rounded-[100px] bg-black" />
    </Comp>
  );
}

export { HoverBorderGradient };
