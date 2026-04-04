// ─── Seed data ────────────────────────────────────────────────────────────────

export const PHARMACIES = [
  { id: 'ph1', name: 'Colombo Central Pharmacy', city: 'Colombo', licenseNo: 'LK-PH-0012', isActive: true, orders: 142, revenue: 487200 },
  { id: 'ph2', name: 'Kandy MediPlus',          city: 'Kandy',   licenseNo: 'LK-PH-0047', isActive: true, orders: 98,  revenue: 312500 },
  { id: 'ph3', name: 'Galle HealthCare Pharma', city: 'Galle',   licenseNo: 'LK-PH-0089', isActive: true, orders: 74,  revenue: 218900 },
  { id: 'ph4', name: 'Jaffna City Pharmacy',    city: 'Jaffna',  licenseNo: 'LK-PH-0103', isActive: false, orders: 0,  revenue: 0 },
];

export const USERS = [
  { id: 'u1', name: 'Dr. Kavinda Perera',   role: 'pharmacy_owner', pharmacy: 'Colombo Central Pharmacy', phone: '+94771234567', joined: '2024-01-15' },
  { id: 'u2', name: 'Nimal Rajapaksa',      role: 'pharmacy_staff', pharmacy: 'Colombo Central Pharmacy', phone: '+94772345678', joined: '2024-02-01' },
  { id: 'u3', name: 'Amara Wickramasinghe', role: 'pharmacy_staff', pharmacy: 'Kandy MediPlus',           phone: '+94773456789', joined: '2024-03-10' },
  { id: 'u4', name: 'Sithum Fernando',      role: 'customer',       pharmacy: null,                        phone: '+94774567890', joined: '2024-04-05' },
  { id: 'u5', name: 'Dilani Jayawardena',   role: 'customer',       pharmacy: null,                        phone: '+94775678901', joined: '2024-04-12' },
];

export const PRESCRIPTIONS = [
  {
    id: 'rx1', patient: 'Sithum Fernando', phone: '+94774567890',
    uploadedAt: '2026-04-04T08:15:00Z', status: 'PENDING_REVIEW',
    confidenceTier: 'MEDIUM', confidence: 0.82,
    imageUrl: '/prescription-sample.jpg',
    medicines: [
      { drug: 'Amoxicillin', dosage: '500mg', frequency: 'TDS', duration: '7 days', matched: true,  formularyId: 'med002' },
      { drug: 'Paracetamol', dosage: '1g',    frequency: 'PRN', duration: '5 days', matched: true,  formularyId: 'med001' },
      { drug: 'Omeprazol',   dosage: '20mg',  frequency: 'BD',  duration: '14 days', matched: false, formularyId: null },
    ],
  },
  {
    id: 'rx2', patient: 'Dilani Jayawardena', phone: '+94775678901',
    uploadedAt: '2026-04-04T09:30:00Z', status: 'PENDING_REVIEW',
    confidenceTier: 'HIGH', confidence: 0.95,
    imageUrl: '/prescription-sample.jpg',
    medicines: [
      { drug: 'Metformin',    dosage: '500mg', frequency: 'BD',  duration: '30 days', matched: true, formularyId: 'med003' },
      { drug: 'Atorvastatin', dosage: '20mg',  frequency: 'OD',  duration: '30 days', matched: true, formularyId: 'med005' },
    ],
  },
  {
    id: 'rx3', patient: 'Ruwan Silva', phone: '+94776789012',
    uploadedAt: '2026-04-04T07:00:00Z', status: 'CONFIRMED',
    confidenceTier: 'HIGH', confidence: 0.96,
    imageUrl: '/prescription-sample.jpg',
    medicines: [
      { drug: 'Lisinopril', dosage: '10mg', frequency: 'OD', duration: '30 days', matched: true, formularyId: 'med006' },
    ],
  },
];

export const INVENTORY = [
  { id: 'inv1', name: 'Paracetamol 500mg',   stock: 1240, reorder: 200, unit: 'tablets', expiry: '2027-06', price: 2.50,  status: 'ok' },
  { id: 'inv2', name: 'Amoxicillin 500mg',   stock: 85,   reorder: 100, unit: 'capsules', expiry: '2026-12', price: 18.00, status: 'low' },
  { id: 'inv3', name: 'Metformin 500mg',      stock: 620,  reorder: 150, unit: 'tablets', expiry: '2027-03', price: 5.50,  status: 'ok' },
  { id: 'inv4', name: 'Omeprazole 20mg',      stock: 45,   reorder: 80,  unit: 'capsules', expiry: '2026-09', price: 12.00, status: 'low' },
  { id: 'inv5', name: 'Atorvastatin 20mg',    stock: 310,  reorder: 100, unit: 'tablets', expiry: '2027-06', price: 22.00, status: 'ok' },
  { id: 'inv6', name: 'Insulin Glargine',     stock: 18,   reorder: 30,  unit: 'vials',   expiry: '2026-08', price: 2800.00, status: 'critical' },
  { id: 'inv7', name: 'Salbutamol Inhaler',   stock: 24,   reorder: 20,  unit: 'inhalers', expiry: '2026-11', price: 480.00, status: 'ok' },
  { id: 'inv8', name: 'Warfarin 5mg',         stock: 12,   reorder: 50,  unit: 'tablets', expiry: '2026-07', price: 8.50,  status: 'critical' },
];

