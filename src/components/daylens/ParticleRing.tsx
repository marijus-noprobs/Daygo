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
    const ringR = size * 0.34; // center of the ring band
    const ringThickness = size * 0.08; // thick band

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

    // Generate massive particle cloud
    const count = 4000;
    const particles: {
      angle: number;
      dist: number; // distance from ring center line
      size: number;
      baseOpacity: number;
      speed: number;
      phase: number;
      layer: number; // 0=core, 1=mid, 2=outer scatter
    }[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      
      // Gaussian-like distribution around the ring center
      const u1 = Math.random();
      const u2 = Math.random();
      const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const dist = gaussian * ringThickness * 0.6;
      
      const absDist = Math.abs(dist);
      const layer = absDist < ringThickness * 0.3 ? 0 : absDist < ringThickness * 0.8 ? 1 : 2;
      
      particles.push({
        angle,
        dist,
        size: layer === 0 ? 0.3 + Math.random() * 1.0 : 
              layer === 1 ? 0.2 + Math.random() * 0.8 :
              0.2 + Math.random() * 0.5,
        baseOpacity: layer === 0 ? 0.4 + Math.random() * 0.6 :
                     layer === 1 ? 0.15 + Math.random() * 0.4 :
                     0.03 + Math.random() * 0.15,
        speed: (0.00005 + Math.random() * 0.0002) * (layer === 2 ? 0.5 : 1),
        phase: Math.random() * Math.PI * 2,
        layer,
      });
    }

    // Outer scattered halo particles — close scatter
    const haloCount = 1200;
    const haloParticles: {
      angle: number;
      dist: number;
      size: number;
      opacity: number;
      speed: number;
      phase: number;
    }[] = [];

    for (let i = 0; i < haloCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = ringThickness + Math.random() * size * 0.16;
      const sign = Math.random() > 0.5 ? 1 : -1;
      
      haloParticles.push({
        angle,
        dist: dist * sign,
        size: 0.2 + Math.random() * 0.5,
        opacity: 0.02 + Math.random() * 0.1,
        speed: 0.00003 + Math.random() * 0.00012,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Far-flung stray particles that escape the ring
    const strayCount = 500;
    const strayParticles: {
      angle: number;
      dist: number;
      size: number;
      opacity: number;
      speed: number;
      phase: number;
      driftR: number;
    }[] = [];

    for (let i = 0; i < strayCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = ringThickness * 1.5 + Math.random() * size * 0.25;
      const sign = Math.random() > 0.4 ? 1 : -1; // bias outward
      
      strayParticles.push({
        angle,
        dist: dist * sign,
        size: 0.15 + Math.random() * 0.4,
        opacity: 0.01 + Math.random() * 0.06,
        speed: 0.00002 + Math.random() * 0.00008,
        phase: Math.random() * Math.PI * 2,
        driftR: (Math.random() - 0.5) * 2,
      });
    }

    // Inner sparse dust
    const dustCount = 300;
    const dustParticles: {
      x: number; y: number; size: number; opacity: number; phase: number;
    }[] = [];

    for (let i = 0; i < dustCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * ringR * 0.7;
      dustParticles.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        size: 0.2 + Math.random() * 0.6,
        opacity: 0.02 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, size, size);

      // Inner dust
      for (const d of dustParticles) {
        const flicker = 0.5 + 0.5 * Math.sin(time * 0.001 + d.phase);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${d.opacity * flicker})`;
        ctx.fillRect(cx + d.x, cy + d.y, d.size, d.size);
      }

      // Outer halo
      for (const h of haloParticles) {
        const a = h.angle + time * h.speed;
        const r = ringR + h.dist;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const flicker = 0.4 + 0.6 * Math.sin(time * 0.0008 + h.phase);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${h.opacity * flicker})`;
        ctx.fillRect(x, y, h.size, h.size);
      }

      // Far stray particles
      for (const s of strayParticles) {
        const a = s.angle + time * s.speed;
        const drift = Math.sin(time * 0.0005 + s.phase) * s.driftR;
        const r = ringR + s.dist + drift;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const flicker = 0.3 + 0.7 * Math.sin(time * 0.0006 + s.phase);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${s.opacity * flicker})`;
        ctx.fillRect(x, y, s.size, s.size);
      }

      const progressAngle = progress * Math.PI * 2;

      for (const p of particles) {
        const a = p.angle + time * p.speed;
        const r = ringR + p.dist;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;

        // Check if in active progress arc
        const normAngle = ((a - (-Math.PI / 2)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const inActive = normAngle <= progressAngle;

        const flicker = 0.6 + 0.4 * Math.sin(time * 0.002 + p.phase);
        const alpha = p.baseOpacity * flicker * (inActive ? 1 : 0.35);

        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
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
