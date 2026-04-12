// ─── Seed data — Full ER Diagram Coverage ─────────────────────────────────────

// ─── UserTypes (Roles) ────────────────────────────────────────────────────────
export const USER_TYPES = [
  { id: 'ut1', code: 'ADMIN',      name: 'Admin' },
  { id: 'ut2', code: 'PHARMACIST', name: 'Pharmacist' },
  { id: 'ut3', code: 'CUSTOMER',   name: 'Customer' },
];

// ─── Screen Permissions ───────────────────────────────────────────────────────
export const SCREEN_PERMISSIONS = [
  { id: 'perm1',  code: 'DASHBOARD_VIEW',      screenName: 'Dashboard' },
  { id: 'perm2',  code: 'ANALYTICS_VIEW',      screenName: 'Analytics' },
  { id: 'perm3',  code: 'PHARMACY_MANAGE',     screenName: 'Pharmacy Management' },
  { id: 'perm4',  code: 'USER_MANAGE',         screenName: 'User Management' },
  { id: 'perm5',  code: 'PRESCRIPTION_VIEW',   screenName: 'View Prescriptions' },
  { id: 'perm6',  code: 'PRESCRIPTION_REVIEW', screenName: 'Review Prescriptions' },
  { id: 'perm7',  code: 'INVENTORY_VIEW',      screenName: 'View Inventory' },
  { id: 'perm8',  code: 'INVENTORY_MANAGE',    screenName: 'Manage Inventory' },
  { id: 'perm9',  code: 'ORDER_VIEW',          screenName: 'View Orders' },
  { id: 'perm10', code: 'ORDER_MANAGE',        screenName: 'Manage Orders' },
  { id: 'perm11', code: 'BILLING_VIEW',        screenName: 'View Billing' },
  { id: 'perm12', code: 'BILLING_MANAGE',      screenName: 'Manage Billing' },
  { id: 'perm13', code: 'AI_PIPELINE_VIEW',    screenName: 'AI Pipeline' },
  { id: 'perm14', code: 'DELIVERY_MANAGE',     screenName: 'Manage Delivery' },
  { id: 'perm15', code: 'GRN_MANAGE',          screenName: 'GRN Management' },
  { id: 'perm16', code: 'MEDICINE_MANAGE',     screenName: 'Medicine Management' },
  { id: 'perm17', code: 'REPORTS_VIEW',        screenName: 'Reports' },
];

// ─── UserType ↔ Permission Mapping ───────────────────────────────────────────
export const USER_TYPE_PERMISSION_MAP = [
  // Admin — all permissions
  ...SCREEN_PERMISSIONS.map((p, i) => ({ id: `utp${i + 1}`, userTypeId: 'ut1', permissionId: p.id })),
  // Pharmacist — operational permissions
  { id: 'utp20', userTypeId: 'ut2', permissionId: 'perm1' },
  { id: 'utp21', userTypeId: 'ut2', permissionId: 'perm5' },
  { id: 'utp22', userTypeId: 'ut2', permissionId: 'perm6' },
  { id: 'utp23', userTypeId: 'ut2', permissionId: 'perm7' },
  { id: 'utp24', userTypeId: 'ut2', permissionId: 'perm8' },
  { id: 'utp25', userTypeId: 'ut2', permissionId: 'perm9' },
  { id: 'utp26', userTypeId: 'ut2', permissionId: 'perm10' },
  { id: 'utp27', userTypeId: 'ut2', permissionId: 'perm11' },
  { id: 'utp28', userTypeId: 'ut2', permissionId: 'perm12' },
  { id: 'utp29', userTypeId: 'ut2', permissionId: 'perm13' },
  { id: 'utp30', userTypeId: 'ut2', permissionId: 'perm14' },
  { id: 'utp31', userTypeId: 'ut2', permissionId: 'perm15' },
  { id: 'utp32', userTypeId: 'ut2', permissionId: 'perm16' },
  // Customer — limited permissions
  { id: 'utp40', userTypeId: 'ut3', permissionId: 'perm1' },
  { id: 'utp41', userTypeId: 'ut3', permissionId: 'perm5' },
  { id: 'utp42', userTypeId: 'ut3', permissionId: 'perm9' },
  { id: 'utp43', userTypeId: 'ut3', permissionId: 'perm11' },
];

// ─── Pharmacies ───────────────────────────────────────────────────────────────
export const PHARMACIES = [
  { id: 'ph1', name: 'Colombo Central Pharmacy', city: 'Colombo',  locationCode: 'COL-001', licenseNo: 'LK-PH-0012', ownerName: 'Dr. Kavinda Perera',   contactNumber: '+94771234567', email: 'info@colombopharmacy.lk', isActive: true,  orders: 142, revenue: 487200 },
  { id: 'ph2', name: 'Kandy MediPlus',           city: 'Kandy',    locationCode: 'KND-001', licenseNo: 'LK-PH-0047', ownerName: 'Dr. Sampath Kumara',   contactNumber: '+94772345000', email: 'info@kandymediplus.lk',   isActive: true,  orders: 98,  revenue: 312500 },
  { id: 'ph3', name: 'Galle HealthCare Pharma',  city: 'Galle',    locationCode: 'GAL-001', licenseNo: 'LK-PH-0089', ownerName: 'Dr. Nimali Fernando',  contactNumber: '+94773456000', email: 'info@gallehealthcare.lk', isActive: true,  orders: 74,  revenue: 218900 },
  { id: 'ph4', name: 'Jaffna City Pharmacy',     city: 'Jaffna',   locationCode: 'JAF-001', licenseNo: 'LK-PH-0103', ownerName: 'Dr. Kuhan Selvam',    contactNumber: '+94774567000', email: 'info@jaffnapharmacy.lk',  isActive: false, orders: 0,   revenue: 0 },
  { id: 'ph5', name: 'Matara MedHub',            city: 'Matara',   locationCode: 'MAT-001', licenseNo: 'LK-PH-0115', ownerName: 'Dr. Ruwani Peris',    contactNumber: '+94775678000', email: 'info@mataramedHub.lk',    isActive: true,  orders: 56,  revenue: 178400 },
];

