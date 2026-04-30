// ============================================================
// UTILS.JS — Shared utilities across all pages
// ============================================================

// ── Live Clock ───────────────────────────────────────────────
function startClock() {
  const el = document.getElementById('live-clock');
  if (!el) return;
  const update = () => {
    const now  = new Date();
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const mons = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const hh   = String(now.getHours()).padStart(2,'0');
    const mm   = String(now.getMinutes()).padStart(2,'0');
    const ss   = String(now.getSeconds()).padStart(2,'0');
    el.textContent = `${days[now.getDay()]}, ${mons[now.getMonth()]} ${now.getDate()} · ${hh}:${mm}:${ss}`;
  };
  update();
  setInterval(update, 1000);
}

// ── Toast Notifications ──────────────────────────────────────
function showToast(message, type = 'info') {
  document.querySelectorAll('.bw-toast').forEach(t => t.remove());
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `bw-toast bw-toast--${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('bw-toast--show'));
  setTimeout(() => {
    toast.classList.remove('bw-toast--show');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

// ── Auth error messages ──────────────────────────────────────
function getAuthError(code) {
  const map = {
    'auth/user-not-found'    : 'No account found with this email.',
    'auth/wrong-password'    : 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email'     : 'Please enter a valid email address.',
    'auth/weak-password'     : 'Password must be at least 6 characters.',
    'auth/too-many-requests' : 'Too many attempts. Please try again later.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

// ── Navbar: update based on auth state ──────────────────────
function updateNav(user) {
  const authBtns  = document.getElementById('auth-buttons');
  const userMenu  = document.getElementById('user-menu');
  const userName  = document.getElementById('user-name');
  const adminLink = document.getElementById('admin-link');

  if (user) {
    authBtns  && (authBtns.style.display  = 'none');
    userMenu  && (userMenu.style.display   = 'flex');
    userName  && (userName.textContent     = user.displayName || user.email?.split('@')[0] || 'Reader');
    adminLink && (adminLink.style.display  = user.email === ADMIN_EMAIL ? 'inline-flex' : 'none');
  } else {
    authBtns  && (authBtns.style.display  = 'flex');
    userMenu  && (userMenu.style.display   = 'none');
    adminLink && (adminLink.style.display  = 'none');
  }
}

// ── Streak system ────────────────────────────────────────────
async function updateStreak(uid) {
  try {
    const ref  = db.collection('users').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return 0;

    const data  = snap.data();
    const today = new Date().toISOString().split('T')[0];
    if (data.lastStreakDate === today) return data.streak || 0;

    const prev = new Date();
    prev.setDate(prev.getDate() - 1);
    const yesterday = prev.toISOString().split('T')[0];

    const newStreak = data.lastStreakDate === yesterday ? (data.streak || 0) + 1 : 1;
    await ref.update({
      streak: newStreak,
      lastStreakDate: today,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    });
    return newStreak;
  } catch (e) {
    console.error('Streak update failed:', e);
    return 0;
  }
}

// ── Scroll-triggered animations ──────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('anim-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.anim').forEach(el => observer.observe(el));
}

// ── Format Firestore timestamp ───────────────────────────────
function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

// ── Mobile hamburger ─────────────────────────────────────────
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    links.classList.toggle('nav--open');
    toggle.classList.toggle('nav-toggle--active');
  });
  document.addEventListener('click', (e) => {
    if (!links.contains(e.target) && !toggle.contains(e.target)) {
      links.classList.remove('nav--open');
      toggle.classList.remove('nav-toggle--active');
    }
  });
}

// ── Sign-out ─────────────────────────────────────────────────
function logout() {
  auth.signOut().then(() => {
    showToast('Signed out. See you soon! 👋', 'success');
    setTimeout(() => window.location.href = 'index.html', 900);
  });
}

// ── User-dropdown toggle ─────────────────────────────────────
function initUserDropdown() {
  const avatar   = document.getElementById('user-avatar-btn');
  const dropdown = document.getElementById('user-dropdown');
  if (!avatar || !dropdown) return;

  avatar.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('dropdown--open');
  });
  document.addEventListener('click', () => dropdown.classList.remove('dropdown--open'));
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  initMobileNav();
  initUserDropdown();
  initScrollAnimations();

  document.querySelectorAll('.js-logout').forEach(btn => btn.addEventListener('click', logout));

  auth.onAuthStateChanged(user => updateNav(user));
});