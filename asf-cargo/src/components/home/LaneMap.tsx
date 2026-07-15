import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { lanes, cityCoordinates, laneCities } from '../../data/content';
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

// Positioning uses real city coordinates (`cityCoordinates`/`laneCities`) so
// dots sit where the lanes actually run, but every label stays state-level
// (`lane.origin`/`lane.dest`) — see the note on `cityCoordinates` in
// content.ts for why the two are kept separate.
type CityPoint = { key: string; label: string; coordinates: [number, number] };

const cityPoints = new Map<string, CityPoint>();
lanes.forEach((lane) => {
  const cities = laneCities[lane.idx];
  if (!cities) return;
  if (!cityPoints.has(cities.origin)) {
    cityPoints.set(cities.origin, {
      key: cities.origin,
      label: lane.origin,
      coordinates: cityCoordinates[cities.origin],
    });
  }
  if (!cityPoints.has(cities.dest)) {
    cityPoints.set(cities.dest, {
      key: cities.dest,
      label: lane.dest,
      coordinates: cityCoordinates[cities.dest],
    });
  }
});
const uniqueCityPoints = Array.from(cityPoints.values());

// Lanes sharing the exact same directed origin->dest city pair would
// otherwise draw as one overlapping arc — give each one in that group a
// progressively wider bend. Lanes that just reverse an existing pair already
// bend to the opposite side automatically, since the arc's perpendicular
// offset flips sign with the direction.
const laneCurvature = new Map<string, number>();
{
  const seen = new Map<string, number>();
  lanes.forEach((lane) => {
    const cities = laneCities[lane.idx];
    if (!cities) return;
    const key = `${cities.origin}->${cities.dest}`;
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    laneCurvature.set(lane.idx, 0.18 + count * 0.22);
  });
}

function laneArcCoordinates(lane: Lane): [number, number][] {
  const cities = laneCities[lane.idx];
  if (!cities) return [];
  return buildArc(
    cityCoordinates[cities.origin],
    cityCoordinates[cities.dest],
    laneCurvature.get(lane.idx) ?? 0.18,
  );
}

function fullBounds(): maplibregl.LngLatBounds {
  const bounds = new maplibregl.LngLatBounds();
  uniqueCityPoints.forEach((point) => bounds.extend(point.coordinates));
  return bounds;
}

function applySelection(map: maplibregl.Map, selectedLaneIdx: string | null) {
  uniqueCityPoints.forEach((point) =>
    map.setFeatureState({ source: 'lane-points', id: point.key }, { emphasized: false }),
  );

  const highlightSource = map.getSource('lane-highlight') as maplibregl.GeoJSONSource | undefined;

  if (!selectedLaneIdx) {
    highlightSource?.setData({ type: 'FeatureCollection', features: [] });
    map.setPaintProperty('lane-arcs-layer', 'line-opacity', 0.35);
    map.fitBounds(fullBounds(), { padding: 48, duration: 700 });
    return;
  }

  const lane = lanes.find((l) => l.idx === selectedLaneIdx);
  const cities = lane ? laneCities[lane.idx] : undefined;
  if (!lane || !cities) return;

  map.setFeatureState({ source: 'lane-points', id: cities.origin }, { emphasized: true });
  map.setFeatureState({ source: 'lane-points', id: cities.dest }, { emphasized: true });

  highlightSource?.setData({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: laneArcCoordinates(lane) },
      },
    ],
  });
  map.setPaintProperty('lane-arcs-layer', 'line-opacity', 0.12);

  const bounds = new maplibregl.LngLatBounds();
  bounds.extend(cityCoordinates[cities.origin]);
  bounds.extend(cityCoordinates[cities.dest]);
  map.fitBounds(bounds, { padding: 90, duration: 700, maxZoom: 6.5 });
}

type LaneMapProps = {
  selectedLaneIdx: string | null;
  onSelectLane: (idx: string | null) => void;
};

export default function LaneMap({ selectedLaneIdx, onSelectLane }: LaneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      attributionControl: false,
      cooperativeGestures: true,
      dragRotate: true,
      pitchWithRotate: false,
      touchPitch: false,
    });
    mapRef.current = map;

    map.on('load', () => {
      map.setProjection({ type: 'globe' });

      const arcsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
        type: 'FeatureCollection',
        features: lanes.map((lane) => ({
          type: 'Feature',
          properties: { idx: lane.idx },
          geometry: { type: 'LineString', coordinates: laneArcCoordinates(lane) },
        })),
      };

      // Two points can share the same state label (e.g. Middletown, PA and
      // Carlisle, PA are both "Pennsylvania") — only label the first one so
      // the text doesn't overlap itself when the dots sit close together.
      const seenLabels = new Set<string>();
      const pointsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: uniqueCityPoints.map((point) => {
          const showLabel = !seenLabels.has(point.label);
          seenLabels.add(point.label);
          return {
            type: 'Feature',
            properties: { pointKey: point.key, name: showLabel ? point.label : '' },
            geometry: { type: 'Point', coordinates: point.coordinates },
          };
        }),
      };

      map.addSource('lane-arcs', { type: 'geojson', data: arcsGeoJSON });
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

      map.addSource('lane-highlight', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
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

      map.addSource('lane-points', { type: 'geojson', data: pointsGeoJSON, promoteId: 'pointKey' });
      map.addLayer({
        id: 'lane-points-glow',
        type: 'circle',
        source: 'lane-points',
        paint: {
          'circle-radius': ['case', ['boolean', ['feature-state', 'emphasized'], false], 17, 11],
          'circle-color': '#c41230',
          'circle-opacity': ['case', ['boolean', ['feature-state', 'emphasized'], false], 0.3, 0.18],
        },
      });
      map.addLayer({
        id: 'lane-points-dot',
        type: 'circle',
        source: 'lane-points',
        paint: {
          'circle-radius': ['case', ['boolean', ['feature-state', 'emphasized'], false], 6, 4.5],
          'circle-color': '#f3efe6',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#c41230',
        },
      });
      map.addLayer({
        id: 'lane-points-label',
        type: 'symbol',
        source: 'lane-points',
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

      map.fitBounds(fullBounds(), { padding: 48, duration: 0 });
      setReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    applySelection(map, selectedLaneIdx);
  }, [ready, selectedLaneIdx]);

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
