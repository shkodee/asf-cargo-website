import type { Lane } from '../../types';
import Reveal from '../UI/Reveal';

type LaneRowProps = {
  lane: Lane;
  active?: boolean;
  onClick?: () => void;
};

export default function LaneRow({ lane, active, onClick }: LaneRowProps) {
  return (
    <Reveal className={`lane-row${active ? ' active' : ''}`} onClick={onClick}>
      <span className="idx">{lane.idx}</span>
      <span className="origin">{lane.origin}</span>
      <span className="arrow">→</span>
      <span className="dest">{lane.dest}</span>
      <span className="status">{lane.status}</span>
    </Reveal>
  );
}
