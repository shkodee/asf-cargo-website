import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { lanes, stateCoordinates } from '../../data/content';

function buildArc(
  from: [number, number],
  to: [number, number],
  curvature = 0.15,
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

export default function LaneMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      interactive: false,
      attributionControl: false,
    });

    map.on('load', () => {
      const pointsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: uniqueStates.map((state) => ({
          type: 'Feature',
          properties: { name: state },
          geometry: { type: 'Point', coordinates: stateCoordinates[state] },
        })),
      };

      const arcsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
        type: 'FeatureCollection',
        features: lanes.map((lane) => ({
          type: 'Feature',
          properties: { idx: lane.idx },
          geometry: {
            type: 'LineString',
            coordinates: buildArc(stateCoordinates[lane.origin], stateCoordinates[lane.dest]),
          },
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
          'line-width': 1.5,
          'line-opacity': 0.7,
        },
      });

      map.addSource('lane-points', { type: 'geojson', data: pointsGeoJSON });
      map.addLayer({
        id: 'lane-points-glow',
        type: 'circle',
        source: 'lane-points',
        paint: {
          'circle-radius': 11,
          'circle-color': '#c41230',
          'circle-opacity': 0.18,
        },
      });
      map.addLayer({
        id: 'lane-points-dot',
        type: 'circle',
        source: 'lane-points',
        paint: {
          'circle-radius': 4.5,
          'circle-color': '#f3efe6',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#c41230',
        },
      });

      const bounds = new maplibregl.LngLatBounds();
      uniqueStates.forEach((state) => bounds.extend(stateCoordinates[state]));
      map.fitBounds(bounds, { padding: 48, duration: 0 });
    });

    return () => map.remove();
  }, []);

  return <div className="lane-map" ref={containerRef} />;
}
