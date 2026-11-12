import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Bubbles } from '@/components/Effects';
import { HomePage } from '@/components/HomePage';
import { AdminGate } from '@/components/AdminGate';
import { OrganizerView } from '@/components/OrganizerView';
import { PlayerView } from '@/components/PlayerView';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useRoom, useGameActions } from '@/lib/useGame';
import { generateRoomCode, isMobile } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { supabase, type Player } from '@/lib/supabase';

type Route =
  | { name: 'home' }
  | { name: 'admin-gate' }
  | { name: 'organizer'; roomCode: string }
  | { name: 'player'; roomCode: string };

function Page({ bubbles, children }: { bubbles: number; children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Bubbles count={bubbles} />
      <div className="relative z-20 flex justify-end px-4 pt-4">
        <LanguageSwitcher />
      </div>
      {children}
    </div>
  );
}

function App() {
  const { t } = useI18n();
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

  const handleCreateRoom = useCallback(async () => {
    const code = generateRoomCode();
    const room = await actions.createRoom(code);
    if (room) {
      setRoomCode(code);
      setRoute({ name: 'organizer', roomCode: code });
      window.history.replaceState(null, '', `/admin?code=${code}`);
    } else {
      // Room code collision — try again
      const code2 = generateRoomCode();
      const room2 = await actions.createRoom(code2);
      if (room2) {
        setRoomCode(code2);
        setRoute({ name: 'organizer', roomCode: code2 });
        window.history.replaceState(null, '', `/admin?code=${code2}`);
      }
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
      <Page bubbles={12}>
        <div className="relative z-10 min-h-[80vh] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="text-5xl animate-bounce inline-block">🌊</div>
            <div className="text-lg font-bold text-cyanNeon animate-pulse">{t('common.connecting')}</div>
          </div>
        </div>
      </Page>
    );
  }

  // Room not found
  if (roomCode && !gameState.loading && !gameState.room) {
    return (
      <Page bubbles={12}>
        <div className="relative z-10 min-h-[80vh] flex items-center justify-center px-4">
          <div className="glass-card-glow rounded-3xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="text-5xl">😢</div>
            <h2 className="text-xl font-extrabold text-white">{t('app.roomNotFound')}</h2>
            <p className="text-sm text-slate-300">{t('app.roomNotFoundDesc', { code: roomCode })}</p>
            <button
              onClick={() => {
                setRoomCode(null);
                setRoute({ name: 'home' });
                window.history.replaceState(null, '', '/');
              }}
              className="w-full py-3 bg-gradient-to-r from-cyanNeon to-blue-500 text-ocean-900 font-black rounded-2xl transition-all active:scale-95"
            >
              {t('app.backHome')}
            </button>
          </div>
        </div>
      </Page>
    );
  }

  // Render based on route
  if (route.name === 'home') {
    return (
      <Page bubbles={16}>
        <HomePage onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
      </Page>
    );
  }

  if (route.name === 'admin-gate') {
    return (
      <Page bubbles={12}>
        <AdminGate onUnlock={handleAdminUnlock} onBack={() => setRoute({ name: 'home' })} />
      </Page>
    );
  }

  if (route.name === 'organizer' && gameState.room) {
    return (
      <Page bubbles={20}>
        <canvas id="confetti-canvas" className="fixed inset-0 pointer-events-none z-[999]" />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <OrganizerView room={gameState.room} players={gameState.players} />
        </div>
      </Page>
    );
  }

  if (route.name === 'player' && gameState.room) {
    return (
      <Page bubbles={10}>
        <PlayerView
          room={gameState.room}
          player={myPlayer}
          players={gameState.players}
          onJoin={handleJoinAsPlayer}
          onLeave={handleLeaveRoom}
        />
      </Page>
    );
  }

  // Fallback
  return (
    <Page bubbles={12}>
      <HomePage onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
    </Page>
  );
}

export default App;
