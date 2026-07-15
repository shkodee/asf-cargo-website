import type { EquipmentItem } from '../../types';
import Reveal from '../UI/Reveal';

type EquipmentCardProps = {
  item: EquipmentItem;
  onExpand?: () => void;
};

export default function EquipmentCard({ item, onExpand }: EquipmentCardProps) {
  return (
    <Reveal className={`equip-card${item.soon ? ' soon' : ''}`}>
      {item.image && (
        <button
          type="button"
          className="equip-img"
          onClick={onExpand}
          aria-label={`View larger image of ${item.title}`}
        >
          <img src={item.image} alt={item.title} loading="lazy" />
          <span className="equip-img-hint">Click to enlarge</span>
        </button>
      )}
      <div className={`tag${item.soon ? ' soon-tag' : ''}`}>{item.tag}</div>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </Reveal>
  );
}
