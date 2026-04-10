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
    const baseR = size * 0.36;

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

    // Ring layers with different frequencies and amplitudes
    const rings = [
      { r: baseR * 0.7, amp: 2.5, freq: 3, speed: 0.0006, opacity: 0.06, width: 0.5 },
      { r: baseR * 0.78, amp: 3, freq: 4, speed: 0.0008, opacity: 0.08, width: 0.5 },
      { r: baseR * 0.85, amp: 2, freq: 5, speed: 0.001, opacity: 0.1, width: 0.6 },
      { r: baseR * 0.92, amp: 4, freq: 3, speed: 0.0007, opacity: 0.15, width: 0.8 },
      { r: baseR, amp: 5, freq: 4, speed: 0.0009, opacity: 0.25, width: 1 },
      { r: baseR * 1.05, amp: 6, freq: 5, speed: 0.0011, opacity: 0.5, width: 1.2 },
      { r: baseR * 1.1, amp: 4, freq: 6, speed: 0.0013, opacity: 0.35, width: 1 },
      { r: baseR * 1.16, amp: 7, freq: 4, speed: 0.001, opacity: 0.6, width: 1.5 },
      { r: baseR * 1.22, amp: 5, freq: 5, speed: 0.0012, opacity: 0.3, width: 1 },
      { r: baseR * 1.28, amp: 3, freq: 3, speed: 0.0008, opacity: 0.15, width: 0.7 },
      { r: baseR * 1.33, amp: 2, freq: 4, speed: 0.0006, opacity: 0.08, width: 0.5 },
    ];

    const draw = (time: number) => {
      ctx.clearRect(0, 0, size, size);

      const progressAngle = progress * Math.PI * 2;

      for (const ring of rings) {
        const points = 200;
        
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          
          // Organic undulation using multiple sine waves
          const wave1 = Math.sin(angle * ring.freq + time * ring.speed) * ring.amp;
          const wave2 = Math.sin(angle * (ring.freq + 2) - time * ring.speed * 0.7) * ring.amp * 0.5;
          const wave3 = Math.sin(angle * (ring.freq * 2) + time * ring.speed * 1.3) * ring.amp * 0.3;
          
          const r = ring.r + wave1 + wave2 + wave3;
          
          const x = cx + Math.cos(angle - Math.PI / 2) * r;
          const y = cy + Math.sin(angle - Math.PI / 2) * r;
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Active arc portion is brighter
        const inActiveZone = ring.r >= baseR * 0.98 && ring.r <= baseR * 1.2;
        const alphaMultiplier = inActiveZone ? 1 : 0.6;
        
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${ring.opacity * alphaMultiplier})`;
        ctx.lineWidth = ring.width;
        ctx.stroke();
      }

      // Draw the main bright progress arc on top
      const mainR = baseR * 1.08;
      const arcPoints = 200;
      
      ctx.beginPath();
      for (let i = 0; i <= arcPoints; i++) {
        const t = i / arcPoints;
        const angle = t * progressAngle;
        
        const wave1 = Math.sin(angle * 4 + time * 0.001) * 5;
        const wave2 = Math.sin(angle * 6 - time * 0.0008) * 3;
        const wave3 = Math.sin(angle * 9 + time * 0.0015) * 1.5;
        
        const r = mainR + wave1 + wave2 + wave3;
        
        const x = cx + Math.cos(angle - Math.PI / 2) * r;
        const y = cy + Math.sin(angle - Math.PI / 2) * r;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.85)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Secondary bright ring slightly inside
      ctx.beginPath();
      for (let i = 0; i <= arcPoints; i++) {
        const t = i / arcPoints;
        const angle = t * progressAngle;
        
        const wave1 = Math.sin(angle * 5 - time * 0.0009) * 4;
        const wave2 = Math.sin(angle * 3 + time * 0.0012) * 2.5;
        
        const r = mainR * 0.94 + wave1 + wave2;
        
        const x = cx + Math.cos(angle - Math.PI / 2) * r;
        const y = cy + Math.sin(angle - Math.PI / 2) * r;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.45)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

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
