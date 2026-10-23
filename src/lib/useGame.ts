import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, type Room, type Player } from './supabase';

export interface GameState {
  room: Room | null;
  players: Player[];
  loading: boolean;
}

export function useRoom(roomCode: string | null) {
  const [state, setState] = useState<GameState>({
    room: null,
    players: [],
    loading: true,
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!roomCode) {
      setState({ room: null, players: [], loading: false });
      return;
    }

    let cancelled = false;

    async function init() {
      const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .maybeSingle();

      if (cancelled) return;

      if (error || !room) {
        setState({ room: null, players: [], loading: false });
        return;
      }

      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .order('score', { ascending: false });

      if (cancelled) return;

      setState({ room: room as Room, players: (players || []) as Player[], loading: false });

      // Realtime: room updates
      const channel = supabase
        .channel(`room-${roomCode}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` },
          (payload) => {
            if (payload.eventType === 'UPDATE' && payload.new) {
              setState((prev) => ({ ...prev, room: payload.new as Room }));
            } else if (payload.eventType === 'DELETE') {
              setState({ room: null, players: [], loading: false });
            }
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              setState((prev) => ({
                ...prev,
                players: [...prev.players, payload.new as Player].sort((a, b) => b.score - a.score),
              }));
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updated = payload.new as Player;
              setState((prev) => ({
                ...prev,
                players: prev.players
                  .map((p) => (p.id === updated.id ? updated : p))
                  .sort((a, b) => b.score - a.score),
              }));
            } else if (payload.eventType === 'DELETE') {
              const deleted = payload.old as { id: string };
              setState((prev) => ({
                ...prev,
                players: prev.players.filter((p) => p.id !== deleted.id),
              }));
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    }

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode]);

  return state;
}

export function useGameActions(room: Room | null, playerId: string | null) {
  const updateRoom = useCallback(async (updates: Partial<Room>) => {
    if (!room) return;
    const { error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', room.id);
    if (error) console.error('Failed to update room:', error);
    return error;
  }, [room]);

  const createRoom = useCallback(async (code: string): Promise<Room | null> => {
    const { data, error } = await supabase
      .from('rooms')
      .insert({ code, status: 'lobby' })
      .select()
      .maybeSingle();
    if (error) {
      console.error('Failed to create room:', error);
      return null;
    }
    return data as Room;
  }, []);

  const joinRoom = useCallback(async (roomId: string, name: string): Promise<Player | null> => {
    const { data, error } = await supabase
      .from('players')
      .insert({ room_id: roomId, name })
      .select()
      .maybeSingle();
    if (error) {
      console.error('Failed to join room:', error);
      return null;
    }
    return data as Player;
  }, []);

  const submitVote = useCallback(async (vote: 'BOIA' | 'AFUNDA', reactionMs: number): Promise<{ error: string | null; points: number }> => {
    if (!room || !playerId) return { error: 'Not connected', points: 0 };
    if (room.status !== 'voting' && room.status !== 'countdown') return { error: 'Voting not open', points: 0 };

    const { data: player, error: fetchErr } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .maybeSingle();

    if (fetchErr || !player) return { error: 'Player not found', points: 0 };

    const { error: updateErr } = await supabase
      .from('players')
      .update({ last_vote: vote, last_reaction_ms: reactionMs })
      .eq('id', playerId);

    if (updateErr) return { error: updateErr.message, points: 0 };

    return { error: null, points: 0 };
  }, [room, playerId]);

  const resetVotes = useCallback(async () => {
    if (!room) return;
    await supabase
      .from('players')
      .update({ last_vote: null, last_correct: false, last_points: 0, last_reaction_ms: null })
      .eq('room_id', room.id);
  }, [room]);

  const openVoting = useCallback(async (objectName: string, emoji: string, timerSeconds: number) => {
    if (!room) return;
    await updateRoom({
      status: 'countdown',
      current_object_name: objectName,
      current_emoji: emoji,
      current_result: null,
      timer_seconds: timerSeconds,
      countdown_ends_at: new Date(Date.now() + 4000).toISOString(),
    });
    await resetVotes();
  }, [room, updateRoom, resetVotes]);

  const transitionToVoting = useCallback(async () => {
    if (!room) return;
    await updateRoom({
      status: 'voting',
      voting_started_at: new Date().toISOString(),
      countdown_ends_at: null,
    });
  }, [room, updateRoom]);

  const startTesting = useCallback(async () => {
    if (!room) return;
    await updateRoom({ status: 'testing' });
  }, [room, updateRoom]);

  const revealResult = useCallback(async (result: 'BOIA' | 'AFUNDA') => {
    if (!room) return;

    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', room.id);

    if (!players) return;

    const totalTimeMs = room.timer_seconds * 1000;

    for (const player of players) {
      const correct = player.last_vote === result;
      let points = 0;
      if (correct && player.last_reaction_ms != null) {
        const timeRemaining = Math.max(0, totalTimeMs - player.last_reaction_ms);
        const ratio = timeRemaining / totalTimeMs;
        points = Math.round(500 + 500 * ratio);
      }
      await supabase
        .from('players')
        .update({
          last_correct: correct,
          last_points: points,
          score: player.score + points,
        })
        .eq('id', player.id);
    }

    await supabase.from('rounds').insert({
      room_id: room.id,
      round_number: room.round_number,
      object_name: room.current_object_name,
      emoji: room.current_emoji,
      result,
    });

    await updateRoom({ status: 'result', current_result: result });
  }, [room, updateRoom]);

  const nextRound = useCallback(async (objectName: string, emoji: string) => {
    if (!room) return;
    await updateRoom({
      status: 'lobby',
      round_number: room.round_number + 1,
      current_object_name: objectName,
      current_emoji: emoji,
      current_result: null,
      voting_started_at: null,
      countdown_ends_at: null,
    });
    await resetVotes();
  }, [room, updateRoom, resetVotes]);

  const resetGame = useCallback(async () => {
    if (!room) return;
    await supabase.from('players').delete().eq('room_id', room.id);
    await supabase.from('rounds').delete().eq('room_id', room.id);
    await updateRoom({
      status: 'lobby',
      round_number: 1,
      current_object_name: 'Elefante',
      current_emoji: '🐘',
      current_result: null,
      voting_started_at: null,
      countdown_ends_at: null,
    });
  }, [room, updateRoom]);

  return {
    createRoom,
    joinRoom,
    submitVote,
    resetVotes,
    openVoting,
    transitionToVoting,
    startTesting,
    revealResult,
    nextRound,
    resetGame,
    updateRoom,
  };
}
