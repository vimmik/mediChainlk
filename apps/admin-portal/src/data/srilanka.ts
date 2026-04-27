export const provinces = [
  'Central',
  'Eastern',
  'North Central',
  'Northern',
  'North Western',
  'Sabaragamuwa',
  'Southern',
  'Uva',
  'Western',
] as const;

export type Province = (typeof provinces)[number];

export const districtsByProvince: Record<Province, string[]> = {
  Central: ['Kandy', 'Matale', 'Nuwara Eliya'],
  Eastern: ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  Northern: ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  'North Western': ['Kurunegala', 'Puttalam'],
  Sabaragamuwa: ['Kegalle', 'Ratnapura'],
  Southern: ['Galle', 'Hambantota', 'Matara'],
  Uva: ['Badulla', 'Monaragala'],
  Western: ['Colombo', 'Gampaha', 'Kalutara'],
};

export const allDistricts = Object.values(districtsByProvince).flat().sort();

export function getDistrictsForProvince(province: string): string[] {
  return districtsByProvince[province as Province] ?? [];
}
