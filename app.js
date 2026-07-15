const loginForm = document.querySelector('#login-form');
const loginScreen = document.querySelector('#login-screen');
const appScreen = document.querySelector('#app-screen');
const welcomeText = document.querySelector('#welcome-text');
const logoutBtn = document.querySelector('#logout-btn');

const homeDashboard = document.querySelector('#home-dashboard');
const homeAddForm = document.querySelector('#home-add-form');
const homeFormBack = document.querySelector('#home-form-back');
const showAllTimelineBtn = document.querySelector('#show-all-timeline-btn');

const tabButtons = [...document.querySelectorAll('.tab-btn')];
const panels = [...document.querySelectorAll('.tab-panel')];

const memoryForm = document.querySelector('#memory-form');
const peopleForm = document.querySelector('#people-form');
const timelineList = document.querySelector('#timeline-list');
const peopleList = document.querySelector('#people-list');
const peopleOverviewCard = document.querySelector('#people-overview-card');
const personDetailCard = document.querySelector('#person-detail-card');
const personDetailBackBtn = document.querySelector('#person-detail-back');
const personDetailAvatar = document.querySelector('#person-detail-avatar');
const personDetailName = document.querySelector('#person-detail-name');
const personDetailMeta = document.querySelector('#person-detail-meta');
const personDetailMemories = document.querySelector('#person-detail-memories');
const tagsList = document.querySelector('#tags-list');
const mapPinsList = document.querySelector('#map-pins-list');
const memoryTemplate = document.querySelector('#memory-item-template');
const activeTagInfo = document.querySelector('#active-tag-info');
const clearTagFilterBtn = document.querySelector('#clear-tag-filter');
const timelineSearchInput = document.querySelector('#timeline-search');
const timelineSearchClear = document.querySelector('#timeline-search-clear');

let searchQuery = '';
let detailReturnTab = 'timeline';
const statsGrid = document.querySelector('#stats-grid');
const homeRecentList = document.querySelector('#home-recent-list');
const onThisDayCard = document.querySelector('#on-this-day-card');
const onThisDaySubtitle = document.querySelector('#on-this-day-subtitle');
const onThisDayList = document.querySelector('#on-this-day-list');
const memoryMediaInput = document.querySelector('#memory-media');
const memoryMediaPreview = document.querySelector('#memory-media-preview');
const fabAddMemoryBtn = document.querySelector('#fab-add-memory');

const memoryDetailEl = document.querySelector('#memory-detail');
const detailBackBtn = document.querySelector('#detail-back-btn');
const detailEditBtn = document.querySelector('#detail-edit-btn');
const detailView = document.querySelector('#detail-view');
const detailEdit = document.querySelector('#detail-edit');
const detailGallery = document.querySelector('#detail-gallery');
const detailTitle = document.querySelector('#detail-title');
const detailDate = document.querySelector('#detail-date');
const detailLocationEl = document.querySelector('#detail-location');
const detailStaticMapEl = document.querySelector('#detail-static-map');
const detailPinChipsEl = document.querySelector('#detail-pin-chips');
const detailPersonEl = document.querySelector('#detail-person');
const detailItemEl = document.querySelector('#detail-item');
let detailMapInstance = null;
const detailTags = document.querySelector('#detail-tags');
const detailText = document.querySelector('#detail-text');
const detailNotesWrap = document.querySelector('#detail-notes-wrap');
const detailNotesText = document.querySelector('#detail-notes');
const detailEditForm = document.querySelector('#detail-edit-form');
const editTextArea = document.querySelector('#edit-text');
const editEventDate = document.querySelector('#edit-event-date');
const editPerson = document.querySelector('#edit-person');
const editItem = document.querySelector('#edit-item');
const editTags = document.querySelector('#edit-tags');
const editActivityTags = document.querySelector('#edit-activity-tags');
const editEmotionTags = document.querySelector('#edit-emotion-tags');
const editNotesArea = document.querySelector('#edit-notes');
const editTitleInput = document.querySelector('#edit-title');
const editPhotoStripEl = document.querySelector('#edit-photo-strip');
const editMediaInput = document.querySelector('#edit-media');
const detailEditCancel = document.querySelector('#detail-edit-cancel');
const editPinPickerEl = document.querySelector('#edit-pin-picker');
const editPinCoords = document.querySelector('#edit-pin-coords');
const editClearPinBtn = document.querySelector('#edit-clear-pin');

let editPickerMap;
let editPickerMarkers = [];
let editLocationFields = [];
let editActiveLocationIndex = 0;
let editPhotoItems = [];
let editPhotoDrag = null;
let editFallbackClickHandler = null;
let dataLoadInProgress = false;
let pendingTokenRefresh = false;

const exportBtn = document.querySelector('#export-btn');
const importBtn = document.querySelector('#import-btn');
const importFileInput = document.querySelector('#import-file-input');

const memoryPinPickerEl = document.querySelector('#memory-pin-picker');
const mapBoardEl = document.querySelector('#map-board');
const memoryPinCoords = document.querySelector('#memory-pin-coords');
const clearPinBtn = document.querySelector('#clear-pin');

// --- Supabase ---
const SUPABASE_URL = 'https://vcmypvmwtccejwuaiiod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbXlwdm13dGNjZWp3dWFpaW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxOTQzODgsImV4cCI6MjA4OTc3MDM4OH0.smL2oX-kbE5X0Ojfu-gwGBL_XO8khGedxIMh_1PAbvQ';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storage: localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const MAPTILER_KEY = 'EUCoLY6ma4XHK9Gt2Xxq';
const MAX_PINS = 5;
const LOCATION_COLORS = ['#2BB0A0', '#F5A623', '#E8604C', '#9B6BCE', '#4A90D9'];

const DEFAULT_MAP_CONFIG = {
  center: [42.6977, 23.3219], // [lat, lng]
  zoom: 6,
  styleUrl: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
};

const MAP_CONFIG = {
  ...DEFAULT_MAP_CONFIG,
  ...(window.APP_MAP_CONFIG || {}),
};

function emptyLocationField() {
  return { name: '', lat: null, lng: null, x: null, y: null };
}

let appState = {
  user: null,
  userId: null,
  memories: [],
  people: [],
  activeTag: null,
  locationFields: [emptyLocationField()],
  activeLocationIndex: 0,
  selectedPerson: null,
  selectedMemory: null,
  loading: false,
};

let mapMode = 'fallback';
let pickerMap;
let pickerMarkers = [];
let overviewMap;
let overviewMarkers = [];
let pickerSavedMarkers = [];

const memoryLocationsEl = document.querySelector('#memory-locations');
const memoryAddLocationBtn = document.querySelector('#memory-add-location');
const editLocationsEl = document.querySelector('#edit-locations');
const editAddLocationBtn = document.querySelector('#edit-add-location');

function clampIndex(list, idx) {
  if (!list.length) return 0;
  return Math.max(0, Math.min(idx, list.length - 1));
}

function pinFromField(field) {
  if (!field) return null;
  if (Number.isFinite(field.lat) && Number.isFinite(field.lng)) {
    return { lat: field.lat, lng: field.lng, name: (field.name || '').trim() };
  }
  if (Number.isFinite(field.x) && Number.isFinite(field.y)) {
    return { x: field.x, y: field.y, name: (field.name || '').trim() };
  }
  return null;
}

// --- Supabase helpers ---

function memPhotoUrl(path) {
  return sb.storage.from('memory-photos').getPublicUrl(path).data.publicUrl;
}

function peoplePhotoUrl(path) {
  return sb.storage.from('people-photos').getPublicUrl(path).data.publicUrl;
}

function mapMemory(row) {
  const media = (row.memory_media || []).slice().sort((a, b) => a.position - b.position);
  return {
    createdAt: row.id,
    title: row.title || '',
    text: row.text || '',
    eventDate: row.event_date || row.created_at,
    location: row.location || '',
    persons: parsePeople(row.person),
    items: parsePeople(row.item),
    notes: row.notes || '',
    pins: normalizePins(row.pin),
    tags: normalizeTagGroups(row.tags),
    mediaDataUrls: media.map((m) => memPhotoUrl(m.storage_path)),
    mediaPaths: media.map((m) => m.storage_path),
    mediaCount: media.length,
  };
}

function mapPerson(row) {
  return {
    id: row.id,
    name: row.name || '',
    photoDataUrl: row.photo_url ? peoplePhotoUrl(row.photo_url) : '',
    photoPath: row.photo_url || '',
  };
}

async function loadData() {
  console.log('loadData called, userId:', appState.userId);
  if (!appState.userId) {
    console.warn('loadData: no userId, aborting');
    return;
  }

  // Query directly. autoRefreshToken:true keeps the access token fresh, so we
  // do NOT call getSession() here — calling it can block on the auth lock and
  // leave the query pending forever (the deadlock that caused 0 records on refresh).
  const [memoriesResult, peopleResult] = await Promise.all([
    sb.from('memories').select('*, memory_media(*)').eq('user_id', appState.userId),
    sb.from('people').select('*').eq('user_id', appState.userId),
  ]);

  if (memoriesResult.error) {
    console.error('loadData memories error:', memoriesResult.error);
    throw new Error(memoriesResult.error.message);
  }
  if (peopleResult.error) {
    console.error('loadData people error:', peopleResult.error);
  }

  if (memoriesResult.data) {
    appState.memories = memoriesResult.data.map(mapMemory);
  }
  if (peopleResult.data) {
    appState.people = peopleResult.data.map(mapPerson);
  }
  console.log(`loadData complete: ${appState.memories.length} memories, ${appState.people.length} people`);
}

async function deleteMemoryById(id) {
  const memory = appState.memories.find((m) => m.createdAt === id);
  const { error } = await sb.from('memories').delete().eq('id', id).eq('user_id', appState.userId);
  if (error) {
    console.error('deleteMemory error:', error);
    alert(`Грешка при изтриване: ${error.message}`);
    return;
  }
  if (memory && memory.mediaPaths && memory.mediaPaths.length) {
    await sb.from('memory_media').delete().eq('memory_id', id);
    const { error: storageErr } = await sb.storage.from('memory-photos').remove(memory.mediaPaths);
    if (storageErr) console.error('Storage remove error:', storageErr);
  }
  appState.memories = appState.memories.filter((m) => m.createdAt !== id);
}

async function compressImage(file, maxWidth = 1600, quality = 0.8) {
  if (!file.type || !file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const name = file.name || 'photo.jpg';
    return await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(new File([blob], name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg',
        quality,
      );
    });
  } catch (e) {
    console.error('compressImage error, uploading original:', e);
    return file;
  }
}

