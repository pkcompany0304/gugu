(async function initNav() {
  document.documentElement.classList.add('nav-loading');

  const loginBtn = document.getElementById('navLoginBtn');
  const signupBtn = document.getElementById('navSignupBtn');
  const userArea = document.getElementById('navUserArea');

  if (!loginBtn && !signupBtn && !userArea) {
    document.documentElement.classList.remove('nav-loading');
    return;
  }

  const user = await getCurrentUser();

  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';

    if (userArea) {
      const name = user.profile?.channel_name || user.profile?.name || '사용자';
      const isInfluencer = user.profile?.role === 'influencer';
      const target = isInfluencer ? 'influencer-dashboard.html' : 'mypage.html';

      userArea.style.display = 'flex';
      userArea.style.alignItems = 'center';
      userArea.style.gap = '8px';
      userArea.style.flexShrink = '0';

      userArea.innerHTML = `
        <div onclick="location.href='${target}'"
             style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 10px;border-radius:8px;border:1px solid var(--b1);background:var(--s2);transition:.15s"
             onmouseover="this.style.borderColor='var(--r)'"
             onmouseout="this.style.borderColor='var(--b1)'">
          <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--r),var(--o));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0">
            ${name.charAt(0) || 'G'}
          </div>
          <span style="font-size:13px;font-weight:600;color:var(--t);max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
          ${isInfluencer ? '<span style="font-size:10px;color:var(--r);font-weight:700;background:rgba(255,59,59,0.1);padding:1px 6px;border-radius:4px">인플루언서</span>' : ''}
        </div>
        <button onclick="doSignOut()"
                style="padding:6px 12px;border-radius:7px;border:1px solid var(--b1);background:none;color:var(--t2);font-size:12px;cursor:pointer;font-family:inherit;transition:.15s"
                onmouseover="this.style.color='var(--t)'"
                onmouseout="this.style.color='var(--t2)'">
          로그아웃
        </button>
      `;
    }
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (signupBtn) signupBtn.style.display = '';
    if (userArea) userArea.style.display = 'none';
  }

  document.documentElement.classList.remove('nav-loading');
})();

async function doSignOut() {
  await sb.auth.signOut();
  location.href = 'login.html';
}
