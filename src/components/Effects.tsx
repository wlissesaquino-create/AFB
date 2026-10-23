import { useEffect, useRef } from 'react';

export function Bubbles({ count = 16 }: { count?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      const size = Math.random() * 38 + 10;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}%`;
      bubble.style.animationDuration = `${Math.random() * 6 + 6}s`;
      bubble.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(bubble);
    }
  }, [count]);

  return <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden />;
}

export function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: {
    x: number; y: number; vx: number; vy: number;
    size: number; color: string; rotation: number;
    rotationSpeed: number; opacity: number;
  }[] = [];

  const colors = ['#00F0FF', '#FFD600', '#FF6D00', '#00FF9D', '#FFFFFF', '#FF007A'];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.8) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    });
  }

  function animate() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    for (const p of particles) {
      if (p.opacity > 0) {
        active = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.opacity -= 0.015;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    }

    if (active) requestAnimationFrame(animate);
  }

  animate();
}