async function uploadMemPhotoFile(file, userId, memoryId, position) {
  const compressed = await compressImage(file);
  const ext = compressed.name.split('.').pop() || 'jpg';
  const path = `${userId}/${memoryId}/${position}-${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage.from('memory-photos').upload(path, compressed);
  if (upErr) throw new Error(upErr.message);
  const { error: dbErr } = await sb.from('memory_media').insert({ memory_id: memoryId, storage_path: path, position });
  if (dbErr) {
    await sb.storage.from('memory-photos').remove([path]);
    throw new Error(dbErr.message);
  }
  return path;
}

async function uploadMemPhotoBlob(blob, userId, memoryId, position) {
  const compressed = await compressImage(blob);
  const ext = compressed.type.split('/')[1] || 'jpg';
  const path = `${userId}/${memoryId}/${position}-${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage.from('memory-photos').upload(path, compressed);
  if (upErr) throw new Error(upErr.message);
  const { error: dbErr } = await sb.from('memory_media').insert({ memory_id: memoryId, storage_path: path, position });
  if (dbErr) {
    await sb.storage.from('memory-photos').remove([path]);
    throw new Error(dbErr.message);
  }
  return path;
}

async function uploadPeoplePhotoBlob(blob, userId) {
  const compressed = await compressImage(blob);
  const ext = compressed.type.split('/')[1] || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await sb.storage.from('people-photos').upload(path, compressed);
  if (error) throw new Error(error.message);
  return path;
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const ICON = {
  pin: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
  bag: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  heart: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  target: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
};

// --- Core functions ---

function normalizeOnePin(pin) {
  if (!pin) return null;
  if (Number.isFinite(pin.lat) && Number.isFinite(pin.lng)) {
    return { lat: Number(pin.lat), lng: Number(pin.lng), name: pin.name || '' };
  }
  if (Number.isFinite(pin.x) && Number.isFinite(pin.y)) {
    return { x: Number(pin.x), y: Number(pin.y), name: pin.name || '' };
  }
  return null;
}

// Accepts either the new array-of-pins format or the old single-pin object
// format (backward compatibility with memories saved before multi-pin support).
function normalizePins(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map(normalizeOnePin).filter(Boolean).slice(0, MAX_PINS);
}

// Renders each pin as a "📍 name ×" chip. Pass onRemove to make chips
// removable (add/edit forms); omit it for a read-only list (detail view).
function renderPinChips(listEl, coordsEl, pins, onRemove) {
  if (!listEl) return;
  listEl.innerHTML = '';
  if (coordsEl) {
    coordsEl.textContent = pins.length
      ? `${pins.length} ${pins.length === 1 ? 'локация' : 'локации'} избрани (макс. ${MAX_PINS}).`
      : 'Няма избрани локации.';
  }
  pins.forEach((pin, idx) => {
    const chip = document.createElement('li');
    chip.className = 'pin-chip';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'pin-chip-icon';
    iconSpan.innerHTML = ICON.pin;

    const label = document.createElement('span');
    label.className = 'pin-chip-label';
    label.textContent = pin.name
      || (Number.isFinite(pin.lat) ? `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}` : `x ${(pin.x ?? 0).toFixed(1)}%, y ${(pin.y ?? 0).toFixed(1)}%`);

    chip.append(iconSpan, label);

    if (onRemove) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'pin-chip-remove';
      removeBtn.setAttribute('aria-label', 'Премахни локация');
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => onRemove(idx));
      chip.appendChild(removeBtn);
    }

    listEl.appendChild(chip);
  });
}

function normalizeTagGroups(tags) {
  if (Array.isArray(tags)) {
    return { general: [...new Set(tags.filter(Boolean))], activity: [], emotion: [] };
  }

  return {
    general: Array.isArray(tags?.general) ? [...new Set(tags.general.filter(Boolean))] : [],
    activity: Array.isArray(tags?.activity) ? [...new Set(tags.activity.filter(Boolean))] : [],
    emotion: Array.isArray(tags?.emotion) ? [...new Set(tags.emotion.filter(Boolean))] : [],
  };
}

function setScreen() {
  document.getElementById('auth-splash')?.remove();
  const loggedIn = Boolean(appState.user);
  loginScreen.classList.toggle('active', !loggedIn);
  appScreen.classList.toggle('active', loggedIn);
  if (loggedIn) welcomeText.textContent = `Здравей, ${appState.user.split('@')[0]}!`;
  if (loggedIn) {
    refreshMapSizes();
  }
}

function refreshMapSizes(targetTab) {
  if (mapMode !== 'maplibre') return;

  if ((!targetTab || targetTab === 'create-memory') && pickerMap) {
    setTimeout(() => pickerMap.resize(), 0);
  }

  if ((!targetTab || targetTab === 'map') && overviewMap) {
    setTimeout(() => overviewMap.resize(), 0);
  }
}

function switchTab(targetTab) {
  tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === targetTab));
  panels.forEach((panel) => panel.classList.toggle('active', panel.id === targetTab));
  if (targetTab === 'create-memory') {
    showHomeDashboard();
  }
  if (targetTab === 'map' && mapMode === 'maplibre' && !overviewMap) {
    setTimeout(() => {
      initOverviewMap();
      refreshMapSizes('map');
      renderMapPins();
    }, 500);
  } else {
    refreshMapSizes(targetTab);
  }
}

function toSetList(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseTagInput(raw) {
  return [...new Set(raw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))];
}

function parsePeople(raw) {
  return [...new Set((raw || '').split(',').map((s) => s.trim()).filter(Boolean))];
}

function buildTagEntries(memory) {
  return [
    ...memory.tags.general.map((value) => ({ type: 'general', value, label: `#${value}` })),
    ...memory.tags.activity.map((value) => ({ type: 'activity', value, label: `🎯 ${value}`, iconHtml: ICON.target })),
    ...memory.tags.emotion.map((value) => ({ type: 'emotion', value, label: `💛 ${value}`, iconHtml: ICON.heart })),
  ];
}

function buildTagButton(entry) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tag-chip';
  if (entry.iconHtml) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'chip-icon';
    iconSpan.innerHTML = entry.iconHtml;
    button.append(iconSpan, document.createTextNode(' ' + entry.value));
  } else {
    button.textContent = entry.label;
  }
  button.addEventListener('click', () => {
    appState.activeTag = entry;
    switchTab('timeline');
    render();
  });
  return button;
}

function formatEventDate(dateValue) {
  return new Date(dateValue).toLocaleDateString('bg-BG');
}


function getMemoryCover(memory) {
  if (memory.mediaDataUrls && memory.mediaDataUrls.length > 0) return memory.mediaDataUrls[0];
  const personPhoto = memory.persons.length ? getPersonPhoto(memory.persons[0]) : '';
  if (personPhoto) return personPhoto;
  return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="460"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%233ECab8"/><stop offset="1" stop-color="%232BB0A0"/></linearGradient></defs><rect width="100%25" height="100%25" fill="url(%23g)"/><text x="50%25" y="52%25" font-size="42" text-anchor="middle" fill="white" font-family="DM Sans,Arial,sans-serif">Памет</text></svg>';
}

function toEventDateTimestamp(memory) {
  const sourceDate = String(memory.eventDate || memory.createdAt || '').trim();
  if (!sourceDate) return 0;
  if (/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) {
    return Date.parse(`${sourceDate}T00:00:00`);
  }
  return Date.parse(sourceDate);
}

function sortByEventDateDesc(memories) {
  return [...memories].sort((a, b) => toEventDateTimestamp(b) - toEventDateTimestamp(a));
}


function monthLabel(dateValue) {
  return new Date(dateValue).toLocaleDateString('bg-BG', { month: 'long', year: 'numeric' });
}

function showHomeDashboard() {
  homeDashboard.classList.remove('hidden');
  homeAddForm.classList.add('hidden');
}

function showHomeAddForm() {
  homeDashboard.classList.add('hidden');
  homeAddForm.classList.remove('hidden');
  if (mapMode === 'maplibre') {
    if (!pickerMap) {
      setTimeout(() => { initPickerMap(); if (pickerMap) pickerMap.resize(); }, 500);
    } else {
      setTimeout(() => pickerMap.resize(), 50);
    }
  }
}

function renderHomeSummary() {
  if (!statsGrid || !homeRecentList) return;

  const uniquePlaces = new Set(appState.memories.map((memory) => memory.location.trim()).filter(Boolean));
  const photosCount = appState.memories.reduce((sum, memory) => sum + (memory.mediaCount || 0), 0);
  const uniquePeople = new Set(appState.people.map((person) => person.name.trim().toLowerCase()).filter(Boolean));
  appState.memories.forEach((memory) => {
    memory.persons.forEach((name) => uniquePeople.add(name.trim().toLowerCase()));
  });

  const SVG = (d) => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const stats = [
    { label: 'Спомени', value: appState.memories.length, icon: SVG('<rect x="2" y="7" width="20" height="15" rx="2.5"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><circle cx="12" cy="14" r="3"/>'), onClick: () => switchTab('timeline') },
    { label: 'Хора',    value: uniquePeople.size,         icon: SVG('<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5"/><circle cx="18" cy="8" r="2.5"/><path d="M22 20c0-2.5-2-4-4-4"/>'), onClick: () => switchTab('people') },
    { label: 'Места',   value: uniquePlaces.size,         icon: SVG('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/>'), onClick: () => switchTab('map') },
    { label: 'Снимки',  value: photosCount,               icon: SVG('<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>'), onClick: () => openPhotosOverlay() },
  ];

  statsGrid.innerHTML = '';
  stats.forEach((stat) => {
    const card = document.createElement('article');
    card.className = 'stat-card';
    card.style.cursor = 'pointer';
    card.innerHTML = `<span class="stat-icon">${stat.icon}</span><strong>${stat.value}</strong><small>${stat.label}</small>`;
    card.addEventListener('click', stat.onClick);
    statsGrid.appendChild(card);
  });

  homeRecentList.innerHTML = '';
  sortByEventDateDesc(appState.memories)
    .slice(0, 5)
    .forEach((memory) => {
      const clone = memoryTemplate.content.cloneNode(true);
      clone.querySelector('.memory-photo').src = getMemoryCover(memory);
      clone.querySelector('.event-date').textContent = formatEventDate(memory.eventDate);
      clone.querySelector('.text').textContent = memory.title || memory.text;

      const locationEl = clone.querySelector('.location');
      if (memory.location) locationEl.innerHTML = `${ICON.pin} ${escHtml(memory.location)}`;
      else locationEl.remove();

      clone.querySelector('.person')?.remove();
      clone.querySelector('.item')?.remove();
      clone.querySelector('.media-count')?.remove();
      clone.querySelector('.memory-tags')?.remove();

      const cardItem = clone.querySelector('.memory-item');
      cardItem.style.cursor = 'pointer';
      cardItem.addEventListener('click', () => openMemoryDetail(memory.createdAt));

      homeRecentList.appendChild(clone);
    });

  if (!homeRecentList.children.length) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = appState.loading ? 'Зареждане…' : 'Все още няма добавени спомени.';
    homeRecentList.appendChild(li);
  }
}

