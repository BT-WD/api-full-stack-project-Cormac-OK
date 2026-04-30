const NASA_API   = 'https://images-api.nasa.gov/search';
const STORAGE_KEY = 'cosmos_liked';
const PAGE_SIZE  = 24;

// DOM referencs
const form        = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const yearStart   = document.getElementById('year-start');
const yearEnd     = document.getElementById('year-end');
const mediaType   = document.getElementById('media-type');
const statusBar   = document.getElementById('status-bar');
const spinner     = document.getElementById('spinner');
const gallery     = document.getElementById('gallery');
const loadMoreWrap= document.getElementById('load-more-wrap');
const loadMoreBtn = document.getElementById('load-more-btn');
const navCount    = document.getElementById('nav-liked-count');

const modalOverlay = document.getElementById('modal-overlay');
const modalClose   = document.getElementById('modal-close');
const modalImg     = document.getElementById('modal-img');
const modalTitle   = document.getElementById('modal-title');
const modalMeta    = document.getElementById('modal-meta');
const modalDesc    = document.getElementById('modal-desc');
const modalLikeBtn = document.getElementById('modal-like-btn');
const modalNasaLink= document.getElementById('modal-nasa-link');

// Current state
let currentPage  = 1;
let currentQuery = '';
let totalHits    = 0;
let currentItem  = null;  // item currently open in modal




//  LocalStorage helper functions

function getLiked() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveLiked(liked) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(liked));
}

function isLiked(nasaId) {
  return !!getLiked()[nasaId];
}

function toggleLike(item) {
  const liked   = getLiked();
  const data    = item.data[0];
  const nasaId  = data.nasa_id;
  const thumb   = getThumb(item.links);

  if (liked[nasaId]) {
    delete liked[nasaId];
  } else {
    liked[nasaId] = {
      nasa_id    : nasaId,
      title      : data.title      || 'Untitled',
      date       : data.date_created || '',
      center     : data.center      || '',
      description: data.description || '',
      thumb      : thumb            || '',
      nasa_url   : `https://images.nasa.gov/details/${nasaId}`,
    };
  }

  saveLiked(liked);
  updateNavCount();
  return !!liked[nasaId];
}

// UUI functions

function updateNavCount() {
  const count = Object.keys(getLiked()).length;
  if (navCount) {
    navCount.textContent = count || '';
    navCount.classList.toggle('hidden', count === 0);
  }
}

function getThumb(links) {
  if (!links) return null;
  const t = links.find(l => l.rel === 'preview');
  return t ? t.href : null;
}

function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// Year filters

(function populateYears() {
  const now = new Date().getFullYear();
  for (let y = now; y >= 1920; y--) {
    [yearStart, yearEnd].forEach(sel => {
      const o = document.createElement('option');
      o.value = o.textContent = y;
      sel.appendChild(o);
    });
  }
  yearEnd.value = now;
})();


// URL Builder
function buildUrl(query, page) {
  const params = new URLSearchParams({
    q        : query,
    page     : page,
    page_size: PAGE_SIZE,
  });
  if (mediaType.value)  params.set('media_type', mediaType.value);
  if (yearStart.value)  params.set('year_start', yearStart.value);
  if (yearEnd.value)    params.set('year_end',   yearEnd.value);
  return `${NASA_API}?${params}`;
}


