import { z } from "zod";

// Authentication validation schemas
export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be less than 72 characters"),
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters"),
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(1, "Password is required"),
});

// Project validation schemas
export const projectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Project title is required")
    .max(200, "Project title must be less than 200 characters"),
  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(50000, "Content must be less than 50,000 characters"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