// ─── Users (Full ER fields) ──────────────────────────────────────────────────
export const USERS = [
  { id: 'u1',  name: 'Dr. Kavinda Perera',      role: 'pharmacy_owner', userTypeId: 'ut2', pharmacy: 'Colombo Central Pharmacy', pharmacyId: 'ph1', phone: '+94771234567', email: 'kavinda@colombopharmacy.lk',  joined: '2024-01-15', firstName: 'Kavinda',  lastName: 'Perera',          nic: '852631425V', gender: 'Male',   birthDay: '1985-03-12', district: 'Colombo',    postalCode: '00100', addressLine1: '45 Hospital Road', addressLine2: 'Colombo 07', addressLine3: '' },
  { id: 'u2',  name: 'Nimal Rajapaksa',         role: 'pharmacy_staff', userTypeId: 'ut2', pharmacy: 'Colombo Central Pharmacy', pharmacyId: 'ph1', phone: '+94772345678', email: 'nimal@colombopharmacy.lk',   joined: '2024-02-01', firstName: 'Nimal',    lastName: 'Rajapaksa',       nic: '901234567V', gender: 'Male',   birthDay: '1990-07-22', district: 'Colombo',    postalCode: '00200', addressLine1: '12 Galle Road',    addressLine2: 'Wellawatte',  addressLine3: '' },
  { id: 'u3',  name: 'Amara Wickramasinghe',    role: 'pharmacy_staff', userTypeId: 'ut2', pharmacy: 'Kandy MediPlus',           pharmacyId: 'ph2', phone: '+94773456789', email: 'amara@kandymediplus.lk',     joined: '2024-03-10', firstName: 'Amara',    lastName: 'Wickramasinghe',  nic: '885632145V', gender: 'Female', birthDay: '1988-11-05', district: 'Kandy',      postalCode: '20000', addressLine1: '8 Peradeniya Road', addressLine2: 'Kandy',       addressLine3: '' },
  { id: 'u4',  name: 'Sithum Fernando',         role: 'customer',       userTypeId: 'ut3', pharmacy: null,                        pharmacyId: null,  phone: '+94774567890', email: 'sithum.f@gmail.com',         joined: '2024-04-05', firstName: 'Sithum',   lastName: 'Fernando',        nic: '951123456V', gender: 'Male',   birthDay: '1995-01-18', district: 'Colombo',    postalCode: '00300', addressLine1: '23 Station Road',   addressLine2: 'Bambalapitiya', addressLine3: '', height: 175, weight: 72 },
  { id: 'u5',  name: 'Dilani Jayawardena',      role: 'customer',       userTypeId: 'ut3', pharmacy: null,                        pharmacyId: null,  phone: '+94775678901', email: 'dilani.j@gmail.com',         joined: '2024-04-12', firstName: 'Dilani',   lastName: 'Jayawardena',     nic: '925678901V', gender: 'Female', birthDay: '1992-06-30', district: 'Gampaha',    postalCode: '11000', addressLine1: '56 Negombo Road',   addressLine2: 'Wattala',     addressLine3: '', height: 162, weight: 58 },
  { id: 'u6',  name: 'Ruwan Silva',             role: 'customer',       userTypeId: 'ut3', pharmacy: null,                        pharmacyId: null,  phone: '+94776789012', email: 'ruwan.silva@gmail.com',      joined: '2024-05-20', firstName: 'Ruwan',    lastName: 'Silva',           nic: '881234567V', gender: 'Male',   birthDay: '1988-09-14', district: 'Kalutara',   postalCode: '12000', addressLine1: '78 Beach Road',     addressLine2: 'Kalutara',    addressLine3: '', height: 180, weight: 85 },
  { id: 'u7',  name: 'Malini Perera',           role: 'customer',       userTypeId: 'ut3', pharmacy: null,                        pharmacyId: null,  phone: '+94777890123', email: 'malini.p@gmail.com',         joined: '2024-06-01', firstName: 'Malini',   lastName: 'Perera',          nic: '781234567V', gender: 'Female', birthDay: '1978-12-03', district: 'Colombo',    postalCode: '00500', addressLine1: '14 Temple Road',    addressLine2: 'Dehiwala',    addressLine3: '', height: 155, weight: 63 },
  { id: 'u8',  name: 'Kasun Bandara',           role: 'customer',       userTypeId: 'ut3', pharmacy: null,                        pharmacyId: null,  phone: '+94778901234', email: 'kasun.b@gmail.com',          joined: '2024-06-15', firstName: 'Kasun',    lastName: 'Bandara',         nic: '971234567V', gender: 'Male',   birthDay: '1997-04-25', district: 'Matale',     postalCode: '21000', addressLine1: '33 Main Street',    addressLine2: 'Matale',      addressLine3: '', height: 170, weight: 68 },
  { id: 'u9',  name: 'Priya Navaratnam',        role: 'customer',       userTypeId: 'ut3', pharmacy: null,                        pharmacyId: null,  phone: '+94779012345', email: 'priya.nav@gmail.com',        joined: '2024-07-10', firstName: 'Priya',    lastName: 'Navaratnam',      nic: '901234568V', gender: 'Female', birthDay: '1990-08-19', district: 'Jaffna',     postalCode: '40000', addressLine1: '21 Hospital Road',  addressLine2: 'Jaffna',      addressLine3: '', height: 158, weight: 52 },
  { id: 'u10', name: 'Dr. Sampath Kumara',      role: 'pharmacy_owner', userTypeId: 'ut2', pharmacy: 'Kandy MediPlus',           pharmacyId: 'ph2', phone: '+94772345000', email: 'sampath@kandymediplus.lk',   joined: '2024-01-20', firstName: 'Sampath',  lastName: 'Kumara',          nic: '821234567V', gender: 'Male',   birthDay: '1982-05-10', district: 'Kandy',      postalCode: '20000', addressLine1: '5 Dalada Veediya',  addressLine2: 'Kandy',       addressLine3: '' },
  { id: 'u11', name: 'Chamari De Silva',        role: 'pharmacy_staff', userTypeId: 'ut2', pharmacy: 'Galle HealthCare Pharma',  pharmacyId: 'ph3', phone: '+94773456000', email: 'chamari@gallehealthcare.lk', joined: '2024-04-01', firstName: 'Chamari',  lastName: 'De Silva',        nic: '931234567V', gender: 'Female', birthDay: '1993-02-14', district: 'Galle',      postalCode: '80000', addressLine1: '10 Fort Road',      addressLine2: 'Galle',       addressLine3: '' },
  { id: 'u12', name: 'Admin User',              role: 'system_admin',   userTypeId: 'ut1', pharmacy: null,                        pharmacyId: null,  phone: '+94770000001', email: 'admin@medichainlk.com',      joined: '2024-01-01', firstName: 'System',   lastName: 'Admin',           nic: '800000001V', gender: 'Male',   birthDay: '1980-01-01', district: 'Colombo',    postalCode: '00100', addressLine1: 'MediChainLK HQ',    addressLine2: 'Colombo 03',  addressLine3: '' },
];

// ─── Disease Details ─────────────────────────────────────────────────────────
export const DISEASE_DETAILS = [
  { id: 'dis1', code: 'DM2',   name: 'Type 2 Diabetes Mellitus' },
  { id: 'dis2', code: 'HTN',   name: 'Hypertension' },
  { id: 'dis3', code: 'HLD',   name: 'Hyperlipidemia' },
  { id: 'dis4', code: 'AST',   name: 'Asthma' },
  { id: 'dis5', code: 'CKD',   name: 'Chronic Kidney Disease' },
  { id: 'dis6', code: 'THY',   name: 'Hypothyroidism' },
  { id: 'dis7', code: 'GERD',  name: 'Gastroesophageal Reflux' },
  { id: 'dis8', code: 'AF',    name: 'Atrial Fibrillation' },
  { id: 'dis9', code: 'OA',    name: 'Osteoarthritis' },
  { id: 'dis10', code: 'DEP',  name: 'Depression' },
];

// ─── Disease ↔ User Mapping (Customer health profiles) ──────────────────────
export const DISEASE_USER_MAP = [
  { id: 'dum1',  userId: 'u4',  diseaseId: 'dis4', notes: 'Mild, using inhaler PRN' },
  { id: 'dum2',  userId: 'u5',  diseaseId: 'dis1', notes: 'On Metformin 500mg BD' },
  { id: 'dum3',  userId: 'u5',  diseaseId: 'dis3', notes: 'On Atorvastatin 20mg' },
  { id: 'dum4',  userId: 'u6',  diseaseId: 'dis2', notes: 'Lisinopril 10mg daily' },
  { id: 'dum5',  userId: 'u7',  diseaseId: 'dis1', notes: 'Insulin Glargine + Metformin' },
  { id: 'dum6',  userId: 'u7',  diseaseId: 'dis2', notes: 'On Losartan 50mg' },
  { id: 'dum7',  userId: 'u7',  diseaseId: 'dis3', notes: 'On Atorvastatin 40mg' },
  { id: 'dum8',  userId: 'u8',  diseaseId: 'dis4', notes: 'Salbutamol inhaler' },
  { id: 'dum9',  userId: 'u9',  diseaseId: 'dis8', notes: 'On Warfarin 5mg' },
  { id: 'dum10', userId: 'u9',  diseaseId: 'dis2', notes: 'Controlled with medication' },
];

