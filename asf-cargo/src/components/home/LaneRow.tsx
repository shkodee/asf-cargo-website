import type { Lane } from '../../types';
import Reveal from '../UI/Reveal';

export default function LaneRow({ lane }: { lane: Lane }) {
  return (
    <Reveal className="lane-row">
      <span className="idx">{lane.idx}</span>
      <span className="origin">{lane.origin}</span>
      <span className="arrow">→</span>
      <span className="dest">{lane.dest}</span>
      <span className="status">{lane.status}</span>
    </Reveal>
  );
}
