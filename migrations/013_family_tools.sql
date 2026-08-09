-- Family tools: bulletin board, shared lists, wishlist tie-in to grail_list
-- (011/012 numbers reserved by the fb_free_posts branch)

create table if not exists fliply_board_posts (
  id uuid primary key default gen_random_uuid(),
  author_email text not null,
  author_name text,
  title text,
  body text not null,
  category text not null default 'general' check (category in ('general','deals','plans','wins')),
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists board_posts_order_idx on fliply_board_posts (pinned desc, created_at desc);

create table if not exists fliply_board_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references fliply_board_posts(id) on delete cascade,
  author_email text not null,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists board_replies_post_idx on fliply_board_replies (post_id, created_at);

create table if not exists fliply_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists fliply_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references fliply_lists(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  added_by text,
  done_by text,
  created_at timestamptz not null default now()
);
create index if not exists list_items_list_idx on fliply_list_items (list_id, done, created_at);

-- Wishlist rides the Items pipeline's grail_list (v2 scoring boost hooks into it)
alter table grail_list add column if not exists requested_by text;
alter table grail_list add column if not exists notes text;
alter table grail_list add column if not exists created_at timestamptz not null default now();

alter table fliply_board_posts enable row level security;
alter table fliply_board_replies enable row level security;
alter table fliply_lists enable row level security;
alter table fliply_list_items enable row level security;

insert into fliply_lists (name, emoji, created_by) values
  ('Groceries', E'🛒', 'system'),
  ('Costco Run', E'🏬', 'system'),
  ('Hardware Store', E'🔨', 'system')
on conflict (name) do nothing;
