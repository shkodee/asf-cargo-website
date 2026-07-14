export interface ApplicationPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  position: string;
  cdlNumber: string;
  cdlState: string;
  experience: string;
  city: string;
  message: string;
}

export interface Lane {
  idx: string;
  origin: string;
  dest: string;
  status: string;
}

export interface PayTier {
  role: string;
  rate: string;
  rateSuffix?: string;
  rateFontSize?: string;
  description: string;
  bullets: string[];
}

export interface EquipmentItem {
  tag: string;
  soon?: boolean;
  title: string;
  description: string;
}

export interface RequirementItemData {
  num: string;
  title: string;
  desc: string;
}

export interface ContactItem {
  label: string;
  type: 'tel' | 'text';
  value: string;
  href?: string;
}
