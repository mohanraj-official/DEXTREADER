// ============================================================
// AUTH.JS — Login & Sign-up logic
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const params     = new URLSearchParams(window.location.search);
  const redirectTo = params.get('redirect') || 'dashboard.html';

  // Redirect if already logged in
  auth.onAuthStateChanged(user => {
    if (user) window.location.href = decodeURIComponent(redirectTo);
  });

  // ── Tab switching ────────────────────────────────────────
  const tabLogin  = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const panelLogin  = document.getElementById('panel-login');
  const panelSignup = document.getElementById('panel-signup');

  function switchTab(tab) {
    const isLogin = tab === 'login';
    tabLogin.classList.toggle('tab--active', isLogin);
    tabSignup.classList.toggle('tab--active', !isLogin);
    panelLogin.classList.toggle('panel--hidden', !isLogin);
    panelSignup.classList.toggle('panel--hidden', isLogin);
  }

  tabLogin?.addEventListener('click',  () => switchTab('login'));
  tabSignup?.addEventListener('click', () => switchTab('signup'));

  if (params.get('tab') === 'signup') switchTab('signup');

  // ── Password visibility toggle ───────────────────────────
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp  = btn.previousElementSibling;
      const icon = btn.querySelector('i');
      inp.type   = inp.type === 'password' ? 'text' : 'password';
      icon.className = inp.type === 'text' ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  });

  // ── Login ────────────────────────────────────────────────
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn      = e.target.querySelector('.auth-submit-btn');

    setBtn(btn, true, 'Signing in…');
    try {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      await updateStreak(cred.user.uid);
      showToast('Welcome back! 🎉', 'success');
      setTimeout(() => window.location.href = decodeURIComponent(redirectTo), 900);
    } catch (err) {
      showToast(getAuthError(err.code), 'error');
      setBtn(btn, false, '<i class="fa-solid fa-right-to-bracket"></i> Sign In');
    }
  });

  // ── Signup ───────────────────────────────────────────────
  document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name     = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm  = document.getElementById('signup-confirm').value;
    const btn      = e.target.querySelector('.auth-submit-btn');

    if (password !== confirm) return showToast('Passwords do not match.', 'error');
    if (password.length < 6)  return showToast('Password must be at least 6 characters.', 'error');

    setBtn(btn, true, 'Creating account…');
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });

      const today = new Date().toISOString().split('T')[0];
      await db.collection('users').doc(cred.user.uid).set({
        name,
        email,
        createdAt      : firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin      : firebase.firestore.FieldValue.serverTimestamp(),
        streak         : 1,
        lastStreakDate : today,
        readBooks      : [],
        readHistory    : [],
        isAdmin        : false
      });

      showToast('Welcome to BookWise! 🚀', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } catch (err) {
      showToast(getAuthError(err.code), 'error');
      setBtn(btn, false, '<i class="fa-solid fa-user-plus"></i> Create Account');
    }
  });

  // ── Helpers ──────────────────────────────────────────────
  function setBtn(btn, loading, html) {
    btn.disabled   = loading;
    btn.innerHTML  = loading
      ? '<i class="fa-solid fa-spinner fa-spin"></i>&nbsp;&nbsp;' + html
      : html;
  }
});