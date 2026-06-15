import { useEffect, useRef } from 'react';

const ParticleCanvas = ({
  maxParticles = 120,
  particleSizeMin = 2,
  particleSizeMax = 5,
  speedScale = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const tickRef = useRef(0);
  const dimensionsRef = useRef({ width: 0, height: 0, cx: 0, cy: 0 });
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      dimensionsRef.current.width = w;
      dimensionsRef.current.height = h;
      // Set initial center if cx/cy are not yet set
      if (dimensionsRef.current.cx === 0) {
        dimensionsRef.current.cx = w / 2;
        dimensionsRef.current.cy = h / 2;
      }
    };

    handleResize();

    function getShaderColor(hue: number, time: number) {
      hue = hue - Math.floor(hue);
      if (hue < 0) hue += 1;

      const frac = 1 / 6;
      let r = 0, g = 0, b = 0;

      if (hue < frac) {
        r = 1;
        g = hue / frac;
        b = 0;
      } else if (hue < frac * 2) {
        r = 1 - (hue - frac) / frac;
        g = 1;
        b = 0;
      } else if (hue < frac * 3) {
        r = 0;
        g = 1;
        b = (hue - frac * 2) / frac;
      } else if (hue < frac * 4) {
        r = 0;
        g = 1 - (hue - frac * 3) / frac;
        b = 1;
      } else if (hue < frac * 5) {
        r = (hue - frac * 4) / frac;
        g = 0;
        b = 1;
      } else {
        r = 1;
        g = 0;
        b = 1 - (hue - frac * 5) / frac;
      }

      // Multiply by time (v_color.y) to replicate shader brightness fade
      r = Math.floor(r * time * 255);
      g = Math.floor(g * time * 255);
      b = Math.floor(b * time * 255);

      return `rgb(${r}, ${g}, ${b})`;
    }

    class Particle {
      size!: number;
      x!: number;
      y!: number;
      vx!: number;
      vy!: number;
      time!: number;
      hue!: number;

      constructor() {
        this.reset();
      }

      reset() {
        this.size = particleSizeMin + (particleSizeMax - particleSizeMin) * Math.random();
        this.x = dimensionsRef.current.cx;
        this.y = dimensionsRef.current.cy;
        this.vx = (Math.random() - 0.5) * 2 * speedScale;
        this.vy = -2 - speedScale * Math.random();
        this.time = 1;
        this.hue = this.vy / 10;
      }

      step() {
        this.x += (this.vx *= 0.995);
        this.y += (this.vy += 0.05);
        this.time *= 0.99;

        // Reset if goes off-screen or fades out completely
        if (this.y - this.size > dimensionsRef.current.height || this.time < 0.01) {
          this.reset();
        }
      }

      draw(ctx: CanvasRenderingContext2D, tick: number) {
        const currentHue = (this.hue + tick / 100);
        const colorStr = getShaderColor(currentHue, this.time);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.time, 0, Math.PI * 2);
        ctx.fillStyle = colorStr;
        ctx.fill();
      }
    }

    // Initialize particles array
    particlesRef.current = [];
    for (let i = 0; i < maxParticles; i++) {
      particlesRef.current.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tickRef.current++;

      particlesRef.current.forEach(p => {
        p.step();
        p.draw(ctx, tickRef.current);
      });

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      dimensionsRef.current.cx = e.clientX;
      dimensionsRef.current.cy = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [maxParticles, particleSizeMin, particleSizeMax, speedScale]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
    />
  );
};

export { ParticleCanvas };
