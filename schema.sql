-- Supabase pgvector setup
create extension if not exists vector;

-- Chats Table
create table chats (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, -- Clerk User ID
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages Table
create table messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content jsonb not null, -- Store structured data (Title, Summary, Detailed Explanation, etc.)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Documents Table for RAG
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  source_type text not null check (source_type in ('user', 'public')),
  priority integer default 1,
  embedding vector(1536), -- Assuming OpenAI text-embedding-3-small (1536 dims)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a function for similarity search
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  source_type text,
  priority integer,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.title,
    documents.content,
    documents.source_type,
    documents.priority,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc, priority desc
  limit match_count;
$$;
