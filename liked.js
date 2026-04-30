
const STORAGE_KEY = 'cosmos_liked';

// DOM references
const likedGallery = document.getElementById('liked-gallery');
const likedStatus  = document.getElementById('liked-status');
const emptyState   = document.getElementById('empty-state');
const clearAllBtn  = document.getElementById('clear-all-btn');
const likedToolbar = document.getElementById('liked-toolbar');
const navCount     = document.getElementById('nav-liked-count');

const modalOverlay = document.getElementById('modal-overlay');
const modalClose   = document.getElementById('modal-close');
const modalImg     = document.getElementById('modal-img');
const modalTitle   = document.getElementById('modal-title');
const modalMeta    = document.getElementById('modal-meta');
const modalDesc    = document.getElementById('modal-desc');
const modalLikeBtn = document.getElementById('modal-like-btn');
const modalNasaLink= document.getElementById('modal-nasa-link');

let currentNasaId = null;

//  LocalStorage helper function

function getLiked() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveLiked(liked) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(liked));
}

function unlike(nasaId) {
  const liked = getLiked();
  delete liked[nasaId];
  saveLiked(liked);
  updateNavCount();
}


// UI helper functions
function updateNavCount() {
  const count = Object.keys(getLiked()).length;
  if (navCount) {
    navCount.textContent = count || '';
    navCount.classList.toggle('hidden', count === 0);
  }
}

function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// Render liked images
function renderGallery() {
  const liked = getLiked();
  const items = Object.values(liked);

  likedGallery.innerHTML = '';

  if (items.length === 0) {
    emptyState.classList.remove('hidden');
    likedToolbar.classList.add('hidden');
    likedStatus.textContent = '';
    return;
  }

  emptyState.classList.add('hidden');
  likedToolbar.classList.remove('hidden');
  likedStatus.textContent = `${items.length} saved photo${items.length !== 1 ? 's' : ''}`;

  const frag = document.createDocumentFragment();

  items.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'card';

    // Thumbnail
    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'card-thumb';

    if (entry.thumb) {
      const img = document.createElement('img');
      img.src     = entry.thumb;
      img.alt     = entry.title;
      img.loading = 'lazy';
      thumbWrap.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className   = 'no-thumb';
      ph.textContent = '🌌';
      thumbWrap.appendChild(ph);
    }

    // Unlike button
    const unlikeBtn = document.createElement('button');
    unlikeBtn.className = 'card-like-btn liked';
    unlikeBtn.title     = 'Unlike';
    unlikeBtn.innerHTML = '&#9829;';
    unlikeBtn.addEventListener('click', e => {
      e.stopPropagation();
      unlike(entry.nasa_id);
      if (currentNasaId === entry.nasa_id) closeModal();
      renderGallery();
    });
    thumbWrap.appendChild(unlikeBtn);

    // Info
    const info = document.createElement('div');
    info.className = 'card-info';

    const title = document.createElement('div');
    title.className   = 'card-title';
    title.textContent = entry.title;

    const year = document.createElement('div');
    year.className   = 'card-year';
    year.textContent = entry.date ? new Date(entry.date).getFullYear() : '';

    info.appendChild(title);
    info.appendChild(year);
    card.appendChild(thumbWrap);
    card.appendChild(info);

    card.addEventListener('click', () => openModal(entry));
    frag.appendChild(card);
  });

  likedGallery.appendChild(frag);
}

//  Modal
function openModal(entry) {
  currentNasaId = entry.nasa_id;

  modalImg.src           = entry.thumb || '';
  modalImg.alt           = entry.title;
  modalTitle.textContent = entry.title;
  modalMeta.textContent  = [
    entry.date   ? fmtDate(entry.date) : null,
    entry.center ? entry.center        : null,
  ].filter(Boolean).join(' · ');
  modalDesc.textContent  = entry.description || 'No description available.';
  modalNasaLink.href     = entry.nasa_url || '#';

  modalLikeBtn.innerHTML = '&#9829; Unlike';

  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  currentNasaId = null;
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

modalLikeBtn.addEventListener('click', () => {
  if (!currentNasaId) return;
  unlike(currentNasaId);
  closeModal();
  renderGallery();
});

//  Clear library button

clearAllBtn.addEventListener('click', () => {
  if (!confirm('Remove all liked photos?')) return;
  localStorage.removeItem(STORAGE_KEY);
  updateNavCount();
  renderGallery();
});


updateNavCount();
renderGallery();