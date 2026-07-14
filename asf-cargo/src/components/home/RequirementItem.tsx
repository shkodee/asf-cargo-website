import type { RequirementItemData } from '../../types';
import Reveal from '../UI/Reveal';

export default function RequirementItem({ item }: { item: RequirementItemData }) {
  return (
    <Reveal as="li">
      <span className="num">{item.num}</span>
      <div>
        <strong>{item.title}</strong>
        <span className="desc">{item.desc}</span>
      </div>
    </Reveal>
  );
}
