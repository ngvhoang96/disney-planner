import { attractionSuggestions, initialDays, magicKingdomLands } from './itinerary.js';
import { additionalParkPlaces } from './park-places.js';
import { disneyPlaceLink } from './disney-place-links.js';

function place(title, category, coords, area = '') {
  return { title, category, coords, area };
}

const parkDefinitions = [
  {
    id: 'magic-kingdom', name: 'Magic Kingdom', lands: magicKingdomLands,
    places: [
      ...attractionSuggestions.map(({ title, category, coords, location, duration, notes }) =>
        ({ title, category, coords, area: location, duration, notes })),
      place('The Diamond Horseshoe', 'Dining', [28.41930, -81.58290], 'Liberty Square'),
      place('Magic Kingdom entrance', 'Travel', [28.41620, -81.58119]),
      place('Main Street, U.S.A.', 'Other', [28.41670, -81.58120]),
      place('Festival of Fantasy Parade viewing area', 'Show', [28.41955, -81.58260], 'Liberty Square')
    ]
  },
  {
    id: 'epcot', name: 'EPCOT', places: [
      place('International Gateway', 'Travel', [28.36957, -81.55295]),
      place('Remy’s Ratatouille Adventure', 'Attraction', [28.36792, -81.55286], 'France Pavilion'),
      place('Living with the Land', 'Attraction', [28.37388, -81.55289], 'The Land Pavilion'),
      place('Test Track', 'Attraction', [28.37286, -81.54722], 'World Discovery'),
      place('Sunshine Seasons', 'Dining', [28.37393, -81.55204], 'The Land Pavilion')
    ]
  },
  {
    id: 'hollywood-studios', name: 'Hollywood Studios', places: [
      place('Mickey & Minnie’s Runaway Railway', 'Attraction', [28.35626, -81.56045]),
      place('Toy Story Mania!', 'Attraction', [28.35602, -81.56134], 'Toy Story Land'),
      place('Alien Swirling Saucers', 'Attraction', [28.3557, -81.5627], 'Toy Story Land'),
      place('Slinky Dog Dash', 'Attraction', [28.35645, -81.56312], 'Toy Story Land'),
      place('The Twilight Zone Tower of Terror', 'Attraction', [28.36002, -81.55994], 'Sunset Boulevard'),
      place('Woody’s Lunch Box', 'Dining', [28.35571, -81.56221], 'Toy Story Land')
    ]
  },
  {
    id: 'animal-kingdom', name: 'Animal Kingdom', places: [
      place('Na’vi River Journey', 'Attraction', [28.35476, -81.59219], 'Pandora'),
      place('Kilimanjaro Safaris', 'Attraction', [28.35973, -81.59241], 'Africa'),
      place('Finding Nemo: The Big Blue... and Beyond!', 'Show', [28.35726, -81.58718], 'Theater in the Wild'),
      place('Avatar Flight of Passage', 'Attraction', [28.35486, -81.59283], 'Pandora'),
      place('Festival of the Lion King', 'Show', [28.35841, -81.59281], 'Harambe Theatre'),
      place('Flame Tree Barbecue', 'Dining', [28.35735, -81.58938], 'Discovery Island')
    ]
  }
];

function placeKey(name) {
  return name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const parks = parkDefinitions.map(park => ({
  ...park, lands: park.lands ?? [],
  places: [...park.places, ...additionalParkPlaces[park.id].map(fields => place(...fields))]
    .map(item => {
      const id = park.id + ':' + placeKey(item.title);
      return { ...item, id, disneyLink: disneyPlaceLink(park.id, id) };
    })
    .sort((a, b) => a.title.localeCompare(b.title))
}));
const byId = new Map(parks.map(park => [park.id, park]));
const seedParks = new Map(initialDays.filter(day => day.parkId).map(day => [day.id, day.parkId]));

export function dayPark(day) {
  if (!day) return null;
  const id = day.parkId ?? (day.suggestions === 'magic-kingdom' ? 'magic-kingdom' : seedParks.get(day.id));
  return byId.get(id) ?? null;
}

export function eventPlace(day, event) {
  const places = dayPark(day)?.places ?? [];
  if (event.placeId) return places.find(item => item.id === event.placeId);
  if (event.locationMode === 'custom') return undefined;
  const title = placeKey((event.title ?? '').replace(/^(Breakfast|Lunch|Dinner):\s*/i, ''));
  const location = placeKey(event.location ?? '');
  return places.find(item => placeKey(item.title) === title || placeKey(item.title) === location);
}
