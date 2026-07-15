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
  hasCoDriver: string;
  coDriverFirstName: string;
  coDriverLastName: string;
  coDriverPhone: string;
  coDriverEmail: string;
  coDriverCity: string;
  coDriverCdlNumber: string;
  coDriverCdlState: string;
  coDriverExperience: string;
  /** Honeypot — must stay empty. Real users never see or fill this field. */
  website: string;
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
  image?: string;
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
