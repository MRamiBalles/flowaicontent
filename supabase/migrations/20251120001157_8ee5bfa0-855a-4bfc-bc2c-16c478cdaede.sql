-- Add length constraints to prevent database overflow

-- Projects table constraints
ALTER TABLE public.projects 
ADD CONSTRAINT title_length CHECK (length(title) <= 200);

ALTER TABLE public.projects 
ADD CONSTRAINT original_text_length CHECK (length(original_text) <= 50000);

-- Generated content constraints
ALTER TABLE public.generated_content 
ADD CONSTRAINT content_text_length CHECK (length(content_text) <= 10000);

-- Profiles table constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT full_name_length CHECK (length(full_name) <= 100);