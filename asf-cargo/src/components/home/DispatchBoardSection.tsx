import { useState } from 'react';
import SectionHeading from '../UI/SectionHeading';
import DispatchBoard from './DispatchBoard';
import LaneMap from './LaneMap';
import { useLanes } from '../../hooks/useLanes';

export default function DispatchBoardSection() {
  const [selectedLaneIdx, setSelectedLaneIdx] = useState<string | null>(null);
  const lanes = useLanes();

  return (
    <section className="section section-dark" id="lanes">
      <div className="wrap">
        <SectionHeading
          eyebrow="Where we run"
          eyebrowColor="#ff6b7a"
          description="Our freight moves the East Coast to the Midwest on a steady, repeatable network — and we're adding more lanes every couple of months."
        >
          {lanes.length} lanes, running daily.
        </SectionHeading>
        <LaneMap lanes={lanes} selectedLaneIdx={selectedLaneIdx} onSelectLane={setSelectedLaneIdx} />
        <DispatchBoard lanes={lanes} selectedLaneIdx={selectedLaneIdx} onSelectLane={setSelectedLaneIdx} />
      </div>
    </section>
  );
}