function renderOnThisDay() {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const thisYear = today.getFullYear();

  const matches = appState.memories.filter((memory) => {
    const d = new Date(memory.eventDate);
    return d.getMonth() === todayMonth && d.getDate() === todayDay && d.getFullYear() < thisYear;
  }).sort((a, b) => toEventDateTimestamp(b) - toEventDateTimestamp(a));

  if (!matches.length) {
    onThisDayCard.classList.add('hidden');
    return;
  }

  onThisDayCard.classList.remove('hidden');
  onThisDaySubtitle.textContent =
    today.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long' }) + ' в предишни години';

  onThisDayList.innerHTML = '';
  matches.forEach((memory) => {
    const year = new Date(memory.eventDate).getFullYear();
    const li = document.createElement('li');
    li.className = 'memory-item memory-card';
    li.style.cursor = 'pointer';
    const img = document.createElement('img');
    img.className = 'memory-photo';
    img.src = getMemoryCover(memory);
    img.alt = '';
    const body = document.createElement('div');
    body.className = 'memory-card-body';
    const yearSpan = document.createElement('span');
    yearSpan.className = 'on-this-day-year';
    yearSpan.textContent = String(year);
    const strong = document.createElement('strong');
    strong.textContent = (memory.title || memory.text).slice(0, 60);
    const small = document.createElement('small');
    if (memory.location) small.innerHTML = `${ICON.pin} ${escHtml(memory.location)}`;
    body.append(yearSpan, strong, small);
    li.append(img, body);
    li.addEventListener('click', () => openMemoryDetail(memory.createdAt, 'create-memory'));
    onThisDayList.appendChild(li);
  });
}

function renderMediaPreview() {
  if (!memoryMediaPreview || !memoryMediaInput) return;
  memoryMediaPreview.innerHTML = '';
  [...memoryMediaInput.files].slice(0, 6).forEach((file) => {
    if (!file.type.startsWith('image/')) return;
    const img = document.createElement('img');
    img.className = 'media-preview-item';
    img.alt = file.name;
    img.src = URL.createObjectURL(file);
    memoryMediaPreview.appendChild(img);
  });
}

function addFallbackPin(container, x, y, title) {
  const pin = document.createElement('div');
  pin.className = 'fallback-pin';
  pin.style.left = `${x}%`;
  pin.style.top = `${y}%`;
  pin.title = title;
  container.appendChild(pin);
  return pin;
}

function toFallbackPin(lat, lng) {
  return {
    x: ((lng + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100,
  };
}

function initMaps() {
  if (!window.maplibregl) {
    memoryPinPickerEl.addEventListener('click', (event) => {
      if (!appState.locationFields.length) { showToast('Добавете място, преди да поставите пин.'); return; }
      const idx = clampIndex(appState.locationFields, appState.activeLocationIndex);
      const field = appState.locationFields[idx];
      const rect = memoryPinPickerEl.getBoundingClientRect();
      field.x = ((event.clientX - rect.left) / rect.width) * 100;
      field.y = ((event.clientY - rect.top) / rect.height) * 100;
      field.lat = null;
      field.lng = null;
      renderLocationPins();
    });
    return;
  }
  mapMode = 'maplibre';
  // Maps are initialized lazily when their containers first become visible
}

function initPickerMap() {
  if (!window.maplibregl || pickerMap) return;
  const mlCenter = [MAP_CONFIG.center[1], MAP_CONFIG.center[0]];
  pickerMap = new maplibregl.Map({
    container: 'memory-pin-picker',
    style: MAP_CONFIG.styleUrl,
    center: mlCenter,
    zoom: MAP_CONFIG.zoom,
  });
  pickerMap.on('click', (event) => {
    if (!appState.locationFields.length) { showToast('Добавете място, преди да поставите пин.'); return; }
    const idx = clampIndex(appState.locationFields, appState.activeLocationIndex);
    const field = appState.locationFields[idx];
    field.lat = event.lngLat.lat;
    field.lng = event.lngLat.lng;
    if (!field.name) field.name = `${field.lat.toFixed(4)}, ${field.lng.toFixed(4)}`;
    renderLocationPins();
    syncLocationFieldInput(idx);
  });
  pickerMap.on('load', () => {
    renderPickerSavedPins();
    renderLocationPins();
  });
}

function initOverviewMap() {
  if (!window.maplibregl || overviewMap) return;
  const mlCenter = [MAP_CONFIG.center[1], MAP_CONFIG.center[0]];
  overviewMap = new maplibregl.Map({
    container: 'map-board',
    style: MAP_CONFIG.styleUrl,
    center: mlCenter,
    zoom: MAP_CONFIG.zoom,
  });
}

function syncLocationFieldInput(idx) {
  const input = memoryLocationsEl?.querySelector(`.location-field[data-index="${idx}"] .location-field-input`);
  if (input) input.value = appState.locationFields[idx].name;
}

// Rebuilds the location field rows (text input + swatch + remove button) in
// the add form. Only called on structural changes (add/remove field, form
// reset) — never from the global render() — so it never wipes text the user
// is mid-typing during an incidental re-render.
function renderLocationFields() {
  if (!memoryLocationsEl) return;
  memoryLocationsEl.innerHTML = '';
  appState.locationFields.forEach((field, idx) => {
    const row = document.createElement('div');
    row.className = 'location-field';
    row.dataset.index = idx;

    const swatch = document.createElement('span');
    swatch.className = 'location-field-swatch';
    swatch.style.background = LOCATION_COLORS[idx % LOCATION_COLORS.length];

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'location-field-input';
    input.placeholder = 'Напр. Аспарухов плаж';
    input.value = field.name;
    input.addEventListener('input', () => { field.name = input.value; });
    input.addEventListener('focus', () => { appState.activeLocationIndex = idx; });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'location-field-remove';
    removeBtn.setAttribute('aria-label', 'Премахни място');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      appState.locationFields.splice(idx, 1);
      appState.activeLocationIndex = clampIndex(appState.locationFields, appState.activeLocationIndex);
      renderLocationFields();
      renderLocationPins();
    });

    row.append(swatch, input, removeBtn);
    memoryLocationsEl.appendChild(row);

    attachLocationAutocomplete(input, (item) => {
      field.name = item.name;
      field.lat = item.lat;
      field.lng = item.lng;
      field.x = null;
      field.y = null;
      appState.activeLocationIndex = idx;
      renderLocationPins();
      if (pickerMap) pickerMap.flyTo({ center: [item.lng, item.lat], zoom: 13 });
    });
  });

  if (memoryAddLocationBtn) memoryAddLocationBtn.disabled = appState.locationFields.length >= MAX_PINS;
}

// Updates only the map markers + hint text from appState.locationFields.
// Safe to call from the global render() since it never touches the field
// <input> elements (which would blow away in-progress typing).
function renderLocationPins() {
  const fields = appState.locationFields;

  if (mapMode === 'maplibre') {
    pickerMarkers.forEach((m) => m.remove());
    pickerMarkers = [];
    if (pickerMap) {
      fields.forEach((field, idx) => {
        if (!Number.isFinite(field.lat) || !Number.isFinite(field.lng)) return;
        const marker = new maplibregl.Marker({ color: LOCATION_COLORS[idx % LOCATION_COLORS.length] })
          .setLngLat([field.lng, field.lat])
          .addTo(pickerMap);
        pickerMarkers.push(marker);
      });
    }
  } else {
    memoryPinPickerEl.querySelectorAll('.fallback-pin').forEach((el) => el.remove());
    fields.forEach((field, idx) => {
      if (Number.isFinite(field.x) && Number.isFinite(field.y)) {
        addFallbackPin(memoryPinPickerEl, field.x, field.y, field.name || `Място ${idx + 1}`);
      }
    });
  }

  const withCoords = fields.filter((f) => pinFromField(f)).length;
  memoryPinCoords.textContent = fields.length
    ? `${withCoords} от ${fields.length} ${fields.length === 1 ? 'място има' : 'места имат'} отбелязан пин.`
    : 'Няма избрани места.';
}

function renderMapPins() {
  mapPinsList.innerHTML = '';
  const flatPins = appState.memories.flatMap((memory) => memory.pins.map((pin) => ({ memory, pin })));

  if (mapMode === 'maplibre') {
    overviewMarkers.forEach((m) => m.remove());
    overviewMarkers = [];
    if (overviewMap) {
      flatPins.forEach(({ memory, pin }) => {
        if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) return;
        const marker = new maplibregl.Marker({ color: '#2BB0A0' })
          .setLngLat([pin.lng, pin.lat])
          .addTo(overviewMap);
        marker.getElement().style.cursor = 'pointer';
        marker.getElement().addEventListener('click', (e) => {
          e.stopPropagation();
          openMemoryDetail(memory.createdAt, 'map');
        });
        overviewMarkers.push(marker);
      });
      const geoPins = flatPins.filter(({ pin }) => Number.isFinite(pin.lat) && Number.isFinite(pin.lng));
      if (geoPins.length > 0) {
        const lngs = geoPins.map(({ pin }) => pin.lng);
        const lats = geoPins.map(({ pin }) => pin.lat);
        overviewMap.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 60, maxZoom: 11 },
        );
      }
    }
  } else {
    mapBoardEl.querySelectorAll('.fallback-pin').forEach((el) => el.remove());
    flatPins.forEach(({ memory, pin }) => {
      const title = pin.name || memory.location || memory.text.slice(0, 48);
      let el;
      if (Number.isFinite(pin.x) && Number.isFinite(pin.y)) {
        el = addFallbackPin(mapBoardEl, pin.x, pin.y, title);
      } else if (Number.isFinite(pin.lat) && Number.isFinite(pin.lng)) {
        const converted = toFallbackPin(pin.lat, pin.lng);
        el = addFallbackPin(mapBoardEl, converted.x, converted.y, title);
      }
      if (el) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => openMemoryDetail(memory.createdAt, 'map'));
      }
    });
  }

  flatPins.forEach(({ memory, pin }, index) => {
    const pinTitle = pin.name || memory.location || (memory.title || memory.text).slice(0, 48);
    const li = document.createElement('li');
    li.className = 'memory-item';
    li.style.cursor = 'pointer';
    li.innerHTML = `${ICON.pin} Пин #${index + 1} — ${escHtml(pinTitle)}`;
    li.addEventListener('click', () => openMemoryDetail(memory.createdAt, 'map'));
    mapPinsList.appendChild(li);
  });

  if (!flatPins.length) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'Все още няма добавени пинове.';
    mapPinsList.appendChild(li);
  }
}

function passesTagFilter(memory) {
  if (!appState.activeTag) return true;
  if (appState.activeTag.type === 'item') return memory.items.includes(appState.activeTag.value);
  return memory.tags[appState.activeTag.type].includes(appState.activeTag.value);
}

function passesSearchFilter(memory) {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  const allTags = [
    ...memory.tags.general,
    ...memory.tags.activity,
    ...memory.tags.emotion,
  ].join(' ');
  return (
    memory.text.toLowerCase().includes(q) ||
    memory.persons.some((p) => p.toLowerCase().includes(q)) ||
    memory.location.toLowerCase().includes(q) ||
    memory.items.some((it) => it.toLowerCase().includes(q)) ||
    allTags.toLowerCase().includes(q)
  );
}

