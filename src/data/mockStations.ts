export interface MockStation {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  distance: number; // in km
  available: boolean;
  rating: number;
  totalReviews: number;
  pricePerKwh: number;
  connectors: {
    type: string;
    power: number;
    available: boolean;
  }[];
  openNow: boolean;
}

export const mockStations: MockStation[] = [
  {
    id: 'st-001',
    name: 'Tata Power EV Charging - Samalkha',
    address: 'NH-44, Near Bus Stand, Samalkha, Haryana 132101',
    location: { lat: 29.2335, lng: 76.9712 },
    distance: 0.8,
    available: true,
    rating: 4.3,
    totalReviews: 47,
    pricePerKwh: 12,
    connectors: [
      { type: 'CCS', power: 50, available: true },
      { type: 'Type 2', power: 22, available: true },
    ],
    openNow: true,
  },
  {
    id: 'st-002',
    name: 'EESL Charging Hub - NH-44',
    address: 'Petrol Pump Complex, NH-44, Samalkha, Haryana 132101',
    location: { lat: 29.2280, lng: 76.9650 },
    distance: 1.5,
    available: true,
    rating: 4.1,
    totalReviews: 32,
    pricePerKwh: 14,
    connectors: [
      { type: 'DC Fast', power: 60, available: true },
      { type: 'CHAdeMO', power: 50, available: false },
    ],
    openNow: true,
  },
  {
    id: 'st-003',
    name: 'Statiq EV Station - Panipat Road',
    address: 'GT Road, Near Toll Plaza, Samalkha-Panipat, Haryana',
    location: { lat: 29.2450, lng: 76.9830 },
    distance: 3.2,
    available: false,
    rating: 3.8,
    totalReviews: 19,
    pricePerKwh: 15,
    connectors: [
      { type: 'CCS', power: 30, available: false },
      { type: 'AC', power: 7, available: false },
    ],
    openNow: true,
  },
  {
    id: 'st-004',
    name: 'ChargeZone - Samalkha Industrial Area',
    address: 'HSIIDC Industrial Estate, Phase-2, Samalkha, Haryana',
    location: { lat: 29.2190, lng: 76.9580 },
    distance: 4.1,
    available: true,
    rating: 4.5,
    totalReviews: 63,
    pricePerKwh: 11,
    connectors: [
      { type: 'CCS', power: 120, available: true },
      { type: 'Type 2', power: 22, available: true },
      { type: 'AC', power: 7, available: true },
    ],
    openNow: true,
  },
  {
    id: 'st-005',
    name: 'Fortum Charge - Panipat Highway',
    address: 'HP Petrol Pump, Samalkha-Panipat Highway, Haryana',
    location: { lat: 29.2560, lng: 76.9920 },
    distance: 5.7,
    available: true,
    rating: 4.0,
    totalReviews: 28,
    pricePerKwh: 13,
    connectors: [
      { type: 'DC Fast', power: 50, available: true },
    ],
    openNow: false,
  },
  {
    id: 'st-006',
    name: 'Kazam EV Point - Samalkha Market',
    address: 'Main Market Road, Near SBI Branch, Samalkha, Haryana',
    location: { lat: 29.2310, lng: 76.9740 },
    distance: 1.1,
    available: true,
    rating: 3.6,
    totalReviews: 11,
    pricePerKwh: 16,
    connectors: [
      { type: 'Type 2', power: 22, available: true },
    ],
    openNow: true,
  },
  {
    id: 'st-007',
    name: 'Ather Grid - Jind Road Junction',
    address: 'Jind-Samalkha Road, Near Hanuman Temple, Haryana',
    location: { lat: 29.2100, lng: 76.9400 },
    distance: 8.3,
    available: false,
    rating: 4.2,
    totalReviews: 37,
    pricePerKwh: 10,
    connectors: [
      { type: 'AC', power: 7, available: false },
      { type: 'Type 2', power: 22, available: false },
    ],
    openNow: false,
  },
  {
    id: 'st-008',
    name: 'Exicom HyperCharger - NH-44 Plaza',
    address: 'Highway Service Center, NH-44, Gharaunda, Haryana',
    location: { lat: 29.2700, lng: 77.0050 },
    distance: 12.4,
    available: true,
    rating: 4.7,
    totalReviews: 89,
    pricePerKwh: 9,
    connectors: [
      { type: 'CCS', power: 150, available: true },
      { type: 'CHAdeMO', power: 100, available: true },
      { type: 'Type 2', power: 43, available: true },
    ],
    openNow: true,
  },
];
