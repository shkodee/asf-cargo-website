import { useState } from 'react';
import { equipment } from '../../data/content';
import SectionHeading from '../UI/SectionHeading';
import EquipmentCard from './EquipmentCard';
import EquipmentLightbox from './EquipmentLightbox';
import type { EquipmentItem } from '../../types';

export default function EquipmentSection() {
  const [lightboxItem, setLightboxItem] = useState<EquipmentItem | null>(null);

  return (
    <section className="section" id="equipment">
      <div className="wrap">
        <SectionHeading eyebrow="Equipment" description="We keep it focused — two trailer types, run well, with a third on the way.">
          Freight we run.
        </SectionHeading>
        <div className="equip-grid">
          {equipment.map((item) => (
            <EquipmentCard key={item.title} item={item} onExpand={() => setLightboxItem(item)} />
          ))}
        </div>
      </div>
      <EquipmentLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </section>
  );
}
