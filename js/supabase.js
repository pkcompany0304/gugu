// ============================================================
// GUGU — Supabase 설정 파일
// 아래 SUPABASE_URL 과 SUPABASE_ANON_KEY 를 본인 값으로 교체하세요
// Supabase Dashboard > Project Settings > API 에서 확인 가능
// ============================================================

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Supabase 클라이언트 초기화 (CDN 방식)
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// 인증 헬퍼
// ============================================================

/** 현재 로그인 유저 + 프로필 반환. 비로그인이면 null */
async function getCurrentUser() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return { ...user, profile };
}

/** 로그인 페이지로 리디렉션 */
function requireAuth(redirectTo = 'login.html') {
  getCurrentUser().then(u => {
    if (!u) location.href = redirectTo;
  });
}

/** 인플루언서 전용 페이지 보호 */
function requireInfluencer() {
  getCurrentUser().then(u => {
    if (!u) { location.href = 'login.html'; return; }
    if (u.profile?.role !== 'influencer') { location.href = 'index.html'; return; }
  });
}

/** 로그아웃 */
async function signOut() {
  await sb.auth.signOut();
  location.href = 'login.html';
}

// ============================================================
// 대시보드 데이터 헬퍼
// ============================================================

/** 인플루언서의 공구 목록 조회 */
async function getInfluencerGugus(influencerId) {
  const { data, error } = await sb
    .from('gugus')
    .select('*')
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: false });
  return data || [];
}

/** 인플루언서의 총 수익 계산 */
async function getInfluencerRevenue(influencerId) {
  const { data: gugus } = await sb
    .from('gugus')
    .select('id, sale_price, commission_rate, current_participants')
    .eq('influencer_id', influencerId);

  if (!gugus) return { total: 0, thisMonth: 0 };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: orders } = await sb
    .from('orders')
    .select('total_amount, created_at, gugu_id')
    .in('gugu_id', gugus.map(g => g.id))
    .neq('status', 'cancelled')
    .neq('status', 'refunded');

  if (!orders) return { total: 0, thisMonth: 0 };

  // 수수료 5% 제외 후 순수익
  const calcNet = (amount) => Math.round(amount * 0.95);

  const total = orders.reduce((sum, o) => sum + calcNet(o.total_amount), 0);
  const thisMonth = orders
    .filter(o => o.created_at >= startOfMonth)
    .reduce((sum, o) => sum + calcNet(o.total_amount), 0);

  return { total, thisMonth };
}

/** 공구별 주문 목록 */
async function getGuguOrders(guguId) {
  const { data, error } = await sb
    .from('orders')
    .select('*')
    .eq('gugu_id', guguId)
    .order('created_at', { ascending: false });
  return data || [];
}

// ============================================================
// 유틸
// ============================================================

function formatKRW(n) {
  return Number(n).toLocaleString('ko-KR') + '원';
}

function daysLeft(endDate) {
  if (!endDate) return '-';
  const diff = new Date(endDate) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return '마감';
  if (days === 0) return '오늘 마감';
  return `${days}일 남음`;
}

function progressPct(current, target) {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}
