import { useState, useEffect } from 'react';
import { Waves, Monitor, Smartphone, Lock, ArrowRight } from 'lucide-react';
import { isMobile } from '@/lib/utils';

interface HomePageProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
}

export function HomePage({ onCreateRoom, onJoinRoom }: HomePageProps) {
  const [code, setCode] = useState('');
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile());
  }, []);

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="text-6xl animate-bounce inline-block">🌊</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-wide bg-gradient-to-r from-cyanNeon via-white to-yellowNeon bg-clip-text text-transparent uppercase">
            Afunda ou Boia?
          </h1>
          <p className="text-sm text-cyan-200">Game Show Interativo para Eventos</p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Organizer */}
          <button
            onClick={onCreateRoom}
            className="glass-card-glow rounded-2xl p-6 text-center space-y-3 hover:scale-[1.02] transition-all duration-300 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-cyanNeon/20 border border-cyanNeon/40 flex items-center justify-center mx-auto group-hover:bg-cyanNeon/30 transition-all">
              <Monitor className="w-7 h-7 text-cyanNeon" />
            </div>
            <div className="text-lg font-bold text-white">Organizador</div>
            <div className="text-xs text-slate-300">Criar sala e projetar na TV</div>
            <div className="flex items-center justify-center gap-1 text-xs text-cyanNeon font-semibold">
              <Lock className="w-3 h-3" />
              Protegido por senha
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Player */}
          <button
            onClick={() => document.getElementById('join-input')?.focus()}
            className="glass-card rounded-2xl p-6 text-center space-y-3 hover:scale-[1.02] transition-all duration-300 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-yellowNeon/20 border border-yellowNeon/40 flex items-center justify-center mx-auto group-hover:bg-yellowNeon/30 transition-all">
              <Smartphone className="w-7 h-7 text-yellowNeon" />
            </div>
            <div className="text-lg font-bold text-white">Jogador</div>
            <div className="text-xs text-slate-300">Entrar com o código da sala</div>
            <div className="flex items-center justify-center gap-1 text-xs text-yellowNeon font-semibold">
              Acesse pelo celular
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Join with code */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <div className="text-center">
            <h2 className="text-sm font-bold text-cyanNeon uppercase tracking-wider">Entrar com código</h2>
          </div>
          <div className="flex gap-2">
            <input
              id="join-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              onKeyDown={(e) => e.key === 'Enter' && code.length >= 3 && onJoinRoom(code)}
              placeholder="Ex: 8421"
              inputMode="numeric"
              className="flex-1 bg-ocean-900 border border-cyanNeon/50 rounded-xl px-4 py-3 text-yellowNeon font-black tracking-widest text-center text-lg focus:outline-none focus:border-cyanNeon uppercase"
            />
            <button
              onClick={() => code.length >= 3 && onJoinRoom(code)}
              disabled={code.length < 3}
              className="px-6 py-3 bg-gradient-to-r from-cyanNeon to-blue-500 text-ocean-900 font-black rounded-xl transition-all active:scale-95 disabled:opacity-40"
            >
              Entrar
            </button>
          </div>
        </div>

        {mobile && (
          <div className="text-center text-xs text-slate-400">
            Dica: Você está no celular. Peça para o organizador criar a sala no computador/TV.
          </div>
        )}

        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1">
          <Waves className="w-3 h-3" />
          Feito para diversão em família
        </div>
      </div>
    </div>
  );
}