// ─── Medicine Companies ──────────────────────────────────────────────────────
export const MEDICINE_COMPANIES = [
  { id: 'mc1', code: 'ASTRAZ',  name: 'AstraZeneca',           email: 'orders@astrazeneca.lk',   tel: '+94112345001' },
  { id: 'mc2', code: 'PFIZER',  name: 'Pfizer Lanka',          email: 'orders@pfizerlanka.lk',   tel: '+94112345002' },
  { id: 'mc3', code: 'GSK',     name: 'GlaxoSmithKline Lanka', email: 'orders@gsklanka.lk',      tel: '+94112345003' },
  { id: 'mc4', code: 'SANOFI',  name: 'Sanofi Aventis',        email: 'orders@sanofi.lk',        tel: '+94112345004' },
  { id: 'mc5', code: 'CIPLA',   name: 'Cipla Lanka',           email: 'orders@ciplalanka.lk',    tel: '+94112345005' },
  { id: 'mc6', code: 'HETERO',  name: 'Hetero Pharma',         email: 'orders@heteropharma.lk',  tel: '+94112345006' },
  { id: 'mc7', code: 'ROCHE',   name: 'Roche Lanka',           email: 'orders@rochelanka.lk',    tel: '+94112345007' },
];

// ─── Medicine Categories ─────────────────────────────────────────────────────
export const MEDICINE_CATEGORIES = [
  { id: 'mcat1', code: 'ANTI',  name: 'Antibiotics' },
  { id: 'mcat2', code: 'ANALG', name: 'Analgesics' },
  { id: 'mcat3', code: 'DIAB',  name: 'Antidiabetics' },
  { id: 'mcat4', code: 'CARDIO', name: 'Cardiovascular' },
  { id: 'mcat5', code: 'RESP',  name: 'Respiratory' },
  { id: 'mcat6', code: 'GI',    name: 'Gastrointestinal' },
  { id: 'mcat7', code: 'COAG',  name: 'Anticoagulants' },
  { id: 'mcat8', code: 'ENDO',  name: 'Endocrine' },
  { id: 'mcat9', code: 'NSAID', name: 'NSAIDs' },
  { id: 'mcat10', code: 'VITA', name: 'Vitamins & Supplements' },
];

// ─── Measuring Unit Categories ───────────────────────────────────────────────
export const MEASURING_UNIT_CATEGORIES = [
  { id: 'muc1', code: 'SOLID',  name: 'Solid' },
  { id: 'muc2', code: 'LIQUID', name: 'Liquid' },
  { id: 'muc3', code: 'DEVICE', name: 'Device' },
];

// ─── Measuring Units ─────────────────────────────────────────────────────────
export const MEASURING_UNITS = [
  { id: 'mu1', code: 'TAB',  name: 'Tablets',   categoryId: 'muc1' },
  { id: 'mu2', code: 'CAP',  name: 'Capsules',  categoryId: 'muc1' },
  { id: 'mu3', code: 'ML',   name: 'Milliliters', categoryId: 'muc2' },
  { id: 'mu4', code: 'VIAL', name: 'Vials',     categoryId: 'muc2' },
  { id: 'mu5', code: 'INH',  name: 'Inhalers',  categoryId: 'muc3' },
  { id: 'mu6', code: 'AMP',  name: 'Ampoules',  categoryId: 'muc2' },
  { id: 'mu7', code: 'TUBE', name: 'Tubes',     categoryId: 'muc1' },
  { id: 'mu8', code: 'SACHET', name: 'Sachets', categoryId: 'muc1' },
];

// ─── Measuring Unit Conversions ──────────────────────────────────────────────
export const MEASURING_UNIT_CONVERSIONS = [
  { id: 'conv1', unitId1: 'mu1', unitId2: 'mu8', quantity1: 10, quantity2: 1, medicineId: 'med001', description: '10 Tablets = 1 Sachet' },
  { id: 'conv2', unitId1: 'mu3', unitId2: 'mu4', quantity1: 10, quantity2: 1, medicineId: 'med006', description: '10 mL = 1 Vial (Insulin)' },
  { id: 'conv3', unitId1: 'mu2', unitId2: 'mu8', quantity1: 14, quantity2: 1, medicineId: 'med002', description: '14 Capsules = 1 Sachet' },
];

// ─── Medicines (Full ER — with company, category, measuring unit) ────────────
export const MEDICINES = [
  { id: 'med001', code: 'PARA500',   name: 'Paracetamol 500mg',        categoryId: 'mcat2',  companyId: 'mc3', unitId: 'mu1', isHighAlert: false },
  { id: 'med002', code: 'AMOX500',   name: 'Amoxicillin 500mg',        categoryId: 'mcat1',  companyId: 'mc3', unitId: 'mu2', isHighAlert: false },
  { id: 'med003', code: 'METF500',   name: 'Metformin 500mg',          categoryId: 'mcat3',  companyId: 'mc5', unitId: 'mu1', isHighAlert: false },
  { id: 'med004', code: 'OMEP20',    name: 'Omeprazole 20mg',          categoryId: 'mcat6',  companyId: 'mc1', unitId: 'mu2', isHighAlert: false },
  { id: 'med005', code: 'ATOR20',    name: 'Atorvastatin 20mg',        categoryId: 'mcat4',  companyId: 'mc2', unitId: 'mu1', isHighAlert: false },
  { id: 'med006', code: 'INSU_GLAR', name: 'Insulin Glargine',         categoryId: 'mcat3',  companyId: 'mc4', unitId: 'mu4', isHighAlert: true },
  { id: 'med007', code: 'SALB_INH',  name: 'Salbutamol Inhaler',       categoryId: 'mcat5',  companyId: 'mc3', unitId: 'mu5', isHighAlert: false },
  { id: 'med008', code: 'WARF5',     name: 'Warfarin 5mg',             categoryId: 'mcat7',  companyId: 'mc5', unitId: 'mu1', isHighAlert: true },
  { id: 'med009', code: 'LISI10',    name: 'Lisinopril 10mg',          categoryId: 'mcat4',  companyId: 'mc1', unitId: 'mu1', isHighAlert: false },
  { id: 'med010', code: 'LOSAR50',   name: 'Losartan 50mg',            categoryId: 'mcat4',  companyId: 'mc5', unitId: 'mu1', isHighAlert: false },
  { id: 'med011', code: 'ATOR40',    name: 'Atorvastatin 40mg',        categoryId: 'mcat4',  companyId: 'mc2', unitId: 'mu1', isHighAlert: false },
  { id: 'med012', code: 'CEFI200',   name: 'Cefixime 200mg',           categoryId: 'mcat1',  companyId: 'mc5', unitId: 'mu2', isHighAlert: false },
  { id: 'med013', code: 'DICLOF50',  name: 'Diclofenac 50mg',          categoryId: 'mcat9',  companyId: 'mc6', unitId: 'mu1', isHighAlert: false },
  { id: 'med014', code: 'LEVOTHY50', name: 'Levothyroxine 50mcg',      categoryId: 'mcat8',  companyId: 'mc4', unitId: 'mu1', isHighAlert: false },
  { id: 'med015', code: 'VITD3',     name: 'Vitamin D3 1000IU',        categoryId: 'mcat10', companyId: 'mc7', unitId: 'mu1', isHighAlert: false },
  { id: 'med016', code: 'CLOPI75',   name: 'Clopidogrel 75mg',         categoryId: 'mcat7',  companyId: 'mc4', unitId: 'mu1', isHighAlert: true },
  { id: 'med017', code: 'AZITH500',  name: 'Azithromycin 500mg',       categoryId: 'mcat1',  companyId: 'mc2', unitId: 'mu1', isHighAlert: false },
  { id: 'med018', code: 'PANTO40',   name: 'Pantoprazole 40mg',        categoryId: 'mcat6',  companyId: 'mc1', unitId: 'mu1', isHighAlert: false },
];

