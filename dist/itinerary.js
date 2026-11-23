function sampleDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map(part => String(part).padStart(2, '0')).join('-');
}

export const initialDays = [
  {
    id: sampleDate(0),
    title: 'Animal Kingdom',
    subtitle: 'Sample day',
    notes: 'Edit these sample events or add your own.',
    parkId: 'animal-kingdom',
    events: [
      {
        id: 'example-trails', title: 'Discovery Island Trails', start: 570, end: 610,
        category: 'Attraction', location: 'Discovery Island Trails', locationMode: 'preset',
        placeId: 'animal-kingdom:discovery-island-trails',
        notes: 'Explore the trails around the Tree of Life.', links: [], done: false
      },
      {
        id: 'example-lunch', title: 'Lunch at Flame Tree Barbecue', start: 720, end: 780,
        category: 'Dining', location: 'Flame Tree Barbecue', locationMode: 'preset',
        placeId: 'animal-kingdom:flame-tree-barbecue',
        notes: '', links: [], done: false
      }
    ]
  },
  { id: sampleDate(1), title: 'EPCOT', subtitle: 'Sample day', notes: '', parkId: 'epcot', events: [] },
  { id: sampleDate(2), title: 'Hollywood Studios', subtitle: 'Sample day', notes: '', parkId: 'hollywood-studios', events: [] },
  { id: sampleDate(3), title: 'Magic Kingdom', subtitle: 'Sample day', notes: '', parkId: 'magic-kingdom', events: [] }
];

