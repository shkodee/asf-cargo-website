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
    image: '/truck.png',
  },
  {
    tag: 'Active',
    title: 'Dry Van',
    description: 'Standard dry van freight across our East-to-Midwest lane network — steady and predictable.',
    image: '/van.png',
  },
  {
    tag: 'Coming Soon',
    soon: true,
    title: 'Flatbed',
    description: "Flatbed capacity is being added to the fleet soon — reach out if you're a flatbed driver and want to be first in line.",
    image: '/flatbed.png',
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

// Lightweight autocomplete suggestions for the "current city / state" fields — the ~200
// largest US cities, not an exhaustive dataset. Applicants can still type any value.
export const usCitySuggestions = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'Austin, TX',
  'Jacksonville, FL', 'Fort Worth, TX', 'San Jose, CA', 'Columbus, OH', 'Charlotte, NC',
  'Indianapolis, IN', 'San Francisco, CA', 'Seattle, WA', 'Denver, CO', 'Oklahoma City, OK',
  'Nashville, TN', 'El Paso, TX', 'Washington, DC', 'Boston, MA', 'Las Vegas, NV',
  'Portland, OR', 'Detroit, MI', 'Louisville, KY', 'Memphis, TN', 'Baltimore, MD',
  'Milwaukee, WI', 'Albuquerque, NM', 'Tucson, AZ', 'Fresno, CA', 'Sacramento, CA',
  'Mesa, AZ', 'Kansas City, MO', 'Atlanta, GA', 'Omaha, NE', 'Colorado Springs, CO',
  'Raleigh, NC', 'Long Beach, CA', 'Virginia Beach, VA', 'Miami, FL', 'Oakland, CA',
  'Minneapolis, MN', 'Tulsa, OK', 'Bakersfield, CA', 'Wichita, KS', 'Arlington, TX',
  'Aurora, CO', 'Tampa, FL', 'New Orleans, LA', 'Cleveland, OH', 'Honolulu, HI',
  'Anaheim, CA', 'Lexington, KY', 'Stockton, CA', 'Corpus Christi, TX', 'Henderson, NV',
  'Riverside, CA', 'Newark, NJ', 'Saint Paul, MN', 'Santa Ana, CA', 'Cincinnati, OH',
  'Irvine, CA', 'Orlando, FL', 'Pittsburgh, PA', 'St. Louis, MO', 'Greensboro, NC',
  'Jersey City, NJ', 'Anchorage, AK', 'Lincoln, NE', 'Plano, TX', 'Durham, NC',
  'Buffalo, NY', 'Chandler, AZ', 'Toledo, OH', 'Madison, WI', 'Gilbert, AZ',
  'Reno, NV', 'Fort Wayne, IN', 'North Las Vegas, NV', 'St. Petersburg, FL', 'Lubbock, TX',
  'Irving, TX', 'Laredo, TX', 'Winston-Salem, NC', 'Chesapeake, VA', 'Glendale, AZ',
  'Garland, TX', 'Scottsdale, AZ', 'Norfolk, VA', 'Boise, ID', 'Fremont, CA',
  'Baton Rouge, LA', 'Spokane, WA', 'Richmond, VA', 'San Bernardino, CA', 'Des Moines, IA',
  'Modesto, CA', 'Birmingham, AL', 'Tacoma, WA', 'Fontana, CA', 'Rochester, NY',
  'Oxnard, CA', 'Moreno Valley, CA', 'Fayetteville, NC', 'Huntington Beach, CA', 'Yonkers, NY',
  'Montgomery, AL', 'Aurora, IL', 'Akron, OH', 'Little Rock, AR', 'Amarillo, TX',
  'Augusta, GA', 'Grand Rapids, MI', 'Mobile, AL', 'Tallahassee, FL', 'Huntsville, AL',
  'Knoxville, TN', 'Worcester, MA', 'Newport News, VA', 'Brownsville, TX', 'Overland Park, KS',
  'Santa Clarita, CA', 'Providence, RI', 'Garden Grove, CA', 'Chattanooga, TN', 'Oceanside, CA',
  'Jackson, MS', 'Fort Lauderdale, FL', 'Santa Rosa, CA', 'Rancho Cucamonga, CA', 'Port St. Lucie, FL',
  'Ontario, CA', 'Vancouver, WA', 'Tempe, AZ', 'Springfield, MO', 'Lancaster, CA',
  'Eugene, OR', 'Pembroke Pines, FL', 'Salem, OR', 'Cape Coral, FL', 'Peoria, AZ',
  'Sioux Falls, SD', 'Springfield, MA', 'Elk Grove, CA', 'Rockford, IL', 'Palmdale, CA',
  'Corona, CA', 'Salinas, CA', 'Pomona, CA', 'Pasadena, TX', 'Joliet, IL',
  'Paterson, NJ', 'Kansas City, KS', 'Torrance, CA', 'Syracuse, NY', 'Bridgeport, CT',
  'Hayward, CA', 'Fort Collins, CO', 'Escondido, CA', 'Lakewood, CO', 'Naperville, IL',
  'Dayton, OH', 'Hollywood, FL', 'Alexandria, VA', 'Mesquite, TX', 'Savannah, GA',
  'Clarksville, TN', 'Orange, CA', 'Pasadena, CA', 'Fullerton, CA', 'Killeen, TX',
  'Charleston, SC', 'Frisco, TX', 'McKinney, TX', 'Warren, MI', 'Hampton, VA',
  'Columbia, SC', 'New Haven, CT', 'Sterling Heights, MI', 'Cary, NC', 'Olathe, KS',
];
