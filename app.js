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
const statsGrid = document.querySelector('#stats-grid');
const homeRecentList = document.querySelector('#home-recent-list');
const memoryMediaInput = document.querySelector('#memory-media');
const memoryMediaPreview = document.querySelector('#memory-media-preview');
const fabAddMemoryBtn = document.querySelector('#fab-add-memory');

const memoryPinPickerEl = document.querySelector('#memory-pin-picker');
const mapBoardEl = document.querySelector('#map-board');
const memoryPinCoords = document.querySelector('#memory-pin-coords');
const clearPinBtn = document.querySelector('#clear-pin');

const STORAGE_KEY = 'memories-mobile-app';

const DEFAULT_MAP_CONFIG = {
  center: [42.6977, 23.3219],
  zoom: 6,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution: '&copy; OpenStreetMap contributors',
};

const MAP_CONFIG = {
  ...DEFAULT_MAP_CONFIG,
  ...(window.APP_MAP_CONFIG || {}),
};

let appState = {
  user: null,
  memories: [],
  people: [],
  activeTag: null,
  draftPin: null,
  selectedPerson: null,
};

let mapMode = 'fallback';
let pickerMap;
let pickerMarker;
let overviewMap;
let overviewMarkersLayer;

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    appState = {
      user: parsed.user || null,
      activeTag: null,
      draftPin: null,
      selectedPerson: null,
      people: Array.isArray(parsed.people)
        ? parsed.people.map((person) => ({
            name: person?.name || '',
            photoDataUrl: person?.photoDataUrl || '',
          }))
        : [],
      memories: Array.isArray(parsed.memories)
        ? parsed.memories.map((memory) => ({
            ...memory,
            person: memory.person || '',
            item: memory.item || '',
            location: memory.location || '',
            tags: normalizeTagGroups(memory.tags),
            eventDate: memory.eventDate || memory.createdAt || new Date().toISOString(),
            pin: normalizePin(memory.pin),
            mediaDataUrls: Array.isArray(memory.mediaDataUrls) ? memory.mediaDataUrls : [],
          }))
        : [],
    };
  } catch {
    appState = { user: null, memories: [], people: [], activeTag: null, draftPin: null, selectedPerson: null };
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      user: appState.user,
      memories: appState.memories,
      people: appState.people,
    }),
  );
}

function normalizePin(pin) {
  if (!pin) return null;
  if (Number.isFinite(pin.lat) && Number.isFinite(pin.lng)) return { lat: Number(pin.lat), lng: Number(pin.lng) };
  if (Number.isFinite(pin.x) && Number.isFinite(pin.y)) return { x: Number(pin.x), y: Number(pin.y) };
  return null;
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
  const loggedIn = Boolean(appState.user);
  loginScreen.classList.toggle('active', !loggedIn);
  appScreen.classList.toggle('active', loggedIn);
  if (loggedIn) welcomeText.textContent = `Здравей, ${appState.user}!`;
  if (loggedIn) {
    refreshLeafletMapSizes();
  }
}

function refreshLeafletMapSizes(targetTab) {
  if (mapMode !== 'leaflet') return;

  if ((!targetTab || targetTab === 'create-memory') && pickerMap) {
    setTimeout(() => pickerMap.invalidateSize(), 0);
  }

  if ((!targetTab || targetTab === 'map') && overviewMap) {
    setTimeout(() => overviewMap.invalidateSize(), 0);
  }
}

function switchTab(targetTab) {
  tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === targetTab));
  panels.forEach((panel) => panel.classList.toggle('active', panel.id === targetTab));
  if (targetTab === 'create-memory') {
    showHomeDashboard();
  }
  refreshLeafletMapSizes(targetTab);
}

function toSetList(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseTagInput(raw) {
  return [...new Set(raw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))];
}

function buildTagEntries(memory) {
  return [
    ...memory.tags.general.map((value) => ({ type: 'general', value, label: `#${value}` })),
    ...memory.tags.activity.map((value) => ({ type: 'activity', value, label: `🎯 ${value}` })),
    ...memory.tags.emotion.map((value) => ({ type: 'emotion', value, label: `💛 ${value}` })),
  ];
}