// ─── Bins (Storage Locations) ────────────────────────────────────────────────
export const BINS = [
  { id: 'bin1', code: 'A-01', name: 'Shelf A - Row 1',      section: 'General',       pharmacyId: 'ph1' },
  { id: 'bin2', code: 'A-02', name: 'Shelf A - Row 2',      section: 'General',       pharmacyId: 'ph1' },
  { id: 'bin3', code: 'B-01', name: 'Shelf B - Row 1',      section: 'Antibiotics',   pharmacyId: 'ph1' },
  { id: 'bin4', code: 'C-01', name: 'Cold Storage - Rack 1', section: 'Refrigerated', pharmacyId: 'ph1' },
  { id: 'bin5', code: 'C-02', name: 'Cold Storage - Rack 2', section: 'Refrigerated', pharmacyId: 'ph1' },
  { id: 'bin6', code: 'D-01', name: 'High Alert Cabinet',   section: 'Controlled',    pharmacyId: 'ph1' },
  { id: 'bin7', code: 'E-01', name: 'OTC Display',          section: 'Over-the-Counter', pharmacyId: 'ph1' },
  { id: 'bin8', code: 'A-01', name: 'Main Shelf 1',         section: 'General',       pharmacyId: 'ph2' },
  { id: 'bin9', code: 'B-01', name: 'Antibiotics Shelf',    section: 'Antibiotics',   pharmacyId: 'ph2' },
];

// ─── Medicine ↔ Bin Mapping ──────────────────────────────────────────────────
export const MEDICINE_BIN_MAP = [
  { id: 'mbm1',  binId: 'bin1', medicineId: 'med001', categoryId: 'mcat2', companyId: 'mc3' },
  { id: 'mbm2',  binId: 'bin3', medicineId: 'med002', categoryId: 'mcat1', companyId: 'mc3' },
  { id: 'mbm3',  binId: 'bin1', medicineId: 'med003', categoryId: 'mcat3', companyId: 'mc5' },
  { id: 'mbm4',  binId: 'bin2', medicineId: 'med004', categoryId: 'mcat6', companyId: 'mc1' },
  { id: 'mbm5',  binId: 'bin2', medicineId: 'med005', categoryId: 'mcat4', companyId: 'mc2' },
  { id: 'mbm6',  binId: 'bin4', medicineId: 'med006', categoryId: 'mcat3', companyId: 'mc4' },
  { id: 'mbm7',  binId: 'bin7', medicineId: 'med007', categoryId: 'mcat5', companyId: 'mc3' },
  { id: 'mbm8',  binId: 'bin6', medicineId: 'med008', categoryId: 'mcat7', companyId: 'mc5' },
  { id: 'mbm9',  binId: 'bin2', medicineId: 'med009', categoryId: 'mcat4', companyId: 'mc1' },
  { id: 'mbm10', binId: 'bin1', medicineId: 'med010', categoryId: 'mcat4', companyId: 'mc5' },
  { id: 'mbm11', binId: 'bin2', medicineId: 'med011', categoryId: 'mcat4', companyId: 'mc2' },
  { id: 'mbm12', binId: 'bin3', medicineId: 'med012', categoryId: 'mcat1', companyId: 'mc5' },
  { id: 'mbm13', binId: 'bin7', medicineId: 'med013', categoryId: 'mcat9', companyId: 'mc6' },
  { id: 'mbm14', binId: 'bin6', medicineId: 'med014', categoryId: 'mcat8', companyId: 'mc4' },
  { id: 'mbm15', binId: 'bin7', medicineId: 'med015', categoryId: 'mcat10', companyId: 'mc7' },
  { id: 'mbm16', binId: 'bin6', medicineId: 'med016', categoryId: 'mcat7', companyId: 'mc4' },
  { id: 'mbm17', binId: 'bin3', medicineId: 'med017', categoryId: 'mcat1', companyId: 'mc2' },
  { id: 'mbm18', binId: 'bin2', medicineId: 'med018', categoryId: 'mcat6', companyId: 'mc1' },
];

// ─── Item Details (Inventory per pharmacy — with bin, reorder, min/max) ──────
export const ITEM_DETAILS = [
  { id: 'itm1',  medicineId: 'med001', binMappingId: 'mbm1',  binId: 'bin1', pharmacyId: 'ph1', stock: 1240, reorderLevel: 200, minLevel: 100, maxLevel: 2000, unit: 'tablets',  expiry: '2027-06', unitPrice: 2.50,    status: 'ok' },
  { id: 'itm2',  medicineId: 'med002', binMappingId: 'mbm2',  binId: 'bin3', pharmacyId: 'ph1', stock: 85,   reorderLevel: 100, minLevel: 50,  maxLevel: 500,  unit: 'capsules', expiry: '2026-12', unitPrice: 18.00,   status: 'low' },
  { id: 'itm3',  medicineId: 'med003', binMappingId: 'mbm3',  binId: 'bin1', pharmacyId: 'ph1', stock: 620,  reorderLevel: 150, minLevel: 80,  maxLevel: 1000, unit: 'tablets',  expiry: '2027-03', unitPrice: 5.50,    status: 'ok' },
  { id: 'itm4',  medicineId: 'med004', binMappingId: 'mbm4',  binId: 'bin2', pharmacyId: 'ph1', stock: 45,   reorderLevel: 80,  minLevel: 30,  maxLevel: 300,  unit: 'capsules', expiry: '2026-09', unitPrice: 12.00,   status: 'low' },
  { id: 'itm5',  medicineId: 'med005', binMappingId: 'mbm5',  binId: 'bin2', pharmacyId: 'ph1', stock: 310,  reorderLevel: 100, minLevel: 50,  maxLevel: 800,  unit: 'tablets',  expiry: '2027-06', unitPrice: 22.00,   status: 'ok' },
  { id: 'itm6',  medicineId: 'med006', binMappingId: 'mbm6',  binId: 'bin4', pharmacyId: 'ph1', stock: 18,   reorderLevel: 30,  minLevel: 10,  maxLevel: 100,  unit: 'vials',    expiry: '2026-08', unitPrice: 2800.00, status: 'critical' },
  { id: 'itm7',  medicineId: 'med007', binMappingId: 'mbm7',  binId: 'bin7', pharmacyId: 'ph1', stock: 24,   reorderLevel: 20,  minLevel: 10,  maxLevel: 60,   unit: 'inhalers', expiry: '2026-11', unitPrice: 480.00,  status: 'ok' },
  { id: 'itm8',  medicineId: 'med008', binMappingId: 'mbm8',  binId: 'bin6', pharmacyId: 'ph1', stock: 12,   reorderLevel: 50,  minLevel: 20,  maxLevel: 200,  unit: 'tablets',  expiry: '2026-07', unitPrice: 8.50,    status: 'critical' },
  { id: 'itm9',  medicineId: 'med009', binMappingId: 'mbm9',  binId: 'bin2', pharmacyId: 'ph1', stock: 450,  reorderLevel: 100, minLevel: 50,  maxLevel: 800,  unit: 'tablets',  expiry: '2027-04', unitPrice: 15.00,   status: 'ok' },
  { id: 'itm10', medicineId: 'med010', binMappingId: 'mbm10', binId: 'bin1', pharmacyId: 'ph1', stock: 280,  reorderLevel: 80,  minLevel: 40,  maxLevel: 600,  unit: 'tablets',  expiry: '2027-02', unitPrice: 18.50,   status: 'ok' },
  { id: 'itm11', medicineId: 'med011', binMappingId: 'mbm11', binId: 'bin2', pharmacyId: 'ph1', stock: 160,  reorderLevel: 60,  minLevel: 30,  maxLevel: 400,  unit: 'tablets',  expiry: '2027-05', unitPrice: 35.00,   status: 'ok' },
  { id: 'itm12', medicineId: 'med012', binMappingId: 'mbm12', binId: 'bin3', pharmacyId: 'ph1', stock: 95,   reorderLevel: 80,  minLevel: 40,  maxLevel: 300,  unit: 'capsules', expiry: '2026-10', unitPrice: 45.00,   status: 'low' },
  { id: 'itm13', medicineId: 'med013', binMappingId: 'mbm13', binId: 'bin7', pharmacyId: 'ph1', stock: 500,  reorderLevel: 100, minLevel: 50,  maxLevel: 1000, unit: 'tablets',  expiry: '2027-01', unitPrice: 3.50,    status: 'ok' },
  { id: 'itm14', medicineId: 'med014', binMappingId: 'mbm14', binId: 'bin6', pharmacyId: 'ph1', stock: 220,  reorderLevel: 60,  minLevel: 30,  maxLevel: 500,  unit: 'tablets',  expiry: '2027-08', unitPrice: 12.00,   status: 'ok' },
  { id: 'itm15', medicineId: 'med015', binMappingId: 'mbm15', binId: 'bin7', pharmacyId: 'ph1', stock: 340,  reorderLevel: 80,  minLevel: 40,  maxLevel: 600,  unit: 'tablets',  expiry: '2027-09', unitPrice: 8.00,    status: 'ok' },
  { id: 'itm16', medicineId: 'med016', binMappingId: 'mbm16', binId: 'bin6', pharmacyId: 'ph1', stock: 8,    reorderLevel: 40,  minLevel: 20,  maxLevel: 150,  unit: 'tablets',  expiry: '2026-06', unitPrice: 42.00,   status: 'critical' },
  { id: 'itm17', medicineId: 'med017', binMappingId: 'mbm17', binId: 'bin3', pharmacyId: 'ph1', stock: 180,  reorderLevel: 60,  minLevel: 30,  maxLevel: 400,  unit: 'tablets',  expiry: '2027-07', unitPrice: 55.00,   status: 'ok' },
  { id: 'itm18', medicineId: 'med018', binMappingId: 'mbm18', binId: 'bin2', pharmacyId: 'ph1', stock: 290,  reorderLevel: 80,  minLevel: 40,  maxLevel: 600,  unit: 'tablets',  expiry: '2027-03', unitPrice: 28.00,   status: 'ok' },
];

