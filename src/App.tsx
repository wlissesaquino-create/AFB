import { useState, useEffect, useCallback } from 'react';
import { Bubbles } from '@/components/Effects';
import { HomePage } from '@/components/HomePage';
import { AdminGate } from '@/components/AdminGate';
import { OrganizerView } from '@/components/OrganizerView';
import { PlayerView } from '@/components/PlayerView';
import { useRoom, useGameActions } from '@/lib/useGame';
import { generateRoomCode, isMobile } from '@/lib/utils';
import { supabase, type Player } from '@/lib/supabase';

type Route =
  | { name: 'home' }
  | { name: 'admin-gate' }
  | { name: 'organizer'; roomCode: string }
  | { name: 'player'; roomCode: string };

function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  const gameState = useRoom(roomCode);
  const actions = useGameActions(gameState.room, playerId);

  // Parse URL on load (handles QR code deep links like /join?code=8421)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const path = window.location.pathname;

    if (path === '/admin' || path === '/organizer') {
      setRoute({ name: 'admin-gate' });
    } else if (code) {
      setRoomCode(code);
      setRoute({ name: 'player', roomCode: code });
    } else if (path === '/join') {
      setRoute({ name: 'home' });
    } else {
      // On mobile, default to player home
      if (isMobile()) {
        setRoute({ name: 'home' });
      } else {
        setRoute({ name: 'home' });
      }
    }
  }, []);

  // Load player ID from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('afunda_player_id');
    if (stored) setPlayerId(stored);
  }, []);

 const handleCreateRoom = useCallback(async (customCode?: string) => {
    // 1. Pede para o organizador digitar o nome da sala
    const inputCode = customCode || window.prompt("Digite o código da sala que deseja criar (ex: SALA123):");
    
    // Se o usuário cancelar ou deixar em branco, não faz nada
    if (!inputCode) return; 

    // Remove espaços e deixa tudo em maiúsculo
    const code = inputCode.trim().toUpperCase();
    
    // 2. Tenta criar a sala no banco
    const room = await actions.createRoom(code);
    
    if (room) {
      setRoomCode(code);
      setRoute({ name: 'organizer', roomCode: code });
      window.history.replaceState(null, '', `/admin?code=${code}`);
    } else {
      // 3. Se a sala já existir, avisa o organizador
      alert('Ops! Esse código de sala já está em uso. Tente outro!');
    }
  }, [actions]);

  const handleJoinRoom = useCallback((code: string) => {
    setRoomCode(code);
    setRoute({ name: 'player', roomCode: code });
    window.history.replaceState(null, '', `/join?code=${code}`);
  }, []);

  const handleAdminUnlock = useCallback(() => {
    if (roomCode) {
      setRoute({ name: 'organizer', roomCode });
    } else {
      handleCreateRoom();
    }
  }, [roomCode, handleCreateRoom]);

  const handleJoinAsPlayer = useCallback(async (name: string): Promise<Player | null> => {
    if (!gameState.room) return null;
    const player = await actions.joinRoom(gameState.room.id, name);
    if (player) {
      setPlayerId(player.id);
      localStorage.setItem('afunda_player_id', player.id);
    }
    return player;
  }, [gameState.room, actions]);

  const handleLeaveRoom = useCallback(() => {
    if (playerId && gameState.room) {
      supabase.from('players').delete().eq('id', playerId);
    }
    setPlayerId(null);
    localStorage.removeItem('afunda_player_id');
    setRoomCode(null);
    setRoute({ name: 'home' });
    window.history.replaceState(null, '', '/');
  }, [playerId, gameState.room]);

  const myPlayer = gameState.players.find((p) => p.id === playerId) || null;

  // Loading screen
  if (roomCode && gameState.loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <Bubbles count={12} />
        <div className="relative z-10 text-center space-y-3">
          <div className="text-5xl animate-bounce inline-block">🌊</div>
          <div className="text-lg font-bold text-cyanNeon animate-pulse">Conectando...</div>
        </div>
      </div>
    );
  }

  // Room not found
  if (roomCode && !gameState.loading && !gameState.room) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <Bubbles count={12} />
        <div className="glass-card-glow rounded-3xl p-8 max-w-sm w-full text-center space-y-4 relative z-10">
          <div className="text-5xl">😢</div>
          <h2 className="text-xl font-extrabold text-white">Sala não encontrada</h2>
          <p className="text-sm text-slate-300">
            A sala <span className="font-mono text-yellowNeon">{roomCode}</span> não existe ou foi fechada.
          </p>
          <button
            onClick={() => {
              setRoomCode(null);
              setRoute({ name: 'home' });
              window.history.replaceState(null, '', '/');
            }}
            className="w-full py-3 bg-gradient-to-r from-cyanNeon to-blue-500 text-ocean-900 font-black rounded-2xl transition-all active:scale-95"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // Render based on route
  if (route.name === 'home') {
    return (
      <div className="relative min-h-screen">
        <Bubbles count={16} />
        <HomePage onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
      </div>
    );
  }

  if (route.name === 'admin-gate') {
    return (
      <div className="relative min-h-screen">
        <Bubbles count={12} />
        <AdminGate onUnlock={handleAdminUnlock} onBack={() => setRoute({ name: 'home' })} />
      </div>
    );
  }

  if (route.name === 'organizer' && gameState.room) {
    return (
      <div className="relative min-h-screen">
        <Bubbles count={20} />
        <canvas id="confetti-canvas" className="fixed inset-0 pointer-events-none z-[999]" />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <OrganizerView room={gameState.room} players={gameState.players} />
        </div>
      </div>
    );
  }

  if (route.name === 'player' && gameState.room) {
    return (
      <div className="relative min-h-screen">
        <Bubbles count={10} />
        <PlayerView
          room={gameState.room}
          player={myPlayer}
          players={gameState.players}
          onJoin={handleJoinAsPlayer}
          onLeave={handleLeaveRoom}
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="relative min-h-screen">
      <Bubbles count={12} />
      <HomePage onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
    </div>
  );
}

export default App;
