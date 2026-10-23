/*
# Afunda ou Boia? - Game Show Schema

Creates the full database schema for the "Afunda ou Boia?" interactive game show.

## Tables

### rooms
- Represents a game session. The organizer creates a room with a unique 4-digit code.
- `code` (text, unique) — the room join code shown on TV (e.g. "8421")
- `status` (text) — current game phase: 'lobby', 'countdown', 'voting', 'testing', 'result', 'finished'
- `round_number` (integer) — current round index
- `current_object_name` (text) — name of the item for the current round
- `current_emoji` (text) — emoji shown in the aquarium
- `current_result` (text) — 'BOIA' | 'AFUNDA' | null (set at reveal)
- `timer_seconds` (integer) — voting timer duration (default 15)
- `voting_started_at` (timestamptz) — when voting was opened (for reaction-time scoring)
- `countdown_ends_at` (timestamptz) — when the "3,2,1" countdown finishes and voting unlocks
- `created_at` (timestamptz)

### players
- A participant who joined a room via mobile.
- `id` (uuid, primary key)
- `room_id` (uuid, FK to rooms)
- `name` (text) — display name / family name
- `score` (integer, default 0)
- `last_vote` (text) — 'BOIA' | 'AFUNDA' | null
- `last_correct` (boolean, default false)
- `last_points` (integer, default 0) — points earned in the last round
- `last_reaction_ms` (integer) — reaction time in ms for the last vote
- `created_at` (timestamptz)

### rounds
- Historical record of each completed round.
- `id` (uuid, primary key)
- `room_id` (uuid, FK to rooms)
- `round_number` (integer)
- `object_name` (text)
- `emoji` (text)
- `result` (text) — 'BOIA' | 'AFUNDA'
- `created_at` (timestamptz)

## Security (RLS)
- This is a no-auth app (players join via room code, no sign-in).
- All tables grant CRUD to `anon, authenticated` so the anon-key client can operate.
- Policies use `USING (true)` / `WITH CHECK (true)` because data is intentionally shared within a game session.
- RLS is enabled on all tables.

## Notes
1. The app is single-tenant per room — any client with the room code can join and play.
2. Scores and votes are public within the room (everyone sees the lobby and leaderboard).
3. No user accounts or auth — purely a real-time party game.
*/

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'lobby',
  round_number integer NOT NULL DEFAULT 1,
  current_object_name text NOT NULL DEFAULT 'Elefante',
  current_emoji text NOT NULL DEFAULT '🐘',
  current_result text,
  timer_seconds integer NOT NULL DEFAULT 15,
  voting_started_at timestamptz,
  countdown_ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON rooms TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_rooms" ON rooms;
CREATE POLICY "anon_select_rooms" ON rooms FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rooms" ON rooms;
CREATE POLICY "anon_insert_rooms" ON rooms FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rooms" ON rooms;
CREATE POLICY "anon_update_rooms" ON rooms FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rooms" ON rooms;
CREATE POLICY "anon_delete_rooms" ON rooms FOR DELETE
  TO anon, authenticated USING (true);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Participante',
  score integer NOT NULL DEFAULT 0,
  last_vote text,
  last_correct boolean NOT NULL DEFAULT false,
  last_points integer NOT NULL DEFAULT 0,
  last_reaction_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON players TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE
  TO anon, authenticated USING (true);

-- Rounds table (history)
CREATE TABLE IF NOT EXISTS rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  object_name text NOT NULL,
  emoji text NOT NULL,
  result text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON rounds TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_rounds" ON rounds;
CREATE POLICY "anon_select_rounds" ON rounds FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rounds" ON rounds;
CREATE POLICY "anon_insert_rounds" ON rounds FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rounds" ON rounds;
CREATE POLICY "anon_update_rounds" ON rounds FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rounds" ON rounds;
CREATE POLICY "anon_delete_rounds" ON rounds FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for performance (150+ players per room)
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_rounds_room_id ON rounds(room_id);
