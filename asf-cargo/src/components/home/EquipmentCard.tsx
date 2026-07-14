import type { EquipmentItem } from '../../types';
import Reveal from '../UI/Reveal';

export default function EquipmentCard({ item }: { item: EquipmentItem }) {
  return (
    <Reveal className={`equip-card${item.soon ? ' soon' : ''}`}>
      <div className={`tag${item.soon ? ' soon-tag' : ''}`}>{item.tag}</div>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </Reveal>
  );
}
