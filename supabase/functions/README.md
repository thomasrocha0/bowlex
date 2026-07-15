Supabase Edge Functions, if/when server-side logic doesn't fit in a Postgres
function or RLS policy (e.g. third-party webhooks). Empty for now — most of
this app's server-side logic belongs in Postgres (views, RLS, security-definer
functions), not Edge Functions.
