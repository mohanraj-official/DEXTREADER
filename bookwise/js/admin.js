// ============================================================
// ADMIN.JS — Add and manage books (admin only)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = 'auth.html';
      return;
    }
    if (user.email !== ADMIN_EMAIL) {
      showToast('Admin access only.', 'error');
      setTimeout(() => window.location.href = 'index.html', 1500);
      return;
    }

    document.getElementById('admin-gate')?.classList.add('admin-gate--open');
    await loadBooksList();
  });

  // ── Cover preview ─────────────────────────────────────────
  document.getElementById('book-cover')?.addEventListener('input', e => {
    const prev = document.getElementById('cover-preview');
    const wrap = document.getElementById('cover-preview-wrap');
    if (!prev || !wrap) return;
    if (e.target.value) {
      prev.src = e.target.value;
      wrap.style.display = 'block';
      prev.onerror = () => { prev.src = 'https://placehold.co/200x280/0b1628/e8601c?text=Bad+URL'; };
    } else {
      wrap.style.display = 'none';
    }
  });

  // ── Add Book Form ─────────────────────────────────────────
  document.getElementById('add-book-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn      = e.target.querySelector('.admin-submit-btn');
    const title    = v('book-title');
    const author   = v('book-author');
    const category = v('book-category');
    const cover    = v('book-cover');
    const insRaw   = v('book-insights');

    const insights = insRaw.split('\n').map(s => s.trim()).filter(Boolean);

    if (!title || !cover || insights.length === 0) {
      showToast('Title, cover URL and at least one insight are required.', 'error');
      return;
    }

    setBtn(btn, true);
    try {
      await db.collection('books').add({
        title,
        author,
        category,
        coverImage : cover,
        insights,
        addedAt    : firebase.firestore.FieldValue.serverTimestamp(),
        addedBy    : auth.currentUser.uid
      });

      showToast(`"${title}" added successfully! 📚`, 'success');
      e.target.reset();
      document.getElementById('cover-preview-wrap').style.display = 'none';
      await loadBooksList();
    } catch (err) {
      console.error(err);
      showToast('Error adding book. Check console.', 'error');
    } finally {
      setBtn(btn, false);
    }
  });
});

async function loadBooksList() {
  const list = document.getElementById('admin-books-list');
  if (!list) return;
  list.innerHTML = '<p class="admin-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading books…</p>';

  try {
    const snap = await db.collection('books').orderBy('addedAt', 'desc').get();

    if (snap.empty) {
      list.innerHTML = '<p class="admin-empty">No books yet. Add your first book above.</p>';
      return;
    }

    list.innerHTML = snap.docs.map(doc => {
      const b = { id: doc.id, ...doc.data() };
      return `
        <div class="admin-book-row">
          <img
            src="${b.coverImage}"
            alt="${b.title}"
            onerror="this.src='https://placehold.co/52x74/0b1628/e8601c?text=📖'"
          />
          <div class="admin-book-row__info">
            <strong>${b.title}</strong>
            <span>${b.author || 'Unknown'} &bull; ${b.category || '—'} &bull; ${b.insights?.length ?? 0} insights</span>
          </div>
          <div class="admin-book-row__actions">
            <a href="book.html?id=${b.id}" target="_blank" class="icon-btn" title="Preview">
              <i class="fa-solid fa-eye"></i>
            </a>
            <button class="icon-btn icon-btn--danger" onclick="deleteBook('${b.id}','${b.title.replace(/'/g,"\\'")}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = '<p class="admin-error">Failed to load books.</p>';
    console.error(err);
  }
}

async function deleteBook(id, title) {
  if (!confirm(`Delete "${title}"?\nThis cannot be undone.`)) return;
  try {
    await db.collection('books').doc(id).delete();
    showToast(`"${title}" deleted.`, 'success');
    await loadBooksList();
  } catch (err) {
    showToast('Delete failed.', 'error');
  }
}

const v   = id => document.getElementById(id)?.value.trim() || '';
function setBtn(btn, loading) {
  btn.disabled  = loading;
  btn.innerHTML = loading
    ? '<i class="fa-solid fa-spinner fa-spin"></i>&nbsp;Adding book…'
    : '<i class="fa-solid fa-plus"></i>&nbsp;Add Book to Library';
}