function buildTagButton(entry) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tag-chip';
  button.textContent = entry.label;
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
  const personPhoto = memory.person ? getPersonPhoto(memory.person) : '';
  if (personPhoto) return personPhoto;
  return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="460"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%236366f1"/><stop offset="1" stop-color="%2322c55e"/></linearGradient></defs><rect width="100%25" height="100%25" fill="url(%23g)"/><text x="50%25" y="52%25" font-size="42" text-anchor="middle" fill="white" font-family="Inter,Arial,sans-serif">Memory</text></svg>';
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
  if (mapMode === 'leaflet' && pickerMap) {
    setTimeout(() => pickerMap.invalidateSize(), 50);
  }
}

function renderHomeSummary() {
  if (!statsGrid || !homeRecentList) return;

  const uniquePlaces = new Set(appState.memories.map((memory) => memory.location.trim()).filter(Boolean));
  const photosCount = appState.memories.reduce((sum, memory) => sum + (memory.mediaCount || 0), 0);
  const uniquePeople = new Set(appState.people.map((person) => person.name.trim().toLowerCase()).filter(Boolean));
  appState.memories.forEach((memory) => {
    const normalized = memory.person.trim().toLowerCase();
    if (normalized) uniquePeople.add(normalized);
  });

  const stats = [
    { label: 'Спомени', value: appState.memories.length, icon: '📸' },
    { label: 'Хора', value: uniquePeople.size, icon: '👥' },
    { label: 'Места', value: uniquePlaces.size, icon: '📍' },
    { label: 'Снимки', value: photosCount, icon: '🖼️' },
  ];

  statsGrid.innerHTML = '';
  stats.forEach((stat) => {
    const card = document.createElement('article');
    card.className = 'stat-card';
    card.innerHTML = `<span class="stat-icon">${stat.icon}</span><strong>${stat.value}</strong><small>${stat.label}</small>`;
    statsGrid.appendChild(card);
  });

  homeRecentList.innerHTML = '';
  sortByEventDateDesc(appState.memories)
    .slice(0, 3)
    .forEach((memory) => {
      const li = document.createElement('li');
      li.className = 'memory-item memory-card';
      li.innerHTML = `<img class="memory-photo" src="${getMemoryCover(memory)}" alt="Снимка на спомен" /><div class="memory-card-body"><strong>${memory.text.slice(0, 48)}</strong><small>${memory.location ? `📍 ${memory.location}` : '📍 Без локация'}</small><small>🗓️ ${formatEventDate(memory.eventDate)}</small></div>`;
      homeRecentList.appendChild(li);
    });

  if (!homeRecentList.children.length) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'Все още няма добавени спомени.';
    homeRecentList.appendChild(li);
  }
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
}

