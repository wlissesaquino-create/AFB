import { useState, useEffect, useMemo, useRef } from 'react';
import { Users, Search, Trophy, Play, Timer, RotateCcw, ChevronRight, Anchor, LifeBuoy, FlaskConical, Sparkles } from 'lucide-react';
import type { Room, Player } from '@/lib/supabase';
import { useGameActions } from '@/lib/useGame';
import { ITEM_PRESETS } from '@/lib/utils';
import { Bubbles, triggerConfetti } from '@/components/Effects';
import { Aquarium } from '@/components/Aquarium';
import { QRCode } from '@/components/QRCode';

interface OrganizerViewProps {
  room: Room;
  players: Player[];
}

export function OrganizerView({ room, players }: OrganizerViewProps) {
  const actions = useGameActions(room, null);
  const [objectName, setObjectName] = useState(room.current_object_name);
  const [emoji, setEmoji] = useState(room.current_emoji);
  const [timerSeconds, setTimerSeconds] = useState(room.timer_seconds);
  const [search, setSearch] = useState('');

  // Sync local form when room changes round
  useEffect(() => {
    if (room.status === 'lobby') {
      setObjectName(room.current_object_name);
      setEmoji(room.current_emoji);
    }
  }, [room.round_number, room.status, room.current_object_name, room.current_emoji]);

  // Confetti on result
  const prevStatusRef = useRef(room.status);
  useEffect(() => {
    if (room.status === 'result' && prevStatusRef.current !== 'result') {
      triggerConfetti();
    }
    prevStatusRef.current = room.status;
  }, [room.status]);

  const sortedPlayers = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const filteredPlayers = useMemo(
    () => sortedPlayers.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [sortedPlayers, search]
  );

  const votedPlayers = players.filter((p) => p.last_vote !== null);
  const boiaCount = players.filter((p) => p.last_vote === 'BOIA').length;
  const afundaCount = players.filter((p) => p.last_vote === 'AFUNDA').length;
  const totalVotes = boiaCount + afundaCount;
  const boiaPct = totalVotes > 0 ? Math.round((boiaCount / totalVotes) * 100) : 50;
  const afundaPct = totalVotes > 0 ? 100 - boiaPct : 50;

  const joinUrl = `${window.location.origin}/join?code=${room.code}`;

  const handleOpenVoting = () => {
    actions.openVoting(objectName, emoji, timerSeconds);
  };

  // Auto-transition from countdown to voting
  useEffect(() => {
    if (room.status === 'countdown' && room.countdown_ends_at) {
      const endsAt = new Date(room.countdown_ends_at).getTime();
      const now = Date.now();
      const delay = endsAt - now;
      if (delay <= 0) {
        actions.transitionToVoting();
      } else {
        const t = setTimeout(() => actions.transitionToVoting(), delay);
        return () => clearTimeout(t);
      }
    }
  }, [room.status, room.countdown_ends_at, actions]);

  const statusPill = () => {
    switch (room.status) {
      case 'lobby':
        return { text: 'Aguardando Início', cls: 'bg-slate-500/20 text-slate-300 border-slate-500/40' };
      case 'countdown':
        return { text: '3, 2, 1... Contagem!', cls: 'bg-yellowNeon/20 text-yellowNeon border-yellowNeon/40 animate-pulse' };
      case 'voting':
        return { text: 'Votação Aberta nos Celulares!', cls: 'bg-cyanNeon/20 text-cyanNeon border-cyanNeon/40 animate-pulse' };
      case 'testing':
        return { text: 'Teste em Execução', cls: 'bg-yellowNeon/20 text-yellowNeon border-yellowNeon/40 animate-pulse' };
      case 'result':
        return { text: `Resultado: ${room.current_result}!`, cls: 'bg-emeraldNeon/20 text-emeraldNeon border-emeraldNeon/40' };
      default:
        return { text: 'Jogo Finalizado', cls: 'bg-slate-500/20 text-slate-300 border-slate-500/40' };
    }
  };
  const pill = statusPill();

  return (
    <div className="relative z-10 space-y-6">
      <Bubbles count={16} />
      <canvas id="confetti-canvas" className="fixed inset-0 pointer-events-none z-[999]" />

      {/* Header: Room code + QR + Player count */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-l-cyanNeon">
        <div className="flex items-center gap-4">
          <QRCode value={joinUrl} size={120} />
          <div>
            <div className="text-xs uppercase tracking-widest text-cyanNeon font-bold">Código da Sala</div>
            <div className="text-3xl sm:text-5xl font-black text-yellowNeon tracking-wider drop-shadow-[0_0_12px_rgba(255,214,0,0.5)]">
              {room.code}
            </div>
            <p className="text-xs text-slate-300 mt-1">Pais entram com este código no celular</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-ocean-800/90 px-6 py-3.5 rounded-2xl border border-cyanNeon/40 shadow-inner">
          <Users className="w-9 h-9 text-cyanNeon" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">{players.length}</span>
              <span className="text-sm text-slate-400">participantes</span>
            </div>
            <div className="text-xs text-emeraldNeon font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emeraldNeon animate-ping" />
              Lobby Conectado
            </div>
          </div>
        </div>
      </div>

      {/* Central panel: Round config + Aquarium */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Round config */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-card rounded-2xl p-5 border-t-2 border-t-yellowNeon space-y-4">
            <h2 className="text-lg font-bold text-yellowNeon flex items-center gap-2">
              <FlaskConical className="w-5 h-5" />
              Cadastrar Objeto da Rodada
              <span className="text-xs bg-yellowNeon/20 text-yellowNeon px-2.5 py-0.5 rounded-full border border-yellowNeon/40">
                Rodada {room.round_number}
              </span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Item:</label>
                <input
                  type="text"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                  disabled={room.status !== 'lobby'}
                  placeholder="Ex: Elefante de Brinquedo"
                  className="w-full bg-ocean-900/90 border border-cyanNeon/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyanNeon disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Emoji Exibido no Aquário:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    disabled={room.status !== 'lobby'}
                    placeholder="🐘"
                    className="w-16 text-center text-2xl bg-ocean-900/90 border border-cyanNeon/40 rounded-xl px-2 py-1 text-white font-medium focus:outline-none focus:border-cyanNeon disabled:opacity-50"
                  />
                  <div className="text-xs text-slate-400 flex-1 flex items-center">
                    Este emoji vai flutuar ou afundar no aquário!
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Tempo de Votação:</label>
                <div className="flex gap-2">
                  {[10, 15, 20].map((s) => (
                    <button
                      key={s}
                      onClick={() => setTimerSeconds(s)}
                      disabled={room.status !== 'lobby'}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all disabled:opacity-50 ${
                        timerSeconds === s
                          ? 'bg-cyanNeon text-ocean-900 border-cyanNeon'
                          : 'bg-white/10 text-slate-300 border-white/10 hover:bg-cyanNeon/20'
                      }`}
                    >
                      <Timer className="w-4 h-4 inline mr-1" />
                      {s}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-cyan-200 mb-1.5 uppercase tracking-wider">
                  Sugestões Rápidas:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ITEM_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setObjectName(preset.name);
                        setEmoji(preset.emoji);
                      }}
                      disabled={room.status !== 'lobby'}
                      className="text-xs bg-white/10 hover:bg-cyanNeon/30 px-2.5 py-1 rounded-lg border border-white/10 transition-all disabled:opacity-50"
                    >
                      {preset.emoji} {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Flow buttons */}
            <div className="pt-2 space-y-2">
              {room.status === 'lobby' && (
                <button
                  onClick={handleOpenVoting}
                  className="w-full py-3.5 bg-gradient-to-r from-cyanNeon to-blue-500 hover:from-cyan-400 hover:to-blue-600 text-ocean-900 font-extrabold rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 text-base"
                >
                  <Play className="w-5 h-5" />
                  ABRIR VOTAÇÃO NOS CELULARES
                </button>
              )}

              {room.status === 'voting' && (
                <button
                  onClick={actions.startTesting}
                  className="w-full py-3.5 bg-gradient-to-r from-yellowNeon to-amber-500 hover:from-yellow-300 hover:to-amber-600 text-ocean-900 font-extrabold rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 text-base"
                >
                  <FlaskConical className="w-5 h-5" />
                  INICIAR TESTE EM EXECUÇÃO
                </button>
              )}

              {room.status === 'testing' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => actions.revealResult('AFUNDA')}
                    className="py-3.5 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-extrabold rounded-xl border border-indigo-400/50 shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Anchor className="w-5 h-5" />
                    AFUNDOU!
                  </button>
                  <button
                    onClick={() => actions.revealResult('BOIA')}
                    className="py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold rounded-xl border border-emerald-400/50 shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <LifeBuoy className="w-5 h-5" />
                    BOIOU!
                  </button>
                </div>
              )}

              {room.status === 'result' && (
                <button
                  onClick={() => actions.nextRound('Maçã', '🍎')}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-cyanNeon text-ocean-900 font-extrabold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  PRÓXIMA RODADA
                </button>
              )}
            </div>
          </div>

          {/* Vote bar */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Palpites Recebidos</h3>
              <span className="text-xs bg-cyanNeon/20 text-cyanNeon px-2.5 py-0.5 rounded-full font-mono font-bold">
                {votedPlayers.length} / {players.length} Votaram
              </span>
            </div>
            <div className="h-6 w-full bg-ocean-900 rounded-full overflow-hidden p-1 flex border border-white/10">
              <div
                className="bg-gradient-to-r from-emerald-400 to-cyanNeon h-full rounded-l-full transition-all duration-500 flex items-center justify-center text-[10px] text-ocean-900 font-black"
                style={{ width: `${boiaPct}%` }}
              >
                {totalVotes > 0 && `BOIA ${boiaPct}%`}
              </div>
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-r-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-black"
                style={{ width: `${afundaPct}%` }}
              >
                {totalVotes > 0 && `AFUNDA ${afundaPct}%`}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Aquarium */}
        <div className="lg:col-span-7">
          <div className="glass-card rounded-2xl p-6 h-full flex flex-col justify-between items-center relative overflow-hidden border border-cyanNeon/40 min-h-[440px]">
            <div className="w-full text-center z-10">
              <span className="text-xs uppercase tracking-widest text-cyanNeon font-bold">Objeto em Experimento</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 drop-shadow-md">
                {room.current_object_name} {room.current_emoji}
              </h2>
              <div className={`inline-block mt-2 px-3 py-1 ${pill.cls} border rounded-full text-xs font-bold uppercase tracking-wider`}>
                {pill.text}
              </div>
            </div>

            <Aquarium room={room} />

            {room.status === 'result' && (
              <div className="w-full text-center py-2 px-4 rounded-xl bg-white/5 border border-white/10 z-10">
                <span className="text-sm font-bold text-cyanNeon flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Resultado: {room.current_result === 'BOIA' ? '🎈 Boiou!' : '⚓ Afundou!'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lobby grid */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-bold text-cyanNeon flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lobby de Participantes ({players.length} Conectados)
            </h3>
            <p className="text-xs text-slate-300">Grade otimizada para monitorar até 150+ pais ao vivo</p>
          </div>
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar participante..."
              className="w-full bg-ocean-900/80 border border-cyanNeon/30 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyanNeon"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1">
          {filteredPlayers.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-400">
              {players.length === 0
                ? 'Nenhum pai/família entrou na sala ainda. Compartilhe o código!'
                : 'Nenhum participante encontrado na busca.'}
            </div>
          ) : (
            filteredPlayers.map((p) => (
              <div
                key={p.id}
                className="bg-ocean-800/80 border border-white/10 rounded-xl p-2 flex items-center justify-between gap-1.5 hover:border-cyanNeon/40 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate" title={p.name}>{p.name}</div>
                  <div className="text-[10px] text-yellowNeon font-mono font-bold">{p.score} pts</div>
                </div>
                <div>
                  {p.last_vote === 'BOIA' ? (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">BOIA</span>
                  ) : p.last_vote === 'AFUNDA' ? (
                    <span className="text-[9px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">AFUNDA</span>
                  ) : (
                    <span className="text-[9px] text-slate-400 bg-slate-500/20 px-1.5 py-0.5 rounded">...</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Podium + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 glass-card rounded-2xl p-5 space-y-4">
          <h3 className="text-base font-bold text-yellowNeon flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Pódio dos Campeões (Top 3)
          </h3>
          <Podium players={sortedPlayers} />
        </div>

        <div className="lg:col-span-7 glass-card rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h3 className="text-base font-bold text-cyan-200">Classificação Geral</h3>
            <span className="text-xs text-slate-400">Pontos por acerto + velocidade</span>
          </div>
          <div className="overflow-y-auto max-h-56 pr-1">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase border-b border-white/10 sticky top-0 bg-ocean-900/90 backdrop-blur-sm">
                <tr>
                  <th className="py-2">Pos.</th>
                  <th className="py-2">Nome / Família</th>
                  <th className="py-2 text-center">Último Palpite</th>
                  <th className="py-2 text-right">Pontos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      Nenhum pai conectado na sala ainda.
                    </td>
                  </tr>
                ) : (
                  sortedPlayers.map((p, i) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-all">
                      <td className={`py-2 font-bold ${i === 0 ? 'text-yellowNeon' : 'text-slate-300'}`}>
                        #{i + 1}
                      </td>
                      <td className="py-2 font-medium text-white">{p.name}</td>
                      <td className="py-2 text-center">
                        {p.last_vote === 'BOIA' ? (
                          <span className="text-emerald-400 font-bold">BOIA</span>
                        ) : p.last_vote === 'AFUNDA' ? (
                          <span className="text-purple-400 font-bold">AFUNDA</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-cyanNeon">{p.score} pts</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reset button */}
      <div className="flex justify-center pb-4">
        <button
          onClick={() => {
            if (confirm('Deseja realmente reiniciar todo o jogo e placar?')) {
              actions.resetGame();
            }
          }}
          className="px-4 py-2 text-sm bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/40 text-rose-200 rounded-xl transition-all flex items-center gap-2 font-semibold"
        >
          <RotateCcw className="w-4 h-4" />
          Reiniciar Sala
        </button>
      </div>
    </div>
  );
}

function Podium({ players }: { players: Player[] }) {
  const [first, second, third] = players;

  const PodiumPlace = ({ player, place, height, emoji, color, border }: {
    player?: Player; place: number; height: string; emoji: string; color: string; border: string;
  }) => (
    <div className="flex flex-col items-center animate-slide-up">
      <div className="text-xs font-bold text-white truncate max-w-[90px]" title={player?.name || ''}>
        {player?.name || '-'}
      </div>
      <div className="text-[10px] text-cyanNeon font-mono font-bold">{player ? `${player.score}pt` : ''}</div>
      <div
        className={`w-full ${height} bg-gradient-to-t ${color} rounded-t-xl border-t-2 ${border} flex items-center justify-center font-black text-3xl ${emoji} shadow-lg`}
      >
        {place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉'}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-2 items-end pt-4 min-h-[160px]">
      <PodiumPlace player={second} place={2} height="h-20" emoji="text-slate-200" color="from-slate-400/40 to-slate-300/20" border="border-slate-300" />
      <PodiumPlace player={first} place={1} height="h-28" emoji="text-yellowNeon" color="from-yellow-500/40 to-yellow-300/20" border="border-yellowNeon" />
      <PodiumPlace player={third} place={3} height="h-16" emoji="text-amber-500" color="from-amber-700/40 to-amber-500/20" border="border-amber-600" />
    </div>
  );
}
