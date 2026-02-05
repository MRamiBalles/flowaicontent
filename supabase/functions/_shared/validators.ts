 // Shared validation schemas for edge functions
 // Using Zod for comprehensive input validation
 
 import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
 
 // =============================================================================
 // BASE SCHEMAS - Reusable primitive validators
 // =============================================================================
 
 export const uuidSchema = z.string().uuid('Invalid ID format');
 
 export const emailSchema = z.string()
   .email('Invalid email format')
   .max(255, 'Email must be less than 255 characters')
   .transform((val) => val.toLowerCase().trim());
 
 export const urlSchema = z.string()
   .url('Invalid URL format')
   .max(2048, 'URL must be less than 2048 characters');
 
 export const optionalUrlSchema = urlSchema.optional().nullable();
 
 export const safeTextSchema = z.string()
   .trim()
   .min(1, 'Field cannot be empty')
   .max(500, 'Text must be less than 500 characters');
 
 export const longTextSchema = z.string()
   .trim()
   .max(5000, 'Text must be less than 5000 characters');
 
 // =============================================================================
 // BRAND DEALS SCHEMAS
 // =============================================================================
 
 export const brandDealApplicationSchema = z.object({
   campaign_id: uuidSchema,
   proposed_rate: z.number()
     .int('Rate must be a whole number')
     .min(0, 'Rate cannot be negative')
     .max(100000000, 'Rate exceeds maximum allowed'), // $1M max
   message: longTextSchema.optional(),
 });
 
 export const brandDealUpdateSchema = z.object({
   deal_id: uuidSchema,
   status: z.enum([
     'pending', 'negotiating', 'accepted', 'in_progress',
     'review', 'revision_requested', 'approved', 'published',
     'completed', 'cancelled'
   ], {
     errorMap: () => ({ message: 'Invalid status' }),
   }),
 });
 
 export const brandDealMessageSchema = z.object({
   deal_id: uuidSchema,
   message: z.string()
     .trim()
     .min(1, 'Message cannot be empty')
     .max(10000, 'Message must be less than 10000 characters'),
   attachments: z.array(urlSchema).max(10, 'Maximum 10 attachments').optional(),
 });
 
 export const campaignQuerySchema = z.object({
   campaign_id: uuidSchema,
   limit: z.number().int().min(1).max(100).optional().default(10),
 });
 
 // =============================================================================
 // ENTERPRISE ADMIN SCHEMAS
 // =============================================================================
 
 export const enterpriseRoleSchema = z.enum(['member', 'manager', 'admin', 'owner'], {
   errorMap: () => ({ message: 'Invalid role. Must be: member, manager, admin, or owner' }),
 });
 
 export const enterpriseInviteSchema = z.object({
   email: emailSchema,
   role: enterpriseRoleSchema.optional().default('member'),
   department: safeTextSchema.max(100).optional(),
   team: safeTextSchema.max(100).optional(),
   message: longTextSchema.max(1000).optional(),
 });
 
 export const enterpriseTenantUpdateSchema = z.object({
   name: safeTextSchema.max(200).optional(),
   logo_url: optionalUrlSchema,
   logo_dark_url: optionalUrlSchema,
   favicon_url: optionalUrlSchema,
   primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
   secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
   font_family: safeTextSchema.max(100).optional(),
   support_email: emailSchema.optional(),
   billing_email: emailSchema.optional(),
 });
 
 export const enterpriseApiKeySchema = z.object({
   name: safeTextSchema.max(100),
   description: longTextSchema.max(500).optional(),
   scopes: z.array(z.enum(['read', 'write', 'admin'])).min(1).max(5).optional().default(['read']),
   expires_at: z.string().datetime().optional(),
 });
 
 export const paginationSchema = z.object({
   limit: z.number().int().min(1).max(100).optional().default(50),
   offset: z.number().int().min(0).optional().default(0),
 });
 
 // =============================================================================
 // COSTREAM COMPANION SCHEMAS
 // =============================================================================
 
 export const companionPersonalitySchema = z.enum(
   ['friendly', 'sarcastic', 'educational', 'hype'],
   { errorMap: () => ({ message: 'Invalid personality type' }) }
 );
 
 export const createCompanionSchema = z.object({
   name: z.string()
     .trim()
     .min(1, 'Name is required')
     .max(100, 'Name must be less than 100 characters'),
   personality: companionPersonalitySchema,
   avatar_url: optionalUrlSchema,
   voice_id: uuidSchema.optional(),
   custom_knowledge: z.array(
     z.string().trim().max(1000, 'Knowledge item too long')
   ).max(50, 'Maximum 50 knowledge items').optional().default([]),
 });
 
 export const sessionActionSchema = z.object({
   session_id: uuidSchema,
 });
 
 export const startSessionSchema = z.object({
   companion_id: uuidSchema,
   title: safeTextSchema.max(200).optional(),
   platform: z.enum(['twitch', 'youtube', 'kick', 'custom']).optional().default('custom'),
 });
 
 export const sendMessageSchema = z.object({
   session_id: uuidSchema,
   message: z.string()
     .trim()
     .min(1, 'Message cannot be empty')
     .max(500, 'Message must be less than 500 characters'),
   sender_type: z.enum(['streamer', 'viewer', 'ai']).optional().default('streamer'),
   sender_name: safeTextSchema.max(50).optional(),
 });
 
 export const generateAiResponseSchema = z.object({
   session_id: uuidSchema,
   prompt: z.string()
     .trim()
     .min(1, 'Prompt cannot be empty')
     .max(2000, 'Prompt must be less than 2000 characters'),
 });
 
 // =============================================================================
 // LICENSE CREATION SCHEMAS
 // =============================================================================
 
 export const contentTypeSchema = z.enum(
   ['video', 'style_pack', 'voice', 'music', 'template'],
   { errorMap: () => ({ message: 'Invalid content type' }) }
 );
 
 export const licenseTypeSchema = z.enum(
   ['royalty_free', 'rights_managed', 'editorial', 'commercial', 'exclusive'],
   { errorMap: () => ({ message: 'Invalid license type' }) }
 );
 
 export const createLicenseSchema = z.object({
   content_type: contentTypeSchema,
   content_id: uuidSchema,
   content_title: z.string()
     .trim()
     .min(1, 'Title is required')
     .max(200, 'Title must be less than 200 characters'),
   content_preview_url: optionalUrlSchema,
   license_type: licenseTypeSchema,
   price_cents: z.number()
     .int('Price must be a whole number')
     .min(0, 'Price cannot be negative')
     .max(100000000, 'Price exceeds maximum ($1M)'),
   usage_rights: z.array(z.string().max(50)).max(20).optional(),
   max_impressions: z.number().int().min(0).max(1000000000).optional(),
   duration_days: z.number().int().min(1).max(3650).optional(), // Max 10 years
   territory: z.array(z.string().max(50)).max(200).optional(),
   royalty_percentage: z.number().min(0).max(50).optional(),
   requires_attribution: z.boolean().optional().default(false),
   attribution_text: z.string().trim().max(500).optional(),
   allows_ai_training: z.boolean().optional().default(false),
   allows_derivative_works: z.boolean().optional().default(true),
 }).refine(
   (data) => {
     // If license_type is rights_managed, royalty_percentage is required
     if (data.license_type === 'rights_managed') {
       return data.royalty_percentage !== undefined && 
              data.royalty_percentage >= 0 && 
              data.royalty_percentage <= 50;
     }
     return true;
   },
   { message: 'rights_managed licenses require royalty_percentage between 0 and 50' }
 );
 
 // =============================================================================
 // HELPER FUNCTIONS
 // =============================================================================
 
 /**
  * Parse request data with a Zod schema and return structured error response if invalid
  */
 export function parseWithSchema<T>(
   schema: z.ZodSchema<T>,
   data: unknown,
   corsHeaders: Record<string, string>
 ): { success: true; data: T } | { success: false; response: Response } {
   try {
     const parsed = schema.parse(data);
     return { success: true, data: parsed };
   } catch (error) {
     if (error instanceof z.ZodError) {
       const response = new Response(JSON.stringify({
         success: false,
         error: 'Validation failed',
         details: error.issues.map((issue) => ({
           field: issue.path.join('.') || 'root',
           message: issue.message,
         })),
       }), {
         status: 400,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
       return { success: false, response };
     }
     throw error;
   }
 }
 
 /**
  * Safely parse without throwing - returns undefined on failure
  */
 export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | undefined {
   const result = schema.safeParse(data);
   return result.success ? result.data : undefined;
 }
 
 // Re-export Zod for convenience
 export { z };