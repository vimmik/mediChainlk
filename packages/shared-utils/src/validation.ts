import { z } from 'zod';

export const prescriptionSchema = z.object({
  imageFile: z.instanceof(File).optional(),
  pharmacyId: z.string().min(1),
  notes: z.string().optional(),
});

export const orderSchema = z.object({
  prescriptionId: z.string().min(1),
  pharmacyId: z.string().min(1),
  deliveryAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    postalCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  deliveryProvider: z.enum(['PICKME_FLASH', 'GRASSHOPPERS', 'OWN_FLEET', 'MANUAL']),
});
