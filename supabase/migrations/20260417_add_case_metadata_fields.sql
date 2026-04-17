alter table public.nexo_cases
  add column if not exists description text,
  add column if not exists equipment_model text,
  add column if not exists installation_size text;

comment on column public.nexo_cases.description is '설치사례 요약 설명';
comment on column public.nexo_cases.equipment_model is '설치 모델명';
comment on column public.nexo_cases.installation_size is '설치 면적 또는 사이즈';