function toFallbackPin(lat, lng) {
  return {
    x: ((lng + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100,
  };
}

function initMaps() {
  if (window.L) {
    mapMode = 'leaflet';
    pickerMap = L.map('memory-pin-picker').setView(MAP_CONFIG.center, MAP_CONFIG.zoom);
    overviewMap = L.map('map-board').setView(MAP_CONFIG.center, MAP_CONFIG.zoom);
    L.tileLayer(MAP_CONFIG.tileUrl, { attribution: MAP_CONFIG.tileAttribution, maxZoom: 19 }).addTo(pickerMap);
    L.tileLayer(MAP_CONFIG.tileUrl, { attribution: MAP_CONFIG.tileAttribution, maxZoom: 19 }).addTo(overviewMap);
    overviewMarkersLayer = L.layerGroup().addTo(overviewMap);

    pickerMap.on('click', (event) => {
      appState.draftPin = { lat: event.latlng.lat, lng: event.latlng.lng };
      renderDraftPin();
    });
    return;
  }

  memoryPinPickerEl.addEventListener('click', (event) => {
    const rect = memoryPinPickerEl.getBoundingClientRect();
    appState.draftPin = {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
    renderDraftPin();
  });
}

function renderDraftPin() {
  if (mapMode === 'leaflet') {
    if (pickerMarker) {
      pickerMap.removeLayer(pickerMarker);
      pickerMarker = null;
    }
    if (!appState.draftPin) {
      memoryPinCoords.textContent = 'Няма избран пин.';
      return;
    }
    pickerMarker = L.marker([appState.draftPin.lat, appState.draftPin.lng]).addTo(pickerMap);
    memoryPinCoords.textContent = `Избран пин: ${appState.draftPin.lat.toFixed(5)}, ${appState.draftPin.lng.toFixed(5)}`;
    return;
  }

  memoryPinPickerEl.querySelectorAll('.fallback-pin').forEach((pin) => pin.remove());
  if (!appState.draftPin) {
    memoryPinCoords.textContent = 'Няма избран пин.';
    return;
  }
  addFallbackPin(memoryPinPickerEl, appState.draftPin.x, appState.draftPin.y, 'Избран пин');
  memoryPinCoords.textContent = `Избран пин: x ${appState.draftPin.x.toFixed(1)}%, y ${appState.draftPin.y.toFixed(1)}%`;
}

function renderMapPins() {
  mapPinsList.innerHTML = '';
  const withPins = appState.memories.filter((memory) => memory.pin);

  if (mapMode === 'leaflet') {
    overviewMarkersLayer.clearLayers();
    withPins.forEach((memory) => {
      if (Number.isFinite(memory.pin.lat) && Number.isFinite(memory.pin.lng)) {
        const title = memory.location || memory.text.slice(0, 48);
        const marker = L.marker([memory.pin.lat, memory.pin.lng]);
        marker.bindPopup(`<strong>${title}</strong><br>${formatEventDate(memory.eventDate)}`);
        overviewMarkersLayer.addLayer(marker);
      }
    });
    const leafletPins = withPins.filter((m) => Number.isFinite(m.pin.lat) && Number.isFinite(m.pin.lng));
    if (leafletPins.length > 0) {
      const bounds = L.latLngBounds(leafletPins.map((m) => [m.pin.lat, m.pin.lng]));
      overviewMap.fitBounds(bounds.pad(0.2));
    }
  } else {
    mapBoardEl.querySelectorAll('.fallback-pin').forEach((pin) => pin.remove());
    withPins.forEach((memory) => {
      const title = memory.location || memory.text.slice(0, 48);
      if (Number.isFinite(memory.pin.x) && Number.isFinite(memory.pin.y)) {
        addFallbackPin(mapBoardEl, memory.pin.x, memory.pin.y, title);
      } else if (Number.isFinite(memory.pin.lat) && Number.isFinite(memory.pin.lng)) {
        const converted = toFallbackPin(memory.pin.lat, memory.pin.lng);
        addFallbackPin(mapBoardEl, converted.x, converted.y, title);
      }
    });
  }

  withPins.forEach((memory, index) => {
    const title = memory.location || memory.text.slice(0, 48);
    const li = document.createElement('li');
    li.className = 'memory-item';
    li.textContent = `📍 Пин #${index + 1} — ${title}`;
    mapPinsList.appendChild(li);
  });

  if (!withPins.length) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'Все още няма добавени пинове.';
    mapPinsList.appendChild(li);
  }
}

function passesTagFilter(memory) {
  if (!appState.activeTag) return true;
  return memory.tags[appState.activeTag.type].includes(appState.activeTag.value);
}

function getPersonPhoto(name) {
  const lower = name.trim().toLowerCase();
  const found = appState.people.find((person) => person.name.trim().toLowerCase() === lower);
  return found?.photoDataUrl || '';
}


function getMemoriesForPerson(name) {
  const lower = name.trim().toLowerCase();
  return sortByEventDateDesc(appState.memories).filter((memory) => memory.person.trim().toLowerCase() === lower);
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
    li.innerHTML = `<strong>🗓️ ${formatEventDate(memory.eventDate)}</strong><p>${memory.text}</p><small>${memory.location ? `📍 ${memory.location}` : '📍 Без локация'}</small>`;
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
    .filter(passesTagFilter);
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
    clone.querySelector('.location').textContent = memory.location ? `📍 ${memory.location}` : '📍 Без локация';
    clone.querySelector('.text').textContent = memory.text;
    clone.querySelector('.person').textContent = memory.person ? `👤 ${memory.person}` : '👤 Без човек';
    clone.querySelector('.item').textContent = memory.item ? `🎒 ${memory.item}` : '🎒 Без предмет';
    clone.querySelector('.media-count').textContent = memory.mediaCount ? `🎞️ ${memory.mediaCount} файла` : '🎞️ без медия';

    const tagsWrap = clone.querySelector('.memory-tags');
    const entries = buildTagEntries(memory);
    if (entries.length) {
      entries.forEach((entry) => tagsWrap.appendChild(buildTagButton(entry)));
    } else {
      tagsWrap.textContent = 'Без тагове';
      tagsWrap.classList.add('no-tags');
    }

    timelineList.appendChild(clone);
  });

  if (!sortedMemories.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = appState.activeTag ? 'Няма спомени за избрания филтър.' : 'Все още няма добавени спомени.';
    timelineList.appendChild(empty);
  }
}

