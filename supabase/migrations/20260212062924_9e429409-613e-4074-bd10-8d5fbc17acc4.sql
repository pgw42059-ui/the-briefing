-- Remove the overly permissive public read policy on market_analysis_cache
-- Client reads data via edge functions (which use service_role), not directly from the table
DROP POLICY IF EXISTS "Allow public read" ON public.market_analysis_cache;
