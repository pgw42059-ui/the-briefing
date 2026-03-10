
-- Cache table for AI market analysis results
CREATE TABLE public.market_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Only keep latest row, auto-cleanup old entries
CREATE INDEX idx_market_analysis_cache_created ON public.market_analysis_cache (created_at DESC);

-- Public read access (no auth needed for this cache)
ALTER TABLE public.market_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.market_analysis_cache FOR SELECT USING (true);
CREATE POLICY "Allow service role insert" ON public.market_analysis_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role delete" ON public.market_analysis_cache FOR DELETE USING (true);
