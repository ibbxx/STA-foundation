-- Force refresh the materialized view so existing success donations appear immediately
REFRESH MATERIALIZED VIEW public.leaderboard;
