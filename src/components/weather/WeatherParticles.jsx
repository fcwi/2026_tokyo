import React, { useEffect, useRef } from "react";
import Particle from "./Particle";

const WeatherParticles = ({ type, isDay }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!type || type === "clouds") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrameId;
    let particles = [];

    const resize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", resize);
    resize();

    const count =
      type === "rain"
        ? 150
        : type === "snow"
          ? 80
          : type === "fog"
            ? 30
            : type === "lightning"
              ? 8
              : 100;
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(canvas, ctx, type, isDay));
    }

    const animate = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type, isDay]);

  if (!type || type === "clouds") return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default WeatherParticles;
