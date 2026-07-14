import type {
  Lane,
  PayTier,
  EquipmentItem,
  RequirementItemData,
  ContactItem,
} from '../types';

export const company = {
  name: 'ASF Cargo LLC',
  officePhone: '+1 (412) 588-1575',
  officePhoneHref: 'tel:14125881575',
  dispatchPhone: '+1 (412) 588-1683',
  dispatchPhoneHref: 'tel:14125881683',
  address1: '5850 Cameron Run Terrace',
  address2: 'Alexandria, VA 22303',
  mc: 'MC 1578558',
  dot: 'DOT 4125298',
  mcNum: 'MC# 1578558',
  dotNum: 'DOT# 4125298',
};

export const lanes: Lane[] = [
  { idx: '01', origin: 'Tennessee', dest: 'New Jersey', status: 'Daily' },
  { idx: '02', origin: 'Tennessee', dest: 'Pennsylvania', status: 'Daily' },
  { idx: '03', origin: 'Tennessee', dest: 'Pennsylvania', status: 'Daily' },
  { idx: '04', origin: 'Georgia', dest: 'Pennsylvania', status: 'Daily' },
  { idx: '05', origin: 'New York', dest: 'Illinois', status: 'Daily' },
  { idx: '06', origin: 'Pennsylvania', dest: 'Tennessee', status: 'Daily' },
  { idx: '07', origin: 'New Jersey', dest: 'Tennessee', status: 'Daily' },
  { idx: '08', origin: 'Maryland', dest: 'Tennessee', status: 'Daily' },
];

export const payTiers: PayTier[] = [
  {
    role: 'Solo Driver',
    rate: '0.65–0.75',
    rateSuffix: '$ / mile',
    description: 'Starting rate for experienced drivers. Run your own truck, your own pace.',
    bullets: ['Power-only & dry van freight', 'Consistent East → Midwest lanes', 'CDL-A, no experience required'],
  },
  {
    role: 'Team Drivers',
    rate: 'Up to 1.00',
    rateSuffix: '$ / mile',
    description: 'Split per truck. Keep the wheels turning and the miles stacking.',
    bullets: ['Higher weekly mileage', 'Same daily lane network', 'Great for driving partners'],
  },
  {
    role: 'New to the Wheel?',
    rate: 'We Train You',
    rateFontSize: '2rem',
    description: "Hold a CDL-A but light on miles? That's fine — come drive with us.",
    bullets: ['Valid CDL-A required', 'No experience necessary', 'Clean MVR, ready to work'],
  },
];

export const equipment: EquipmentItem[] = [
  {
    tag: 'Active',
    title: 'Power-Only',
    description: 'Hook, haul, and drop. Power-only freight keeps you moving without waiting on trailer turnaround.',
  },
  {
    tag: 'Active',
    title: 'Dry Van',
    description: 'Standard dry van freight across our East-to-Midwest lane network — steady and predictable.',
  },
  {
    tag: 'Coming Soon',
    soon: true,
    title: 'Flatbed',
    description: "Flatbed capacity is being added to the fleet soon — reach out if you're a flatbed driver and want to be first in line.",
  },
];

export const requirements: RequirementItemData[] = [
  { num: '01', title: 'Valid CDL-A', desc: "Class A commercial driver's license in good standing." },
  { num: '02', title: 'No experience required', desc: "New to driving professionally? We'll train you." },
  { num: '03', title: 'Clean driving record', desc: 'Safe, reliable driving history.' },
  { num: '04', title: 'Ready for the road', desc: 'Able to meet DOT physical and background check standards.' },
];

export const contactItems: ContactItem[] = [
  { label: 'Office', type: 'tel', value: company.officePhone, href: company.officePhoneHref },
  { label: 'Dispatch', type: 'tel', value: company.dispatchPhone, href: company.dispatchPhoneHref },
  { label: 'Address', type: 'text', value: `${company.address1}<br>${company.address2}` },
  { label: 'Registration', type: 'text', value: `${company.mcNum}<br>${company.dotNum}` },
];

export const experienceOptions = [
  'No experience — new CDL-A',
  'Less than 1 year',
  '1–2 years',
  '3–5 years',
  '5+ years',
];

export const positionOptions = ['Solo Driver', 'Team Driver', 'Not sure yet'];

export const coDriverOptions = [
  'I already have a co-driver',
  'I need to be paired with a co-driver',
];
