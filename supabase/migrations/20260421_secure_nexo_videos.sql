alter table public.nexo_videos enable row level security;

drop policy if exists nexo_videos_public_select on public.nexo_videos;
drop policy if exists nexo_videos_admin_insert on public.nexo_videos;
drop policy if exists nexo_videos_admin_update on public.nexo_videos;
drop policy if exists nexo_videos_admin_delete on public.nexo_videos;

create policy nexo_videos_public_select
  on public.nexo_videos
  for select
  using (
    is_published = true
    or exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

create policy nexo_videos_admin_insert
  on public.nexo_videos
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

create policy nexo_videos_admin_update
  on public.nexo_videos
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

create policy nexo_videos_admin_delete
  on public.nexo_videos
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

with ranked_videos as (
  select
    id,
    row_number() over (
      partition by youtube_url
      order by created_at desc, id desc
    ) as rank_in_url
  from public.nexo_videos
  where youtube_url is not null
)
delete from public.nexo_videos videos
using ranked_videos ranked
where videos.id = ranked.id
  and ranked.rank_in_url > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'nexo_videos_youtube_url_key'
      and conrelid = 'public.nexo_videos'::regclass
  ) then
    alter table public.nexo_videos
      add constraint nexo_videos_youtube_url_key unique (youtube_url);
  end if;
end $$;
