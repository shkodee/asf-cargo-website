import type {
  Lane,
  PayTier,
  EquipmentItem,
  RequirementItemData,
  ContactItem,
  TeamMember,
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
  foundedYear: 2023,
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

/**
 * Real pickup/drop-off cities behind each lane, for map dot placement only —
 * never rendered as text on public pages (see PROJECT_BRIEF.md: lane detail
 * is state-level only on public pages, a deliberate client instruction).
 * `lanes` above stays state-level for all displayed text (dispatch board,
 * map labels); this is purely coordinate data for `LaneMap.tsx`.
 */
export const cityCoordinates: Record<string, [number, number]> = {
  'Memphis, TN': [-90.049, 35.1495],
  'Bayonne, NJ': [-74.1143, 40.6687],
  'Middletown, PA': [-76.7302, 40.1998],
  'Carlisle, PA': [-77.201, 40.201],
  'Ellenwood, GA': [-84.2938, 33.6001],
  'Fishkill, NY': [-73.8993, 41.5359],
  'Hodgkins, IL': [-87.8534, 41.7581],
  'Lancaster, PA': [-76.3055, 40.0379],
  'Kearny, NJ': [-74.1454, 40.7684],
  'Capitol Heights, MD': [-76.9152, 38.8898],
};

/** Maps each lane's `idx` to its city-level origin/destination keys into `cityCoordinates`. */
export const laneCities: Record<string, { origin: string; dest: string }> = {
  '01': { origin: 'Memphis, TN', dest: 'Bayonne, NJ' },
  '02': { origin: 'Memphis, TN', dest: 'Middletown, PA' },
  '03': { origin: 'Memphis, TN', dest: 'Carlisle, PA' },
  '04': { origin: 'Ellenwood, GA', dest: 'Carlisle, PA' },
  '05': { origin: 'Fishkill, NY', dest: 'Hodgkins, IL' },
  '06': { origin: 'Lancaster, PA', dest: 'Memphis, TN' },
  '07': { origin: 'Kearny, NJ', dest: 'Memphis, TN' },
  '08': { origin: 'Capitol Heights, MD', dest: 'Memphis, TN' },
};

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
    tag: 'Active',
    title: 'Reefer',
    description: 'Temperature-controlled freight — reefer loads that need to stay cold or frozen door-to-door.',
    image: '/refeer.png',
  },
  {
    tag: 'Active',
    title: 'RGN',
    description: 'Removable gooseneck trailer for heavy-haul and oversized loads that need lower deck clearance.',
    image: '/rgn.png',
  },
  {
    tag: 'Active',
    title: 'Step Deck',
    description: "Lower deck height than standard flatbed, for taller freight that won't clear normal legal limits up top.",
    image: '/stepdeck.png',
  },
  {
    tag: 'Active',
    title: 'Flatbed',
    description: 'Open-deck flatbed freight — tarped and secured loads across our lane network.',
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

export interface AboutHighlight {
  icon: 'truck' | 'layers' | 'route' | 'graduationCap' | 'headphones' | 'shieldCheck';
  title: string;
  description: string;
}

/**
 * Both of these are functions of the live lane count, not a plain array —
 * `lanes`/`lanes.length` from this file is only the static fallback (see
 * useLanes.ts), so a value baked in at module load would go stale the moment
 * the bot adds/removes a lane. Callers pass the count from useLanes() instead.
 */
export const getAboutHighlights = (laneCount: number): AboutHighlight[] => [
  {
    icon: 'truck',
    title: 'Solo & Team Driving',
    description: `Solo drivers start at ${payTiers[0].rate} ${payTiers[0].rateSuffix}; team drivers split ${payTiers[1].rate} ${payTiers[1].rateSuffix} per truck.`,
  },
  {
    icon: 'layers',
    title: 'Modern Equipment',
    description: `${equipment.length} active freight types: ${equipment.map((e) => e.title).join(', ')}.`,
  },
  {
    icon: 'route',
    title: 'Nationwide Lane Network',
    description: `${laneCount} daily lanes running the East Coast to Midwest, with more added every few months.`,
  },
  {
    icon: 'graduationCap',
    title: 'No Experience Required',
    description: 'Hold a valid CDL-A and a clean driving record — we train the rest.',
  },
  {
    icon: 'headphones',
    title: 'Dedicated Dispatch',
    description: `A direct dispatch line, not a call center — reach dispatch at ${company.dispatchPhone}.`,
  },
  {
    icon: 'shieldCheck',
    title: 'Licensed & Insured',
    description: `Registered and operating under ${company.mcNum} / ${company.dotNum}.`,
  },
];

export interface AboutStat {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export const getAboutStats = (laneCount: number): AboutStat[] => [
  { value: new Date().getFullYear() - company.foundedYear, suffix: '+', label: 'Years Running' },
  { value: laneCount, suffix: '+', label: 'Daily Lanes' },
  { value: equipment.length, label: 'Freight Types' },
  { value: 0.75, decimals: 2, prefix: '$', suffix: '/mi', label: 'Up to, Solo Pay' },
  { value: 1, decimals: 2, prefix: '$', suffix: '/mi', label: 'Up to, Team Pay' },
];

/**
 * DRAFT company story copy — client asked for a first pass to edit, not confirmed
 * marketing claims. Keep to voice/mission framing, not invented history, numbers,
 * or achievements beyond the founding year — nothing else verifiable was supplied,
 * so nothing else verifiable is asserted here.
 */
export const aboutStory: string[] = [
  `Founded in ${company.foundedYear}, ASF Cargo LLC was built around a simple idea: keep drivers loaded, keep them moving, and pay them fairly for the miles they run. We're a licensed, DOT-registered carrier (${company.mcNum} / ${company.dotNum}) running daily freight lanes across the East Coast and Midwest.`,
  "Whether you're behind the wheel solo or running as a team, we keep the freight consistent, the equipment modern, and the dispatch line answered by a real person — not a call center.",
];

export interface AboutValue {
  title: string;
  description: string;
}

export const aboutValues: AboutValue[] = [
  { title: 'Reliability', description: 'Consistent daily lanes drivers can plan their week around.' },
  { title: 'Driver-First Dispatch', description: "A dispatch team that's reachable, not a call center." },
  { title: 'Room to Grow', description: 'New CDL-A? We train you. Experienced? We keep you loaded.' },
];

/**
 * Fallback-only as of 2026-07-22: the About page's roster is now managed live
 * from the Telegram bot (see worker/worker.js's GET /roster, and
 * useTeamRoster.ts) — editing this array no longer changes what's live on the
 * site once the bot's KV data loads, same relationship `lanes` below has to
 * the live lane feed. This is shown immediately on load and kept only if that
 * fetch ever fails, plus it's the reference data the bot's KV was originally
 * seeded with.
 */
export const teamMembers: TeamMember[] = [
  {
    name: 'Hugo',
    role: 'CEO & Dispatch Manager',
    experience: '7+ yrs experience',
    image: '/team/hugo.jpg',
    bio: 'Runs the dispatch team day to day and keeps ASF’s lanes moving on schedule.',
  },
  {
    name: 'Tessa',
    role: 'Main Dispatcher',
    image: '/team/tessa.jpg',
    bio: 'First point of contact for drivers — keeps loads matched and trucks moving.',
  },
  {
    name: 'Sam',
    role: 'Dispatcher',
    image: '/team/sam.jpg',
    bio: 'Works the board daily, matching drivers to loads across the lane network.',
  },
  {
    name: 'Nate',
    role: 'Dispatcher',
    image: '/team/nate.jpg',
    bio: 'Handles day-to-day dispatch, keeping drivers informed and on the road.',
  },
  {
    name: 'Ben',
    role: 'Dispatcher & Developer',
    image: '/team/ben.jpg',
    bio: 'Splits time between dispatch and building the tools ASF runs on.',
  },
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
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Philadelphia, PA",
  "Phoenix, AZ", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA", "Austin, TX",
  "Indianapolis, IN", "Jacksonville, FL", "San Francisco, CA", "Columbus, OH", "Charlotte, NC",
  "Fort Worth, TX", "Detroit, MI", "El Paso, TX", "Memphis, TN", "Seattle, WA", "Denver, CO",
  "Washington, DC", "Boston, MA", "Nashville, TN", "Baltimore, MD", "Oklahoma City, OK",
  "Louisville, KY", "Portland, OR", "Las Vegas, NV", "Milwaukee, WI", "Albuquerque, NM",
  "Tucson, AZ", "Fresno, CA", "Sacramento, CA", "Long Beach, CA", "Kansas City, MO", "Mesa, AZ",
  "Virginia Beach, VA", "Atlanta, GA", "Colorado Springs, CO", "Omaha, NE", "Raleigh, NC",
  "Miami, FL", "Oakland, CA", "Minneapolis, MN", "Tulsa, OK", "Cleveland, OH", "Wichita, KS",
  "Arlington, TX", "New Orleans, LA", "Bakersfield, CA", "Tampa, FL", "Honolulu, HI",
  "Aurora, CO", "Anaheim, CA", "Santa Ana, CA", "St. Louis, MO", "Riverside, CA",
  "Corpus Christi, TX", "Lexington-Fayette, KY", "Pittsburgh, PA", "Anchorage, AK",
  "Stockton, CA", "Cincinnati, OH", "St. Paul, MN", "Toledo, OH", "Greensboro, NC", "Newark, NJ",
  "Plano, TX", "Henderson, NV", "Lincoln, NE", "Buffalo, NY", "Jersey City, NJ",
  "Chula Vista, CA", "Fort Wayne, IN", "Orlando, FL", "St. Petersburg, FL", "Chandler, AZ",
  "Laredo, TX", "Norfolk, VA", "Durham, NC", "Madison, WI", "Lubbock, TX", "Irvine, CA",
  "Winston-Salem, NC", "Glendale, AZ", "Garland, TX", "Hialeah, FL", "Reno, NV",
  "Chesapeake, VA", "Gilbert, AZ", "Baton Rouge, LA", "Irving, TX", "Scottsdale, AZ",
  "North Las Vegas, NV", "Fremont, CA", "Boise City, ID", "Richmond, VA", "San Bernardino, CA",
  "Birmingham, AL", "Spokane, WA", "Rochester, NY", "Des Moines, IA", "Modesto, CA",
  "Fayetteville, NC", "Tacoma, WA", "Oxnard, CA", "Fontana, CA", "Columbus, GA",
  "Montgomery, AL", "Moreno Valley, CA", "Shreveport, LA", "Aurora, IL", "Yonkers, NY",
  "Akron, OH", "Huntington Beach, CA", "Little Rock, AR", "Augusta-Richmond County, GA",
  "Amarillo, TX", "Glendale, CA", "Mobile, AL", "Grand Rapids, MI", "Salt Lake City, UT",
  "Tallahassee, FL", "Huntsville, AL", "Grand Prairie, TX", "Knoxville, TN", "Worcester, MA",
  "Newport News, VA", "Brownsville, TX", "Overland Park, KS", "Santa Clarita, CA",
  "Providence, RI", "Garden Grove, CA", "Chattanooga, TN", "Oceanside, CA", "Jackson, MS",
  "Fort Lauderdale, FL", "Santa Rosa, CA", "Rancho Cucamonga, CA", "Port St. Lucie, FL",
  "Tempe, AZ", "Ontario, CA", "Vancouver, WA", "Cape Coral, FL", "Sioux Falls, SD",
  "Springfield, MO", "Peoria, AZ", "Pembroke Pines, FL", "Elk Grove, CA", "Salem, OR",
  "Lancaster, CA", "Corona, CA", "Eugene, OR", "Palmdale, CA", "Salinas, CA", "Springfield, MA",
  "Pasadena, TX", "Fort Collins, CO", "Hayward, CA", "Pomona, CA", "Cary, NC", "Rockford, IL",
  "Alexandria, VA", "Escondido, CA", "McKinney, TX", "Kansas City, KS", "Joliet, IL",
  "Sunnyvale, CA", "Torrance, CA", "Bridgeport, CT", "Lakewood, CO", "Hollywood, FL",
  "Paterson, NJ", "Naperville, IL", "Syracuse, NY", "Mesquite, TX", "Dayton, OH", "Savannah, GA",
  "Clarksville, TN", "Orange, CA", "Pasadena, CA", "Fullerton, CA", "Killeen, TX", "Frisco, TX",
  "Hampton, VA", "McAllen, TX", "Warren, MI", "Bellevue, WA", "West Valley City, UT",
  "Columbia, SC", "Olathe, KS", "Sterling Heights, MI", "New Haven, CT", "Miramar, FL",
  "Waco, TX", "Thousand Oaks, CA", "Cedar Rapids, IA", "Charleston, SC", "Visalia, CA",
  "Topeka, KS", "Elizabeth, NJ", "Gainesville, FL", "Thornton, CO", "Roseville, CA",
  "Carrollton, TX", "Coral Springs, FL", "Stamford, CT", "Simi Valley, CA", "Concord, CA",
  "Hartford, CT", "Kent, WA", "Lafayette, LA", "Midland, TX", "Surprise, AZ", "Denton, TX",
  "Victorville, CA", "Evansville, IN", "Santa Clara, CA", "Abilene, TX",
  "Athens-Clarke County, GA", "Vallejo, CA", "Allentown, PA", "Norman, OK", "Beaumont, TX",
  "Independence, MO", "Murfreesboro, TN", "Ann Arbor, MI", "Springfield, IL", "Berkeley, CA",
  "Peoria, IL", "Provo, UT", "El Monte, CA", "Columbia, MO", "Lansing, MI", "Fargo, ND",
  "Downey, CA", "Costa Mesa, CA", "Wilmington, NC", "Arvada, CO", "Inglewood, CA",
  "Miami Gardens, FL", "Carlsbad, CA", "Westminster, CO", "Rochester, MN", "Odessa, TX",
  "Manchester, NH", "Elgin, IL", "West Jordan, UT", "Round Rock, TX", "Clearwater, FL",
  "Waterbury, CT", "Gresham, OR", "Fairfield, CA", "Billings, MT", "Lowell, MA",
  "San Buenaventura (Ventura), CA", "Pueblo, CO", "High Point, NC", "West Covina, CA",
  "Richmond, CA", "Murrieta, CA", "Cambridge, MA", "Antioch, CA", "Temecula, CA", "Norwalk, CA",
  "Centennial, CO", "Everett, WA", "Wichita Falls, TX", "Palm Bay, FL", "Green Bay, WI",
  "Daly City, CA", "Burbank, CA", "Richardson, TX", "Pompano Beach, FL", "North Charleston, SC",
  "Broken Arrow, OK", "Boulder, CO", "West Palm Beach, FL", "Santa Maria, CA", "El Cajon, CA",
  "Davenport, IA", "Rialto, CA", "Las Cruces, NM", "San Mateo, CA", "Lewisville, TX",
  "South Bend, IN", "Lakeland, FL", "Erie, PA", "Tyler, TX", "Pearland, TX",
  "College Station, TX", "Kenosha, WI", "Sandy Springs, GA", "Clovis, CA", "Flint, MI",
  "Roanoke, VA", "Albany, NY", "Jurupa Valley, CA", "Compton, CA", "San Angelo, TX",
  "Hillsboro, OR", "Lawton, OK", "Renton, WA", "Vista, CA", "Davie, FL", "Greeley, CO",
  "Mission Viejo, CA", "Portsmouth, VA", "Dearborn, MI", "South Gate, CA", "Tuscaloosa, AL",
  "Livonia, MI", "New Bedford, MA", "Vacaville, CA", "Brockton, MA", "Roswell, GA",
  "Beaverton, OR", "Quincy, MA", "Sparks, NV", "Yakima, WA", "Lee's Summit, MO",
  "Federal Way, WA", "Carson, CA", "Santa Monica, CA", "Hesperia, CA", "Allen, TX",
  "Rio Rancho, NM", "Yuma, AZ", "Westminster, CA", "Orem, UT", "Lynn, MA", "Redding, CA",
  "Spokane Valley, WA", "Miami Beach, FL", "League City, TX", "Lawrence, KS",
  "Santa Barbara, CA", "Plantation, FL", "Sandy, UT", "Sunrise, FL", "Macon, GA", "Longmont, CO",
  "Boca Raton, FL", "San Marcos, CA", "Greenville, NC", "Waukegan, IL", "Fall River, MA",
  "Chico, CA", "Newton, MA", "San Leandro, CA", "Reading, PA", "Norwalk, CT", "Fort Smith, AR",
  "Newport Beach, CA", "Asheville, NC", "Nashua, NH", "Edmond, OK", "Whittier, CA", "Nampa, ID",
  "Bloomington, MN", "Deltona, FL", "Hawthorne, CA", "Duluth, MN", "Carmel, IN", "Suffolk, VA",
  "Clifton, NJ", "Citrus Heights, CA", "Livermore, CA", "Tracy, CA", "Alhambra, CA",
  "Kirkland, WA", "Trenton, NJ", "Ogden, UT", "Hoover, AL", "Cicero, IL", "Fishers, IN",
  "Sugar Land, TX", "Danbury, CT", "Meridian, ID", "Indio, CA", "Concord, NC", "Menifee, CA",
  "Champaign, IL", "Buena Park, CA", "Troy, MI", "O'Fallon, MO", "Johns Creek, GA",
  "Bellingham, WA", "Westland, MI", "Bloomington, IN", "Sioux City, IA", "Warwick, RI",
  "Hemet, CA", "Longview, TX", "Farmington Hills, MI", "Bend, OR", "Lakewood, CA", "Merced, CA",
  "Mission, TX", "Chino, CA", "Redwood City, CA", "Edinburg, TX", "Cranston, RI", "Parma, OH",
  "New Rochelle, NY", "Lake Forest, CA", "Napa, CA", "Hammond, IN", "Fayetteville, AR",
  "Bloomington, IL", "Avondale, AZ", "Somerville, MA", "Palm Coast, FL", "Bryan, TX", "Gary, IN",
  "Largo, FL", "Brooklyn Park, MN", "Tustin, CA", "Racine, WI", "Deerfield Beach, FL",
  "Lynchburg, VA", "Mountain View, CA", "Medford, OR", "Lawrence, MA", "Bellflower, CA",
  "Melbourne, FL", "St. Joseph, MO", "Camden, NJ", "St. George, UT", "Kennewick, WA",
  "Baldwin Park, CA", "Chino Hills, CA", "Alameda, CA", "Albany, GA", "Arlington Heights, IL",
  "Scranton, PA", "Evanston, IL", "Kalamazoo, MI", "Baytown, TX", "Upland, CA", "Springdale, AR",
  "Bethlehem, PA", "Schaumburg, IL", "Mount Pleasant, SC", "Auburn, WA", "Decatur, IL",
  "San Ramon, CA", "Pleasanton, CA", "Wyoming, MI", "Lake Charles, LA", "Plymouth, MN",
  "Bolingbrook, IL", "Pharr, TX", "Appleton, WI", "Gastonia, NC", "Folsom, CA", "Southfield, MI",
  "Rochester Hills, MI", "New Britain, CT", "Goodyear, AZ", "Canton, OH", "Warner Robins, GA",
  "Union City, CA", "Perris, CA", "Manteca, CA", "Iowa City, IA", "Jonesboro, AR",
  "Wilmington, DE", "Lynwood, CA", "Loveland, CO", "Pawtucket, RI", "Boynton Beach, FL",
  "Waukesha, WI", "Gulfport, MS", "Apple Valley, CA", "Passaic, NJ", "Rapid City, SD",
  "Layton, UT", "Lafayette, IN", "Turlock, CA", "Muncie, IN", "Temple, TX", "Missouri City, TX",
  "Redlands, CA", "Santa Fe, NM", "Lauderhill, FL", "Milpitas, CA", "Palatine, IL",
  "Missoula, MT", "Rock Hill, SC", "Jacksonville, NC", "Franklin, TN", "Flagstaff, AZ",
  "Flower Mound, TX", "Weston, FL", "Waterloo, IA", "Union City, NJ", "Mount Vernon, NY",
  "Fort Myers, FL", "Dothan, AL", "Rancho Cordova, CA", "Redondo Beach, CA", "Jackson, TN",
  "Pasco, WA", "St. Charles, MO", "Eau Claire, WI", "North Richland Hills, TX", "Bismarck, ND",
  "Yorba Linda, CA", "Kenner, LA", "Walnut Creek, CA", "Frederick, MD", "Oshkosh, WI",
  "Pittsburg, CA", "Palo Alto, CA", "Bossier City, LA", "Portland, ME", "St. Cloud, MN",
  "Davis, CA", "South San Francisco, CA", "Camarillo, CA", "North Little Rock, AR",
  "Schenectady, NY", "Gaithersburg, MD", "Harlingen, TX", "Woodbury, MN", "Eagan, MN",
  "Yuba City, CA", "Maple Grove, MN", "Youngstown, OH", "Skokie, IL", "Kissimmee, FL",
  "Johnson City, TN", "Victoria, TX", "San Clemente, CA", "Bayonne, NJ", "Laguna Niguel, CA",
  "East Orange, NJ", "Shawnee, KS", "Homestead, FL", "Delray Beach, FL", "Rockville, MD",
  "Janesville, WI", "Conway, AR", "Pico Rivera, CA", "Lorain, OH", "Montebello, CA", "Lodi, CA",
  "New Braunfels, TX", "Marysville, WA", "Tamarac, FL", "Madera, CA", "Conroe, TX",
  "Santa Cruz, CA", "Eden Prairie, MN", "Cheyenne, WY", "Daytona Beach, FL", "Alpharetta, GA",
  "Hamilton, OH", "Waltham, MA", "Coon Rapids, MN", "Haverhill, MA", "Council Bluffs, IA",
  "Taylor, MI", "Utica, NY", "Ames, IA", "La Habra, CA", "Encinitas, CA", "Bowling Green, KY",
  "Burnsville, MN", "Greenville, SC", "West Des Moines, IA", "Cedar Park, TX", "Tulare, CA",
  "Monterey Park, CA", "Vineland, NJ", "Terre Haute, IN", "North Miami, FL", "Mansfield, TX",
  "West Allis, WI", "Bristol, CT", "Taylorsville, UT", "Malden, MA", "Meriden, CT", "Blaine, MN",
  "Wellington, FL", "Cupertino, CA", "Springfield, OR", "Rogers, AR", "St. Clair Shores, MI",
  "Gardena, CA", "Pontiac, MI", "National City, CA", "Grand Junction, CO", "Rocklin, CA",
  "Chapel Hill, NC", "Casper, WY", "Broomfield, CO", "Petaluma, CA", "South Jordan, UT",
  "Springfield, OH", "Great Falls, MT", "Lancaster, PA", "North Port, FL", "Lakewood, WA",
  "Marietta, GA", "San Rafael, CA", "Royal Oak, MI", "Des Plaines, IL", "Huntington Park, CA",
  "La Mesa, CA", "Orland Park, IL", "Auburn, AL", "Lakeville, MN", "Owensboro, KY", "Moore, OK",
  "Jupiter, FL", "Idaho Falls, ID", "Dubuque, IA", "Bartlett, TN", "Rowlett, TX", "Novi, MI",
  "White Plains, NY", "Arcadia, CA", "Redmond, WA", "Lake Elsinore, CA", "Ocala, FL",
  "Tinley Park, IL", "Port Orange, FL", "Medford, MA", "Oak Lawn, IL", "Rocky Mount, NC",
  "Kokomo, IN", "Coconut Creek, FL", "Bowie, MD", "Berwyn, IL", "Midwest City, OK",
  "Fountain Valley, CA", "Buckeye, AZ", "Dearborn Heights, MI", "Woodland, CA",
  "Noblesville, IN", "Valdosta, GA", "Diamond Bar, CA", "Manhattan, KS", "Santee, CA",
  "Taunton, MA", "Sanford, FL", "Kettering, OH", "New Brunswick, NJ", "Decatur, AL",
  "Chicopee, MA", "Anderson, IN", "Margate, FL", "Weymouth Town, MA", "Hempstead, NY",
  "Corvallis, OR", "Eastvale, CA", "Porterville, CA", "West Haven, CT", "Brentwood, CA",
  "Paramount, CA", "Grand Forks, ND", "Georgetown, TX", "St. Peters, MO", "Shoreline, WA",
  "Mount Prospect, IL", "Hanford, CA", "Normal, IL", "Rosemead, CA", "Lehi, UT", "Pocatello, ID",
  "Highland, CA", "Novato, CA", "Port Arthur, TX", "Carson City, NV", "San Marcos, TX",
  "Hendersonville, TN", "Elyria, OH", "Revere, MA", "Pflugerville, TX", "Greenwood, IN",
  "Bellevue, NE", "Wheaton, IL", "Smyrna, GA", "Sarasota, FL", "Blue Springs, MO", "Colton, CA",
  "Euless, TX", "Castle Rock, CO", "Cathedral City, CA", "Kingsport, TN", "Lake Havasu City, AZ",
  "Pensacola, FL", "Hoboken, NJ", "Yucaipa, CA", "Watsonville, CA", "Richland, WA", "Delano, CA",
  "Hoffman Estates, IL", "Florissant, MO", "Placentia, CA", "West New York, NJ", "Dublin, CA",
  "Oak Park, IL", "Peabody, MA", "Perth Amboy, NJ", "Battle Creek, MI", "Bradenton, FL",
  "Gilroy, CA", "Milford, CT", "Albany, OR", "Ankeny, IA", "La Crosse, WI", "Burlington, NC",
  "DeSoto, TX", "Harrisonburg, VA", "Minnetonka, MN", "Elkhart, IN", "Lakewood, OH",
  "Glendora, CA", "Southaven, MS", "Charleston, WV", "Joplin, MO", "Enid, OK",
  "Palm Beach Gardens, FL", "Brookhaven, GA", "Plainfield, NJ", "Grand Island, NE",
  "Palm Desert, CA", "Huntersville, NC", "Tigard, OR", "Lenexa, KS", "Saginaw, MI",
  "Kentwood, MI", "Doral, FL", "Apple Valley, MN", "Grapevine, TX", "Aliso Viejo, CA",
  "Sammamish, WA", "Casa Grande, AZ", "Pinellas Park, FL", "Troy, NY", "West Sacramento, CA",
  "Burien, WA", "Commerce City, CO", "Monroe, LA", "Cerritos, CA", "Downers Grove, IL",
  "Coral Gables, FL", "Wilson, NC", "Niagara Falls, NY", "Poway, CA", "Edina, MN",
  "Cuyahoga Falls, OH", "Rancho Santa Margarita, CA", "Harrisburg, PA", "Huntington, WV",
  "La Mirada, CA", "Cypress, CA", "Caldwell, ID", "Logan, UT", "Galveston, TX", "Sheboygan, WI",
  "Middletown, OH", "Murray, UT", "Roswell, NM", "Parker, CO", "Bedford, TX", "East Lansing, MI",
  "Methuen, MA", "Covina, CA", "Alexandria, LA", "Olympia, WA", "Euclid, OH", "Mishawaka, IN",
  "Salina, KS", "Azusa, CA", "Newark, OH", "Chesterfield, MO", "Leesburg, VA", "Dunwoody, GA",
  "Hattiesburg, MS", "Roseville, MI", "Bonita Springs, FL", "Portage, MI", "St. Louis Park, MN",
  "Collierville, TN", "Middletown, CT", "Stillwater, OK", "East Providence, RI", "Lawrence, IN",
  "Wauwatosa, WI", "Mentor, OH", "Ceres, CA", "Cedar Hill, TX", "Mansfield, OH",
  "Binghamton, NY", "Coeur d'Alene, ID", "San Luis Obispo, CA", "Minot, ND", "Palm Springs, CA",
  "Pine Bluff, AR", "Texas City, TX", "Summerville, SC", "Twin Falls, ID", "Jeffersonville, IN",
  "San Jacinto, CA", "Madison, AL", "Altoona, PA", "Columbus, IN", "Beavercreek, OH",
  "Apopka, FL", "Elmhurst, IL", "Maricopa, AZ", "Farmington, NM", "Glenview, IL",
  "Cleveland Heights, OH", "Draper, UT", "Lincoln, CA", "Sierra Vista, AZ", "Lacey, WA",
  "Biloxi, MS", "Strongsville, OH", "Barnstable Town, MA", "Wylie, TX", "Sayreville, NJ",
  "Kannapolis, NC", "Charlottesville, VA", "Littleton, CO", "Titusville, FL", "Hackensack, NJ",
  "Newark, CA", "Pittsfield, MA", "York, PA", "Lombard, IL", "Attleboro, MA", "DeKalb, IL",
  "Blacksburg, VA", "Dublin, OH", "Haltom City, TX", "Lompoc, CA", "El Centro, CA",
  "Danville, CA", "Jefferson City, MO", "Cutler Bay, FL", "Oakland Park, FL",
  "North Miami Beach, FL", "Freeport, NY", "Moline, IL", "Coachella, CA", "Fort Pierce, FL",
  "Smyrna, TN", "Bountiful, UT", "Fond du Lac, WI", "Everett, MA", "Danville, VA", "Keller, TX",
  "Belleville, IL", "Bell Gardens, CA", "Cleveland, TN", "North Lauderdale, FL", "Fairfield, OH",
  "Salem, MA", "Rancho Palos Verdes, CA", "San Bruno, CA", "Concord, NH", "Burlington, VT",
  "Apex, NC", "Midland, MI", "Altamonte Springs, FL", "Hutchinson, KS", "Buffalo Grove, IL",
  "Urbandale, IA", "State College, PA", "Urbana, IL", "Plainfield, IL", "Manassas, VA",
  "Bartlett, IL", "Kearny, NJ", "Oro Valley, AZ", "Findlay, OH", "Rohnert Park, CA",
  "Westfield, MA", "Linden, NJ", "Sumter, SC", "Wilkes-Barre, PA", "Woonsocket, RI",
  "Leominster, MA", "Shelton, CT", "Brea, CA", "Covington, KY", "Rockwall, TX", "Riverton, UT",
  "Meridian, MS", "St. Cloud, FL", "Quincy, IL", "Morgan Hill, CA", "Warren, OH", "Edmonds, WA",
  "Burleson, TX", "Beverly, MA", "Mankato, MN", "Hagerstown, MD", "Prescott, AZ", "Campbell, CA",
  "Cedar Falls, IA", "Beaumont, CA", "La Puente, CA", "Crystal Lake, IL", "Fitchburg, MA",
  "Carol Stream, IL", "Hickory, NC", "Streamwood, IL", "Norwich, CT", "Coppell, TX",
  "San Gabriel, CA", "Holyoke, MA", "Bentonville, AR", "Peachtree Corners, GA", "Florence, AL",
  "Brentwood, TN", "Bozeman, MT", "New Berlin, WI", "Goose Creek, SC", "Huntsville, TX",
  "Prescott Valley, AZ", "Maplewood, MN", "Romeoville, IL", "Duncanville, TX",
  "Atlantic City, NJ", "Clovis, NM", "The Colony, TX", "Culver City, CA", "Marlborough, MA",
  "Hilton Head Island, SC", "Moorhead, MN", "Calexico, CA", "Bullhead City, AZ",
  "Germantown, TN", "La Quinta, CA", "Lancaster, OH", "Wausau, WI", "Sherman, TX", "Ocoee, FL",
  "Shakopee, MN", "Woburn, MA", "Bremerton, WA", "Rock Island, IL", "Muskogee, OK",
  "Cape Girardeau, MO", "Annapolis, MD", "Greenacres, FL", "Ormond Beach, FL",
  "Hallandale Beach, FL", "Stanton, CA", "Puyallup, WA", "Pacifica, CA", "Hanover Park, IL",
  "Hurst, TX", "Lima, OH", "Marana, AZ", "Carpentersville, IL", "Oakley, CA",
  "Huber Heights, OH", "Lancaster, TX", "Montclair, CA", "Wheeling, IL", "Brookfield, WI",
  "Park Ridge, IL", "Florence, SC", "Roy, UT", "Winter Garden, FL", "Chelsea, MA",
  "Valley Stream, NY", "Spartanburg, SC", "Lake Oswego, OR", "Friendswood, TX",
  "Westerville, OH", "Northglenn, CO", "Phenix City, AL", "Grove City, OH", "Texarkana, TX",
  "Addison, IL", "Dover, DE", "Lincoln Park, MI", "Calumet City, IL", "Muskegon, MI",
  "Aventura, FL", "Martinez, CA", "Greenfield, WI", "Apache Junction, AZ", "Monrovia, CA",
  "Weslaco, TX", "Keizer, OR", "Spanish Fork, UT", "Beloit, WI", "Panama City, FL",
  "Middletown, PA", "Carlisle, PA", "Ellenwood, GA", "Fishkill, NY", "Hodgkins, IL",
  "Capitol Heights, MD",
];
