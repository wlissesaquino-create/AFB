import { useState, useEffect, useRef } from 'react';
import { LifeBuoy, Anchor, Zap, CheckCircle2, XCircle, Clock, Trophy, LogOut } from 'lucide-react';
import type { Room, Player } from '@/lib/supabase';
import { useGameActions } from '@/lib/useGame';

interface PlayerViewProps {
  room: Room;
  player: Player | null;
  players: Player[];
  onJoin: (name: string) => Promise<Player | null>;
  onLeave: () => void;
}

export function PlayerView({ room, player, players, onJoin, onLeave }: PlayerViewProps) {
  const actions = useGameActions(room, player?.id || null);
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [voteFeedback, setVoteFeedback] = useState<{ vote: string; reactionMs: number } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const voteStartRef = useRef<number | null>(null);
  const votedRef = useRef(false);

  // Countdown effect
  useEffect(() => {
    if (room.status === 'countdown' && room.countdown_ends_at) {
      const endsAt = new Date(room.countdown_ends_at).getTime();
      const tick = () => {
        const remaining = Math.ceil((endsAt - Date.now()) / 1000);
        if (remaining > 0) {
          setCountdown(remaining);
          setTimeout(tick, 200);
        } else {
          setCountdown(null);
          voteStartRef.current = Date.now();
          votedRef.current = false;
        }
      };
      tick();
    } else {
      setCountdown(null);
    }
  }, [room.status, room.countdown_ends_at]);

  // Reset vote feedback when new round starts
  useEffect(() => {
    if (room.status === 'lobby' || room.status === 'countdown') {
      setVoteFeedback(null);
      votedRef.current = false;
    }
  }, [room.status, room.round_number]);

  const handleJoin = async () => {
    if (!name.trim()) {
      setJoinError('Digite seu nome ou nome da família.');
      return;
    }
    setJoining(true);
    setJoinError('');
    const result = await onJoin(name.trim());
    setJoining(false);
    if (!result) {
      setJoinError('Erro ao entrar na sala. Tente novamente.');
    }
  };

  const handleVote = async (vote: 'BOIA' | 'AFUNDA') => {
    if (votedRef.current || !player) return;
    if (room.status !== 'voting') return;

    votedRef.current = true;
    const reactionMs = voteStartRef.current ? Date.now() - voteStartRef.current : room.timer_seconds * 1000;

    setVoteFeedback({ vote, reactionMs });
    await actions.submitVote(vote, reactionMs);
  };

  // Join screen
  if (!player) {
    return (
      <div className="relative z-10 max-w-md mx-auto pt-8 px-4">
        <div className="glass-card-glow rounded-3xl p-6 space-y-6 text-center shadow-2xl">
          <div className="space-y-2">
            <div className="text-5xl animate-bounce">🎈⚓</div>
            <h2 className="text-2xl font-extrabold text-white">Entrar no Game Show</h2>
            <p className="text-xs text-cyan-200">Digite seu nome e o código que aparece na tela do evento</p>
          </div>

          <div className="space-y-3 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Código da Sala:</label>
              <input
                type="text"
                value={room.code}
                readOnly
                className="w-full bg-ocean-900 border border-cyanNeon/50 rounded-xl px-4 py-3 text-yellowNeon font-black tracking-widest text-center text-lg focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Seu Nome / Nome da Família:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="Ex: Família Silva / Mãe do Lucas"
                className="w-full bg-ocean-900 border border-cyanNeon/50 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-cyanNeon"
                autoFocus
              />
            </div>
            {joinError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2 border border-rose-500/30">
                {joinError}
              </div>
            )}
          </div>

          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-4 bg-gradient-to-r from-yellowNeon to-amber-500 hover:from-yellow-300 hover:to-amber-600 text-ocean-900 font-black rounded-2xl shadow-xl text-lg tracking-wide transition-all active:scale-95 disabled:opacity-50"
          >
            {joining ? 'ENTRANDO...' : 'ENTRAR NO JOGO'}
          </button>
        </div>
      </div>
    );
  }

  // Game screen
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const myRank = sortedPlayers.findIndex((p) => p.id === player.id) + 1;
  const rankEmoji = myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '';

  return (
    <div className="relative z-10 max-w-md mx-auto px-4 pt-4 pb-8 space-y-4">
      {/* Player header */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-b-2 border-b-cyanNeon">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-slate-400">Participante</div>
          <div className="text-base font-extrabold text-cyanNeon truncate">{player.name}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Pontuação</div>
          <div className="text-xl font-black text-yellowNeon font-mono">{player.score} pts</div>
        </div>
      </div>

      {/* Main voting card */}
      <div className="glass-card-glow rounded-3xl p-6 text-center space-y-5 relative overflow-hidden">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyanNeon/20 text-cyanNeon border border-cyanNeon/30">
            Rodada {room.round_number}
          </span>
          <h3 className="text-xs text-slate-300 uppercase tracking-wider mt-2">Qual seu palpite para:</h3>
          <div className="text-3xl font-black text-white drop-shadow flex items-center justify-center gap-2">
            {room.current_object_name} {room.current_emoji}
          </div>
        </div>

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="py-8">
            <div className="text-xs uppercase font-bold tracking-widest text-yellowNeon mb-2 animate-pulse">
              Prepare-se...
            </div>
            <div
              key={countdown}
              className="text-8xl font-black text-white animate-count-pop drop-shadow-[0_0_20px_rgba(0,240,255,0.6)]"
            >
              {countdown}
            </div>
            <div className="text-sm text-slate-300 mt-2">Botões bloqueados!</div>
          </div>
        )}

        {/* Timer + vote buttons during voting */}
        {room.status === 'voting' && countdown === null && !voteFeedback && (
          <>
            <TimerBar room={room} />
            <div className="grid grid-cols-1 gap-4 pt-2">
              <button
                onClick={() => handleVote('BOIA')}
                className="py-5 px-4 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-ocean-900 font-black text-2xl rounded-2xl shadow-xl border-2 border-emerald-300/50 transition-all transform active:scale-95 flex items-center justify-center gap-3"
              >
                <LifeBuoy className="w-8 h-8" />
                BOIA!
              </button>
              <button
                onClick={() => handleVote('AFUNDA')}
                className="py-5 px-4 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-black text-2xl rounded-2xl shadow-xl border-2 border-purple-400/50 transition-all transform active:scale-95 flex items-center justify-center gap-3"
              >
                <Anchor className="w-8 h-8" />
                AFUNDA!
              </button>
            </div>
          </>
        )}

        {/* Vote feedback */}
        {voteFeedback && room.status !== 'result' && (
          <div className="py-4 px-3 bg-ocean-900/90 rounded-2xl border border-cyanNeon/40 space-y-2 animate-pop-in">
            <div className="text-sm font-bold text-cyanNeon flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Palpite Registrado!
            </div>
            <div className="text-xs text-slate-300">
              Você palpitou{' '}
              <span className="font-bold text-yellowNeon">{voteFeedback.vote}</span>. Aguarde o teste no projetor!
            </div>
            <div className="text-xs text-cyan-200 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3" />
              Tempo de reação: {(voteFeedback.reactionMs / 1000).toFixed(1)}s
            </div>
          </div>
        )}

        {/* Testing state */}
        {room.status === 'testing' && !voteFeedback && (
          <div className="py-8 px-3 bg-ocean-900/90 rounded-2xl border border-yellowNeon/40 space-y-2">
            <div className="text-4xl animate-spin">🌀</div>
            <div className="text-lg font-extrabold text-yellowNeon">TESTE EM EXECUÇÃO!</div>
            <div className="text-xs text-cyan-200">Olhe para a tela do evento para ver o aquário!</div>
          </div>
        )}

        {/* Testing state with vote already cast */}
        {room.status === 'testing' && voteFeedback && (
          <div className="py-4 px-3 bg-ocean-900/90 rounded-2xl border border-yellowNeon/40 space-y-2">
            <div className="text-sm font-bold text-yellowNeon">Teste em Execução!</div>
            <div className="text-xs text-cyan-200">Aguarde o resultado...</div>
          </div>
        )}

        {/* Result state */}
        {room.status === 'result' && (
          <div
            className={`py-5 px-4 rounded-2xl border text-center space-y-2 animate-pop-in ${
              player.last_correct
                ? 'bg-emerald-500/20 border-emerald-400'
                : 'bg-slate-600/20 border-slate-500'
            }`}
          >
            <div className="text-4xl">{player.last_correct ? '🎉' : '😅'}</div>
            <div className={`text-xl font-extrabold ${player.last_correct ? 'text-emerald-300' : 'text-slate-300'}`}>
              {player.last_correct ? 'VOCÊ ACERTOU!' : 'NÃO FOI DESSA VEZ!'}
            </div>
            <div className="text-sm font-bold text-yellowNeon">
              {player.last_correct ? `+${player.last_points} PONTOS!` : '+0 PONTOS'}
            </div>
            {player.last_correct && player.last_reaction_ms != null && (
              <div className="text-xs text-cyan-200 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />
                Tempo: {(player.last_reaction_ms / 1000).toFixed(1)}s
              </div>
            )}
          </div>
        )}

        {/* Lobby / waiting state */}
        {room.status === 'lobby' && !voteFeedback && (
          <div className="py-4 px-3 bg-ocean-900/90 rounded-2xl border border-cyanNeon/40 space-y-2">
            <div className="text-sm font-bold text-cyanNeon">Aguardando o Organizador...</div>
            <div className="text-xs text-slate-300">A próxima rodada começará em breve!</div>
          </div>
        )}

        {/* Vote was cast and we're back in lobby (between rounds) */}
        {voteFeedback && room.status === 'lobby' && (
          <div className="py-4 px-3 bg-ocean-900/90 rounded-2xl border border-cyanNeon/40 space-y-2">
            <div className="text-sm font-bold text-cyanNeon">Aguardando o Organizador...</div>
            <div className="text-xs text-slate-300">A próxima rodada começará em breve!</div>
          </div>
        )}
      </div>

      {/* Rank badge */}
      <div className="glass-card rounded-2xl p-4 text-center flex items-center justify-between">
        <span className="text-xs text-slate-300">Sua Posição no Ranking:</span>
        <span className="text-sm font-extrabold text-cyanNeon">
          #{myRank}º Lugar {rankEmoji}
        </span>
      </div>

      {/* Leave button */}
      <button
        onClick={onLeave}
        className="w-full py-2 text-xs text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sair da Sala
      </button>
    </div>
  );
}

function TimerBar({ room }: { room: Room }) {
  const [remaining, setRemaining] = useState(room.timer_seconds);

  useEffect(() => {
    if (!room.voting_started_at) return;
    const start = new Date(room.voting_started_at).getTime();
    const total = room.timer_seconds * 1000;

    const tick = () => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, (total - elapsed) / 1000);
      setRemaining(left);
      if (left > 0) requestAnimationFrame(tick);
    };
    tick();
  }, [room.voting_started_at, room.timer_seconds]);

  const pct = (remaining / room.timer_seconds) * 100;
  const color = pct > 50 ? 'from-emerald-400 to-cyanNeon' : pct > 25 ? 'from-yellowNeon to-orangeNeon' : 'from-rose-500 to-pinkNeon';

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-slate-300">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Tempo restante
        </span>
        <span className="font-mono font-bold text-cyanNeon">{remaining.toFixed(1)}s</span>
      </div>
      <div className="h-3 w-full bg-ocean-900 rounded-full overflow-hidden border border-white/10">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-100`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
