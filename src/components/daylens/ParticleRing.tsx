import React, { useRef, useEffect } from 'react';

interface ParticleRingProps {
  size: number;
  progress: number; // 0-1
  color: string; // hex
  className?: string;
}

const ParticleRing: React.FC<ParticleRingProps> = ({ size, progress, color, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

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

    // Ring particles — more of them, tighter spread
    const particleCount = 500;
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
      particles.push({
        angle: Math.random() * Math.PI * 2,
        rOffset: (Math.random() - 0.5) * size * 0.18,
        size: 0.3 + Math.random() * 1.4,
        opacity: 0.05 + Math.random() * 0.65,
        speed: 0.0002 + Math.random() * 0.001,
        drift: (Math.random() - 0.5) * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Dense inner noise field
    const innerCount = 350;
    const innerParticles: {
      x: number; y: number; size: number; opacity: number; phase: number;
    }[] = [];

    for (let i = 0; i < innerCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * baseR * 0.9;
      innerParticles.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        size: 0.3 + Math.random() * 0.8,
        opacity: 0.02 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Static noise grain scattered everywhere
    const noiseCount = 600;
    const noiseParticles: { x: number; y: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < noiseCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * size * 0.48;
      noiseParticles.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        size: 0.2 + Math.random() * 0.6,
        opacity: 0.02 + Math.random() * 0.06,
      });
    }

    const parseColor = (c: string) => {
      if (c.startsWith('#')) {
        return {
          r: parseInt(c.slice(1, 3), 16),
          g: parseInt(c.slice(3, 5), 16),
          b: parseInt(c.slice(5, 7), 16),
        };
      }
      return { r: 255, g: 255, b: 255 };
    };

    const { r: cr, g: cg, b: cb } = parseColor(color);

    const draw = (time: number) => {
      ctx.clearRect(0, 0, size, size);

      // Static noise grain
      for (const n of noiseParticles) {
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${n.opacity})`;
        ctx.fillRect(n.x, n.y, n.size, n.size);
      }

      // Inner scattered dots
      for (const p of innerParticles) {
        const flicker = 0.4 + 0.6 * Math.sin(time * 0.0008 + p.phase);
        const alpha = p.opacity * flicker;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.fillRect(cx + p.x - p.size / 2, cy + p.y - p.size / 2, p.size, p.size);
      }

      // Ring particles — no glow, just raw dots
      const progressAngle = progress * Math.PI * 2;

      for (const p of particles) {
        const a = p.angle + time * p.speed;
        const normalizedAngle = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const inActiveArc = normalizedAngle <= progressAngle;
        const edgeFade = inActiveArc ? 1 : 0.12;

        const wobble = Math.sin(time * 0.002 + p.phase) * p.drift;
        const r = baseR + p.rOffset + wobble * 4;

        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;

        const flicker = 0.5 + 0.5 * Math.sin(time * 0.003 + p.phase * 3);
        const alpha = p.opacity * flicker * edgeFade;

        ctx.fillStyle = inActiveArc
          ? `rgba(${cr},${cg},${cb},${alpha})`
          : `rgba(${cr},${cg},${cb},${alpha * 0.25})`;

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
