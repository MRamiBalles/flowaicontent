import { z } from "zod";

/**
 * Validation Schemas
 * 
 * Zod schemas for input validation across the application.
 * Provides type-safe validation with user-friendly error messages.
 * 
 * Benefits:
 * - Runtime type checking
 * - Automatic TypeScript type inference
 * - Customizable error messages
 * - Composite validation (trim, min, max, regex)
 * 
 * Usage:
 * ```typescript
 * const result = signUpSchema.parse(formData);
 * // Throws ZodError with detailed error messages if invalid
 * ```
 */

// Authentication Schemas

/**
 * Sign Up Validation
 * 
 * Requirements:
 * - Email: Valid format, max 255 chars
 * - Password: 6-72 chars (bcrypt limit is 72)
 * - Full Name: 1-100 chars, trimmed
 * 
 * Security Note:
 * Max password length of 72 prevents DoS via bcrypt
 */
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
    .max(72, "Password must be less than 72 characters"), // bcrypt max
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters"),
});

/**
 * Sign In Validation
 * 
 * More permissive than signup (no min password length check)
 * since we're validating existing accounts.
 */
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

// Content Generation Schemas

/**
 * Project Validation
 * 
 * Used for content generation input.
 * 
 * Limits:
 * - Title: 1-200 chars (UI displays in cards/lists)
 * - Content: 1-50,000 chars (AI model token limit consideration)
 * 
 * Note: Content is further sanitized in generate-content Edge Function
 */
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

// TypeScript types inferred from schemas
// Use these for type-safe form handling
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