// ─── Legacy INVENTORY (backward-compat alias) ────────────────────────────────
export const INVENTORY = ITEM_DETAILS.map((itm) => {
  const med = MEDICINES.find((m) => m.id === itm.medicineId);
  return {
    id: itm.id,
    name: med?.name ?? 'Unknown',
    stock: itm.stock,
    reorder: itm.reorderLevel,
    minLevel: itm.minLevel,
    maxLevel: itm.maxLevel,
    unit: itm.unit,
    expiry: itm.expiry,
    price: itm.unitPrice,
    status: itm.status,
    binCode: BINS.find((b) => b.id === itm.binId)?.code ?? '-',
    binName: BINS.find((b) => b.id === itm.binId)?.name ?? '-',
    section: BINS.find((b) => b.id === itm.binId)?.section ?? '-',
    medicineId: itm.medicineId,
    companyName: MEDICINE_COMPANIES.find((c) => c.id === med?.companyId)?.name ?? '-',
    categoryName: MEDICINE_CATEGORIES.find((c) => c.id === med?.categoryId)?.name ?? '-',
    isHighAlert: med?.isHighAlert ?? false,
  };
});

// ─── Prescriptions (Full ER — Header + Detail) ──────────────────────────────
export const PRESCRIPTIONS = [
  {
    id: 'rx1', patient: 'Sithum Fernando', patientId: 'u4', phone: '+94774567890',
    uploadedAt: '2026-04-04T08:15:00Z', status: 'PENDING_REVIEW',
    confidenceTier: 'MEDIUM', confidence: 0.82,
    imageUrl: '/prescription-sample.jpg',
    doctorName: 'Dr. Ranasinghe',
    pharmacistId: 'u2', pharmacyId: 'ph1',
    medicines: [
      { id: 'rxd1', drug: 'Amoxicillin', dosage: '500mg', frequency: 'TDS', duration: '7 days', matched: true,  formularyId: 'med002', binMappingId: 'mbm2', unitPrice: 18.00, totalPrice: 378.00, qty: 21 },
      { id: 'rxd2', drug: 'Paracetamol', dosage: '1g',    frequency: 'PRN', duration: '5 days', matched: true,  formularyId: 'med001', binMappingId: 'mbm1', unitPrice: 2.50,  totalPrice: 37.50,  qty: 15 },
      { id: 'rxd3', drug: 'Omeprazol',   dosage: '20mg',  frequency: 'BD',  duration: '14 days', matched: false, formularyId: null,     binMappingId: null,   unitPrice: 12.00, totalPrice: 336.00, qty: 28 },
    ],
  },
  {
    id: 'rx2', patient: 'Dilani Jayawardena', patientId: 'u5', phone: '+94775678901',
    uploadedAt: '2026-04-04T09:30:00Z', status: 'PENDING_REVIEW',
    confidenceTier: 'HIGH', confidence: 0.95,
    imageUrl: '/prescription-sample.jpg',
    doctorName: 'Dr. Fernando',
    pharmacistId: 'u2', pharmacyId: 'ph1',
    medicines: [
      { id: 'rxd4', drug: 'Metformin',    dosage: '500mg', frequency: 'BD',  duration: '30 days', matched: true, formularyId: 'med003', binMappingId: 'mbm3', unitPrice: 5.50,  totalPrice: 330.00, qty: 60 },
      { id: 'rxd5', drug: 'Atorvastatin', dosage: '20mg',  frequency: 'OD',  duration: '30 days', matched: true, formularyId: 'med005', binMappingId: 'mbm5', unitPrice: 22.00, totalPrice: 660.00, qty: 30 },
    ],
  },
  {
    id: 'rx3', patient: 'Ruwan Silva', patientId: 'u6', phone: '+94776789012',
    uploadedAt: '2026-04-04T07:00:00Z', status: 'CONFIRMED',
    confidenceTier: 'HIGH', confidence: 0.96,
    imageUrl: '/prescription-sample.jpg',
    doctorName: 'Dr. Wijesinghe',
    pharmacistId: 'u2', pharmacyId: 'ph1',
    medicines: [
      { id: 'rxd6', drug: 'Lisinopril', dosage: '10mg', frequency: 'OD', duration: '30 days', matched: true, formularyId: 'med009', binMappingId: 'mbm9', unitPrice: 15.00, totalPrice: 450.00, qty: 30 },
    ],
  },
  {
    id: 'rx4', patient: 'Malini Perera', patientId: 'u7', phone: '+94777890123',
    uploadedAt: '2026-04-03T14:20:00Z', status: 'CONFIRMED',
    confidenceTier: 'MEDIUM', confidence: 0.78,
    imageUrl: '/prescription-sample.jpg',
    doctorName: 'Dr. Gunawardena',
    pharmacistId: 'u3', pharmacyId: 'ph1',
    medicines: [
      { id: 'rxd7', drug: 'Insulin Glargine', dosage: '10 units', frequency: 'OD', duration: '30 days', matched: true, formularyId: 'med006', binMappingId: 'mbm6', unitPrice: 2800.00, totalPrice: 2800.00, qty: 1 },
      { id: 'rxd8', drug: 'Metformin',        dosage: '500mg',    frequency: 'BD', duration: '30 days', matched: true, formularyId: 'med003', binMappingId: 'mbm3', unitPrice: 5.50,    totalPrice: 330.00,  qty: 60 },
    ],
  },
  {
    id: 'rx5', patient: 'Priya Navaratnam', patientId: 'u9', phone: '+94779012345',
    uploadedAt: '2026-04-04T10:45:00Z', status: 'PENDING_REVIEW',
    confidenceTier: 'LOW', confidence: 0.58,
    imageUrl: '/prescription-sample.jpg',
    doctorName: 'Dr. Selvam',
    pharmacistId: null, pharmacyId: 'ph1',
    medicines: [
      { id: 'rxd9',  drug: 'Warfarin', dosage: '5mg', frequency: 'OD', duration: '30 days', matched: true,  formularyId: 'med008', binMappingId: 'mbm8', unitPrice: 8.50,  totalPrice: 255.00, qty: 30 },
      { id: 'rxd10', drug: 'Clopidrl', dosage: '75mg', frequency: 'OD', duration: '30 days', matched: false, formularyId: null,     binMappingId: null,   unitPrice: 42.00, totalPrice: 1260.00, qty: 30 },
    ],
  },
];

