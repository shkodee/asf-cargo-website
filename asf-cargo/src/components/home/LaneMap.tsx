import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Lane } from '../../types';

function buildArc(
  from: [number, number],
  to: [number, number],
  curvature: number,
  samples = 48,
): [number, number][] {
  const [x0, y0] = from;
  const [x2, y2] = to;
  const dx = x2 - x0;
  const dy = y2 - y0;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return [from, to];

  const mx = (x0 + x2) / 2;
  const my = (y0 + y2) / 2;
  const nx = -dy / distance;
  const ny = dx / distance;
  const offset = distance * curvature;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;

  const points: [number, number][] = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const inv = 1 - t;
    const x = inv * inv * x0 + 2 * inv * t * cx + t * t * x2;
    const y = inv * inv * y0 + 2 * inv * t * cy + t * t * y2;
    points.push([x, y]);
  }
  return points;
}

type CityPoint = { key: string; label: string; coordinates: [number, number] };

// Points are keyed by coordinates, not city name — the public /lanes API
// deliberately never sends city text (state-level only, see PROJECT_BRIEF.md),
// so the map has to dedupe/target points using something that's always
// present. Labels still show `lane.origin`/`lane.dest` (state text) same as
// before; only the internal lookup key changed.
function coordKey(coords: [number, number]): string {
  return `${coords[0]},${coords[1]}`;
}

function useLaneMapData(lanes: Lane[]) {
  return useMemo(() => {
    const cityPoints = new Map<string, CityPoint>();
    lanes.forEach((lane) => {
      if (lane.originCoords) {
        const key = coordKey(lane.originCoords);
        if (!cityPoints.has(key)) {
          cityPoints.set(key, { key, label: lane.origin, coordinates: lane.originCoords });
        }
      }
      if (lane.destCoords) {
        const key = coordKey(lane.destCoords);
        if (!cityPoints.has(key)) {
          cityPoints.set(key, { key, label: lane.dest, coordinates: lane.destCoords });
        }
      }
    });

    // Lanes sharing the exact same directed origin->dest pair would
    // otherwise draw as one overlapping arc — give each one in that group a
    // progressively wider bend. Lanes that just reverse an existing pair
    // already bend to the opposite side automatically, since the arc's
    // perpendicular offset flips sign with the direction.
    const seen = new Map<string, number>();
    const arcCoordinatesByIdx = new Map<string, [number, number][]>();
    lanes.forEach((lane) => {
      if (!lane.originCoords || !lane.destCoords) return;
      const key = `${coordKey(lane.originCoords)}->${coordKey(lane.destCoords)}`;
      const count = seen.get(key) ?? 0;
      seen.set(key, count + 1);
      arcCoordinatesByIdx.set(lane.idx, buildArc(lane.originCoords, lane.destCoords, 0.18 + count * 0.22));
    });

    return { uniqueCityPoints: Array.from(cityPoints.values()), arcCoordinatesByIdx };
  }, [lanes]);
}

function fullBounds(points: CityPoint[]): maplibregl.LngLatBounds {
  const bounds = new maplibregl.LngLatBounds();
  points.forEach((point) => bounds.extend(point.coordinates));
  return bounds;
}

function applySelection(
  map: maplibregl.Map,
  lanes: Lane[],
  uniqueCityPoints: CityPoint[],
  arcCoordinatesByIdx: Map<string, [number, number][]>,
  selectedLaneIdx: string | null,
  duration: number,
) {
  uniqueCityPoints.forEach((point) =>
    map.setFeatureState({ source: 'lane-points', id: point.key }, { emphasized: false, role: 'none' }),
  );

  const highlightSource = map.getSource('lane-highlight') as maplibregl.GeoJSONSource | undefined;

  if (!selectedLaneIdx) {
    highlightSource?.setData({ type: 'FeatureCollection', features: [] });
    map.setPaintProperty('lane-arcs-layer', 'line-opacity', 0.35);
    map.setFilter('lane-points-label', ['in', ['get', 'pointKey'], ['literal', []]]);
    if (uniqueCityPoints.length) {
      map.fitBounds(fullBounds(uniqueCityPoints), { padding: 48, duration });
    }
    return;
  }

  const lane = lanes.find((l) => l.idx === selectedLaneIdx);
  const arcCoords = lane ? arcCoordinatesByIdx.get(lane.idx) : undefined;
  if (!lane || !arcCoords || !lane.originCoords || !lane.destCoords) return;

  const originKey = coordKey(lane.originCoords);
  const destKey = coordKey(lane.destCoords);
  map.setFeatureState({ source: 'lane-points', id: originKey }, { emphasized: true, role: 'origin' });
  map.setFeatureState({ source: 'lane-points', id: destKey }, { emphasized: true, role: 'dest' });
  map.setFilter('lane-points-label', ['in', ['get', 'pointKey'], ['literal', [originKey, destKey]]]);

  highlightSource?.setData({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: arcCoords } }],
  });
  map.setPaintProperty('lane-arcs-layer', 'line-opacity', 0.12);

  const bounds = new maplibregl.LngLatBounds();
  bounds.extend(lane.originCoords);
  bounds.extend(lane.destCoords);
  map.fitBounds(bounds, { padding: 90, duration: 700, maxZoom: 6.5 });
}

type LaneMapProps = {
  lanes: Lane[];
  selectedLaneIdx: string | null;
  onSelectLane: (idx: string | null) => void;
};

