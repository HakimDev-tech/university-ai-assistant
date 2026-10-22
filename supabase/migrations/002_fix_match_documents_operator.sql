-- Fix pgvector operator resolution when match_documents uses an empty search_path.
-- Explicitly qualify the cosine-distance operator while preserving SECURITY INVOKER
-- and the auth.uid() ownership boundary.
create or replace function public.match_documents(
  query_embedding extensions.vector(768),
  target_user_id uuid,
  target_document_id uuid,
  match_threshold float,
  match_count int
)
returns table(chunk_id uuid, content text, chunk_index integer, similarity float)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null or auth.uid() <> target_user_id then
    raise exception 'not authorized';
  end if;
  if match_count < 1 or match_count > 12 then
    raise exception 'invalid match_count';
  end if;

  return query
    select c.id, c.content, c.chunk_index,
      (1 - (c.embedding OPERATOR(extensions.<=>) query_embedding))::float as similarity
    from public.document_chunks c
    join public.documents d on d.id = c.document_id
    where c.user_id = target_user_id
      and c.document_id = target_document_id
      and d.user_id = target_user_id
      and (1 - (c.embedding OPERATOR(extensions.<=>) query_embedding)) >= match_threshold
    order by c.embedding OPERATOR(extensions.<=>) query_embedding
    limit match_count;
end;
$$;

revoke all on function public.match_documents(extensions.vector, uuid, uuid, float, int) from public, anon;
grant execute on function public.match_documents(extensions.vector, uuid, uuid, float, int) to authenticated;
