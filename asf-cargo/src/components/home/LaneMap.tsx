import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { lanes, stateCoordinates } from '../../data/content';
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

const uniqueStates = Array.from(new Set(lanes.flatMap((lane) => [lane.origin, lane.dest])));

// Lanes sharing the exact same directed origin->dest pair (e.g. two TN->PA
// runs) would otherwise draw as one overlapping arc — give each one in that
// group a progressively wider bend. Lanes that just reverse an existing pair
// (PA->TN vs TN->PA) already bend to the opposite side automatically, since
// the arc's perpendicular offset flips sign with the direction.
const laneCurvature = new Map<string, number>();
{
  const seen = new Map<string, number>();
  lanes.forEach((lane) => {
    const key = `${lane.origin}->${lane.dest}`;
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    laneCurvature.set(lane.idx, 0.18 + count * 0.22);
  });
}

function laneArcCoordinates(lane: Lane): [number, number][] {
  return buildArc(
    stateCoordinates[lane.origin],
    stateCoordinates[lane.dest],
    laneCurvature.get(lane.idx) ?? 0.18,
  );
}

function fullBounds(): maplibregl.LngLatBounds {
  const bounds = new maplibregl.LngLatBounds();
  uniqueStates.forEach((state) => bounds.extend(stateCoordinates[state]));
  return bounds;
}

function applySelection(map: maplibregl.Map, selectedLaneIdx: string | null) {
  uniqueStates.forEach((state) =>
    map.setFeatureState({ source: 'lane-points', id: state }, { emphasized: false }),
  );

  const highlightSource = map.getSource('lane-highlight') as maplibregl.GeoJSONSource | undefined;

  if (!selectedLaneIdx) {
    highlightSource?.setData({ type: 'FeatureCollection', features: [] });
    map.setPaintProperty('lane-arcs-layer', 'line-opacity', 0.35);
    map.fitBounds(fullBounds(), { padding: 48, duration: 700 });
    return;
  }

  const lane = lanes.find((l) => l.idx === selectedLaneIdx);
  if (!lane) return;

  map.setFeatureState({ source: 'lane-points', id: lane.origin }, { emphasized: true });
  map.setFeatureState({ source: 'lane-points', id: lane.dest }, { emphasized: true });

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
  bounds.extend(stateCoordinates[lane.origin]);
  bounds.extend(stateCoordinates[lane.dest]);
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
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    mapRef.current = map;

    map.on('load', () => {
      const arcsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
        type: 'FeatureCollection',
        features: lanes.map((lane) => ({
          type: 'Feature',
          properties: { idx: lane.idx },
          geometry: { type: 'LineString', coordinates: laneArcCoordinates(lane) },
        })),
      };

      const pointsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: uniqueStates.map((state) => ({
          type: 'Feature',
          properties: { name: state },
          geometry: { type: 'Point', coordinates: stateCoordinates[state] },
        })),
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

      map.addSource('lane-points', { type: 'geojson', data: pointsGeoJSON, promoteId: 'name' });
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
