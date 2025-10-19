(() => {
  const API = 'https://api.thecatapi.com/v1';
  const API_KEY = ''; // opcional: pon tu x-api-key si la tienes
  let page = 0;
  let currentBreed = '';

  const $ = (s) => document.querySelector(s);
  const gallery = $('#gallery');
  const favs = $('#favs');
  const status = $('#status');
  const loadMoreBtn = $('#loadMore');
  const breedSelect = $('#breedSelect');

  // ----- localStorage -----
  const FAV_KEY = 'cat_favs_v1';
  const loadFavs = () => JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  const saveFavs = (arr) => localStorage.setItem(FAV_KEY, JSON.stringify(arr));

  // ----- helpers -----
  const setStatus = (t='') => status.textContent = t;
  const headers = API_KEY ? { 'x-api-key': API_KEY } : {};
  const favIds = () => new Set(loadFavs().map(f => f.id));

  const card = (img) => {
    const isFav = favIds().has(img.id);
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <img src="${img.url}" alt="A cute cat"/>
      <button data-id="${img.id}">${isFav ? '★ Quitar' : '☆ Favorito'}</button>
    `;
    el.querySelector('button').addEventListener('click', () => toggleFav(img));
    return el;
  };

  const renderFavs = () => {
    const items = loadFavs();
    favs.innerHTML = '';
    items.forEach(img => favs.appendChild(card(img)));
  };

  const toggleFav = (img) => {
    const list = loadFavs();
    const i = list.findIndex(x => x.id === img.id);
    if (i >= 0) list.splice(i, 1);
    else list.push({ id: img.id, url: img.url });
    saveFavs(list);
    renderFavs();
    // refresca galería para actualizar etiquetas de botón
    refreshGalleryButtons();
  };

  const refreshGalleryButtons = () => {
    const ids = favIds();
    gallery.querySelectorAll('button[data-id]').forEach(btn => {
      const id = btn.getAttribute('data-id');
      btn.textContent = ids.has(id) ? '★ Quitar' : '☆ Favorito';
    });
  };

  // ----- API -----
  async function fetchCats({ limit = 9, page = 0, breed = '' } = {}) {
    const url = new URL(`${API}/images/search`);
    url.searchParams.set('limit', limit);
    url.searchParams.set('page', page);
    url.searchParams.set('order', 'Desc');
    if (breed) url.searchParams.set('breed_ids', breed);

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Error al cargar imágenes');
    return res.json(); // [{id,url,...}]
  }

  async function fetchBreeds() {
    const res = await fetch(`${API}/breeds`, { headers });
    if (!res.ok) return [];
    return res.json(); // [{id,name},...]
  }

  // ----- UI actions -----
  async function loadPage() {
    try {
      setStatus('Cargando…');
      const imgs = await fetchCats({ page, breed: currentBreed });
      imgs.forEach(img => gallery.appendChild(card(img)));
      refreshGalleryButtons();
      setStatus('');
      page += 1;
    } catch (e) {
      setStatus('Error al cargar. Intenta de nuevo.');
    }
  }

  async function initBreeds() {
    const breeds = await fetchBreeds();
    breeds.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name;
      breedSelect.appendChild(opt);
    });
  }

  // ----- events -----
  loadMoreBtn.addEventListener('click', loadPage);
  breedSelect.addEventListener('change', () => {
    currentBreed = breedSelect.value;
    page = 0;
    gallery.innerHTML = '';
    loadPage();
  });

  // ----- boot -----
  (async () => {
    await initBreeds();
    renderFavs();
    loadPage();
  })();
})();
