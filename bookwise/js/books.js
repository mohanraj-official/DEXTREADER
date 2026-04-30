// ============================================================
// BOOKS.JS — Homepage grid + Book detail page
// ============================================================

// ══════════════════════════════════════════════════════════════
//  HOMEPAGE — Load and render book grid
// ══════════════════════════════════════════════════════════════
async function loadBooksGrid() {
  const grid    = document.getElementById('books-grid');
  const spinner = document.getElementById('books-spinner');
  const empty   = document.getElementById('books-empty');
  if (!grid) return;

  try {
    const snap = await db.collection('books').orderBy('addedAt', 'desc').get();

    spinner?.remove();

    if (snap.empty) {
      empty && (empty.style.display = 'flex');
      return;
    }

    snap.forEach((doc, i) => {
      const book = { id: doc.id, ...doc.data() };
      const card = buildBookCard(book);
      // stagger entrance
      card.style.animationDelay = `${i * 0.08}s`;
      grid.appendChild(card);
    });

    setTimeout(initScrollAnimations, 50);
  } catch (err) {
    console.error('Books load error:', err);
    spinner?.remove();
    empty && (empty.style.display = 'flex');
  }
}

function buildBookCard(book) {
  const card = document.createElement('article');
  card.className = 'book-card anim';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Read ${book.title}`);

  card.innerHTML = `
    <div class="book-card__cover">
      <img
        src="${escHtml(book.coverImage)}"
        alt="${escHtml(book.title)}"
        loading="lazy"
        onerror="this.src='https://placehold.co/300x440/0b1628/e8601c?text=📖'"
      />
      <div class="book-card__hover-glass">
        <span class="book-card__cta"><i class="fa-solid fa-book-open-reader"></i>&nbsp;Read Now</span>
      </div>
    </div>
    <div class="book-card__body">
      <span class="book-card__cat">${escHtml(book.category || 'Self Help')}</span>
      <h3 class="book-card__title">${escHtml(book.title)}</h3>
      <p class="book-card__author">${escHtml(book.author || 'Unknown Author')}</p>
      <div class="book-card__meta">
        <span><i class="fa-solid fa-lightbulb"></i>&nbsp;${book.insights?.length ?? 0} insights</span>
        <span class="book-card__lock"><i class="fa-solid fa-lock"></i>&nbsp;Login to read</span>
      </div>
    </div>
  `;

  const navigate = () => window.location.href = `book.html?id=${book.id}`;
  card.addEventListener('click',  navigate);
  card.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(); });

  // Show lock only if not logged in
  auth.onAuthStateChanged(user => {
    const lock = card.querySelector('.book-card__lock');
    if (lock) lock.style.display = user ? 'none' : 'inline-flex';
  });

  return card;
}

// ══════════════════════════════════════════════════════════════
//  BOOK DETAIL PAGE
// ══════════════════════════════════════════════════════════════
async function loadBookDetail() {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get('id');
  if (!bookId) return (window.location.href = 'index.html');

  try {
    const doc = await db.collection('books').doc(bookId).get();
    if (!doc.exists) return (window.location.href = 'index.html');

    const book = { id: doc.id, ...doc.data() };
    document.title = `${book.title} — BookWise`;

    // Render hero (always visible)
    const hero = document.getElementById('book-hero');
    if (hero) {
      hero.innerHTML = `
        <div class="book-hero__cover">
          <img
            src="${escHtml(book.coverImage)}"
            alt="${escHtml(book.title)}"
            onerror="this.src='https://placehold.co/300x440/0b1628/e8601c?text=📖'"
          />
        </div>
        <div class="book-hero__info">
          <span class="cat-badge">${escHtml(book.category || 'Self Help')}</span>
          <h1 class="book-hero__title">${escHtml(book.title)}</h1>
          <p class="book-hero__author">by ${escHtml(book.author || 'Unknown Author')}</p>
          <div class="book-hero__stats">
            <span><i class="fa-solid fa-lightbulb"></i>&nbsp;${book.insights?.length ?? 0} Key Insights</span>
            <span><i class="fa-regular fa-clock"></i>&nbsp;~5 min read</span>
            <span><i class="fa-solid fa-star"></i>&nbsp;Editor's Pick</span>
          </div>
        </div>
      `;
    }

    // Wait for auth then render content
    auth.onAuthStateChanged(user => renderContent(book, user));
  } catch (err) {
    console.error('Book detail error:', err);
    showToast('Failed to load book.', 'error');
  }
}

function renderContent(book, user) {
  const el = document.getElementById('book-content');
  if (!el) return;

  if (!user) {
    const bookUrl = encodeURIComponent(window.location.href);
    el.innerHTML = `
      <div class="locked-gate">
        <div class="locked-gate__icon">
          <i class="fa-solid fa-lock"></i>
        </div>
        <h2>Members Only Content</h2>
        <p>Sign up for free to unlock all key insights and summaries from every book in our library.</p>
        <div class="locked-gate__actions">
          <a href="auth.html?tab=signup&redirect=${bookUrl}" class="btn btn--primary btn--lg">
            <i class="fa-solid fa-user-plus"></i>&nbsp;Sign Up — It's Free
          </a>
          <a href="auth.html?redirect=${bookUrl}" class="btn btn--outline btn--lg">
            <i class="fa-solid fa-right-to-bracket"></i>&nbsp;Log In
          </a>
        </div>
        <div class="locked-gate__preview">
          <p class="preview-label">Sneak peek:</p>
          <div class="insight-item insight-item--blurred">
            <span class="insight-num">01</span>
            <p>Ikigai is the Japanese concept of finding your reason for being — the place where your passion, mission, vocation, and profession all intersect into one harmonious purpose…</p>
          </div>
          <div class="insight-item insight-item--blurred">
            <span class="insight-num">02</span>
            <p>The secret of the world's happiest people isn't great wealth or fame. It's having something worth waking up for every single morning…</p>
          </div>
        </div>
      </div>
    `;
  } else {
    markBookRead(user.uid, book.id);

    el.innerHTML = `
      <div class="insights-wrap">
        <div class="insights-header">
          <i class="fa-solid fa-lightbulb"></i>
          <h2>Key Insights</h2>
          <span class="insights-count">${book.insights?.length ?? 0} insights</span>
        </div>
        <div class="insights-list">
          ${(book.insights || []).map((txt, i) => `
            <div class="insight-item anim" style="animation-delay:${i * 0.07}s">
              <span class="insight-num">${String(i + 1).padStart(2, '0')}</span>
              <p>${escHtml(txt)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    setTimeout(initScrollAnimations, 80);
  }
}

async function markBookRead(uid, bookId) {
  try {
    const ref  = db.collection('users').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return;

    const data = snap.data();
    if ((data.readBooks || []).includes(bookId)) return; // already counted

    await ref.update({
      readBooks   : firebase.firestore.FieldValue.arrayUnion(bookId),
      readHistory : firebase.firestore.FieldValue.arrayUnion({
        bookId,
        timestamp : new Date().toISOString()
      })
    });
  } catch (e) {
    console.error('markBookRead error:', e);
  }
}

// ── XSS guard ────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('books-grid'))  loadBooksGrid();
  if (document.getElementById('book-detail')) loadBookDetail();
});