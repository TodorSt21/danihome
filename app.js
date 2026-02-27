const loginForm = document.querySelector('#login-form');
const loginScreen = document.querySelector('#login-screen');
const appScreen = document.querySelector('#app-screen');
const welcomeText = document.querySelector('#welcome-text');
const logoutBtn = document.querySelector('#logout-btn');

const tabButtons = [...document.querySelectorAll('.tab-btn')];
const panels = [...document.querySelectorAll('.tab-panel')];

const memoryForm = document.querySelector('#memory-form');
const peopleForm = document.querySelector('#people-form');
const timelineList = document.querySelector('#timeline-list');
const peopleList = document.querySelector('#people-list');
const tagsList = document.querySelector('#tags-list');
const mapPinsList = document.querySelector('#map-pins-list');
const memoryTemplate = document.querySelector('#memory-item-template');
const activeTagInfo = document.querySelector('#active-tag-info');
const clearTagFilterBtn = document.querySelector('#clear-tag-filter');

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
          }))
        : [],
    };
  } catch {
    appState = { user: null, memories: [], people: [], activeTag: null, draftPin: null };
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

  if ((!targetTab || targetTab === 'timeline') && pickerMap) {
    setTimeout(() => pickerMap.invalidateSize(), 0);
  }

  if ((!targetTab || targetTab === 'map') && overviewMap) {
    setTimeout(() => overviewMap.invalidateSize(), 0);
  }
}

function switchTab(targetTab) {
  tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === targetTab));
  panels.forEach((panel) => panel.classList.toggle('active', panel.id === targetTab));
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

function sortByEventDateDesc(memories) {
  return [...memories].sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
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

function renderTimeline() {
  timelineList.innerHTML = '';
  const sortedMemories = sortByEventDateDesc(appState.memories).filter(passesTagFilter);

  sortedMemories.forEach((memory) => {
    const clone = memoryTemplate.content.cloneNode(true);
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

    const img = document.createElement('img');
    img.className = 'person-avatar';
    const photo = getPersonPhoto(name);
    img.src = photo || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%25" height="100%25" fill="%23dfe8ff"/><text x="50%25" y="54%25" dominant-baseline="middle" text-anchor="middle" font-size="28">👤</text></svg>';
    img.alt = `Снимка на ${name}`;

    const caption = document.createElement('span');
    caption.textContent = name;

    li.append(img, caption);
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
  renderTimeline();
  renderPeople();
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
  render();
});

logoutBtn.addEventListener('click', () => {
  appState.user = null;
  appState.activeTag = null;
  saveState();
  setScreen();
});

clearTagFilterBtn.addEventListener('click', () => {
  appState.activeTag = null;
  render();
});

clearPinBtn.addEventListener('click', () => {
  appState.draftPin = null;
  renderDraftPin();
});

tabButtons.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

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
  peopleForm.reset();
});

memoryForm.addEventListener('submit', (event) => {
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

  appState.memories.push({
    text,
    eventDate: eventDateInput || new Date().toISOString().slice(0, 10),
    person,
    item,
    location,
    tags: { general: generalTags, activity: activityTags, emotion: emotionTags },
    pin: appState.draftPin,
    mediaCount: files.length,
    createdAt: new Date().toISOString(),
  });

  appState.activeTag = null;
  appState.draftPin = null;
  saveState();
  render();
  memoryForm.reset();
  document.querySelector('#memory-event-date').value = new Date().toISOString().slice(0, 10);
});

loadState();
setScreen();
initMaps();
render();
switchTab('timeline');
document.querySelector('#memory-event-date').value = new Date().toISOString().slice(0, 10);