function getPersonPhoto(name) {
  const lower = name.trim().toLowerCase();
  const found = appState.people.find((person) => person.name.trim().toLowerCase() === lower);
  return found?.photoDataUrl || '';
}


function getMemoriesForPerson(name) {
  const lower = name.trim().toLowerCase();
  return sortByEventDateDesc(appState.memories).filter((memory) => memory.persons.some((p) => p.trim().toLowerCase() === lower));
}

function openPersonDetail(name) {
  appState.selectedPerson = name;
  renderPersonDetail();
}

function renderPersonDetail() {
  if (!appState.selectedPerson) {
    peopleOverviewCard.classList.remove('hidden');
    personDetailCard.classList.add('hidden');
    return;
  }

  const selectedName = appState.selectedPerson;
  const relatedMemories = getMemoriesForPerson(selectedName);
  peopleOverviewCard.classList.add('hidden');
  personDetailCard.classList.remove('hidden');

  const photo = getPersonPhoto(selectedName);
  personDetailAvatar.src =
    photo ||
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%25" height="100%25" fill="%23dfe8ff"/><text x="50%25" y="54%25" dominant-baseline="middle" text-anchor="middle" font-size="28">👤</text></svg>';
  personDetailAvatar.alt = `Снимка на ${selectedName}`;
  personDetailName.textContent = selectedName;
  personDetailMeta.textContent = `Общо спомени: ${relatedMemories.length}`;

  personDetailMemories.innerHTML = '';
  relatedMemories.forEach((memory) => {
    const li = document.createElement('li');
    li.className = 'memory-item';
    const dateStrong = document.createElement('strong');
    dateStrong.textContent = `🗓️ ${formatEventDate(memory.eventDate)}`;
    const textP = document.createElement('p');
    textP.textContent = memory.text;
    const locationSmall = document.createElement('small');
    locationSmall.innerHTML = memory.location
      ? `${ICON.pin} ${escHtml(memory.location)}`
      : `${ICON.pin} Без локация`;
    li.append(dateStrong, textP, locationSmall);
    personDetailMemories.appendChild(li);
  });

  if (!relatedMemories.length) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'Няма добавени спомени за този човек.';
    personDetailMemories.appendChild(li);
  }
}

function renderTimeline() {
  timelineList.innerHTML = '';
  const sortedMemories = [...appState.memories]
    .sort((a, b) => toEventDateTimestamp(a) - toEventDateTimestamp(b))
    .filter(passesTagFilter)
    .filter(passesSearchFilter);
  let lastGroup = '';

  sortedMemories.forEach((memory) => {
    const currentGroup = monthLabel(memory.eventDate);
    if (currentGroup != lastGroup) {
      const groupLabel = document.createElement('li');
      groupLabel.className = 'timeline-group-label';
      groupLabel.textContent = currentGroup;
      timelineList.appendChild(groupLabel);
      lastGroup = currentGroup;
    }

    const clone = memoryTemplate.content.cloneNode(true);
    clone.querySelector('.memory-photo').src = getMemoryCover(memory);
    clone.querySelector('.event-date').textContent = `🗓️ ${formatEventDate(memory.eventDate)}`;
    clone.querySelector('.text').textContent = memory.title || memory.text;

    const locationEl = clone.querySelector('.location');
    if (memory.location) locationEl.innerHTML = `${ICON.pin} ${escHtml(memory.location)}`;
    else locationEl.remove();

    const personEl = clone.querySelector('.person');
    if (memory.persons.length) personEl.textContent = `👤 ${memory.persons.join(', ')}`;
    else personEl?.remove();

    const itemEl = clone.querySelector('.item');
    if (memory.items.length) itemEl.innerHTML = `${ICON.bag} ${escHtml(memory.items.join(', '))}`;
    else itemEl?.remove();

    const mediaEl = clone.querySelector('.media-count');
    if (memory.mediaCount) mediaEl.textContent = `🎞️ ${memory.mediaCount} файла`;
    else mediaEl.remove();

    const tagsWrap = clone.querySelector('.memory-tags');
    const entries = buildTagEntries(memory);
    if (entries.length) {
      entries.forEach((entry) => tagsWrap.appendChild(buildTagButton(entry)));
    } else {
      tagsWrap.remove();
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-delete-memory';
    deleteBtn.textContent = 'Изтрий';
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Изтриване на спомена?')) return;
      deleteBtn.disabled = true;
      await deleteMemoryById(memory.createdAt);
      render();
    });
    const cardBody = clone.querySelector('.memory-card-body');
    cardBody.appendChild(deleteBtn);

    // Clicking anywhere on the card (except delete) opens detail view
    const cardItem = clone.querySelector('.memory-item');
    cardItem.style.cursor = 'pointer';
    cardItem.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-memory') || e.target.closest('.tag-chip')) return;
      openMemoryDetail(memory.createdAt);
    });

    timelineList.appendChild(clone);
  });

  if (!sortedMemories.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = appState.loading
      ? 'Зареждане…'
      : searchQuery
        ? `Няма резултати за „${searchQuery}".`
        : appState.activeTag
          ? 'Няма спомени за избрания филтър.'
          : 'Все още няма добавени спомени.';
    timelineList.appendChild(empty);
  }
}

function renderPeople() {
  peopleList.innerHTML = '';
  const namesFromMemories = toSetList(appState.memories.flatMap((m) => m.persons));
  const namesFromPeople = toSetList(appState.people.map((p) => p.name));
  const allNames = toSetList([...namesFromPeople, ...namesFromMemories]);

  allNames.forEach((name) => {
    const li = document.createElement('li');
    li.className = 'person-card';
    li.tabIndex = 0;
    li.setAttribute('role', 'button');

    const img = document.createElement('img');
    img.className = 'person-avatar';
    const photo = getPersonPhoto(name);
    img.src = photo || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%25" height="100%25" fill="%23dfe8ff"/><text x="50%25" y="54%25" dominant-baseline="middle" text-anchor="middle" font-size="28">👤</text></svg>';
    img.alt = `Снимка на ${name}`;

    const caption = document.createElement('span');
    caption.textContent = name;

    const memoryCount = document.createElement('small');
    memoryCount.textContent = `${getMemoriesForPerson(name).length} спомена`;

    li.append(img, caption, memoryCount);

    const inDb = appState.people.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (inDb) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-delete-person';
      delBtn.textContent = '✕';
      delBtn.setAttribute('aria-label', `Изтрий ${name}`);
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`Изтрий „${name}" от списъка с хора?`)) return;
        delBtn.disabled = true;
        await deletePersonByName(name);
        renderPeople();
      });
      li.appendChild(delBtn);
    }
    li.addEventListener('click', () => openPersonDetail(name));
    li.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPersonDetail(name);
      }
    });
    peopleList.appendChild(li);
  });

  if (!allNames.length) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'Няма добавени хора.';
    peopleList.appendChild(li);
  }
}

function renderTags() {
  tagsList.innerHTML = '';
  const seen = new Set();
  const allEntries = [
    ...appState.memories.flatMap((m) => m.items.map((value) => ({ type: 'item', value, label: `🎒 ${value}`, iconHtml: ICON.bag }))),
    ...appState.memories.flatMap(buildTagEntries),
  ];
  allEntries.forEach((entry) => {
    const key = `${entry.type}:${entry.value}`;
    if (seen.has(key)) return;
    seen.add(key);
    const li = document.createElement('li');
    li.appendChild(buildTagButton(entry));
    tagsList.appendChild(li);
  });

  if (!tagsList.children.length) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'Няма добавени тагове.';
    tagsList.appendChild(li);
  }
}

function renderFilterState() {
  if (!appState.activeTag) {
    activeTagInfo.textContent = '';
    activeTagInfo.classList.add('hidden');
    clearTagFilterBtn.classList.add('hidden');
    return;
  }
  activeTagInfo.textContent = `Филтър: ${appState.activeTag.label}`;
  activeTagInfo.classList.remove('hidden');
  clearTagFilterBtn.classList.remove('hidden');
}

function render() {
  renderFilterState();
  renderHomeSummary();
  renderOnThisDay();
  renderTimeline();
  renderPeople();
  renderPersonDetail();
  renderTags();
  renderLocationPins();
  renderMapPins();
  renderPickerSavedPins();
}

function openMemoryDetail(createdAt, returnTab = 'timeline') {
  detailReturnTab = returnTab;
  appState.selectedMemory = createdAt;
  renderMemoryDetail();

  if (returnTab === 'map') {
    // Inline mode: place detail inside the map tab panel, not as a fixed overlay
    const mapSection = document.querySelector('#map');
    mapSection.classList.add('showing-detail');
    mapSection.appendChild(memoryDetailEl);
    memoryDetailEl.classList.add('map-inline');
    memoryDetailEl.classList.remove('hidden');
    window.scrollTo(0, 0);
  } else {
    memoryDetailEl.classList.remove('hidden');
    memoryDetailEl.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }

  requestAnimationFrame(() => initDetailStaticMap());
}

function closeMemoryDetail() {
  appState.selectedMemory = null;

  if (memoryDetailEl.classList.contains('map-inline')) {
    // Restore overlay element to its original position outside the tab panels
    const mapSection = document.querySelector('#map');
    mapSection.classList.remove('showing-detail');
    memoryDetailEl.classList.remove('map-inline');
    document.querySelector('#app-screen').appendChild(memoryDetailEl);
    window.scrollTo(0, 0);
  } else {
    document.body.style.overflow = '';
  }

  memoryDetailEl.classList.add('hidden');
  switchTab(detailReturnTab);
}

