"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!glowRef.current) return;
      const { clientX, clientY } = e;
      
      // Use requestAnimationFrame for smoother performance
      window.requestAnimationFrame(() => {
        if (glowRef.current) {
          glowRef.current.style.transform = `translate3d(${clientX - 300}px, ${clientY - 300}px, 0)`;
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed top-0 left-0 w-[600px] h-[600px] rounded-full opacity-60 blur-[120px] z-[1] pointer-events-none"
      style={{
        background: "radial-gradient(circle, rgba(0, 255, 136, 0.08) 0%, rgba(0, 255, 136, 0.01) 50%, transparent 80%)",
        transform: "translate3d(-999px, -999px, 0)",
      }}
    />
  );
}
