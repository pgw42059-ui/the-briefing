
-- Fix profiles: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Fix watchlist: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view own watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Users can add to watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Users can remove from watchlist" ON public.watchlist;

CREATE POLICY "Users can view own watchlist" ON public.watchlist
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can add to watchlist" ON public.watchlist
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from watchlist" ON public.watchlist
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix market_analysis_cache: drop restrictive policies, recreate as permissive, add SELECT
DROP POLICY IF EXISTS "Service role delete only" ON public.market_analysis_cache;
DROP POLICY IF EXISTS "Service role insert only" ON public.market_analysis_cache;

CREATE POLICY "Service role select only" ON public.market_analysis_cache
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role insert only" ON public.market_analysis_cache
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role delete only" ON public.market_analysis_cache
  FOR DELETE TO service_role USING (true);
