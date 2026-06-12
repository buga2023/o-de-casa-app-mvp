-- Ô de Casa! — schema + RLS + storage + seed (Supabase / Postgres)
-- Rode no SQL Editor do Supabase. Idempotente onde possível.

-- ---------- ENUMS ----------
do $$ begin
  create type vinculo_status as enum ('pendente','ativo','recusado');
exception when duplicate_object then null; end $$;
do $$ begin
  create type encomenda_status as enum ('registrada','retirada','contestada');
exception when duplicate_object then null; end $$;
do $$ begin
  create type contestacao_status as enum ('aberta','resolvida');
exception when duplicate_object then null; end $$;

-- ---------- TABELAS ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  endereco text,
  condominio text,
  cep text,
  verificado boolean not null default false,
  reputacao numeric not null default 5,
  bloqueado boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.vinculos (
  id uuid primary key default gen_random_uuid(),
  morador_id uuid not null references public.profiles(id) on delete cascade,
  vizinho_id uuid not null references public.profiles(id) on delete cascade,
  status vinculo_status not null default 'pendente',
  created_at timestamptz not null default now(),
  unique (morador_id, vizinho_id),
  check (morador_id <> vizinho_id)
);

create table if not exists public.encomendas (
  id uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references public.profiles(id),
  recebedor_id uuid not null references public.profiles(id),
  descricao text,
  foto_url text not null,                          -- BR-03: foto obrigatória
  codigo_comprovante text not null unique,
  status encomenda_status not null default 'registrada',
  created_at timestamptz not null default now(),
  retirada_at timestamptz
);

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  encomenda_id uuid references public.encomendas(id) on delete cascade,
  titulo text not null,
  corpo text,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  encomenda_id uuid not null references public.encomendas(id) on delete cascade,
  de_id uuid not null references public.profiles(id),
  para_id uuid not null references public.profiles(id),
  nota int not null check (nota between 1 and 5),
  comentario text,
  created_at timestamptz not null default now()
);

create table if not exists public.contestacoes (
  id uuid primary key default gen_random_uuid(),
  encomenda_id uuid not null references public.encomendas(id) on delete cascade,
  motivo text not null,
  status contestacao_status not null default 'aberta',
  created_at timestamptz not null default now()
);

-- ---------- STORAGE ----------
insert into storage.buckets (id, name, public)
  values ('encomendas','encomendas', true)
  on conflict (id) do nothing;

-- ---------- RLS ----------
alter table public.profiles     enable row level security;
alter table public.vinculos     enable row level security;
alter table public.encomendas   enable row level security;
alter table public.notificacoes enable row level security;
alter table public.avaliacoes   enable row level security;
alter table public.contestacoes enable row level security;

-- profiles: todos leem (para buscar vizinho), só edita o próprio
create policy "profiles_select_all"  on public.profiles for select using (true);
create policy "profiles_insert_self" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_self" on public.profiles for update using (id = auth.uid());

-- vinculos: apenas as partes
create policy "vinculos_select_parties" on public.vinculos for select
  using (morador_id = auth.uid() or vizinho_id = auth.uid());
create policy "vinculos_insert_morador" on public.vinculos for insert
  with check (morador_id = auth.uid());
create policy "vinculos_update_parties" on public.vinculos for update
  using (morador_id = auth.uid() or vizinho_id = auth.uid());

-- encomendas: destinatário ou recebedor
create policy "encomendas_select_parties" on public.encomendas for select
  using (destinatario_id = auth.uid() or recebedor_id = auth.uid());
create policy "encomendas_insert_recebedor" on public.encomendas for insert
  with check (recebedor_id = auth.uid());
create policy "encomendas_update_parties" on public.encomendas for update
  using (destinatario_id = auth.uid() or recebedor_id = auth.uid());

-- notificacoes: dono lê/atualiza; qualquer autenticado pode criar (para notificar outro)
create policy "notif_select_owner" on public.notificacoes for select using (user_id = auth.uid());
create policy "notif_update_owner" on public.notificacoes for update using (user_id = auth.uid());
create policy "notif_insert_auth"  on public.notificacoes for insert with check (auth.uid() is not null);

-- avaliacoes / contestacoes
create policy "aval_select_parties" on public.avaliacoes for select using (de_id = auth.uid() or para_id = auth.uid());
create policy "aval_insert_self"    on public.avaliacoes for insert with check (de_id = auth.uid());
create policy "contest_select_auth" on public.contestacoes for select using (auth.uid() is not null);
create policy "contest_insert_auth" on public.contestacoes for insert with check (auth.uid() is not null);

-- Realtime para notificações (RF-05)
alter publication supabase_realtime add table public.notificacoes;

-- ---------- INTEGRIDADE EXTRA ----------
-- Uma avaliação por (encomenda, avaliador)
do $$ begin
  alter table public.avaliacoes
    add constraint avaliacoes_encomenda_de_unique unique (encomenda_id, de_id);
exception when duplicate_table then null; when duplicate_object then null; end $$;

-- ---------- REPUTAÇÃO (BR-09) ----------
-- Recalcula a média do avaliado a cada avaliação; abaixo de 2.5 bloqueia.
-- Roda como trigger (security definer) porque RLS impede o cliente de
-- atualizar o perfil de outro usuário.
create or replace function public.recalc_reputacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  media numeric;
begin
  select round(avg(nota)::numeric, 1) into media
    from public.avaliacoes where para_id = new.para_id;
  update public.profiles
     set reputacao = coalesce(media, 5),
         bloqueado = bloqueado or coalesce(media, 5) < 2.5
   where id = new.para_id;
  return new;
end;
$$;

drop trigger if exists trg_recalc_reputacao on public.avaliacoes;
create trigger trg_recalc_reputacao
  after insert on public.avaliacoes
  for each row execute function public.recalc_reputacao();

-- ---------- ANTI-ABUSO (rate limit por hora) ----------
create or replace function public.check_limite_convites()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.vinculos
       where morador_id = new.morador_id
         and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Limite de 10 convites por hora atingido.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_limite_convites on public.vinculos;
create trigger trg_limite_convites
  before insert on public.vinculos
  for each row execute function public.check_limite_convites();

create or replace function public.check_limite_registros()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.encomendas
       where recebedor_id = new.recebedor_id
         and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Limite de 20 registros por hora atingido.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_limite_registros on public.encomendas;
create trigger trg_limite_registros
  before insert on public.encomendas
  for each row execute function public.check_limite_registros();

-- NOTA: as contas demo (botão "Entrar como demo") existem só no driver local.
-- No modo Supabase o app usa sign-in anônimo no cadastro — habilite
-- Authentication → Providers → Anonymous sign-in no painel.
