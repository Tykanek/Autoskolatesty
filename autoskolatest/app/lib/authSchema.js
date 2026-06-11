import { z } from "zod";

export const authSchema = z.object({
  fullName: z
    .string()
    .trim()
    .max(100, "Jméno může mít maximálně 100 znaků")
    .optional(),
  email: z.string().trim().email("Zadejte platnou e-mailovou adresu"),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
});