// Image renderer
function renderCard(item) {
  const data  = item.data[0];
  const thumb = getThumb(item.links);
  const liked = isLiked(data.nasa_id);

  const card = document.createElement('div');
  card.className = 'card';

  // Thumbnail
  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'card-thumb';

  if (thumb) {
    const img = document.createElement('img');
    img.src     = thumb;
    img.alt     = data.title || '';
    img.loading = 'lazy';
    thumbWrap.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className   = 'no-thumb';
    ph.textContent = data.media_type === 'video' ? '🎬' : '🌌';
    thumbWrap.appendChild(ph);
  }

  // Like button (on thumbnail)
  const likeBtn = document.createElement('button');
  likeBtn.className = `card-like-btn${liked ? ' liked' : ''}`;
  likeBtn.title     = liked ? 'Unlike' : 'Like';
  likeBtn.innerHTML = liked ? '&#9829;' : '&#9825;';
  likeBtn.addEventListener('click', e => {
    e.stopPropagation();
    const nowLiked = toggleLike(item);
    likeBtn.innerHTML  = nowLiked ? '&#9829;' : '&#9825;';
    likeBtn.title      = nowLiked ? 'Unlike' : 'Like';
    likeBtn.classList.toggle('liked', nowLiked);
  });
  thumbWrap.appendChild(likeBtn);

  // Info
  const info = document.createElement('div');
  info.className = 'card-info';

  const title = document.createElement('div');
  title.className   = 'card-title';
  title.textContent = data.title || 'Untitled';

  const year = document.createElement('div');
  year.className   = 'card-year';
  year.textContent = data.date_created
    ? new Date(data.date_created).getFullYear()
    : '';

  info.appendChild(title);
  info.appendChild(year);
  card.appendChild(thumbWrap);
  card.appendChild(info);

  // Open modal on card click
  card.addEventListener('click', () => openModal(item));
  return card;
}

// modal

function openModal(item) {
  currentItem = item;
  const data  = item.data[0];
  const thumb = getThumb(item.links);
  const liked = isLiked(data.nasa_id);

  modalImg.src          = thumb || '';
  modalImg.alt          = data.title || '';
  modalTitle.textContent = data.title || 'Untitled';
  modalMeta.textContent  = [
    data.date_created ? fmtDate(data.date_created) : null,
    data.center       ? data.center                : null,
  ].filter(Boolean).join(' · ');
  modalDesc.textContent  = data.description || 'No description available.';
  modalNasaLink.href     = `https://images.nasa.gov/details/${data.nasa_id}`;

  modalLikeBtn.innerHTML = liked ? '&#9829; Liked' : '&#9825; Like';
  modalLikeBtn.classList.toggle('liked', liked);

  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  currentItem = null;
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

modalLikeBtn.addEventListener('click', () => {
  if (!currentItem) return;
  const nowLiked = toggleLike(currentItem);
  modalLikeBtn.innerHTML = nowLiked ? '&#9829; Liked' : '&#9825; Like';
  modalLikeBtn.classList.toggle('liked', nowLiked);
});

// API call and renderer

async function fetchImages(query, page, append) {
  if (!append) {
    gallery.innerHTML = '';
    loadMoreWrap.classList.add('hidden');
  }

  spinner.classList.remove('hidden');
  statusBar.className   = 'status-bar';
  statusBar.textContent = append ? 'Loading more…' : 'Searching…';

  try {
    const res  = await fetch(buildUrl(query, page));
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const json  = await res.json();
    const items = json.collection.items   || [];
    totalHits   = json.collection.metadata?.total_hits || 0;

    spinner.classList.add('hidden');

    if (!append && items.length === 0) {
      statusBar.textContent = `No results for "${query}".`;
      return;
    }

    const frag = document.createDocumentFragment();
    items.forEach(item => {
      if (item.data?.length) frag.appendChild(renderCard(item));
    });
    gallery.appendChild(frag);

    const loaded = (page - 1) * PAGE_SIZE + items.length;
    statusBar.textContent = `Showing ${loaded.toLocaleString()} of ${totalHits.toLocaleString()} results`;

    if (loaded < totalHits && items.length === PAGE_SIZE) {
      loadMoreWrap.classList.remove('hidden');
    } else {
      loadMoreWrap.classList.add('hidden');
    }

  } catch (err) {
    spinner.classList.add('hidden');
    statusBar.className   = 'status-bar error';
    statusBar.textContent = 'Something went wrong — please try again.';
    console.error(err);
  }
}

// Event listeners

form.addEventListener('submit', e => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (!q) return;
  currentQuery = q;
  currentPage  = 1;
  fetchImages(currentQuery, currentPage, false);
});

loadMoreBtn.addEventListener('click', () => {
  currentPage++;
  loadMoreWrap.classList.add('hidden');
  fetchImages(currentQuery, currentPage, true);
});

updateNavCount();