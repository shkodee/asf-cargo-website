import { lanes } from '../../data/content';
import Reveal from '../UI/Reveal';
import LaneRow from './LaneRow';

type DispatchBoardProps = {
  selectedLaneIdx: string | null;
  onSelectLane: (idx: string | null) => void;
};

export default function DispatchBoard({ selectedLaneIdx, onSelectLane }: DispatchBoardProps) {
  return (
    <Reveal className="board">
      <div className="board-head">
        <span><span className="dot" />Active lane network</span>
        <span>{lanes.length} / {lanes.length} running</span>
      </div>

      {lanes.map((lane) => (
        <LaneRow
          key={lane.idx}
          lane={lane}
          active={lane.idx === selectedLaneIdx}
          onClick={() => onSelectLane(lane.idx === selectedLaneIdx ? null : lane.idx)}
        />
      ))}

      <div className="board-foot">+ new lanes being added — network expanding over the next 1–2 months.</div>
    </Reveal>
  );
}