export default function LaneMap({ lanes, selectedLaneIdx, onSelectLane }: LaneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const hasFramedRef = useRef(false);
  const { uniqueCityPoints, arcCoordinatesByIdx } = useLaneMapData(lanes);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      attributionControl: false,
      cooperativeGestures: true,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    mapRef.current = map;

    map.on('load', () => {
      const emptyLines: GeoJSON.FeatureCollection<GeoJSON.LineString> = { type: 'FeatureCollection', features: [] };
      const emptyPoints: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: 'FeatureCollection', features: [] };

      map.addSource('lane-arcs', { type: 'geojson', data: emptyLines });
      map.addLayer({
        id: 'lane-arcs-layer',
        type: 'line',
        source: 'lane-arcs',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#c41230',
          'line-width': 1.25,
          'line-opacity': 0.35,
          'line-dasharray': [2, 2],
        },
      });

      map.addSource('lane-highlight', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'lane-highlight-glow',
        type: 'line',
        source: 'lane-highlight',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ff6b7a', 'line-width': 9, 'line-opacity': 0.25, 'line-blur': 2 },
      });
      map.addLayer({
        id: 'lane-highlight-line',
        type: 'line',
        source: 'lane-highlight',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ff6b7a', 'line-width': 3.5, 'line-opacity': 1 },
      });
      map.addLayer({
        id: 'lane-highlight-arrow',
        type: 'symbol',
        source: 'lane-highlight',
        layout: {
          'symbol-placement': 'line-center',
          'text-field': '>',
          'text-font': ['Open Sans Bold', 'Noto Sans Regular'],
          'text-size': 22,
          'text-rotation-alignment': 'map',
          'text-keep-upright': false,
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#ff6b7a',
          'text-halo-color': '#0c1c34',
          'text-halo-width': 1.6,
        },
      });

      map.addSource('lane-points', { type: 'geojson', data: emptyPoints, promoteId: 'pointKey' });
      map.addLayer({
        id: 'lane-points-glow',
        type: 'circle',
        source: 'lane-points',
        paint: {
          'circle-radius': ['case', ['boolean', ['feature-state', 'emphasized'], false], 17, 11],
          'circle-color': [
            'case',
            ['==', ['feature-state', 'role'], 'origin'], '#3ddc78',
            ['==', ['feature-state', 'role'], 'dest'], '#ff6b7a',
            '#c41230',
          ],
          'circle-opacity': ['case', ['boolean', ['feature-state', 'emphasized'], false], 0.35, 0.18],
        },
      });
      map.addLayer({
        id: 'lane-points-dot',
        type: 'circle',
        source: 'lane-points',
        paint: {
          'circle-radius': ['case', ['boolean', ['feature-state', 'emphasized'], false], 6, 4.5],
          'circle-color': [
            'case',
            ['==', ['feature-state', 'role'], 'origin'], '#3ddc78',
            ['==', ['feature-state', 'role'], 'dest'], '#ff6b7a',
            '#f3efe6',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'emphasized'], false], '#ffffff',
            '#c41230',
          ],
        },
      });
      // feature-state can't drive `text-field` (layout properties don't
      // support it, only paint properties do) — so label visibility is
      // controlled via setFilter() in applySelection instead. Starts
      // filtered to match nothing, so no labels show by default.
      map.addLayer({
        id: 'lane-points-label',
        type: 'symbol',
        source: 'lane-points',
        filter: ['in', ['get', 'pointKey'], ['literal', []]],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular', 'Noto Sans Regular'],
          'text-size': 11,
          'text-offset': [0, 1.1],
          'text-anchor': 'top',
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#f3efe6',
          'text-halo-color': '#0c1c34',
          'text-halo-width': 1.4,
        },
      });

      setReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
      hasFramedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps the map's data in sync with `lanes` (which starts as the static
  // fallback and gets replaced once the live /lanes fetch resolves, and
  // could change again if an admin edits lanes via the bot) and re-applies
  // the current selection whenever either changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const arcsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
      type: 'FeatureCollection',
      features: lanes
        .filter((lane) => arcCoordinatesByIdx.has(lane.idx))
        .map((lane) => ({
          type: 'Feature',
          properties: { idx: lane.idx },
          geometry: { type: 'LineString', coordinates: arcCoordinatesByIdx.get(lane.idx) as [number, number][] },
        })),
    };
    const pointsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: uniqueCityPoints.map((point) => ({
        type: 'Feature',
        properties: { pointKey: point.key, name: point.label },
        geometry: { type: 'Point', coordinates: point.coordinates },
      })),
    };

    (map.getSource('lane-arcs') as maplibregl.GeoJSONSource | undefined)?.setData(arcsGeoJSON);
    (map.getSource('lane-points') as maplibregl.GeoJSONSource | undefined)?.setData(pointsGeoJSON);

    const duration = hasFramedRef.current ? 700 : 0;
    hasFramedRef.current = true;
    applySelection(map, lanes, uniqueCityPoints, arcCoordinatesByIdx, selectedLaneIdx, duration);
  }, [ready, lanes, uniqueCityPoints, arcCoordinatesByIdx, selectedLaneIdx]);

  return (
    <div className="lane-map" ref={containerRef}>
      {selectedLaneIdx && (
        <button
          type="button"
          className="lane-map-reset"
          aria-label="Reset map view"
          onClick={() => onSelectLane(null)}
        >
          &times;
        </button>
      )}
    </div>
  );
}
