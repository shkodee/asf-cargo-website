import { useEffect, useState } from 'react';
import { teamMembers as staticTeamMembers } from '../data/content';
import type { TeamMember } from '../types';

const RELAY_ENDPOINT = 'https://asf-cargo-relay.afzaljon0411.workers.dev';
const CACHE_KEY = 'asf_roster_cache_v1';

type RosterMember = {
  id: string;
  name: string;
  role: string;
  experience?: string;
  bio?: string;
  photoUrl?: string;
};

function toTeamMembers(members: RosterMember[]): TeamMember[] {
  return members.map((m) => ({
    name: m.name,
    role: m.role,
    experience: m.experience,
    bio: m.bio,
    image: m.photoUrl || '',
  }));
}

// Last successfully-fetched live roster, persisted across page loads — this
// is what actually fixes "the page shows old/wrong data for a few seconds":
// instead of an initial render from the hardcoded (and increasingly stale)
// content.ts array, a returning visitor's browser already has the real,
// last-known-current roster on hand and paints it immediately, then quietly
// re-checks in the background. content.ts is now only the true last-resort —
// used on a brand new browser that's never loaded this page before.
function readCache(): TeamMember[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(members: TeamMember[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(members));
  } catch {
    // Private browsing / storage disabled — fine, just skip the cache.
  }
}

/**
 * The About page's team roster is managed live from the Telegram bot (see
 * worker/worker.js's GET /roster), same live-data relationship lanes have to
 * the site — a bot edit shows up on next page load, no rebuild/redeploy.
 * Initial state prefers a locally cached copy of the *live* data over the
 * hardcoded `content.ts` fallback, so returning visitors see current content
 * instantly instead of a stale placeholder while the network fetch resolves.
 */
export function useTeamRoster(): TeamMember[] {
  const [members, setMembers] = useState<TeamMember[]>(() => readCache() ?? staticTeamMembers);

  useEffect(() => {
    let cancelled = false;

    fetch(`${RELAY_ENDPOINT}/roster`)
      .then((res) => {
        if (!res.ok) throw new Error(`Roster fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data: { members: RosterMember[] }) => {
        if (cancelled || !Array.isArray(data.members)) return;
        const mapped = toTeamMembers(data.members);
        setMembers(mapped);
        writeCache(mapped);
      })
      .catch((err) => {
        console.error('Failed to fetch live team roster, using cached/static fallback:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return members;
}