function renderMemoryDetail() {
  const memory = appState.memories.find((m) => m.createdAt === appState.selectedMemory);
  if (!memory) return;

  // Gallery
  detailGallery.innerHTML = '';
  detailGallery.onscroll = null;

  if (memory.mediaDataUrls && memory.mediaDataUrls.length) {
    memory.mediaDataUrls.forEach((url, idx) => {
      const img = document.createElement('img');
      img.className = 'detail-gallery-img';
      img.src = url;
      img.alt = '';
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => openLightbox(memory.mediaDataUrls, idx));
      detailGallery.appendChild(img);
    });
    if (memory.mediaDataUrls.length > 1) {
      const count = document.createElement('span');
      count.className = 'detail-gallery-count';
      count.textContent = `1 / ${memory.mediaDataUrls.length}`;
      detailGallery.addEventListener('scroll', () => {
        const idx = Math.round(detailGallery.scrollLeft / detailGallery.clientWidth) + 1;
        count.textContent = `${idx} / ${memory.mediaDataUrls.length}`;
      }, { passive: true });
      detailGallery.style.position = 'relative';
      detailGallery.appendChild(count);
    }
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'detail-gallery-placeholder';
    placeholder.textContent = '📸';
    detailGallery.appendChild(placeholder);
  }

  // 2. Title (memory title, large bold; fall back to text for old memories)
  detailTitle.textContent = memory.title || memory.text;

  // 3. Date
  detailDate.textContent = `🗓️ ${formatEventDate(memory.eventDate)}`;

  // 4–6. Location / Person / Item — show only if filled
  function setMetaRow(el, iconHtml, value) {
    if (value) {
      el.innerHTML = `${iconHtml} ${escHtml(value)}`;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }
  setMetaRow(detailLocationEl, ICON.pin, memory.location);

  // Static pin map — actual MapLibre init is deferred until overlay is visible
  if (detailMapInstance) { detailMapInstance.remove(); detailMapInstance = null; }
  const detailGeoPins = (memory.pins || []).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (detailGeoPins.length && mapMode === 'maplibre') {
    detailStaticMapEl.classList.remove('hidden');
    detailStaticMapEl.innerHTML = '';
  } else {
    detailStaticMapEl.classList.add('hidden');
  }

  if (memory.pins && memory.pins.length) {
    detailPinChipsEl.classList.remove('hidden');
    renderPinChips(detailPinChipsEl, null, memory.pins, null);
  } else {
    detailPinChipsEl.classList.add('hidden');
  }

  setMetaRow(detailPersonEl, '👤', memory.persons.join(', '));
  setMetaRow(detailItemEl,   ICON.bag, memory.items.join(', '));

  // 7. Tags as chips
  detailTags.innerHTML = '';
  buildTagEntries(memory).forEach((entry) => detailTags.appendChild(buildTagButton(entry)));

  // 8. Notes at the bottom (with label)
  if (memory.notes) {
    detailNotesText.textContent = memory.notes;
    detailNotesWrap.classList.remove('hidden');
  } else {
    detailNotesWrap.classList.add('hidden');
  }
  if (memory.title && memory.text) {
    detailText.textContent = memory.text;
    detailText.classList.remove('hidden');
  } else {
    detailText.classList.add('hidden');
  }

  // Reset to view mode
  detailView.classList.remove('hidden');
  detailEdit.classList.add('hidden');
}

function initDetailStaticMap() {
  const memory = appState.memories.find((m) => m.createdAt === appState.selectedMemory);
  if (!memory) return;
  if (detailMapInstance) { detailMapInstance.remove(); detailMapInstance = null; }
  const geoPins = (memory.pins || []).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (!geoPins.length || mapMode !== 'maplibre') return;
  detailStaticMapEl.innerHTML = '';

  const center = geoPins.length === 1
    ? [geoPins[0].lng, geoPins[0].lat]
    : [
        geoPins.reduce((sum, p) => sum + p.lng, 0) / geoPins.length,
        geoPins.reduce((sum, p) => sum + p.lat, 0) / geoPins.length,
      ];

  detailMapInstance = new maplibregl.Map({
    container: detailStaticMapEl,
    style: MAP_CONFIG.styleUrl,
    center,
    zoom: 13,
    interactive: false,
    attributionControl: false,
  });

  detailMapInstance.on('load', () => {
    if (geoPins.length > 1) {
      const bounds = geoPins.reduce(
        (b, p) => b.extend([p.lng, p.lat]),
        new maplibregl.LngLatBounds([geoPins[0].lng, geoPins[0].lat], [geoPins[0].lng, geoPins[0].lat]),
      );
      detailMapInstance.fitBounds(bounds, { padding: 40, maxZoom: 14 });
    }

    geoPins.forEach((pin) => {
      new maplibregl.Marker({ color: '#2BB0A0' })
        .setLngLat([pin.lng, pin.lat])
        .addTo(detailMapInstance);
    });
  });

  setTimeout(() => detailMapInstance && detailMapInstance.resize(), 50);
}

function syncEditLocationFieldInput(idx) {
  const input = editLocationsEl?.querySelector(`.location-field[data-index="${idx}"] .location-field-input`);
  if (input) input.value = editLocationFields[idx].name;
}

function renderEditLocationFields() {
  if (!editLocationsEl) return;
  editLocationsEl.innerHTML = '';
  editLocationFields.forEach((field, idx) => {
    const row = document.createElement('div');
    row.className = 'location-field';
    row.dataset.index = idx;

    const swatch = document.createElement('span');
    swatch.className = 'location-field-swatch';
    swatch.style.background = LOCATION_COLORS[idx % LOCATION_COLORS.length];

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'location-field-input';
    input.placeholder = 'Напр. Аспарухов плаж';
    input.value = field.name;
    input.addEventListener('input', () => { field.name = input.value; });
    input.addEventListener('focus', () => { editActiveLocationIndex = idx; });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'location-field-remove';
    removeBtn.setAttribute('aria-label', 'Премахни място');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      editLocationFields.splice(idx, 1);
      editActiveLocationIndex = clampIndex(editLocationFields, editActiveLocationIndex);
      renderEditLocationFields();
      renderEditLocationPins();
    });

    row.append(swatch, input, removeBtn);
    editLocationsEl.appendChild(row);

    attachLocationAutocomplete(input, (item) => {
      field.name = item.name;
      field.lat = item.lat;
      field.lng = item.lng;
      field.x = null;
      field.y = null;
      editActiveLocationIndex = idx;
      renderEditLocationPins();
      if (editPickerMap) editPickerMap.flyTo({ center: [item.lng, item.lat], zoom: 13 });
    });
  });

  if (editAddLocationBtn) editAddLocationBtn.disabled = editLocationFields.length >= MAX_PINS;
}

function renderEditLocationPins() {
  const fields = editLocationFields;

  if (mapMode === 'maplibre') {
    editPickerMarkers.forEach((m) => m.remove());
    editPickerMarkers = [];
    if (editPickerMap) {
      fields.forEach((field, idx) => {
        if (!Number.isFinite(field.lat) || !Number.isFinite(field.lng)) return;
        const marker = new maplibregl.Marker({ color: LOCATION_COLORS[idx % LOCATION_COLORS.length] })
          .setLngLat([field.lng, field.lat])
          .addTo(editPickerMap);
        editPickerMarkers.push(marker);
      });
    }
  } else {
    editPinPickerEl.querySelectorAll('.fallback-pin').forEach((el) => el.remove());
    fields.forEach((field, idx) => {
      if (Number.isFinite(field.x) && Number.isFinite(field.y)) {
        addFallbackPin(editPinPickerEl, field.x, field.y, field.name || `Място ${idx + 1}`);
      }
    });
  }

  const withCoords = fields.filter((f) => pinFromField(f)).length;
  editPinCoords.textContent = fields.length
    ? `${withCoords} от ${fields.length} ${fields.length === 1 ? 'място има' : 'места имат'} отбелязан пин.`
    : 'Няма избрани места.';
}

function initEditMap(existingFields) {
  if (mapMode === 'maplibre') {
    if (!editPickerMap) {
      editPickerMap = new maplibregl.Map({
        container: 'edit-pin-picker',
        style: MAP_CONFIG.styleUrl,
        center: [MAP_CONFIG.center[1], MAP_CONFIG.center[0]],
        zoom: MAP_CONFIG.zoom,
      });
      editPickerMap.on('click', (e) => {
        if (!editLocationFields.length) { showToast('Добавете място, преди да поставите пин.'); return; }
        const idx = clampIndex(editLocationFields, editActiveLocationIndex);
        const field = editLocationFields[idx];
        field.lat = e.lngLat.lat;
        field.lng = e.lngLat.lng;
        if (!field.name) field.name = `${field.lat.toFixed(4)}, ${field.lng.toFixed(4)}`;
        renderEditLocationPins();
        syncEditLocationFieldInput(idx);
      });
    }
    setTimeout(() => editPickerMap.resize(), 80);
    const firstGeoField = existingFields && existingFields.find((f) => Number.isFinite(f.lat));
    if (firstGeoField) {
      editPickerMap.setCenter([firstGeoField.lng, firstGeoField.lat]);
      editPickerMap.setZoom(13);
    }
    return;
  } else {
    if (editFallbackClickHandler) {
      editPinPickerEl.removeEventListener('click', editFallbackClickHandler);
    }
    editFallbackClickHandler = (e) => {
      if (!editLocationFields.length) { showToast('Добавете място, преди да поставите пин.'); return; }
      const idx = clampIndex(editLocationFields, editActiveLocationIndex);
      const field = editLocationFields[idx];
      const rect = editPinPickerEl.getBoundingClientRect();
      field.x = ((e.clientX - rect.left) / rect.width) * 100;
      field.y = ((e.clientY - rect.top) / rect.height) * 100;
      field.lat = null;
      field.lng = null;
      renderEditLocationPins();
    };
    editPinPickerEl.addEventListener('click', editFallbackClickHandler);
  }
}

function revokeEditPhotoBlobUrls() {
  editPhotoItems.forEach((item) => {
    if (item.type === 'new' && item.url) URL.revokeObjectURL(item.url);
  });
}

// Renders the horizontal photo strip in the edit form as 80x80 thumbnails,
// each with a ⋮⋮ drag handle (top-left) and a ✕ remove button (top-right).
// Item 0 gets a "Корица" (cover) badge since it becomes the timeline card
// cover image. A dashed "+" square after the last photo opens the file
// picker. Reordering uses Pointer Events (not native HTML5 drag-and-drop) so
// the same code path works for mouse and touch/mobile drags: while dragging,
// a floating ghost thumbnail follows the pointer and a blue insertion line
// shows where the photo will land; the array is only reordered on drop.
function renderEditPhotoStrip() {
  if (!editPhotoStripEl) return;
  editPhotoStripEl.innerHTML = '';

  editPhotoItems.forEach((item, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'photo-strip-item';
    wrap.dataset.index = idx;

    const img = document.createElement('img');
    img.className = 'photo-strip-img';
    img.src = item.url;
    img.alt = '';
    img.draggable = false;
    wrap.appendChild(img);

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'photo-strip-handle';
    handle.setAttribute('aria-label', 'Премести снимка');
    handle.textContent = '⋮⋮';
    handle.addEventListener('pointerdown', (e) => startPhotoDrag(idx, e));
    wrap.appendChild(handle);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'photo-strip-remove';
    removeBtn.setAttribute('aria-label', 'Изтрий снимка');
    removeBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    removeBtn.addEventListener('click', () => {
      if (!confirm('Изтрий тази снимка?')) return;
      const [removed] = editPhotoItems.splice(idx, 1);
      if (removed?.type === 'new' && removed.url) URL.revokeObjectURL(removed.url);
      renderEditPhotoStrip();
    });
    wrap.appendChild(removeBtn);

    if (idx === 0) {
      const badge = document.createElement('span');
      badge.className = 'photo-strip-cover-badge';
      badge.textContent = 'Корица';
      wrap.appendChild(badge);
    }

    editPhotoStripEl.appendChild(wrap);
  });

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'photo-strip-add';
  addBtn.setAttribute('aria-label', 'Добави снимки');
  addBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  addBtn.addEventListener('click', () => editMediaInput.click());
  editPhotoStripEl.appendChild(addBtn);

  const insertionLine = document.createElement('div');
  insertionLine.className = 'photo-strip-insertion-line hidden';
  editPhotoStripEl.appendChild(insertionLine);
}

