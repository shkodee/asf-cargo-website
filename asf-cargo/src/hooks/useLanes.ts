import { useEffect, useState } from 'react';
import { lanes as staticLanes, cityCoordinates, laneCities } from '../data/content';
import type { Lane } from '../types';

const RELAY_ENDPOINT = 'https://asf-cargo-relay.afzaljon0411.workers.dev';

// Static content.ts data as a safe default — shown immediately on load and
// kept if the live fetch ever fails, so the section is never empty/broken.
const fallbackLanes: Lane[] = staticLanes.map((lane) => {
  const cities = laneCities[lane.idx];
  return {
    ...lane,
    originCity: cities?.origin,
    originCoords: cities ? cityCoordinates[cities.origin] : undefined,
    destCity: cities?.dest,
    destCoords: cities ? cityCoordinates[cities.dest] : undefined,
  };
});

/**
 * Lanes are managed live from the Telegram bot (see worker/worker.js's
 * GET /lanes), so the site fetches the current list at runtime instead of
 * only using the static `lanes` export — a bot edit shows up on next page
 * load, no rebuild/redeploy needed. Falls back to the static data on any
 * fetch failure so a relay hiccup never leaves the section empty.
 */
export function useLanes(): Lane[] {
  const [lanes, setLanes] = useState<Lane[]>(fallbackLanes);

  useEffect(() => {
    let cancelled = false;

    fetch(`${RELAY_ENDPOINT}/lanes`)
      .then((res) => {
        if (!res.ok) throw new Error(`Lanes fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data: { lanes: Lane[] }) => {
        if (!cancelled && Array.isArray(data.lanes)) {
          setLanes(data.lanes);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch live lanes, using static fallback:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return lanes;
}
