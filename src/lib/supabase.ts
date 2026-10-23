import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: { eventsPerSecond: 20 },
  },
});

export type RoomStatus = 'lobby' | 'countdown' | 'voting' | 'testing' | 'result' | 'finished';

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  round_number: number;
  current_object_name: string;
  current_emoji: string;
  current_result: 'BOIA' | 'AFUNDA' | null;
  timer_seconds: number;
  voting_started_at: string | null;
  countdown_ends_at: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  score: number;
  last_vote: 'BOIA' | 'AFUNDA' | null;
  last_correct: boolean;
  last_points: number;
  last_reaction_ms: number | null;
  created_at: string;
}

export interface Round {
  id: string;
  room_id: string;
  round_number: number;
  object_name: string;
  emoji: string;
  result: 'BOIA' | 'AFUNDA';
  created_at: string;
}
