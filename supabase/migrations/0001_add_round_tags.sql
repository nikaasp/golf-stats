-- Round tags used to live only in localStorage, so they did not sync across
-- devices. This adds a tags column to the rounds table so tags become the
-- source of truth in Supabase. The app keeps a localStorage fallback and
-- degrades gracefully until this migration is applied.
alter table rounds add column if not exists tags text[] not null default '{}';