// ─── Orders (with full delivery info) ────────────────────────────────────────
export const ORDERS = [
  { id: 'ord1', patient: 'Sithum Fernando',    patientId: 'u4', rxId: 'rx1', status: 'DISPATCHED',             total: 2840,  delivery: 'PickMe Flash',  time: '09:45', items: 3, deliveryStatus: 'IN_TRANSIT', pharmacyId: 'ph1' },
  { id: 'ord2', patient: 'Dilani Jayawardena', patientId: 'u5', rxId: 'rx2', status: 'PREPARING',              total: 1650,  delivery: 'Grasshoppers',  time: '10:12', items: 2, deliveryStatus: 'PENDING',    pharmacyId: 'ph1' },
  { id: 'ord3', patient: 'Ruwan Silva',        patientId: 'u6', rxId: 'rx3', status: 'PRESCRIPTION_CONFIRMED', total: 980,   delivery: null,            time: '10:33', items: 1, deliveryStatus: null,         pharmacyId: 'ph1' },
  { id: 'ord4', patient: 'Malini Perera',      patientId: 'u7', rxId: 'rx4', status: 'DELIVERED',              total: 3200,  delivery: 'PickMe Flash',  time: '08:20', items: 4, deliveryStatus: 'DELIVERED',  pharmacyId: 'ph1' },
  { id: 'ord5', patient: 'Kasun Bandara',      patientId: 'u8', rxId: null,  status: 'DELIVERED',              total: 750,   delivery: 'Grasshoppers',  time: '07:55', items: 1, deliveryStatus: 'DELIVERED',  pharmacyId: 'ph2' },
  { id: 'ord6', patient: 'Priya Navaratnam',   patientId: 'u9', rxId: 'rx5', status: 'PENDING_REVIEW',         total: 1515,  delivery: null,            time: '11:00', items: 2, deliveryStatus: null,         pharmacyId: 'ph1' },
];

// ─── Delivery Records (PickMe — Full ER entity) ─────────────────────────────
export const DELIVERY_RECORDS = [
  { id: 'del1', invoiceCode: 'INV-2026-0041', driverName: 'Asanka Bandara',   driverNic: '891234567V', cost: 280,  vehicleType: 'Motorcycle', vehicleNumber: 'WP-BC-1234',  isDelivered: false, billId: 'bill1', orderId: 'ord1', provider: 'PickMe Flash',  eta: '25 min',  pickupTime: '2026-04-04T09:45:00Z', currentLocation: 'Bambalapitiya Junction' },
  { id: 'del2', invoiceCode: 'INV-2026-0040', driverName: 'Pending Assignment', driverNic: '-',          cost: 195,  vehicleType: 'Three Wheeler', vehicleNumber: '-',        isDelivered: false, billId: 'bill2', orderId: 'ord2', provider: 'Grasshoppers', eta: '120 min', pickupTime: null,                    currentLocation: 'Awaiting pickup' },
  { id: 'del3', invoiceCode: 'INV-2026-0038', driverName: 'Ranil Wijeratne',  driverNic: '901234568V', cost: 280,  vehicleType: 'Motorcycle', vehicleNumber: 'WP-DE-5678',  isDelivered: true,  billId: 'bill4', orderId: 'ord4', provider: 'PickMe Flash',  eta: 'Delivered', pickupTime: '2026-04-04T08:20:00Z', currentLocation: 'Delivered to customer' },
  { id: 'del4', invoiceCode: 'INV-2026-0037', driverName: 'Kumara Dissanayake', driverNic: '871234569V', cost: 195, vehicleType: 'Three Wheeler', vehicleNumber: 'SP-AB-9012', isDelivered: true, billId: 'bill5', orderId: 'ord5', provider: 'Grasshoppers', eta: 'Delivered', pickupTime: '2026-04-04T07:55:00Z', currentLocation: 'Delivered to customer' },
];

export const DELIVERY_QUOTES = [
  { provider: 'PICKME_FLASH',  label: 'PickMe Flash',   fee: 280, eta: 25,  available: true },
  { provider: 'GRASSHOPPERS',  label: 'Grasshoppers',   fee: 195, eta: 120, available: true },
  { provider: 'OWN_FLEET',     label: 'Direct Delivery', fee: 150, eta: 45, available: false },
];

