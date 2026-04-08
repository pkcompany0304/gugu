-- ============================================================
-- GUGU 플랫폼 Supabase 스키마 설정
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- ============================================================

-- 1. profiles 테이블 (auth.users 확장)
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  role        text not null default 'consumer' check (role in ('consumer', 'influencer')),
  name        text,
  phone       text,
  channel_name text,       -- 인플루언서 채널명/브랜드명
  channel_url  text,       -- SNS 링크
  follower_count int,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- 2. gugus 테이블 (공구 상품)
create table if not exists public.gugus (
  id                  uuid default gen_random_uuid() primary key,
  influencer_id       uuid references public.profiles(id) not null,
  product_name        text not null,
  description         text,
  category            text,
  brand               text,
  image_url           text,
  original_price      int not null,
  sale_price          int not null,
  target_participants int default 0,
  current_participants int default 0,
  commission_rate     numeric default 0.05,
  shipping_days       text default '공구 마감 후 2~3 영업일',
  shipping_cost       int default 0,
  min_per_person      int default 1,
  max_per_person      int default 3,
  return_policy       text default '수령 후 7일 이내',
  status              text default 'active' check (status in ('ready', 'active', 'closed', 'cancelled')),
  start_date          date,
  end_date            date,
  created_at          timestamptz default now()
);

-- 3. orders 테이블 (주문)
create table if not exists public.orders (
  id          uuid default gen_random_uuid() primary key,
  gugu_id     uuid references public.gugus(id) not null,
  consumer_id uuid references public.profiles(id) not null,
  quantity    int not null default 1,
  unit_price  int not null,
  total_amount int not null,
  status      text default 'paid' check (status in ('paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.gugus enable row level security;
alter table public.orders enable row level security;

-- profiles 정책
create policy "누구나 프로필 조회 가능" on public.profiles
  for select using (true);

create policy "본인 프로필만 수정" on public.profiles
  for update using (auth.uid() = id);

-- gugus 정책
create policy "누구나 공구 조회 가능" on public.gugus
  for select using (true);

create policy "인플루언서만 공구 등록" on public.gugus
  for insert with check (
    auth.uid() = influencer_id and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'influencer')
  );

create policy "본인 공구만 수정" on public.gugus
  for update using (auth.uid() = influencer_id);

-- orders 정책
create policy "소비자 본인 주문 조회" on public.orders
  for select using (auth.uid() = consumer_id);

create policy "인플루언서 자기 공구 주문 조회" on public.orders
  for select using (
    exists (
      select 1 from public.gugus
      where gugus.id = orders.gugu_id
        and gugus.influencer_id = auth.uid()
    )
  );

create policy "로그인 소비자 주문 생성" on public.orders
  for insert with check (auth.uid() = consumer_id);

-- ============================================================
-- 회원가입 시 profiles 자동 생성 트리거
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'consumer'),
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 참여자 수 증가 함수 (RLS 우회용)
-- ============================================================

create or replace function public.increment_participants(p_gugu_id uuid)
returns void as $$
begin
  update public.gugus
  set current_participants = current_participants + 1
  where id = p_gugu_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 샘플 데이터 (선택사항 - 테스트용)
-- 실제 운영 시 삭제하세요
-- ============================================================
-- 아래는 실제 auth 유저를 생성한 후 influencer_id를 넣어야 작동합니다.
