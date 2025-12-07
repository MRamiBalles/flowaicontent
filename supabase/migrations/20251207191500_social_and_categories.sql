-- Create categories table for Content Classification
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- Lucide icon name
    reward_multiplier DECIMAL(3, 2) DEFAULT 1.00, -- 1.00 = standard, 1.50 = educational
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial categories
INSERT INTO public.categories (name, slug, icon, reward_multiplier, description) VALUES
('Education', 'education', 'GraduationCap', 1.50, 'Tutorials, courses, and educational content.'),
('Science & Tech', 'science-tech', 'Atom', 1.40, 'Scientific discoveries and technology reviews.'),
('Art & Design', 'art-design', 'Palette', 1.20, 'Digital art, showcases, and design habits.'),
('Entertainment', 'entertainment', 'Tv', 1.00, 'Gaming, comedy, and general entertainment.'),
('Lifestyle', 'lifestyle', 'Coffee', 1.00, 'Vlogs, travel, and daily life.'),
('Crypto & Web3', 'crypto', 'Bitcoin', 1.30, 'Blockchain education and news.');


-- Create followers table for Social Graph
CREATE TABLE public.followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) NOT NULL,
    following_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, following_id)
);

-- Add 'flow_points' to profiles if not exists (Learn-to-Earn ledger)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS flow_points BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_minutes_watched BIGINT DEFAULT 0;


-- Security Policies (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Categories are public read
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);

-- Followers: Anyone can read, Auth can insert (follow), Auth can delete (unfollow)
CREATE POLICY "Followers are viewable by everyone" ON public.followers
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.followers
  FOR DELETE USING (auth.uid() = follower_id);