// ─── Bill Headers (Full ER — with discount, net price) ──────────────────────
export const BILL_HEADERS = [
  { id: 'bill1', invoiceNo: 'INV-2026-0041', rxId: 'rx1', patientId: 'u4', patient: 'Sithum Fernando',    billDate: '2026-04-04', totalPrice: 751.50,  discountType: 'None',   discountAmount: 0,      netPrice: 751.50,  isPaid: true,  items: 'Amoxicillin, Paracetamol, Omeprazole', deliveryFee: 280, grandTotal: 2840, paymentMethod: 'PayHere' },
  { id: 'bill2', invoiceNo: 'INV-2026-0040', rxId: 'rx2', patientId: 'u5', patient: 'Dilani Jayawardena', billDate: '2026-04-04', totalPrice: 990.00,  discountType: 'Loyalty', discountAmount: 49.50,  netPrice: 940.50,  isPaid: true,  items: 'Metformin, Atorvastatin',              deliveryFee: 195, grandTotal: 1650, paymentMethod: 'PayHere' },
  { id: 'bill3', invoiceNo: 'INV-2026-0039', rxId: 'rx3', patientId: 'u6', patient: 'Ruwan Silva',        billDate: '2026-04-04', totalPrice: 450.00,  discountType: 'None',   discountAmount: 0,      netPrice: 450.00,  isPaid: false, items: 'Lisinopril 10mg',                      deliveryFee: 0,   grandTotal: 980,  paymentMethod: null },
  { id: 'bill4', invoiceNo: 'INV-2026-0038', rxId: 'rx4', patientId: 'u7', patient: 'Malini Perera',      billDate: '2026-04-03', totalPrice: 3130.00, discountType: 'Senior',  discountAmount: 156.50, netPrice: 2973.50, isPaid: true,  items: 'Insulin Glargine (x2), Metformin',     deliveryFee: 280, grandTotal: 3200, paymentMethod: 'PayHere' },
  { id: 'bill5', invoiceNo: 'INV-2026-0037', rxId: null,  patientId: 'u8', patient: 'Kasun Bandara',      billDate: '2026-04-03', totalPrice: 480.00,  discountType: 'None',   discountAmount: 0,      netPrice: 480.00,  isPaid: true,  items: 'Salbutamol Inhaler',                   deliveryFee: 195, grandTotal: 750,  paymentMethod: 'WEBXPAY' },
  { id: 'bill6', invoiceNo: 'INV-2026-0036', rxId: 'rx5', patientId: 'u9', patient: 'Priya Navaratnam',   billDate: '2026-04-02', totalPrice: 1515.00, discountType: 'None',   discountAmount: 0,      netPrice: 1515.00, isPaid: false, items: 'Warfarin 5mg, Clopidogrel',            deliveryFee: 0,   grandTotal: 1515, paymentMethod: null },
  { id: 'bill7', invoiceNo: 'INV-2026-0035', rxId: null,  patientId: 'u4', patient: 'Sithum Fernando',    billDate: '2026-04-01', totalPrice: 75.00,   discountType: 'First',   discountAmount: 7.50,  netPrice: 67.50,   isPaid: true,  items: 'Paracetamol 500mg (x30)',              deliveryFee: 150, grandTotal: 225,  paymentMethod: 'PayHere' },
  { id: 'bill8', invoiceNo: 'INV-2026-0034', rxId: null,  patientId: 'u6', patient: 'Ruwan Silva',        billDate: '2026-03-30', totalPrice: 555.00,  discountType: 'Loyalty', discountAmount: 27.75, netPrice: 527.25,  isPaid: true,  items: 'Losartan 50mg, Vitamin D3',            deliveryFee: 195, grandTotal: 750,  paymentMethod: 'WEBXPAY' },
];

// ─── Legacy INVOICES (backward-compat) ───────────────────────────────────────
export const INVOICES = BILL_HEADERS.map((b) => ({
  id: b.invoiceNo,
  patient: b.patient,
  items: b.items,
  amount: b.grandTotal,
  status: b.isPaid ? 'Paid' : 'Pending',
  date: b.billDate,
  subtotal: b.totalPrice,
  discountType: b.discountType,
  discountAmount: b.discountAmount,
  netPrice: b.netPrice,
  deliveryFee: b.deliveryFee,
  paymentMethod: b.paymentMethod,
}));

// ─── Transaction Types ───────────────────────────────────────────────────────
export const TRANSACTION_TYPES = [
  { id: 'tt1', code: 'GRN',    type: 'Goods Received',     ref: 'GRN', difference: '+' },
  { id: 'tt2', code: 'SALE',   type: 'Sale / Dispense',    ref: 'ORD', difference: '-' },
  { id: 'tt3', code: 'ADJ_IN', type: 'Stock Adjustment In', ref: 'ADJ', difference: '+' },
  { id: 'tt4', code: 'ADJ_OUT', type: 'Stock Adjustment Out', ref: 'ADJ', difference: '-' },
  { id: 'tt5', code: 'RETURN', type: 'Customer Return',    ref: 'RET', difference: '+' },
  { id: 'tt6', code: 'EXPIRED', type: 'Expired / Disposal', ref: 'EXP', difference: '-' },
];

// ─── Transactions (Stock Movements) ─────────────────────────────────────────
export const TRANSACTIONS = [
  { id: 'txn1',  typeId: 'tt1', date: '2026-04-01', itemId: 'itm1',  medicineId: 'med001', quantity: 500,  unit: 'tablets',  reference: 'GRN-2026-001', pharmacyId: 'ph1' },
  { id: 'txn2',  typeId: 'tt2', date: '2026-04-04', itemId: 'itm2',  medicineId: 'med002', quantity: 21,   unit: 'capsules', reference: 'ORD-ord1',     pharmacyId: 'ph1' },
  { id: 'txn3',  typeId: 'tt2', date: '2026-04-04', itemId: 'itm1',  medicineId: 'med001', quantity: 15,   unit: 'tablets',  reference: 'ORD-ord1',     pharmacyId: 'ph1' },
  { id: 'txn4',  typeId: 'tt2', date: '2026-04-04', itemId: 'itm3',  medicineId: 'med003', quantity: 60,   unit: 'tablets',  reference: 'ORD-ord2',     pharmacyId: 'ph1' },
  { id: 'txn5',  typeId: 'tt2', date: '2026-04-04', itemId: 'itm5',  medicineId: 'med005', quantity: 30,   unit: 'tablets',  reference: 'ORD-ord2',     pharmacyId: 'ph1' },
  { id: 'txn6',  typeId: 'tt1', date: '2026-04-02', itemId: 'itm9',  medicineId: 'med009', quantity: 200,  unit: 'tablets',  reference: 'GRN-2026-002', pharmacyId: 'ph1' },
  { id: 'txn7',  typeId: 'tt3', date: '2026-04-03', itemId: 'itm7',  medicineId: 'med007', quantity: 5,    unit: 'inhalers', reference: 'ADJ-001',      pharmacyId: 'ph1' },
  { id: 'txn8',  typeId: 'tt6', date: '2026-04-02', itemId: 'itm4',  medicineId: 'med004', quantity: 10,   unit: 'capsules', reference: 'EXP-001',      pharmacyId: 'ph1' },
  { id: 'txn9',  typeId: 'tt5', date: '2026-04-03', itemId: 'itm13', medicineId: 'med013', quantity: 20,   unit: 'tablets',  reference: 'RET-001',      pharmacyId: 'ph1' },
  { id: 'txn10', typeId: 'tt1', date: '2026-04-03', itemId: 'itm17', medicineId: 'med017', quantity: 100,  unit: 'tablets',  reference: 'GRN-2026-003', pharmacyId: 'ph1' },
  { id: 'txn11', typeId: 'tt2', date: '2026-04-04', itemId: 'itm6',  medicineId: 'med006', quantity: 1,    unit: 'vials',    reference: 'ORD-ord4',     pharmacyId: 'ph1' },
  { id: 'txn12', typeId: 'tt4', date: '2026-04-04', itemId: 'itm16', medicineId: 'med016', quantity: 2,    unit: 'tablets',  reference: 'ADJ-002',      pharmacyId: 'ph1' },
];

// ─── Item Requests (Supply Chain) ────────────────────────────────────────────
export const ITEM_REQUESTS = [
  { id: 'req1', medicineId: 'med002', pharmacyId: 'ph1', requestDate: '2026-04-04', quantity: 200, isApproved: true,  isSupplied: false, requestedBy: 'u2', medicineName: 'Amoxicillin 500mg', urgency: 'High' },
  { id: 'req2', medicineId: 'med004', pharmacyId: 'ph1', requestDate: '2026-04-04', quantity: 150, isApproved: true,  isSupplied: false, requestedBy: 'u2', medicineName: 'Omeprazole 20mg',   urgency: 'High' },
  { id: 'req3', medicineId: 'med006', pharmacyId: 'ph1', requestDate: '2026-04-03', quantity: 20,  isApproved: true,  isSupplied: true,  requestedBy: 'u2', medicineName: 'Insulin Glargine',  urgency: 'Critical' },
  { id: 'req4', medicineId: 'med008', pharmacyId: 'ph1', requestDate: '2026-04-04', quantity: 100, isApproved: false, isSupplied: false, requestedBy: 'u2', medicineName: 'Warfarin 5mg',      urgency: 'Critical' },
  { id: 'req5', medicineId: 'med012', pharmacyId: 'ph1', requestDate: '2026-04-03', quantity: 100, isApproved: true,  isSupplied: true,  requestedBy: 'u3', medicineName: 'Cefixime 200mg',    urgency: 'Medium' },
  { id: 'req6', medicineId: 'med016', pharmacyId: 'ph1', requestDate: '2026-04-04', quantity: 50,  isApproved: false, isSupplied: false, requestedBy: 'u2', medicineName: 'Clopidogrel 75mg',  urgency: 'Critical' },
  { id: 'req7', medicineId: 'med001', pharmacyId: 'ph2', requestDate: '2026-04-03', quantity: 500, isApproved: true,  isSupplied: true,  requestedBy: 'u3', medicineName: 'Paracetamol 500mg', urgency: 'Low' },
];