function positionPhotoGhost(ghost, clientX, clientY) {
  ghost.style.left = `${clientX - 40}px`;
  ghost.style.top = `${clientY - 40}px`;
}

function startPhotoDrag(index, event) {
  event.preventDefault();
  const itemEl = event.currentTarget.closest('.photo-strip-item');
  if (!itemEl) return;
  itemEl.classList.add('dragging');

  const ghost = itemEl.querySelector('.photo-strip-img').cloneNode(true);
  ghost.className = 'photo-strip-ghost';
  document.body.appendChild(ghost);
  positionPhotoGhost(ghost, event.clientX, event.clientY);

  editPhotoDrag = { fromIndex: index, insertIndex: index, itemEl, ghost };
  document.addEventListener('pointermove', onPhotoDragMove);
  document.addEventListener('pointerup', onPhotoDragEnd);
}

function updatePhotoInsertionLine(clientX) {
  const line = editPhotoStripEl.querySelector('.photo-strip-insertion-line');
  if (!line) return;
  const items = [...editPhotoStripEl.querySelectorAll('.photo-strip-item')]
    .filter((el) => Number(el.dataset.index) !== editPhotoDrag.fromIndex);

  if (!items.length) {
    line.classList.add('hidden');
    editPhotoDrag.insertIndex = 0;
    return;
  }

  let best = null;
  items.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dist = Math.abs(clientX - center);
    if (!best || dist < best.dist) best = { el, dist, rect, center };
  });

  const idx = Number(best.el.dataset.index);
  const before = clientX < best.center;
  editPhotoDrag.insertIndex = before ? idx : idx + 1;

  const stripRect = editPhotoStripEl.getBoundingClientRect();
  const edgeX = before ? best.rect.left : best.rect.right;
  line.style.left = `${edgeX - stripRect.left + editPhotoStripEl.scrollLeft}px`;
  line.classList.remove('hidden');
}

function onPhotoDragMove(event) {
  if (!editPhotoDrag) return;
  positionPhotoGhost(editPhotoDrag.ghost, event.clientX, event.clientY);
  updatePhotoInsertionLine(event.clientX);
}

function onPhotoDragEnd() {
  if (!editPhotoDrag) return;
  const { fromIndex, insertIndex, itemEl, ghost } = editPhotoDrag;
  ghost.remove();
  itemEl?.classList.remove('dragging');
  document.removeEventListener('pointermove', onPhotoDragMove);
  document.removeEventListener('pointerup', onPhotoDragEnd);

  const adjusted = insertIndex > fromIndex ? insertIndex - 1 : insertIndex;
  if (adjusted !== fromIndex) {
    const [moved] = editPhotoItems.splice(fromIndex, 1);
    editPhotoItems.splice(adjusted, 0, moved);
  }

  editPhotoDrag = null;
  renderEditPhotoStrip();
}

function enterEditMode() {
  const memory = appState.memories.find((m) => m.createdAt === appState.selectedMemory);
  if (!memory) return;

  if (editTitleInput) editTitleInput.value = memory.title || '';
  editTextArea.value = memory.text;
  editEventDate.value = memory.eventDate ? memory.eventDate.slice(0, 10) : '';
  editPerson.value = memory.persons.join(', ');
  editItem.value = memory.items.join(', ');
  editTags.value = (memory.tags?.general || []).join(', ');
  editActivityTags.value = (memory.tags?.activity || []).join(', ');
  editEmotionTags.value = (memory.tags?.emotion || []).join(', ');
  editNotesArea.value = memory.notes || '';

  // Restore location fields from memory.pins
  editLocationFields = (memory.pins && memory.pins.length)
    ? memory.pins.map((p) => ({
        name: p.name || '',
        lat: Number.isFinite(p.lat) ? p.lat : null,
        lng: Number.isFinite(p.lng) ? p.lng : null,
        x: Number.isFinite(p.x) ? p.x : null,
        y: Number.isFinite(p.y) ? p.y : null,
      }))
    : [emptyLocationField()];
  editActiveLocationIndex = 0;
  renderEditLocationFields();

  // Build the photo strip from existing photos, in their saved order.
  // New files added via the file input get appended and can be dragged
  // to any position (handled by renderEditPhotoStrip/startPhotoDrag).
  revokeEditPhotoBlobUrls();
  editPhotoItems = (memory.mediaPaths || []).map((path, i) => ({
    type: 'existing',
    path,
    url: memory.mediaDataUrls[i],
  }));
  editPhotoDrag = null;
  renderEditPhotoStrip();
  editMediaInput.value = '';

  detailView.classList.add('hidden');
  detailEdit.classList.remove('hidden');
  memoryDetailEl.scrollTop = 0;

  // Init map after becoming visible
  initEditMap(editLocationFields);
  renderEditLocationPins();
}

detailBackBtn.addEventListener('click', closeMemoryDetail);

detailEditBtn.addEventListener('click', enterEditMode);

editClearPinBtn.addEventListener('click', () => {
  editLocationFields = [emptyLocationField()];
  editActiveLocationIndex = 0;
  renderEditLocationFields();
  renderEditLocationPins();
});

if (editAddLocationBtn) {
  editAddLocationBtn.addEventListener('click', () => {
    if (editLocationFields.length >= MAX_PINS) { showToast(`Максимум ${MAX_PINS} места на спомен.`); return; }
    editLocationFields.push(emptyLocationField());
    editActiveLocationIndex = editLocationFields.length - 1;
    renderEditLocationFields();
  });
}

detailEditCancel.addEventListener('click', () => {
  detailView.classList.remove('hidden');
  detailEdit.classList.add('hidden');
});

editMediaInput.addEventListener('change', () => {
  [...editMediaInput.files].filter((f) => f.type.startsWith('image/')).forEach((file) => {
    editPhotoItems.push({ type: 'new', file, url: URL.createObjectURL(file) });
  });
  editMediaInput.value = '';
  renderEditPhotoStrip();
});

detailEditForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const memoryId = appState.selectedMemory;
  const memory = appState.memories.find((m) => m.createdAt === memoryId);
  if (!memory) return;

  const newTitle = (editTitleInput ? editTitleInput.value.trim() : '') || memory.title || memory.text;
  const newText = editTextArea.value.trim();
  const newEventDate = editEventDate.value || memory.eventDate;
  const editPinsForSave = editLocationFields.map(pinFromField).filter(Boolean);
  const newLocation = editLocationFields.map((f) => (f.name || '').trim()).filter(Boolean).join(', ');
  const newPerson = editPerson.value.trim();
  const newItem = editItem.value.trim();
  const newNotes = editNotesArea.value.trim();
  const newTags = {
    general: parseTagInput(editTags.value),
    activity: parseTagInput(editActivityTags.value),
    emotion: parseTagInput(editEmotionTags.value),
  };

  // Update memory row in Supabase
  const { error: updateError } = await sb.from('memories').update({
    title: newTitle,
    text: newText,
    event_date: newEventDate,
    location: newLocation,
    person: newPerson,
    item: newItem,
    notes: newNotes,
    pin: editPinsForSave.length ? editPinsForSave : null,
    tags: newTags,
  }).eq('id', memoryId).eq('user_id', appState.userId);

  if (updateError) {
    console.error('Memory update error:', updateError);
    alert(`Грешка при запазване: ${updateError.message}`);
    return;
  }

  // Remove photos that were dropped from the strip
  const keptExistingPaths = editPhotoItems.filter((it) => it.type === 'existing').map((it) => it.path);
  const removedPaths = (memory.mediaPaths || []).filter((p) => !keptExistingPaths.includes(p));
  if (removedPaths.length) {
    for (const path of removedPaths) {
      const { error: delRowErr } = await sb.from('memory_media').delete().eq('storage_path', path).eq('memory_id', memoryId);
      if (delRowErr) console.error('memory_media delete error:', delRowErr);
    }
    const { error: delStorageErr } = await sb.storage.from('memory-photos').remove(removedPaths);
    if (delStorageErr) console.error('Storage remove error:', delStorageErr);
  }

  // Persist the strip's current order: update position for kept existing
  // photos, then upload new photos using their position in that same order.
  for (let i = 0; i < editPhotoItems.length; i++) {
    const item = editPhotoItems[i];
    if (item.type === 'existing') {
      const { error: posErr } = await sb.from('memory_media').update({ position: i }).eq('storage_path', item.path).eq('memory_id', memoryId);
      if (posErr) console.error('memory_media position update error:', posErr);
    } else {
      try {
        item.uploadedPath = await uploadMemPhotoFile(item.file, appState.userId, memoryId, i);
      } catch (uploadErr) {
        console.error('Photo upload error:', uploadErr);
      }
    }
  }

  // Re-fetch only the edited memory so the rest of appState.memories is untouched
  const { data: updatedRow, error: refetchErr } = await sb.from('memories').select('*, memory_media(*)').eq('id', memoryId).single();
  if (refetchErr) console.error('Memory re-fetch error:', refetchErr);
  const idx = appState.memories.findIndex((m) => m.createdAt === memoryId);
  if (idx !== -1) {
    const finalMedia = editPhotoItems
      .map((item, i) => ({
        storage_path: item.type === 'existing' ? item.path : item.uploadedPath,
        position: i,
      }))
      .filter((m) => m.storage_path);
    appState.memories[idx] = mapMemory(updatedRow ?? {
      id: memoryId,
      title: newTitle,
      text: newText,
      event_date: newEventDate,
      location: newLocation,
      person: newPerson,
      item: newItem,
      notes: newNotes,
      pin: editPinsForSave.length ? editPinsForSave : null,
      tags: newTags,
      memory_media: finalMedia,
    });
  }

  render();
  renderMemoryDetail();
  requestAnimationFrame(() => initDetailStaticMap());
  detailView.classList.remove('hidden');
  detailEdit.classList.add('hidden');
});

