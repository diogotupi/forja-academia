import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  phone: z.string().min(10).max(20),
  password: z.string().min(10).max(128).regex(/[A-Z]/, "Inclua uma letra maiúscula").regex(/[0-9]/, "Inclua um número"),
});
export const loginSchema = z.object({ email: z.email(), password: z.string().min(1).max(128) });
export const checkoutSchema = z.object({ offerId: z.string().min(2).max(120) });
export const progressSchema = z.object({ positionSeconds: z.number().int().min(0), completed: z.boolean().optional() });
