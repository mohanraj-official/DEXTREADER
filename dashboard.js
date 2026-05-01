// ============================================================
// DASHBOARD.JS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = 'auth.html?redirect=dashboard.html';
      return;
    }
    await loadDashboard(user);
  });
});

async function loadDashboard(user) {
  try {
    const ref  = db.collection('users').doc(user.uid);
    let snap   = await ref.get();

    if (!snap.exists) {
      const today = new Date().toISOString().split('T')[0];
      const data  = {
        name : user.displayName || 'Reader',
        email: user.email,
        createdAt      : firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin      : firebase.firestore.FieldValue.serverTimestamp(),
        streak         : 1,
        lastStreakDate : today,
        readBooks      : [],
        readHistory    : []
      };
      await ref.set(data);
      snap = await ref.get();
    }

    const data = snap.data();

    // ── Greet ─────────────────────────────────────────────
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    setText('dash-greeting', `${greet},`);
    setText('dash-name',     data.name || user.displayName || 'Reader');
    setText('dash-email',    data.email || user.email);

    // ── Stats ─────────────────────────────────────────────
    setText('stat-streak',  data.streak      || 0);
    setText('stat-books',   data.readBooks?.length  || 0);
    setText('stat-sessions',data.readHistory?.length || 0);

    // Member since
    const ms = document.getElementById('member-since');
    if (ms && data.createdAt) ms.textContent = `Member since ${formatDate(data.createdAt)}`;

    // ── Streak UI ─────────────────────────────────────────
    renderStreakPanel(data.streak || 0, data.lastStreakDate);

    // ── Activity ──────────────────────────────────────────
    await renderActivity(data.readHistory || []);

  } catch (err) {
    console.error('Dashboard error:', err);
    showToast('Error loading dashboard', 'error');
  }
}

function renderStreakPanel(streak, lastDate) {
  // Flame colour
  const flame = document.getElementById('streak-flame');
  if (flame) {
    if (streak >= 30) flame.style.color = '#ff0000';
    else if (streak >= 14) flame.style.color = '#ff4500';
    else if (streak >= 7)  flame.style.color = '#e8601c';
    else                   flame.style.color = '#f5924e';
  }
  setText('streak-count', streak);
  setText('streak-label', streak === 1 ? '1 day streak!' : `${streak} day streak!`);

  // Day bubbles — last 7 days
  const wrap = document.getElementById('streak-days');
  if (!wrap) return;

  const today      = new Date();
  const lastLogin  = lastDate ? new Date(lastDate + 'T00:00:00') : null;
  const todayStr   = today.toISOString().split('T')[0];

  wrap.innerHTML = '';
  for (let i = 6; i >= 0; i--) {
    const d      = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr   = d.toISOString().split('T')[0];
    const dayAgo = i; // 0 = today
    const active = lastLogin && dayAgo < streak; // rough heuristic

    const cell   = document.createElement('div');
    cell.className = `streak-bubble ${active ? 'streak-bubble--on' : ''}`;
    cell.innerHTML = `
      <div class="streak-bubble__dot">${active ? '🔥' : ''}</div>
      <span>${d.toLocaleDateString('en-US',{weekday:'short'})}</span>
    `;
    wrap.appendChild(cell);
  }
}

async function renderActivity(readHistory) {
  const el = document.getElementById('activity-list');
  if (!el) return;

  if (!readHistory.length) {
    el.innerHTML = `
      <div class="activity-empty">
        <i class="fa-solid fa-book-open"></i>
        <p>No reading activity yet.</p>
        <a href="index.html" class="btn btn--primary btn--sm">Browse Library</a>
      </div>`;
    return;
  }

  // Latest 6 unique reads
  const recent  = [...readHistory].reverse().slice(0, 6);
  const bookIds = [...new Set(recent.map(r => r.bookId))];

  const books = {};
  await Promise.all(bookIds.map(async id => {
    try {
      const d = await db.collection('books').doc(id).get();
      if (d.exists) books[id] = { id: d.id, ...d.data() };
    } catch (_) {}
  }));

  el.innerHTML = recent.map(r => {
    const b = books[r.bookId];
    if (!b) return '';
    const d = new Date(r.timestamp);
    return `
      <div class="activity-row anim">
        <img
          src="${b.coverImage}"
          alt="${b.title}"
          onerror="this.src='https://placehold.co/56x80/0b1628/e8601c?text=📖'"
        />
        <div class="activity-row__info">
          <h4>${b.title}</h4>
          <p>${d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>
        </div>
        <a href="book.html?id=${b.id}" class="activity-row__btn" title="Read again">
          <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>`;
  }).join('');

  setTimeout(initScrollAnimations, 60);
}

// ── Utility ──────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}