function exportData() {
  const payload = JSON.stringify({ memories: appState.memories, people: appState.people }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pamet-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importData(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const incomingMemories = Array.isArray(parsed.memories) ? parsed.memories : [];
      const incomingPeople = Array.isArray(parsed.people) ? parsed.people : [];
      if (!incomingMemories.length && !incomingPeople.length) {
        alert('Файлът не съдържа валидни данни.');
        return;
      }

      // Deduplicate by text+eventDate (never fall back to UUID/createdAt)
      const existingKeys = new Set(appState.memories.map((m) => `${m.text}|${m.eventDate}`));
      let importedMemories = 0;

      for (const m of incomingMemories) {
        const key = `${m.text}|${m.eventDate || m.event_date || ''}`;
        if (existingKeys.has(key)) continue;

        const { data: inserted, error } = await sb.from('memories').insert({
          user_id: appState.userId,
          text: m.text || '',
          event_date: m.eventDate || m.event_date || new Date().toISOString().slice(0, 10),
          location: m.location || '',
          person: m.persons ? m.persons.join(', ') : (m.person || ''),
          item: m.items ? m.items.join(', ') : (m.item || ''),
          notes: m.notes || '',
          pin: m.pins || m.pin || null,
          tags: m.tags || null,
        }).select().single();

        if (error || !inserted) continue;

        const newMemId = inserted.id;
        const mediaUrls = Array.isArray(m.mediaDataUrls) ? m.mediaDataUrls : [];
        for (let i = 0; i < mediaUrls.length; i++) {
          const url = mediaUrls[i];
          try {
            let blob;
            if (url.startsWith('data:')) {
              blob = dataUrlToBlob(url);
            } else {
              const resp = await fetch(url);
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
              blob = await resp.blob();
            }
            await uploadMemPhotoBlob(blob, appState.userId, newMemId, i);
          } catch {
            // skip failed media
          }
        }

        importedMemories++;
        existingKeys.add(key);
      }

      // Import people
      const existingPeopleNames = new Set(appState.people.map((p) => p.name.toLowerCase()));
      let importedPeople = 0;

      for (const p of incomingPeople) {
        if (!p.name || existingPeopleNames.has(p.name.toLowerCase())) continue;

        let photoPath = '';
        if (p.photoDataUrl) {
          try {
            let blob;
            if (p.photoDataUrl.startsWith('data:')) {
              blob = dataUrlToBlob(p.photoDataUrl);
            } else {
              const resp = await fetch(p.photoDataUrl);
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
              blob = await resp.blob();
            }
            photoPath = await uploadPeoplePhotoBlob(blob, appState.userId);
          } catch {
            // skip failed photo
          }
        }

        const { error: peopleInsertErr } = await sb.from('people').insert({
          user_id: appState.userId,
          name: p.name,
          photo_url: photoPath || null,
        });

        if (!peopleInsertErr) {
          importedPeople++;
          existingPeopleNames.add(p.name.toLowerCase());
        } else {
          console.error('People import insert error:', peopleInsertErr);
        }
      }

      await tryLoadData();
      alert(`Импортирани: ${importedMemories} спомена, ${importedPeople} хора.`);
    } catch (err) {
      console.error('Import error:', err);
      alert(`Грешка при импорт: ${err?.message || 'Уверете се, че файлът е валиден JSON.'}`);
    }
  };
  reader.readAsText(file);
}

exportBtn.addEventListener('click', exportData);

importBtn.addEventListener('click', () => importFileInput.click());

importFileInput.addEventListener('change', () => {
  if (importFileInput.files[0]) {
    importData(importFileInput.files[0]);
    importFileInput.value = '';
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.querySelector('#username').value.trim();
  const password = document.querySelector('#password').value;
  if (!email || !password) return;

  // Clear any previous error
  const prev = loginForm.querySelector('.login-error');
  if (prev) prev.remove();

  const submitBtn = loginForm.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Влизане…';

  const { error } = await sb.auth.signInWithPassword({ email, password });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Влез';

  if (error) {
    const errEl = document.createElement('p');
    errEl.className = 'login-error hint';
    errEl.style.color = 'var(--danger, #dc2626)';
    errEl.textContent = error.message;
    loginForm.appendChild(errEl);
  }
});

logoutBtn.addEventListener('click', async () => {
  logoutBtn.disabled = true;
  logoutBtn.textContent = '…';
  try {
    await sb.auth.signOut();
  } catch (e) {
    console.error('signOut error:', e);
  }
  // Force clean state regardless of whether the event fires
  appState.user = null;
  appState.userId = null;
  appState.memories = [];
  appState.people = [];
  appState.activeTag = null;
  appState.locationFields = [emptyLocationField()];
  appState.activeLocationIndex = 0;
  renderLocationFields();
  appState.selectedPerson = null;
  appState.selectedMemory = null;
  appState.loading = false;
  searchQuery = '';
  detailReturnTab = 'timeline';
  if (timelineSearchInput) timelineSearchInput.value = '';
  if (timelineSearchClear) timelineSearchClear.classList.add('hidden');
  setScreen();
  render();
  logoutBtn.disabled = false;
  logoutBtn.textContent = 'Изход';
});

clearTagFilterBtn.addEventListener('click', () => {
  appState.activeTag = null;
  render();
});

timelineSearchInput.addEventListener('input', () => {
  searchQuery = timelineSearchInput.value.trim();
  timelineSearchClear.classList.toggle('hidden', !searchQuery);
  renderTimeline();
});

timelineSearchClear.addEventListener('click', () => {
  searchQuery = '';
  timelineSearchInput.value = '';
  timelineSearchClear.classList.add('hidden');
  renderTimeline();
  timelineSearchInput.focus();
});

clearPinBtn.addEventListener('click', () => {
  appState.locationFields = [emptyLocationField()];
  appState.activeLocationIndex = 0;
  renderLocationFields();
  renderLocationPins();
});

if (memoryAddLocationBtn) {
  memoryAddLocationBtn.addEventListener('click', () => {
    if (appState.locationFields.length >= MAX_PINS) { showToast(`Максимум ${MAX_PINS} места на спомен.`); return; }
    appState.locationFields.push(emptyLocationField());
    appState.activeLocationIndex = appState.locationFields.length - 1;
    renderLocationFields();
  });
}

memoryMediaInput.addEventListener('change', () => {
  renderMediaPreview();
});

fabAddMemoryBtn.addEventListener('click', () => {
  switchTab('create-memory');
  showHomeAddForm();
});

homeFormBack.addEventListener('click', () => {
  showHomeDashboard();
});

showAllTimelineBtn.addEventListener('click', () => {
  switchTab('timeline');
});

document.querySelectorAll('.quick-nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.nav);
  });
});

personDetailBackBtn.addEventListener('click', () => {
  appState.selectedPerson = null;
  renderPersonDetail();
});

tabButtons.forEach((btn) =>
  btn.addEventListener('click', () => {
    if (btn.dataset.tab !== 'people') {
      appState.selectedPerson = null;
    }
    switchTab(btn.dataset.tab);
  }),
);

peopleForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!appState.userId) { alert('Не сте влезли в профила си.'); return; }

  const nameInput = document.querySelector('#people-name');
  const fileInput = document.querySelector('#people-photo');
  const name = nameInput.value.trim();
  if (!name) return;

  const existingPerson = appState.people.find((p) => p.name.trim().toLowerCase() === name.toLowerCase());

  let photoPath = existingPerson ? existingPerson.photoPath : '';

  if (fileInput.files[0]) {
    try {
      const file = fileInput.files[0];
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const newPath = await uploadPeoplePhotoBlob(blob, appState.userId);
      // Delete old photo only after new upload succeeds
      if (existingPerson && existingPerson.photoPath) {
        await sb.storage.from('people-photos').remove([existingPerson.photoPath]);
      }
      photoPath = newPath;
    } catch (uploadErr) {
      console.error('People photo upload error:', uploadErr);
      alert(`Грешка при качване на снимка: ${uploadErr.message}`);
      return;
    }
  }

  if (existingPerson) {
    const { error } = await sb.from('people').update({
      photo_url: photoPath || null,
    }).eq('id', existingPerson.id).eq('user_id', appState.userId);
    if (error) { alert(`Грешка при запазване: ${error.message}`); return; }
  } else {
    const { error } = await sb.from('people').insert({
      user_id: appState.userId,
      name,
      photo_url: photoPath || null,
    });
    if (error) { alert(`Грешка при запазване: ${error.message}`); return; }
  }

  await tryLoadData();
  peopleForm.reset();
});

memoryForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!appState.userId) {
    alert('Не сте влезли в профила си.');
    return;
  }

  const title = document.querySelector('#memory-title').value.trim();
  const text = document.querySelector('#memory-text').value.trim();
  if (!title) return;

  const eventDateInput = document.querySelector('#memory-event-date').value;
  const item = document.querySelector('#memory-item').value.trim();
  const person = document.querySelector('#memory-person').value.trim();
  const locationPinsForSave = appState.locationFields.map(pinFromField).filter(Boolean);
  const location = appState.locationFields.map((f) => (f.name || '').trim()).filter(Boolean).join(', ');
  const generalTags = parseTagInput(document.querySelector('#memory-tags').value);
  const activityTags = parseTagInput(document.querySelector('#memory-activity-tags').value);
  const emotionTags = parseTagInput(document.querySelector('#memory-emotion-tags').value);
  const files = [...document.querySelector('#memory-media').files].filter((f) => f.type.startsWith('image/'));

  const submitBtn = memoryForm.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Запазване…';

  const { data: inserted, error } = await sb.from('memories').insert({
    user_id: appState.userId,
    title,
    text,
    event_date: eventDateInput || new Date().toISOString().slice(0, 10),
    person,
    item,
    location,
    notes: '',
    tags: { general: generalTags, activity: activityTags, emotion: emotionTags },
    pin: locationPinsForSave.length ? locationPinsForSave : null,
  }).select().single();

  if (error) {
    console.error('Memory insert error:', error);
    alert(`Грешка при запазване: ${error.message}`);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Запази спомен';
    return;
  }

  const memoryId = inserted.id;

  for (let i = 0; i < files.length; i++) {
    try {
      await uploadMemPhotoFile(files[i], appState.userId, memoryId, i);
    } catch (uploadErr) {
      console.error('Photo upload error:', uploadErr);
    }
  }

  // Fetch the saved record with its media; fall back to the inserted row so
  // the memory always appears immediately even if the re-fetch fails
  const { data: fullRow } = await sb.from('memories').select('*, memory_media(*)').eq('id', memoryId).single();
  appState.memories.unshift(mapMemory(fullRow ?? { ...inserted, memory_media: [] }));

  appState.activeTag = null;
  appState.locationFields = [emptyLocationField()];
  appState.activeLocationIndex = 0;
  renderLocationFields();
  renderLocationPins();
  render();
  switchTab('create-memory');
  showHomeDashboard();
  memoryForm.reset();
  if (document.querySelector('#memory-title')) document.querySelector('#memory-title').value = '';
  renderMediaPreview();
  document.querySelector('#memory-event-date').value = new Date().toISOString().slice(0, 10);
  submitBtn.disabled = false;
  submitBtn.textContent = 'Запази спомен';
});

// ── Lightbox ────────────────────────────────────────────────────────
const lightboxEl = document.querySelector('#lightbox');
const lightboxGallery = document.querySelector('#lightbox-gallery');
const lightboxCount = document.querySelector('#lightbox-count');

