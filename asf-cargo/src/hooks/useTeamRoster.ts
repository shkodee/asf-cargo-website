import { useEffect, useState } from 'react';
import { teamMembers as staticTeamMembers } from '../data/content';
import type { TeamMember } from '../types';

const RELAY_ENDPOINT = 'https://asf-cargo-relay.afzaljon0411.workers.dev';

type RosterMember = {
  id: string;
  name: string;
  role: string;
  experience?: string;
  bio?: string;
  photoUrl?: string;
};

/**
 * The About page's team roster is managed live from the Telegram bot (see
 * worker/worker.js's GET /roster), same live-data relationship lanes have to
 * the site — a bot edit shows up on next page load, no rebuild/redeploy.
 * `content.ts`'s static `teamMembers` is shown immediately and kept if the
 * live fetch ever fails, so the section is never empty/broken.
 */
export function useTeamRoster(): TeamMember[] {
  const [members, setMembers] = useState<TeamMember[]>(staticTeamMembers);

  useEffect(() => {
    let cancelled = false;

    fetch(`${RELAY_ENDPOINT}/roster`)
      .then((res) => {
        if (!res.ok) throw new Error(`Roster fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data: { members: RosterMember[] }) => {
        if (cancelled || !Array.isArray(data.members)) return;
        setMembers(
          data.members.map((m) => ({
            name: m.name,
            role: m.role,
            experience: m.experience,
            bio: m.bio,
            image: m.photoUrl || '',
          }))
        );
      })
      .catch((err) => {
        console.error('Failed to fetch live team roster, using static fallback:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return members;
}