// ─── GRN Headers ─────────────────────────────────────────────────────────────
export const GRN_HEADERS = [
  { id: 'grn1', grnNo: 'GRN-2026-001', requestId: 'req7', pharmacyId: 'ph1', grnDate: '2026-04-01', isApproved: true,  supplierName: 'GlaxoSmithKline Lanka', totalItems: 1, totalQty: 500 },
  { id: 'grn2', grnNo: 'GRN-2026-002', requestId: null,   pharmacyId: 'ph1', grnDate: '2026-04-02', isApproved: true,  supplierName: 'AstraZeneca',           totalItems: 1, totalQty: 200 },
  { id: 'grn3', grnNo: 'GRN-2026-003', requestId: 'req5', pharmacyId: 'ph1', grnDate: '2026-04-03', isApproved: true,  supplierName: 'Pfizer Lanka',          totalItems: 2, totalQty: 200 },
  { id: 'grn4', grnNo: 'GRN-2026-004', requestId: 'req3', pharmacyId: 'ph1', grnDate: '2026-04-03', isApproved: true,  supplierName: 'Sanofi Aventis',        totalItems: 1, totalQty: 20  },
  { id: 'grn5', grnNo: 'GRN-2026-005', requestId: 'req1', pharmacyId: 'ph1', grnDate: '2026-04-05', isApproved: false, supplierName: 'GlaxoSmithKline Lanka', totalItems: 1, totalQty: 200 },
];

// ─── GRN Details ─────────────────────────────────────────────────────────────
export const GRN_DETAILS = [
  { id: 'grnd1', grnHeaderId: 'grn1', pharmacyId: 'ph1', medicineId: 'med001', binMappingId: 'mbm1',  itemDetailId: 'itm1',  unit: 'tablets',  quantity: 500, availableQty: 500, batchNo: 'BT-20260401-P1', expiryDate: '2027-06-30' },
  { id: 'grnd2', grnHeaderId: 'grn2', pharmacyId: 'ph1', medicineId: 'med009', binMappingId: 'mbm9',  itemDetailId: 'itm9',  unit: 'tablets',  quantity: 200, availableQty: 200, batchNo: 'BT-20260402-L1', expiryDate: '2027-04-30' },
  { id: 'grnd3', grnHeaderId: 'grn3', pharmacyId: 'ph1', medicineId: 'med012', binMappingId: 'mbm12', itemDetailId: 'itm12', unit: 'capsules', quantity: 100, availableQty: 95,  batchNo: 'BT-20260403-C1', expiryDate: '2026-10-31' },
  { id: 'grnd4', grnHeaderId: 'grn3', pharmacyId: 'ph1', medicineId: 'med017', binMappingId: 'mbm17', itemDetailId: 'itm17', unit: 'tablets',  quantity: 100, availableQty: 100, batchNo: 'BT-20260403-A1', expiryDate: '2027-07-31' },
  { id: 'grnd5', grnHeaderId: 'grn4', pharmacyId: 'ph1', medicineId: 'med006', binMappingId: 'mbm6',  itemDetailId: 'itm6',  unit: 'vials',    quantity: 20,  availableQty: 18,  batchNo: 'BT-20260403-IG',  expiryDate: '2026-08-31' },
  { id: 'grnd6', grnHeaderId: 'grn5', pharmacyId: 'ph1', medicineId: 'med002', binMappingId: 'mbm2',  itemDetailId: 'itm2',  unit: 'capsules', quantity: 200, availableQty: 200, batchNo: 'BT-20260405-AM',  expiryDate: '2027-01-31' },
];

// ─── Charts & Analytics ─────────────────────────────────────────────────────
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

export const MONTHLY_ORDERS = [
  { month: 'Oct', orders: 280 },
  { month: 'Nov', orders: 324 },
  { month: 'Dec', orders: 356 },
  { month: 'Jan', orders: 312 },
  { month: 'Feb', orders: 389 },
  { month: 'Mar', orders: 421 },
];

export const CATEGORIES = [
  { name: 'Chronic',   value: 45 },
  { name: 'Acute',     value: 30 },
  { name: 'OTC',       value: 25 },
];

export const QUICK_REORDER = [
  { name: 'Metformin 500mg',   lastOrdered: '2026-03-05', price: 330, icon: '💊' },
  { name: 'Atorvastatin 20mg', lastOrdered: '2026-03-05', price: 660, icon: '💊' },
  { name: 'Paracetamol 500mg', lastOrdered: '2026-03-18', price: 75,  icon: '💊' },
];

export const RECENT_ACTIVITY = [
  { id: 'a1', icon: '🏥', text: 'Matara MedHub onboarded — 5th pharmacy live',       time: '10 min ago', color: 'blue' },
  { id: 'a2', icon: '⚠️', text: 'Warfarin 5mg stock critically low (12 units)',       time: '15 min ago', color: 'red' },
  { id: 'a3', icon: '⚠️', text: 'Clopidogrel 75mg critically low (8 units)',          time: '20 min ago', color: 'red' },
  { id: 'a4', icon: '✅', text: 'Rx #RX002 auto-approved by AI (confidence 95%)',     time: '42 min ago', color: 'green' },
  { id: 'a5', icon: '🚚', text: 'PickMe Flash delivered ORD004 — Malini Perera',      time: '1 hr ago',   color: 'green' },
  { id: 'a6', icon: '📦', text: 'GRN-2026-004 received — 20 vials Insulin Glargine', time: '1.5 hr ago', color: 'blue' },
  { id: 'a7', icon: '👤', text: '3 new customer accounts registered today',           time: '2 hr ago',   color: 'blue' },
  { id: 'a8', icon: '🔔', text: 'Item request REQ-004 pending approval (Warfarin)',   time: '2.5 hr ago', color: 'amber' },
];

// ─── Pharmacy Performance (Admin Dashboard) ─────────────────────────────────
export const PHARMACY_PERFORMANCE = [
  { name: 'Colombo Central', orders: 142, revenue: 487200, satisfaction: 4.8, fillRate: 96 },
  { name: 'Kandy MediPlus',  orders: 98,  revenue: 312500, satisfaction: 4.6, fillRate: 93 },
  { name: 'Galle HealthCare', orders: 74, revenue: 218900, satisfaction: 4.5, fillRate: 91 },
  { name: 'Matara MedHub',   orders: 56,  revenue: 178400, satisfaction: 4.7, fillRate: 94 },
];

// ─── Platform Summary Stats ─────────────────────────────────────────────────
export const PLATFORM_STATS = {
  totalPharmacies: 5,
  activePharmacies: 4,
  totalUsers: 12,
  totalCustomers: 6,
  totalStaff: 4,
  totalMedicines: 18,
  totalOrders: 421,
  aiAccuracy: 94.2,
  avgOrderValue: 1580,
  totalRevenue: 1196000,
};
