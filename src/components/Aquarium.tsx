import { useEffect, useState } from 'react';
import type { Room } from '@/lib/supabase';

interface AquariumProps {
  room: Room | null;
}

export function Aquarium({ room }: AquariumProps) {
  const [bubbles, setBubbles] = useState<{ left: number; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    const arr = Array.from({ length: 8 }, () => ({
      left: Math.random() * 100,
      size: Math.random() * 12 + 4,
      delay: Math.random() * 3,
      duration: Math.random() * 4 + 3,
    }));
    setBubbles(arr);
  }, []);

  const emoji = room?.current_emoji || '🐘';
  const status = room?.status || 'lobby';
  const result = room?.current_result;

  let objectAnim = 'animate-float-bob';
  if (status === 'result') {
    objectAnim = result === 'AFUNDA' ? 'animate-sink-down' : 'animate-float-surface';
  } else if (status === 'testing') {
    objectAnim = 'animate-wiggle';
  }

  return (
    <div className="w-full max-w-sm h-64 my-4 rounded-2xl tank-glass relative overflow-hidden flex flex-col justify-end items-center mx-auto">
      {/* Water */}
      <div className="w-full h-4/5 bg-gradient-to-b from-cyan-400/35 via-blue-600/50 to-ocean-900/85 relative transition-all duration-700">
        {/* Surface line */}
        <div className="w-full h-3 bg-cyanNeon/50 blur-[1px] absolute top-0 left-0 animate-pulse" />

        {/* Object */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 top-6 text-7xl transition-all duration-1000 z-20 ${objectAnim} drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]`}
        >
          {emoji}
        </div>

        {/* Internal bubbles */}
        {bubbles.map((b, i) => (
          <div
            key={i}
            className="absolute bottom-2 bg-white/40 rounded-full"
            style={{
              left: `${b.left}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animation: `rise ${b.duration}s infinite ease-in`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Suspense overlay */}
      {status === 'testing' && (
        <div className="absolute inset-0 bg-ocean-900/70 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30">
          <div className="text-5xl animate-spin">🌀</div>
          <div className="text-xl font-extrabold text-yellowNeon tracking-wider animate-pulse">
            TESTE EM EXECUÇÃO...
          </div>
          <p className="text-xs text-cyan-200">O item está caindo no tanque de água!</p>
        </div>
      )}
    </div>
  );
}
