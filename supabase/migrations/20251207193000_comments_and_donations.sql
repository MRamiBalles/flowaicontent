-- Create comments table
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id TEXT NOT NULL, -- Could be a UUID if we had a videos table, utilizing text for flexibility (mock IDs)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL CHECK (length(content) > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create donations table (The "Boost" feature)
CREATE TABLE public.donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    streamer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    message TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Policies for Comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for Donations
-- Public can see donations (e.g. in a ticker) or just streamer/donor. 
-- For transparency in a "Stream", usually public read is fine for the event feed.
CREATE POLICY "Donations are viewable by everyone" ON public.donations
  FOR SELECT USING (true);

CREATE POLICY "Users can donate" ON public.donations
  FOR INSERT WITH CHECK (auth.uid() = donor_id);
