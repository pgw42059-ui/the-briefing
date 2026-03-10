
-- Fix overly permissive policies: restrict write to service_role only
DROP POLICY "Allow service role insert" ON public.market_analysis_cache;
DROP POLICY "Allow service role delete" ON public.market_analysis_cache;

CREATE POLICY "Service role insert only" ON public.market_analysis_cache 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role delete only" ON public.market_analysis_cache 
  FOR DELETE USING (auth.role() = 'service_role');
