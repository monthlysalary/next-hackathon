export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const SINGAPORE_AREAS = [
  'Tampines',
  'Jurong East',
  'Woodlands',
  'Orchard',
  'Bishan',
  'Ang Mo Kio',
  'Bedok',
  'Clementi',
  'Punggol',
  'Toa Payoh',
  'Novena',
  'Bugis',
  'Chinatown',
  'Marina Bay',
  'Jurong West',
  'Sengkang',
  'Hougang',
  'Yishun',
  'Pasir Ris',
  'Buona Vista',
  'Serangoon',
  'Kallang',
  'Paya Lebar',
  'Dhoby Ghaut',
  'Boon Lay',
]

export const BUDGET_OPTIONS = ['< S$10', 'S$10–20', 'S$20–35', '> S$35']

export const DIETARY_OPTIONS = [
  'Halal',
  'Veg',
  'Vegan',
  'No Pork',
  'No Beef',
  'No Shellfish',
  'No Nuts',
  'No Dairy',
  'None',
]

export const CUISINE_OPTIONS = [
  'Chinese',
  'Malay',
  'Indian',
  'Western',
  'Japanese',
  'Korean',
  'Thai',
  'Any',
]

export const MUST_HAVE_OPTIONS = [
  'Aircon',
  'Big tables',
  'Quiet',
  'Halal-cert',
  'Parking',
]

export const AVOID_OPTIONS = ['Crowded', 'Loud', 'Stairs']

export const EMPTY_PERSON = {
  name: '',
  location: '',
  budget: 'S$10–20',
  dietary: [],
  cuisine_loves: [],
  must_have: [],
  avoid: [],
}

export const DEMO_PERSONS = [
  {
    name: 'Wei Ling',
    location: 'Tampines',
    latitude: 1.3496,
    longitude: 103.9568,
    budget: 'S$10–20',
    dietary: ['Halal'],
    cuisine_loves: ['Chinese', 'Malay'],
    must_have: [],
    avoid: [],
  },
  {
    name: 'Rajan',
    location: 'Jurong East',
    latitude: 1.3329,
    longitude: 103.7436,
    budget: 'S$10–20',
    dietary: ['No Beef'],
    cuisine_loves: ['Indian', 'Any'],
    must_have: [],
    avoid: [],
  },
  {
    name: 'Sarah',
    location: 'Woodlands',
    latitude: 1.4382,
    longitude: 103.789,
    budget: 'S$20–35',
    dietary: ['Veg'],
    cuisine_loves: ['Any'],
    must_have: [],
    avoid: [],
  },
  {
    name: 'Marcus',
    location: 'Bedok',
    latitude: 1.324,
    longitude: 103.93,
    budget: '< S$10',
    dietary: ['None'],
    cuisine_loves: ['Chinese', 'Western'],
    must_have: [],
    avoid: [],
  },
]

export const DEMO_RESULT = {
  session_id: 'demo-session',
  suggested_area: 'Bishan',
  area_reason:
    'Bishan is the most MRT-accessible midpoint, sitting on the Circle and North-South lines.',
  travel_summary: {
    'Wei Ling': '~22 min via East-West + Circle line',
    Rajan: '~25 min via East-West + North-South line',
    Sarah: '~20 min via North-South line',
    Marcus: '~28 min via East-West + Circle line',
  },
  restaurants: [
    {
      name: 'Hjh Maimunah Restaurant',
      area: 'Jalan Pisang (near Bugis)',
      address: '11 & 15 Jalan Pisang, Singapore',
      cuisine: 'Malay / Nasi Padang',
      price_range: 'S$8–14 per pax',
      tags: [
        'halal-certified',
        'no pork',
        'vegetarian options',
        'cash only',
        'big tables',
        'lively',
      ],
      satisfies: ['Wei Ling', 'Rajan', 'Sarah', 'Marcus'],
      match_score: 91,
      summary:
        'Famous for its authentic nasi padang with generous portions and a huge variety of dishes. Gets very crowded at peak hours with long queues.',
      why_this_group:
        "Halal-certified and offers vegetarian dishes, fits everyone's budget, and is a must-try local institution.",
      deal: null,
      maps_url: 'https://maps.google.com/?q=Hjh+Maimunah+Singapore',
      latitude: 1.3009,
      longitude: 103.8559,
      photo_url: 'https://burpple.com/hjh-maimunah',
      opening_hours: 'Mon-Sat 7:00 AM - 8:00 PM, closed Sun',
      reservation_url: 'https://www.chope.co/singapore-restaurants/restaurant/hjh-maimunah-restaurant-jalan-pisang',
    },
    {
      name: 'Komala Vilas',
      area: 'Little India',
      address: '76-78 Serangoon Road, Singapore',
      cuisine: 'South Indian Vegetarian',
      price_range: 'S$6–12 per pax',
      tags: [
        'vegetarian',
        'vegan-friendly',
        'no beef',
        'halal-friendly',
        'aircon available',
        'accepts card',
        'student deal',
      ],
      satisfies: ['Wei Ling', 'Rajan', 'Sarah', 'Marcus'],
      match_score: 87,
      summary:
        'A Singapore institution for vegetarian South Indian food, beloved for its thosai and banana leaf meals. The aircon section can feel rushed during lunch.',
      why_this_group:
        "100% vegetarian satisfies Sarah and Rajan's no-beef requirement, well within everyone's budget, and has a student discount.",
      deal: '10% off with valid student ID',
      maps_url: 'https://maps.google.com/?q=Komala+Vilas+Singapore',
      latitude: 1.3065,
      longitude: 103.8512,
      photo_url: 'https://burpple.com/komala-vilas',
      opening_hours: '7:00 AM - 10:30 PM daily',
      reservation_url: 'https://www.chope.co/singapore-restaurants/restaurant/komala-vilas-serangoon-road',
    },
    {
      name: 'Bishan North Food Centre',
      area: 'Bishan',
      address: 'Bishan North, Singapore',
      cuisine: 'Hawker / Mixed',
      price_range: 'S$4–10 per pax',
      tags: [
        'halal stalls',
        'vegetarian stalls',
        'no pork options',
        'cash',
        'PayNow',
        'outdoor seating',
        'big tables',
      ],
      satisfies: ['Wei Ling', 'Rajan', 'Sarah', 'Marcus'],
      match_score: 82,
      summary:
        'A well-maintained hawker centre with a wide variety of stalls including halal, Chinese, Indian and Western options. Outdoor seating can be warm in the afternoon.',
      why_this_group:
        'Right at the suggested meetup point, has options for every dietary need, and easily fits Marcus\'s tight budget.',
      deal: null,
      maps_url: 'https://maps.google.com/?q=Bishan+North+Food+Centre+Singapore',
      latitude: 1.352,
      longitude: 103.848,
      photo_url: null,
      opening_hours: '6:00 AM - 10:00 PM daily',
    },
  ],
}
