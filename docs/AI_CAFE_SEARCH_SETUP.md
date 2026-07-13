# AI Cafe Search System - Complete Setup Guide

## Current Status

✅ **Frontend**: Build successful - Hero, page, and CafeCard components updated  
⏳ **Backend**: Needs setup - SQL schema, Edge Function, embeddings backfill

## Frontend Changes (Completed)

### Files Modified:
1. **app/components/Hero.tsx** - Client component with search form, calls `/functions/v1/cafe-search`
2. **app/page.tsx** - Manages search results state, conditionally renders results vs static rows
3. **app/components/CafeCard.tsx** - Now accepts `cafe` prop and renders dynamically
4. **.env.local** - Added `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Backend Setup (Required)

### Step 1: Enable pgvector Extension

Go to Supabase Dashboard → SQL Editor → New Query, then run:

```sql
create extension if not exists vector with schema public;
```

### Step 2: Add Embeddings Column to Cafes Table

```sql
alter table cafes add column if not exists embedding vector(1536);
create index if not exists cafes_embedding_idx on cafes using ivfflat (embedding vector_cosine_ops) with (lists = 100);
```

### Step 3: Create Full-Text Search Index

```sql
alter table cafes add column if not exists search_text tsvector;

create or replace function cafe_search_text_update()
returns trigger as $$
begin
  new.search_text :=
    to_tsvector('english', coalesce(new.name, '') || ' ' ||
                           coalesce(new.description, '') || ' ' ||
                           coalesce(string_agg(t.name, ' '), ''));
  return new;
end;
$$ language plpgsql;

create trigger cafe_search_text_trigger
before insert or update on cafes
for each row
execute function cafe_search_text_update();

create index if not exists cafes_search_text_idx on cafes using gin(search_text);
```

### Step 4: Create Hybrid Search RPC Function

```sql
create or replace function hybrid_search_cafes(
  query_text text,
  query_embedding vector,
  match_threshold float default 0.1,
  match_count int default 10
)
returns table (
  id uuid,
  name text,
  description text,
  address text,
  neighborhood text,
  city text,
  featured_image_url text,
  rating numeric,
  review_count int,
  is_new boolean,
  is_featured boolean,
  tag_names text[],
  similarity float
) as $$
begin
  return query
  select
    c.id,
    c.name,
    c.description,
    c.address,
    c.neighborhood,
    c.city,
    c.featured_image_url,
    c.rating,
    c.review_count,
    c.is_new,
    c.is_featured,
    coalesce(array_agg(t.name), array[]::text[]) as tag_names,
    (
      case
        when query_embedding is not null then
          (1 - (c.embedding <=> query_embedding)) * 0.6 +  -- 60% semantic
          (case when c.search_text @@ plainto_tsquery('english', query_text) then 0.4 else 0 end)  -- 40% keyword
        else
          case when c.search_text @@ plainto_tsquery('english', query_text) then 1.0 else 0 end
      end
    ) as similarity
  from cafes c
  left join cafe_tags ct on c.id = ct.cafe_id
  left join tags t on ct.tag_id = t.id
  where
    query_embedding is null or
    (1 - (c.embedding <=> query_embedding)) > match_threshold or
    c.search_text @@ plainto_tsquery('english', query_text)
  group by
    c.id, c.name, c.description, c.address, c.neighborhood, c.city,
    c.featured_image_url, c.rating, c.review_count, c.is_new, c.is_featured
  order by similarity desc
  limit match_count;
end;
$$ language plpgsql;
```

### Step 5: Add Required Environment Variables to Supabase

Go to Supabase Dashboard → Project Settings → Secrets, and add:

```
OPENAI_API_KEY=sk-xxx... (get from OpenAI dashboard)
```

### Step 6: Create Edge Function

Go to Supabase Dashboard → Edge Functions → Create new function, name it `cafe-search`:

**Deno code** (`supabase/functions/cafe-search/index.ts`):

```typescript
import Deno from "https://deno.land/x/deno@v1.40.0/mod.ts";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.0";

const openaiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small",
      dimensions: 1536,
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

async function searchCafes(
  query: string,
  mode: "keyword" | "ai",
  city: string,
  limit: number = 10
) {
  let embedding: number[] | null = null;

  if (mode === "ai") {
    embedding = await generateEmbedding(query);
  }

  const { data, error } = await supabase.rpc("hybrid_search_cafes", {
    query_text: query,
    query_embedding: embedding ? JSON.stringify(embedding) : null,
    match_threshold: 0.1,
    match_count: limit,
  });

  if (error) {
    throw error;
  }

  // Filter by city
  return data.filter((cafe: any) => cafe.city === city);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const { query, mode, city, limit } = await req.json();

  const cafes = await searchCafes(query, mode, city, limit);

  return new Response(JSON.stringify({ cafes }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
```

**Deploy** using Supabase CLI:
```bash
supabase functions deploy cafe-search
```

### Step 7: Backfill Existing Cafe Embeddings

Run this script locally or in a Node.js environment:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uinzpykgbzhvgxwcproi.supabase.co",
  "service_role_key_here" // Use service role key
);

async function backfillEmbeddings() {
  const { data: cafes, error } = await supabase
    .from("cafes")
    .select("id, name, description")
    .is("embedding", null);

  if (error) throw error;

  for (const cafe of cafes) {
    const text = `${cafe.name} ${cafe.description || ""}`;

    const embeddingResponse = await fetch(
      "https://api.openai.com/v1/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-3-small",
          dimensions: 1536,
        }),
      }
    );

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    await supabase
      .from("cafes")
      .update({ embedding })
      .eq("id", cafe.id);

    console.log(`Embedded: ${cafe.name}`);
  }
}

backfillEmbeddings().catch(console.error);
```

## Testing Checklist

- [ ] pgvector extension enabled
- [ ] `embedding` column added to cafes
- [ ] Full-text search index created
- [ ] `hybrid_search_cafes` RPC function created
- [ ] Edge Function `cafe-search` deployed
- [ ] Existing cafes have embeddings backfilled
- [ ] OPENAI_API_KEY set in Supabase secrets
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY in `.env.local`
- [ ] Test search from frontend: try "specialty coffee" or "student friendly"
- [ ] Verify results show correct cafes with ratings and tags

## Troubleshooting

### Edge Function returns 500
- Check Supabase functions logs: Dashboard → Edge Functions → cafe-search → Logs
- Verify OPENAI_API_KEY is set in project secrets
- Verify SUPABASE_SERVICE_ROLE_KEY is accessible to function

### Search returns no results
- Confirm embeddings exist: `select count(*) from cafes where embedding is not null;`
- Check that cafes match the city filter ("Cebu City")
- Verify tsvector search works: `select * from cafes where search_text @@ plainto_tsquery('english', 'coffee');`

### Slow search queries
- Check index creation: `select * from pg_indexes where tablename = 'cafes';`
- May need to increase IVFFlat lists parameter or use different algorithm

## Next Steps

1. Create Supabase project secrets with OPENAI_API_KEY
2. Run all SQL migrations in order
3. Deploy Edge Function
4. Run backfill script for embeddings
5. Test search functionality from frontend