export const attractionSuggestions = [
  {
    "title": "Walt Disney World Railroad",
    "location": "Main Street, U.S.A.",
    "category": "Attraction",
    "duration": 20,
    "notes": "Classic steam train loop around the park; strollers must be folded on board.\nHeight: Any Height",
    "coords": [
      28.4164,
      -81.5812
    ]
  },
  {
    "title": "Meet Mickey at Town Square Theater",
    "location": "Main Street, U.S.A.",
    "category": "Show",
    "duration": 25,
    "notes": "Indoor air-conditioned character meet right inside Main Street.\nHeight: Any Height",
    "coords": [
      28.4168,
      -81.5808
    ]
  },
  {
    "title": "Casey's Corner",
    "location": "Main Street, U.S.A.",
    "category": "Dining",
    "duration": 25,
    "notes": "Mobile Order hot dogs, corn dog nuggets, and fries near the Hub.\nHeight: Any Height",
    "coords": [
      28.4181,
      -81.5816
    ]
  },
  {
    "title": "Main Street Bakery (Starbucks)",
    "location": "Main Street, U.S.A.",
    "category": "Dining",
    "duration": 15,
    "notes": "Coffee, pastries, and light breakfast bites on Main Street.\nHeight: Any Height",
    "coords": [
      28.4176,
      -81.581
    ]
  },
  {
    "title": "Jungle Cruise",
    "location": "Adventureland",
    "category": "Attraction",
    "duration": 20,
    "notes": "Guided riverboat tour with Jingle Cruise holiday overlay in late November.\nHeight: Any Height",
    "coords": [
      28.41797,
      -81.5835
    ]
  },
  {
    "title": "Pirates of the Caribbean",
    "location": "Adventureland",
    "category": "Attraction",
    "duration": 20,
    "notes": "Indoor dark boat ride with one small gentle drop.\nHeight: Any Height",
    "coords": [
      28.41808,
      -81.58432
    ]
  },
  {
    "title": "The Magic Carpets of Aladdin",
    "location": "Adventureland",
    "category": "Attraction",
    "duration": 15,
    "notes": "Gentle outdoor spinner — great for toddlers.\nHeight: Any Height",
    "coords": [
      28.41843,
      -81.58348
    ]
  },
  {
    "title": "Walt Disney's Enchanted Tiki Room",
    "location": "Adventureland",
    "category": "Show",
    "duration": 20,
    "notes": "Air-conditioned seated musical Audio-Animatronics show.\nHeight: Any Height",
    "coords": [
      28.41839,
      -81.5829
    ]
  },
  {
    "title": "Aloha Isle (Dole Whip)",
    "location": "Adventureland",
    "category": "Dining",
    "duration": 15,
    "notes": "Mobile Order Dole Whip soft-serve and pineapple floats.\nHeight: Any Height",
    "coords": [
      28.41845,
      -81.58315
    ]
  },
  {
    "title": "Big Thunder Mountain Railroad",
    "location": "Frontierland",
    "category": "Attraction",
    "duration": 20,
    "notes": "38\" minimum height — use Rider Switch for adults.\nHeight: 38\" / 97 cm",
    "coords": [
      28.42041,
      -81.58477
    ]
  },
  {
    "title": "Tiana's Bayou Adventure",
    "location": "Frontierland",
    "category": "Attraction",
    "duration": 25,
    "notes": "40\" minimum height — Rider Switch; check refurbishment status in My Disney Experience.\nHeight: 40\" / 102 cm",
    "coords": [
      28.41919,
      -81.58461
    ]
  },
  {
    "title": "Country Bear Musical Jamboree",
    "location": "Frontierland",
    "category": "Show",
    "duration": 20,
    "notes": "Air-conditioned theater show featuring Disney classics in country style.\nHeight: Any Height",
    "coords": [
      28.41895,
      -81.58365
    ]
  },
  {
    "title": "Pecos Bill Tall Tale Inn & Cafe",
    "location": "Frontierland",
    "category": "Dining",
    "duration": 35,
    "notes": "Mobile Order bowls and Tex-Mex with plenty of indoor seating.\nHeight: Any Height",
    "coords": [
      28.4187,
      -81.58405
    ]
  },
  {
    "title": "Haunted Mansion",
    "location": "Liberty Square",
    "category": "Attraction",
    "duration": 20,
    "notes": "Slow-moving Omnimover dark ride; mild spooky theming.\nHeight: Any Height",
    "coords": [
      28.42046,
      -81.58313
    ]
  },
  {
    "title": "The Hall of Presidents",
    "location": "Liberty Square",
    "category": "Show",
    "duration": 25,
    "notes": "Quiet, cool 25-minute theater show — great afternoon rest spot.\nHeight: Any Height",
    "coords": [
      28.41955,
      -81.58235
    ]
  },
  {
    "title": "Columbia Harbour House",
    "location": "Liberty Square",
    "category": "Dining",
    "duration": 35,
    "notes": "Mobile Order lobster roll, salmon, and chicken strips; quiet upstairs seating.\nHeight: Any Height",
    "coords": [
      28.4199,
      -81.58275
    ]
  },
  {
    "title": "Sleepy Hollow Refreshments",
    "location": "Liberty Square",
    "category": "Dining",
    "duration": 15,
    "notes": "Mobile Order Mickey waffles, fruit waffles, and funnel cakes near Castle bridge.\nHeight: Any Height",
    "coords": [
      28.41935,
      -81.58195
    ]
  },
  {
    "title": "Peter Pan's Flight",
    "location": "Fantasyland",
    "category": "Attraction",
    "duration": 15,
    "notes": "Top LL Premier Pass value — classic flying pirate ship over London & Never Land.\nHeight: Any Height",
    "coords": [
      28.42031,
      -81.58198
    ]
  },
  {
    "title": "\"it's a small world\"",
    "location": "Fantasyland",
    "category": "Attraction",
    "duration": 20,
    "notes": "Gentle indoor musical boat cruise — huge favorite for toddlers.\nHeight: Any Height",
    "coords": [
      28.42044,
      -81.58212
    ]
  },
  {
    "title": "The Many Adventures of Winnie the Pooh",
    "location": "Fantasyland",
    "category": "Attraction",
    "duration": 15,
    "notes": "Bouncy indoor Hunny Pot dark ride for all ages.\nHeight: Any Height",
    "coords": [
      28.42011,
      -81.58024
    ]
  },
  {
    "title": "Dumbo the Flying Elephant",
    "location": "Fantasyland",
    "category": "Attraction",
    "duration": 15,
    "notes": "Classic gentle spinner in Storybook Circus with indoor AC play tent.\nHeight: Any Height",
    "coords": [
      28.42032,
      -81.57885
    ]
  },
  {
    "title": "Under the Sea ~ Journey of The Little Mermaid",
    "location": "Fantasyland",
    "category": "Attraction",
    "duration": 15,
    "notes": "Colorful indoor clamshell dark ride — zero height limit.\nHeight: Any Height",
    "coords": [
      28.42133,
      -81.57966
    ]
  },
  {
    "title": "Seven Dwarfs Mine Train",
    "location": "Fantasyland",
    "category": "Attraction",
    "duration": 20,
    "notes": "38\" minimum height — smooth swaying family coaster; Rider Switch for adults.\nHeight: 38\" / 97 cm",
    "coords": [
      28.42056,
      -81.58
    ]
  },
  {
    "title": "Mickey's PhilharMagic",
    "location": "Fantasyland",
    "category": "Show",
    "duration": 20,
    "notes": "12-minute air-conditioned 3D musical theater show.\nHeight: Any Height",
    "coords": [
      28.42005,
      -81.58165
    ]
  },
  {
    "title": "Mad Tea Party",
    "location": "Fantasyland",
    "category": "Attraction",
    "duration": 15,
    "notes": "Spinning teacups — you control how fast (or gentle) you spin.\nHeight: Any Height",
    "coords": [
      28.41998,
      -81.57976
    ]
  },
  {
    "title": "Prince Charming Regal Carrousel",
    "location": "Fantasyland",
    "category": "Attraction",
    "duration": 15,
    "notes": "Classic carousel right behind Cinderella Castle.\nHeight: Any Height",
    "coords": [
      28.42032,
      -81.58137
    ]
  },
  {
    "title": "The Barnstormer",
    "location": "Fantasyland",
    "category": "Attraction",
    "duration": 15,
    "notes": "35\" minimum height — short junior coaster in Storybook Circus.\nHeight: 35\" / 89 cm",
    "coords": [
      28.42065,
      -81.5786
    ]
  },
  {
    "title": "Enchanted Tales with Belle",
    "location": "Fantasyland",
    "category": "Show",
    "duration": 25,
    "notes": "Interactive indoor storytelling experience with Belle.\nHeight: Any Height",
    "coords": [
      28.42112,
      -81.58109
    ]
  },
  {
    "title": "Gaston's Tavern",
    "location": "Fantasyland",
    "category": "Dining",
    "duration": 15,
    "notes": "Warm cinnamon rolls, LeFou's Brew, and quick snacks.\nHeight: Any Height",
    "coords": [
      28.42133,
      -81.58046
    ]
  },
  {
    "title": "TRON Lightcycle / Run",
    "location": "Tomorrowland",
    "category": "Attraction",
    "duration": 25,
    "notes": "48\" minimum height — high-speed launch coaster; Rider Switch for adults.\nHeight: 48\" / 122 cm",
    "coords": [
      28.4205,
      -81.5767
    ]
  },
  {
    "title": "Space Mountain",
    "location": "Tomorrowland",
    "category": "Attraction",
    "duration": 25,
    "notes": "44\" minimum height — indoor dark coaster; Rider Switch for adults.\nHeight: 44\" / 112 cm",
    "coords": [
      28.41883,
      -81.57814
    ]
  },
  {
    "title": "Buzz Lightyear's Space Ranger Spin",
    "location": "Tomorrowland",
    "category": "Attraction",
    "duration": 15,
    "notes": "Interactive indoor laser-blaster ride for all ages.\nHeight: Any Height",
    "coords": [
      28.41835,
      -81.57965
    ]
  },
  {
    "title": "Tomorrowland Transit Authority PeopleMover",
    "location": "Tomorrowland",
    "category": "Attraction",
    "duration": 15,
    "notes": "Breezy 10-minute elevated tour over Tomorrowland — great toddler break.\nHeight: Any Height",
    "coords": [
      28.4186,
      -81.57925
    ]
  },
  {
    "title": "Monsters, Inc. Laugh Floor",
    "location": "Tomorrowland",
    "category": "Show",
    "duration": 20,
    "notes": "Live interactive comedy show in an air-conditioned theater.\nHeight: Any Height",
    "coords": [
      28.41815,
      -81.57995
    ]
  },
  {
    "title": "Walt Disney's Carousel of Progress",
    "location": "Tomorrowland",
    "category": "Show",
    "duration": 25,
    "notes": "Classic 20-minute seated rotating theater show.\nHeight: Any Height",
    "coords": [
      28.41825,
      -81.57865
    ]
  },
  {
    "title": "Tomorrowland Speedway",
    "location": "Tomorrowland",
    "category": "Attraction",
    "duration": 15,
    "notes": "32\" minimum with 54\"+ companion (54\" to drive alone).\nHeight: 32\" / 81 cm",
    "coords": [
      28.41946,
      -81.57946
    ]
  },
  {
    "title": "Cosmic Ray's Starlight Cafe",
    "location": "Tomorrowland",
    "category": "Dining",
    "duration": 35,
    "notes": "Mobile Order burgers, chicken strips, and kids meals with Sonny Eclipse.\nHeight: Any Height",
    "coords": [
      28.41905,
      -81.57985
    ]
  }
];

export const magicKingdomLands = [
  {
    "name": "Main Street, U.S.A.",
    "coords": [
      28.41765,
      -81.5812
    ]
  },
  {
    "name": "Adventureland",
    "coords": [
      28.41818,
      -81.58355
    ]
  },
  {
    "name": "Frontierland",
    "coords": [
      28.41975,
      -81.58465
    ]
  },
  {
    "name": "Liberty Square",
    "coords": [
      28.42005,
      -81.58285
    ]
  },
  {
    "name": "Fantasyland",
    "coords": [
      28.4211,
      -81.58055
    ]
  },
  {
    "name": "Tomorrowland",
    "coords": [
      28.41895,
      -81.57825
    ]
  },
  {
    "name": "Entrance & Resort Transit",
    "coords": [
      28.41535,
      -81.58119
    ]
  }
];