function openLightbox(urls, startIndex = 0) {
  lightboxGallery.innerHTML = '';
  urls.forEach((url) => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    lightboxGallery.appendChild(img);
  });

  lightboxEl.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    lightboxGallery.scrollLeft = startIndex * lightboxGallery.clientWidth;
    updateLightboxCount();
  });

  lightboxGallery.onscroll = updateLightboxCount;

  function updateLightboxCount() {
    if (urls.length < 2) { lightboxCount.textContent = ''; return; }
    const idx = Math.round(lightboxGallery.scrollLeft / lightboxGallery.clientWidth) + 1;
    lightboxCount.textContent = `${idx} / ${urls.length}`;
  }
}

function closeLightbox() {
  lightboxEl.classList.add('hidden');
  document.body.style.overflow = '';
  lightboxGallery.innerHTML = '';
}

document.querySelector('#lightbox-close').addEventListener('click', closeLightbox);
lightboxEl.addEventListener('click', (e) => { if (e.target === lightboxEl) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

// ── Location geocoding ───────────────────────────────────────────────

async function geocodeLocation(query) {
  try {
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&language=bg&limit=5`;
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.features || []).map((f) => ({
      name: f.place_name || f.text || '',
      lat: f.center[1],
      lng: f.center[0],
    }));
  } catch {
    return [];
  }
}

function getSavedLocations(query) {
  const lower = query.trim().toLowerCase();
  if (!lower) return [];
  const seen = new Set();
  const results = [];
  for (const m of appState.memories) {
    for (const p of m.pins) {
      if (!p.name || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
      const loc = p.name.trim();
      if (!loc || seen.has(loc.toLowerCase())) continue;
      if (loc.toLowerCase().includes(lower)) {
        seen.add(loc.toLowerCase());
        results.push({ name: loc, lat: p.lat, lng: p.lng, saved: true });
      }
    }
  }
  return results;
}

function attachLocationAutocomplete(inputEl, onSelect, onClear) {
  if (!inputEl) return;
  let debounceTimer;
  let dropdown = null;

  function closeDropdown() {
    if (dropdown) { dropdown.remove(); dropdown = null; }
  }

  function openDropdown(items) {
    closeDropdown();
    if (!items.length) return;

    dropdown = document.createElement('ul');
    dropdown.className = 'location-suggestions';

    items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'location-suggestion-item' + (item.saved ? ' saved' : '');

      const iconSpan = document.createElement('span');
      iconSpan.className = 'suggestion-icon';
      if (item.saved) {
        iconSpan.textContent = '★';
      } else {
        iconSpan.innerHTML = ICON.pin;
      }

      const nameSpan = document.createElement('span');
      nameSpan.className = 'suggestion-name';
      nameSpan.textContent = item.name;

      li.append(iconSpan, nameSpan);

      if (item.saved) {
        const hintSpan = document.createElement('small');
        hintSpan.className = 'suggestion-hint';
        hintSpan.textContent = 'Използвано преди';
        li.appendChild(hintSpan);
      }

      li.addEventListener('mousedown', (e) => {
        e.preventDefault(); // keep focus so blur doesn't close before click
        inputEl.value = item.name;
        closeDropdown();
        onSelect(item);
      });

      dropdown.appendChild(li);
    });

    // Anchor below the input inside the label wrapper
    const parent = inputEl.parentElement;
    parent.style.position = 'relative';
    parent.appendChild(dropdown);
  }

  inputEl.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = inputEl.value.trim();
    if (!query) {
      closeDropdown();
      onClear?.();
      return;
    }
    debounceTimer = setTimeout(async () => {
      const saved = getSavedLocations(query);
      const remote = await geocodeLocation(query);
      const savedNames = new Set(saved.map((s) => s.name.toLowerCase()));
      const unique = remote.filter((r) => !savedNames.has(r.name.toLowerCase()));
      openDropdown([...saved, ...unique]);
    }, 600);
  });

  // Delay close to let mousedown fire first
  inputEl.addEventListener('blur', () => { setTimeout(closeDropdown, 150); });
  inputEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDropdown(); });
}

async function deletePersonByName(name) {
  const person = appState.people.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (!person) return;
  const { error } = await sb.from('people').delete().eq('id', person.id).eq('user_id', appState.userId);
  if (error) {
    alert(`Грешка при изтриване: ${error.message}`);
    return;
  }
  if (person.photoPath) {
    await sb.storage.from('people-photos').remove([person.photoPath]);
  }
  appState.people = appState.people.filter((p) => p.id !== person.id);
}

function renderPickerSavedPins() {
  if (!pickerMap || mapMode !== 'maplibre') return;
  pickerSavedMarkers.forEach((m) => m.remove());
  pickerSavedMarkers = [];
  appState.memories.forEach((memory) => {
    memory.pins.forEach((pin) => {
      if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) return;
      const marker = new maplibregl.Marker({ color: '#888888', scale: 0.55 })
        .setLngLat([pin.lng, pin.lat])
        .addTo(pickerMap);
      const el = marker.getElement();
      el.style.opacity = '0.4';
      el.style.cursor = 'pointer';
      el.title = pin.name || memory.location || (memory.title || memory.text).slice(0, 40);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!appState.locationFields.length) { showToast('Добавете място, преди да изберете локация.'); return; }
        const idx = clampIndex(appState.locationFields, appState.activeLocationIndex);
        const field = appState.locationFields[idx];
        field.lat = pin.lat;
        field.lng = pin.lng;
        field.x = null;
        field.y = null;
        field.name = pin.name || memory.location || field.name;
        renderLocationPins();
        syncLocationFieldInput(idx);
      });
      pickerSavedMarkers.push(marker);
    });
  });
}

function openPhotosOverlay() {
  document.querySelector('#photos-overlay')?.remove();
  const allPhotos = appState.memories.flatMap((m) => m.mediaDataUrls);

  const overlay = document.createElement('div');
  overlay.id = 'photos-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200;background:var(--background,#FBF8F3);overflow-y:auto;padding:16px;padding-bottom:80px';

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px';
  const titleEl = document.createElement('h3');
  titleEl.style.cssText = 'margin:0;font-size:1rem;font-weight:600';
  titleEl.textContent = `Всички снимки (${allPhotos.length})`;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'ghost tiny';
  closeBtn.textContent = '← Назад';
  closeBtn.addEventListener('click', () => overlay.remove());
  header.append(titleEl, closeBtn);
  overlay.appendChild(header);

  if (!allPhotos.length) {
    const empty = document.createElement('p');
    empty.className = 'hint';
    empty.textContent = 'Няма добавени снимки.';
    overlay.appendChild(empty);
  } else {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:4px';
    allPhotos.forEach((url, idx) => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.style.cssText = 'width:100%;aspect-ratio:1/1;object-fit:cover;cursor:zoom-in;border-radius:4px';
      img.addEventListener('click', () => openLightbox(allPhotos, idx));
      grid.appendChild(img);
    });
    overlay.appendChild(grid);
  }

  document.querySelector('#app-screen').appendChild(overlay);
}

// Each location field gets its own geocoding autocomplete, attached when its
// row is created in renderLocationFields()/renderEditLocationFields().

renderLocationFields();
initMaps();
switchTab('create-memory');
document.querySelector('#memory-event-date').value = new Date().toISOString().slice(0, 10);
console.log('App version: 2026-06-25-fix');

// Auth state is handled entirely by onAuthStateChange below.
// INITIAL_SESSION fires on every page load (including PWA cold start)
// with the current session — no need to call getSession() separately.
// This avoids the race condition where both run concurrently.

async function tryLoadData() {
  console.log('tryLoadData called');
  if (dataLoadInProgress) return;
  if (!appState.userId) return;
  dataLoadInProgress = true;
  appState.loading = true;
  render();
  try {
    await loadData();
  } catch (e) {
    console.error('loadData error:', e);
    showDataError(e.message);
  } finally {
    dataLoadInProgress = false;
    appState.loading = false;
    if (pendingTokenRefresh) {
      pendingTokenRefresh = false;
      await tryLoadData();
      return;
    }
  }
  render();
}

function showDataError(msg) {
  const existing = document.querySelector('#data-load-error');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'data-load-error';
  el.style.cssText = 'margin:12px 16px;padding:12px 14px;background:#fff0f0;border:1px solid #fca5a5;border-radius:14px;font-size:.85rem;color:#b91c1c;display:flex;align-items:center;justify-content:space-between;gap:10px';
  const span = document.createElement('span');
  span.textContent = `Грешка при зареждане: ${msg}`;
  const retryBtn = document.createElement('button');
  retryBtn.textContent = 'Retry';
  retryBtn.style.cssText = 'background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:99px;font-size:.8rem;font-weight:600;cursor:pointer;flex-shrink:0';
  retryBtn.addEventListener('click', () => {
    tryLoadData().then(() => document.querySelector('#data-load-error')?.remove());
  });
  el.append(span, retryBtn);
  const panel = document.querySelector('#create-memory');
  if (panel) panel.prepend(el);
}

// Re-fetch data when the app comes back to the foreground after an extended
// absence (token may have expired while the app was in the background).
let lastHiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    lastHiddenAt = Date.now();
    return;
  }
  if (appState.userId && !dataLoadInProgress && Date.now() - lastHiddenAt > 60_000) {
    tryLoadData();
  }
});

sb.auth.onAuthStateChange((event, session) => {
  // CRITICAL: Never await Supabase queries inside this callback. The auth
  // library holds an internal lock during the callback; awaiting a query
  // here deadlocks it (query stays pending forever). We defer all data
  // loading with setTimeout(0) so the callback returns and releases the lock.
  if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
    if (!session) {
      setScreen();
      return;
    }
    appState.user = session.user.email;
    appState.userId = session.user.id;
    setScreen();
    if (event === 'SIGNED_IN') switchTab('create-memory');
    setTimeout(() => { tryLoadData(); }, 0);
  } else if (event === 'TOKEN_REFRESHED') {
    // Deferred out of the callback (setTimeout) to avoid the auth-lock deadlock.
    if (session && appState.userId) {
      if (dataLoadInProgress) {
        pendingTokenRefresh = true;
      } else {
        appState.userId = session.user.id;
        setTimeout(() => { tryLoadData(); }, 0);
      }
    }
  } else if (event === 'SIGNED_OUT') {
    appState.user = null;
    appState.userId = null;
    appState.memories = [];
    appState.people = [];
    appState.activeTag = null;
    appState.locationFields = [emptyLocationField()];
    appState.activeLocationIndex = 0;
    renderLocationFields();
    appState.selectedPerson = null;
    appState.selectedMemory = null;
    appState.loading = false;
    searchQuery = '';
    detailReturnTab = 'timeline';
    if (timelineSearchInput) timelineSearchInput.value = '';
    if (timelineSearchClear) timelineSearchClear.classList.add('hidden');
    setScreen();
    render();
  }
});

// ── Toast + offline detection ─────────────────────────────────────────

function showToast(msg) {
  document.querySelector('#app-toast')?.remove();
  const el = document.createElement('div');
  el.id = 'app-toast';
  el.className = 'app-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

window.addEventListener('offline', () => showToast('Няма интернет връзка'));
window.addEventListener('online', () => {
  showToast('Връзката е възстановена');
  tryLoadData();
});