export const ORDERS = [
  { id: 'ord1', patient: 'Sithum Fernando',    status: 'DISPATCHED',            total: 2840,  delivery: 'PickMe Flash',  time: '09:45', items: 3, deliveryStatus: 'IN_TRANSIT' },
  { id: 'ord2', patient: 'Dilani Jayawardena', status: 'PREPARING',             total: 1650,  delivery: 'Grasshoppers',  time: '10:12', items: 2, deliveryStatus: 'PENDING' },
  { id: 'ord3', patient: 'Ruwan Silva',        status: 'PRESCRIPTION_CONFIRMED', total: 980,  delivery: null,            time: '10:33', items: 1, deliveryStatus: null },
  { id: 'ord4', patient: 'Malini Perera',      status: 'DELIVERED',             total: 3200,  delivery: 'PickMe Flash',  time: '08:20', items: 4, deliveryStatus: 'DELIVERED' },
  { id: 'ord5', patient: 'Kasun Bandara',      status: 'DELIVERED',             total: 750,   delivery: 'Grasshoppers',  time: '07:55', items: 1, deliveryStatus: 'DELIVERED' },
];

export const DELIVERY_QUOTES = [
  { provider: 'PICKME_FLASH',  label: 'PickMe Flash',  fee: 280,  eta: 25,  available: true },
  { provider: 'GRASSHOPPERS',  label: 'Grasshoppers',  fee: 195,  eta: 120, available: true },
  { provider: 'OWN_FLEET',     label: 'Direct Delivery', fee: 150, eta: 45, available: false },
];

export const REVENUE_CHART = [
  { month: 'Oct', revenue: 312000 },
  { month: 'Nov', revenue: 378000 },
  { month: 'Dec', revenue: 421000 },
  { month: 'Jan', revenue: 389000 },
  { month: 'Feb', revenue: 445000 },
  { month: 'Mar', revenue: 487200 },
];

export const ORDERS_CHART = [
  { day: 'Mon', orders: 24 },
  { day: 'Tue', orders: 31 },
  { day: 'Wed', orders: 28 },
  { day: 'Thu', orders: 35 },
  { day: 'Fri', orders: 42 },
  { day: 'Sat', orders: 38 },
  { day: 'Sun', orders: 19 },
];

export const INVOICES = [
  { id: 'INV-2026-0041', patient: 'Sithum Fernando',    items: 'Amoxicillin, Paracetamol, Omeprazole', amount: 2840, status: 'Paid',    date: '2026-04-04' },
  { id: 'INV-2026-0040', patient: 'Dilani Jayawardena', items: 'Metformin, Atorvastatin',              amount: 1650, status: 'Paid',    date: '2026-04-04' },
  { id: 'INV-2026-0039', patient: 'Ruwan Silva',        items: 'Lisinopril 10mg',                      amount: 980,  status: 'Pending', date: '2026-04-04' },
  { id: 'INV-2026-0038', patient: 'Malini Perera',      items: 'Insulin Glargine (x2), Metformin',     amount: 3200, status: 'Paid',    date: '2026-04-03' },
  { id: 'INV-2026-0037', patient: 'Kasun Bandara',      items: 'Salbutamol Inhaler',                   amount: 750,  status: 'Paid',    date: '2026-04-03' },
  { id: 'INV-2026-0036', patient: 'Priya Navaratnam',   items: 'Warfarin 5mg, Atorvastatin',           amount: 1120, status: 'Pending', date: '2026-04-02' },
];

export const QUICK_REORDER = [
  { name: 'Metformin 500mg',    lastOrdered: '2026-03-05', price: 330, icon: '💊' },
  { name: 'Atorvastatin 20mg',  lastOrdered: '2026-03-05', price: 660, icon: '💊' },
  { name: 'Paracetamol 500mg',  lastOrdered: '2026-03-18', price: 75,  icon: '💊' },
];

export const RECENT_ACTIVITY = [
  { id: 'a1', icon: '🏥', text: 'Jaffna City Pharmacy onboarded', time: '10 min ago', color: 'blue' },
  { id: 'a2', icon: '⚠️', text: 'Warfarin 5mg stock critically low at Colombo Central', time: '25 min ago', color: 'red' },
  { id: 'a3', icon: '✅', text: 'Rx #RX002 auto-approved by AI (confidence 95%)', time: '42 min ago', color: 'green' },
  { id: 'a4', icon: '🚚', text: 'PickMe Flash delivered ORD004 successfully', time: '1 hr ago', color: 'green' },
  { id: 'a5', icon: '👤', text: '3 new customer accounts registered', time: '2 hr ago', color: 'blue' },
];
