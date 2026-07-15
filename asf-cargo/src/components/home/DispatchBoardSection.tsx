import SectionHeading from '../UI/SectionHeading';
import DispatchBoard from './DispatchBoard';
import LaneMap from './LaneMap';

export default function DispatchBoardSection() {
  return (
    <section className="section section-dark" id="lanes">
      <div className="wrap">
        <SectionHeading
          eyebrow="Where we run"
          eyebrowColor="#ff6b7a"
          description="Our freight moves the East Coast to the Midwest on a steady, repeatable network — and we're adding more lanes every couple of months."
        >
          8 lanes, running daily.
        </SectionHeading>
        <LaneMap />
        <DispatchBoard />
      </div>
    </section>
  );
}