function renderPeople() {
  peopleList.innerHTML = '';
  const namesFromMemories = toSetList(appState.memories.map((m) => m.person));
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
  appState.memories.flatMap(buildTagEntries).forEach((entry) => {
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
  renderTimeline();
  renderPeople();
  renderPersonDetail();
  renderTags();
  renderDraftPin();
  renderMapPins();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.querySelector('#username').value.trim();
  if (!username) return;
  appState.user = username;
  saveState();
  setScreen();
  switchTab('create-memory');
  render();
});

logoutBtn.addEventListener('click', () => {
  appState.user = null;
  appState.activeTag = null;
  appState.selectedPerson = null;
  saveState();
  setScreen();
  switchTab('create-memory');
});

clearTagFilterBtn.addEventListener('click', () => {
  appState.activeTag = null;
  render();
});

clearPinBtn.addEventListener('click', () => {
  appState.draftPin = null;
  renderDraftPin();
});

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

  const nameInput = document.querySelector('#people-name');
  const fileInput = document.querySelector('#people-photo');
  const name = nameInput.value.trim();
  if (!name) return;

  let photoDataUrl = '';
  if (fileInput.files[0]) {
    photoDataUrl = await fileToDataUrl(fileInput.files[0]);
  }

  const existingIndex = appState.people.findIndex((person) => person.name.trim().toLowerCase() === name.toLowerCase());
  if (existingIndex >= 0) {
    appState.people[existingIndex] = {
      name,
      photoDataUrl: photoDataUrl || appState.people[existingIndex].photoDataUrl,
    };
  } else {
    appState.people.push({ name, photoDataUrl });
  }

  saveState();
  renderPeople();
  renderPersonDetail();
  peopleForm.reset();
});

memoryForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const text = document.querySelector('#memory-text').value.trim();
  const eventDateInput = document.querySelector('#memory-event-date').value;
  const item = document.querySelector('#memory-item').value.trim();
  const person = document.querySelector('#memory-person').value.trim();
  const location = document.querySelector('#memory-location').value.trim();
  const generalTags = parseTagInput(document.querySelector('#memory-tags').value);
  const activityTags = parseTagInput(document.querySelector('#memory-activity-tags').value);
  const emotionTags = parseTagInput(document.querySelector('#memory-emotion-tags').value);
  const files = document.querySelector('#memory-media').files;

  if (!text) return;

  const mediaDataUrls = await Promise.all(
    [...files].filter((f) => f.type.startsWith('image/')).map(fileToDataUrl)
  );

  appState.memories.push({
    text,
    eventDate: eventDateInput || new Date().toISOString().slice(0, 10),
    person,
    item,
    location,
    tags: { general: generalTags, activity: activityTags, emotion: emotionTags },
    pin: appState.draftPin,
    mediaCount: files.length,
    mediaDataUrls,
    createdAt: new Date().toISOString(),
  });

  appState.activeTag = null;
  appState.draftPin = null;
  saveState();
  render();
  switchTab('create-memory');
  showHomeDashboard();
  memoryForm.reset();
  renderMediaPreview();
  document.querySelector('#memory-event-date').value = new Date().toISOString().slice(0, 10);
});

loadState();
setScreen();
initMaps();
render();
switchTab('create-memory');
document.querySelector('#memory-event-date').value = new Date().toISOString().slice(0, 10);
