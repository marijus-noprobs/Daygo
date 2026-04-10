import React, { useRef, useEffect } from 'react';

interface ParticleRingProps {
  size: number;
  progress: number; // 0-1
  color: string; // hex or rgb
  className?: string;
}

const ParticleRing: React.FC<ParticleRingProps> = ({ size, progress, color, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseR = size * 0.38;

    // Generate particles once
    const particleCount = 320;
    const particles: {
      angle: number;
      rOffset: number;
      size: number;
      opacity: number;
      speed: number;
      drift: number;
      phase: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      particles.push({
        angle,
        rOffset: (Math.random() - 0.5) * size * 0.14,
        size: 0.4 + Math.random() * 1.8,
        opacity: 0.08 + Math.random() * 0.7,
        speed: 0.0003 + Math.random() * 0.0012,
        drift: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Scattered fill particles inside the sphere
    const innerCount = 180;
    const innerParticles: {
      x: number;
      y: number;
      size: number;
      opacity: number;
      phase: number;
    }[] = [];

    for (let i = 0; i < innerCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * baseR * 0.85;
      innerParticles.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        size: 0.3 + Math.random() * 1.0,
        opacity: 0.03 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Parse color
    const parseColor = (c: string) => {
      if (c.startsWith('#')) {
        const r = parseInt(c.slice(1, 3), 16);
        const g = parseInt(c.slice(3, 5), 16);
        const b = parseInt(c.slice(5, 7), 16);
        return { r, g, b };
      }
      return { r: 200, g: 232, b: 120 }; // fallback lime
    };

    const { r: cr, g: cg, b: cb } = parseColor(color);

    const draw = (time: number) => {
      timeRef.current = time;
      ctx.clearRect(0, 0, size, size);

      // Inner scattered dots (grid-like noise fill)
      for (const p of innerParticles) {
        const flicker = 0.5 + 0.5 * Math.sin(time * 0.001 + p.phase);
        const alpha = p.opacity * flicker * 0.5;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.fillRect(cx + p.x - p.size / 2, cy + p.y - p.size / 2, p.size, p.size);
      }

      // Ring particles
      const progressAngle = progress * Math.PI * 2;

      for (const p of particles) {
        const a = p.angle + time * p.speed;
        const normalizedAngle = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

        // Particles in the "active" arc are brighter
        const inActiveArc = normalizedAngle <= progressAngle;
        const edgeFade = inActiveArc ? 1 : 0.15;

        const wobble = Math.sin(time * 0.002 + p.phase) * p.drift;
        const r = baseR + p.rOffset + wobble * 4;

        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;

        const flicker = 0.6 + 0.4 * Math.sin(time * 0.003 + p.phase * 3);
        const alpha = p.opacity * flicker * edgeFade;

        // Glow for bright particles
        if (inActiveArc && p.opacity > 0.5 && p.size > 1.2) {
          const grad = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3);
          grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha * 0.4})`);
          grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(x - p.size * 3, y - p.size * 3, p.size * 6, p.size * 6);
        }

        ctx.fillStyle = inActiveArc
          ? `rgba(${cr},${cg},${cb},${alpha})`
          : `rgba(255,255,255,${alpha * 0.3})`;

        // Square dots for that digital/gritty look
        ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size, progress, color]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
};

export default ParticleRing;
