import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type SignInValues = z.infer<typeof signInSchema>;

export function parseSignInFormData(formData: FormData): SignInValues {
  return {
    email: readString(formData, "email"),
    password: readString(formData, "password"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
