import { useState, useEffect } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';

interface AdminGateProps {
  onUnlock: () => void;
  onBack: () => void;
}

export function AdminGate({ onUnlock, onBack }: AdminGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const ADMIN_PASSWORD = 'afunda2024';

  const handleSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_unlocked', 'true');
      onUnlock();
    } else {
      setError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('admin_unlocked') === 'true') {
      onUnlock();
    }
  }, [onUnlock]);

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="glass-card-glow rounded-3xl p-8 max-w-sm w-full space-y-6 text-center">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-cyanNeon/20 border border-cyanNeon/40 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-cyanNeon" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Acesso do Organizador</h2>
          <p className="text-xs text-slate-300">Digite a senha para acessar o painel de controle</p>
        </div>

        <div className="space-y-3 text-left">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Senha do organizador"
              className="w-full bg-ocean-900 border border-cyanNeon/50 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-cyanNeon text-center"
              autoFocus
            />
            {error && (
              <div className="text-xs text-rose-400 mt-2 text-center">{error}</div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 bg-gradient-to-r from-cyanNeon to-blue-500 hover:from-cyan-400 hover:to-blue-600 text-ocean-900 font-black rounded-2xl transition-all active:scale-95"
          >
            ENTRAR NO PAINEL
          </button>
        </div>

        <div className="text-xs text-slate-500 border-t border-white/10 pt-3">
          Senha padrão: <span className="font-mono text-cyanNeon/60">afunda2024</span>
        </div>
      </div>
    </div>
  );
}
