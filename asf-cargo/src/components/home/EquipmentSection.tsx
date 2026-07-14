import { equipment } from '../../data/content';
import SectionHeading from '../UI/SectionHeading';
import EquipmentCard from './EquipmentCard';

export default function EquipmentSection() {
  return (
    <section className="section" id="equipment">
      <div className="wrap">
        <SectionHeading eyebrow="Equipment" description="We keep it focused — two trailer types, run well, with a third on the way.">
          Freight we run.
        </SectionHeading>
        <div className="equip-grid">
          {equipment.map((item) => (
            <EquipmentCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
