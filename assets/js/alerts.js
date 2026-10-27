var db = null;
var homeMap = null;
var activeAlerts = {};
var mapLayers = {};
var expireTimers = {};
var _faviconInterval = null;
var lastAlertDocId = null;
var _readoutSets = {};
var _activeChips = {};
var _activeMarkers = {};
var EXPIRE_MS = 120000;
var HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000;
var IS_DESKTOP = window.matchMedia('(min-width: 701px)').matches;

function extractCities(doc) {
  return (doc.cities || []).map(function(c) {
    return typeof c === 'string' ? c : c.name;
  }).filter(Boolean);
}

function catMetaFor(doc) {
  return t.cat[String(doc.cat)] || { emoji: '🚨', text: getCat10Title(doc) || doc.title || '', instruction: '' };
}

function formatTs(raw) {
  var parts = raw.split(' - ');
  if (parts.length < 2) {
    return raw;
  }
  var datePart = parts[0].trim();
  var time = parts[1].trim();
  var dmy = datePart.split('/');
  if (dmy.length < 3) {
    return raw;
  }
  return dmy[0] + '/' + dmy[1] + '/20' + dmy[2] + ' | ' + time;
}

function extractMinute(timeStr) {
  var parts = timeStr.split(' - ');
  if (parts.length < 2) {
    return null;
  }
  return parts[1].trim().substring(0, 5);
}

function formatHistoryTime(uniqueTimes) {
  function formatOne(raw) {
    var parts = raw.split(' - ');
    if (parts.length < 2) {
      return raw;
    }
    var datePart = parts[0].trim();
    var time = parts[1].trim();
    var dmy = datePart.split('/');
    if (dmy.length < 3) {
      return raw;
    }
    return dmy[0] + '/' + dmy[1] + '/20' + dmy[2] + ' | ' + time;
  }
  if (!uniqueTimes.length) {
    return '';
  }
  if (uniqueTimes.length === 1) {
    return formatOne(uniqueTimes[0]);
  }
  var sorted = uniqueTimes.slice().sort(function(a, b) {
    return a.localeCompare(b);
  });
  var first = sorted[0];
  var last = sorted[sorted.length - 1];
  var firstMinute = extractMinute(first);
  var lastMinute = extractMinute(last);
  if (firstMinute && lastMinute && firstMinute === lastMinute) {
    return formatOne(first);
  }
  var lastTime = last.split(' - ')[1] ? last.split(' - ')[1].trim() : '';
  return formatOne(first) + ' - ' + lastTime;
}

function formatILDateTime(date) {
  var tz = 'Asia/Jerusalem';
  var datePart = date.toLocaleDateString('en-GB', { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric' });
  var timePart = date.toLocaleTimeString('he-IL', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return datePart + ' | ' + timePart;
}

function faviconSet(color) {
  var canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📡', 16, 17);
  var link = document.querySelector("link[rel='icon']") || document.createElement('link');
  link.rel = 'icon';
  link.href = canvas.toDataURL();
  document.head.appendChild(link);
}

function startFaviconPulse() {
  if (!IS_DESKTOP || _faviconInterval) {
    return;
  }
  var toggle = false;
  _faviconInterval = setInterval(function() {
    faviconSet(toggle ? '#e94560' : '#0a0a0a');
    toggle = !toggle;
  }, 800);
}

function stopFaviconPulse() {
  if (!IS_DESKTOP) {
    return;
  }
  if (_faviconInterval) {
    clearInterval(_faviconInterval);
    _faviconInterval = null;
  }
  var link = document.querySelector("link[rel='icon']");
  if (link) {
    link.href = LOGO_URL;
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  navigator.serviceWorker.register('sw.js').catch(function(err) {
    console.warn('SW registration failed:', err);
  });
}

function readoutOn() {
  var toggle = document.getElementById('readout-toggle');
  if (toggle) {
    return toggle.checked;
  }
  try {
    return localStorage.getItem('radar_readout') === '1';
  } catch (e) {
    return false;
  }
}

function sendBrowserNotif(doc, docId) {
  if (!IS_DESKTOP) {
    return;
  }
  var toggle = document.getElementById('notif-toggle');
  if (!toggle || !toggle.checked) {
    return;
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  var catMeta = catMetaFor(doc);
  var cityNames = extractCities(doc);
  var relevant = qualifyingCities(cityNames);
  if (!relevant.length) {
    return;
  }
  var uniqueRelevant = [];
  relevant.forEach(function(n) {
    if (uniqueRelevant.indexOf(n) === -1) {
      uniqueRelevant.push(n);
    }
  });
  var locationsStr = '';
  if (uniqueRelevant.length < 10) {
    locationsStr = uniqueRelevant.map(function(n) {
      return getCityName(n);
    }).join(', ');
  } else {
    var areas = [];
    uniqueRelevant.forEach(function(n) {
      var a = getAreaName(n);
      if (areas.indexOf(a) === -1) {
        areas.push(a);
      }
    });
    locationsStr = areas.join(', ');
  }
  var nowStr = formatILDateTime(new Date());
  var body = nowStr + '\n' + locationsStr + '\n' + t.siteTitle;
  var title = catMeta.emoji + ' ' + catMeta.text;
  var tag = 'radar-alert-' + docId;
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title: title,
      body: body,
      icon: NOTIF_ICON,
      tag: tag,
      dir: IS_RTL ? 'rtl' : 'ltr'
    });
  } else {
    new Notification(title, { body: body, icon: NOTIF_ICON, dir: t.dir, tag: tag });
  }
}

function triggerAlertFeedback(docId, changeType, qualifying) {
  if (!qualifying.length) {
    return;
  }
  if (changeType === 'added') {
    playAlertSound();
    if (readoutOn()) {
      stopReadout();
      startReadout(docId, qualifying);
    }
    _readoutSets[docId] = qualifying.join('|');
  } else if (changeType === 'modified') {
    var setKey = qualifying.join('|');
    if (_readoutSets[docId] !== setKey) {
      playAlertSound();
      if (readoutOn()) {
        stopReadout(docId);
        startReadout(docId, qualifying);
      }
      _readoutSets[docId] = setKey;
    }
  }
}

function makeHomePopupContent(displayName, hebrewName, docId, typesText) {
  var doc = activeAlerts[docId];
  var color = catColor(doc ? doc.cat : '1');
  var dir = IS_RTL ? 'rtl' : 'ltr';
  var align = IS_RTL ? 'right' : 'left';
  var xBtn = '<span class="popup-close-btn" data-city="' + hebrewName.replace(/"/g, '&quot;') + '" data-doc="' + docId + '" style="cursor:pointer;margin-' + (IS_RTL ? 'right' : 'left') + ':8px;font-weight:bold;color:#bbb;font-size:18px;padding:2px 4px;" title="סגור">✕</span>';
  var dot = '<span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:' + color + ';flex:none;"></span>';
  var typesLine = typesText ? '<div dir="' + dir + '" style="font-size:14px;color:#ddd;text-align:' + align + ';margin-top:3px;">' + typesText + '</div>' : '';
  return '<div dir="' + dir + '" style="text-align:' + align + ';"><div style="display:flex;align-items:center;gap:8px;">' + dot + '<b style="font-size:18px;color:#fff;">' + displayName + '</b>' + xBtn + '</div>' + typesLine + '</div>';
}

function cityAlertTypes(hebrewName) {
  var types = [];
  Object.keys(mapLayers).forEach(function(dId) {
    var entry = mapLayers[dId];
    if (!entry || !entry.names || entry.names.indexOf(hebrewName) === -1) {
      return;
    }
    var text = '';
    var doc = activeAlerts[dId];
    if (doc) {
      text = catMetaFor(doc).text;
    } else if (t.cat[String(entry.cat)]) {
      text = t.cat[String(entry.cat)].text;
    }
    if (text && types.indexOf(text) === -1) {
      types.push(text);
    }
  });
  return types;
}

function deactivateHomeChip(docId) {
  var prevCity = _activeChips[docId];
  if (prevCity) {
    var prevChip = document.querySelector('#alerts-container .city-chip[data-doc="' + docId + '"][data-city="' + prevCity.replace(/"/g, '\\"') + '"]');
    if (prevChip) {
      prevChip.classList.remove('active');
      prevChip.style.background = '';
      prevChip.style.color = '';
    }
  }
  var prevMarker = _activeMarkers[docId];
  if (prevMarker) {
    prevMarker.closePopup();
  }
  _activeChips[docId] = null;
  _activeMarkers[docId] = null;
}

function bindHomePopupCloseButtons(container, docId) {
  container.querySelectorAll('.popup-close-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      deactivateHomeChip(docId);
      zoomToAlert(docId);
    });
    btn.addEventListener('touchend', function(e) {
      e.preventDefault();
      e.stopPropagation();
      deactivateHomeChip(docId);
      zoomToAlert(docId);
    });
  });
}

var _homePopupOpen = false;
var _openPopupDoc = null;
var _openPopupCity = null;

function renderMapLayers(docId, doc) {
  var reopenCity = (_openPopupDoc === docId) ? _openPopupCity : null;
  removeMapLayers(docId);
  var allCities = extractCities(doc);
  var filteredNames = qualifyingCities(allCities);
  if (!filteredNames.length) {
    mapLayers[docId] = { layers: [], markers: [] };
    return;
  }
  var built = buildHomeLayers(homeMap, doc, filteredNames);
  built.names = filteredNames;
  built.cat = doc.cat;
  mapLayers[docId] = built;
  built.markers.forEach(function(m) {
    var popupContent = makeHomePopupContent(m.displayName, m.name, docId, cityAlertTypes(m.name).join(', '));
    m.marker.bindPopup(popupContent, { closeButton: false });
    m.marker.on('click', function() {
      focusCity(m.name, docId);
    });
    m.marker.on('popupopen', function() {
      _homePopupOpen = true;
      _openPopupDoc = docId;
      _openPopupCity = m.name;
      m.marker.getPopup().setContent(makeHomePopupContent(m.displayName, m.name, docId, cityAlertTypes(m.name).join(', ')));
      var popupEl = m.marker.getPopup().getElement();
      if (popupEl) {
        bindHomePopupCloseButtons(popupEl, docId);
      }
    });
    m.marker.on('popupclose', function() {
      _homePopupOpen = false;
      _openPopupDoc = null;
      _openPopupCity = null;
      if (_activeChips[docId] === m.name && _activeMarkers[docId] === m.marker) {
        var chip = document.querySelector('#alerts-container .city-chip[data-doc="' + docId + '"][data-city="' + m.name.replace(/"/g, '\\"') + '"]');
        if (chip) {
          chip.classList.remove('active');
          chip.style.background = '';
          chip.style.color = '';
        }
        _activeChips[docId] = null;
        _activeMarkers[docId] = null;
      }
      setTimeout(function() {
        if (!_homePopupOpen) {
          zoomToAlert(docId);
        }
      }, 100);
    });
  });
  if (reopenCity) {
    built.markers.forEach(function(m) {
      if (m.name === reopenCity) {
        m.marker.openPopup();
      }
    });
  }
}

function removeMapLayers(docId) {
  if (mapLayers[docId]) {
    mapLayers[docId].layers.forEach(function(l) {
      try {
        homeMap.removeLayer(l);
      } catch (e) {}
    });
    delete mapLayers[docId];
  }
  delete _activeChips[docId];
  delete _activeMarkers[docId];
}

function zoomToAlert(docId) {
  if (!mapLayers[docId] || !mapLayers[docId].layers.length) {
    return;
  }
  var bounds = L.latLngBounds();
  mapLayers[docId].layers.forEach(function(layer) {
    try {
      if (layer.getBounds) {
        bounds.extend(layer.getBounds());
      } else if (layer.getLatLng) {
        bounds.extend(layer.getLatLng());
      }
    } catch (e) {}
  });
  if (bounds.isValid()) {
    homeMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: true });
  }
}

function focusCity(hebrewName, docId) {
  var chip = document.querySelector('#alerts-container .city-chip[data-doc="' + docId + '"][data-city="' + hebrewName.replace(/"/g, '\\"') + '"]');
  var isAlreadyActive = _activeChips[docId] === hebrewName;
  homeMap.closePopup();
  Object.keys(_activeChips).forEach(function(dId) {
    if (_activeChips[dId]) {
      var prevChip = document.querySelector('#alerts-container .city-chip[data-doc="' + dId + '"][data-city="' + _activeChips[dId].replace(/"/g, '\\"') + '"]');
      if (prevChip) {
        prevChip.classList.remove('active');
        prevChip.style.background = '';
        prevChip.style.color = '';
      }
      if (_activeMarkers[dId]) {
        _activeMarkers[dId].closePopup();
      }
      _activeChips[dId] = null;
      _activeMarkers[dId] = null;
    }
  });
  if (isAlreadyActive) {
    zoomToAlert(docId);
    return;
  }
  if (chip) {
    chip.classList.add('active');
    chip.style.background = catColor(activeAlerts[docId] ? activeAlerts[docId].cat : '1');
    chip.style.color = '#000';
  }
  if (!mapLayers[docId]) {
    return;
  }
  var found = null;
  mapLayers[docId].markers.forEach(function(m) {
    if (m.name === hebrewName) {
      found = m;
    }
  });
  if (found && found.marker.getLatLng) {
    homeMap.setView(found.marker.getLatLng(), 13, { animate: true });
    found.marker.openPopup();
    _activeChips[docId] = hebrewName;
    _activeMarkers[docId] = found.marker;
  } else {
    zoomToAlert(docId);
  }
}

function buildSidebarBlock(docId, doc) {
  var color = catColor(doc.cat);
  var catMeta = catMetaFor(doc);
  var allCityNames = extractCities(doc);
  var cityNames = qualifyingCities(allCityNames);
  var selectionActive = selectedAreas.length > 0 || selectedCities.length > 0;
  if (selectionActive && cityNames.length === 0) {
    var existingGone = document.getElementById('block-' + docId);
    if (existingGone) {
      existingGone.remove();
    }
    if (!document.querySelectorAll('#alerts-container .alert-block').length) {
      var noAlertsEl = document.getElementById('no-alerts');
      if (noAlertsEl) {
        noAlertsEl.style.display = 'flex';
      }
    }
    return;
  }
  var uniqueNames = [];
  cityNames.forEach(function(n) {
    if (uniqueNames.indexOf(n) === -1) {
      uniqueNames.push(n);
    }
  });
  var byArea = cipoByArea(uniqueNames);
  var cities = doc.cities || [];
  var sortedCities = cities.slice().sort(function(a, b) {
    var timeA = (typeof a === 'string' ? '' : a.time) || '';
    var timeB = (typeof b === 'string' ? '' : b.time) || '';
    return timeB.localeCompare(timeA);
  });
  var uniqueTimes = [];
  sortedCities.forEach(function(e) {
    var time = (typeof e === 'string' ? '' : e.time) || '';
    if (time && uniqueTimes.indexOf(time) === -1) {
      uniqueTimes.push(time);
    }
  });
  var isRolling = uniqueTimes.length > 1;
  var tsHTML = '';
  if (!isRolling) {
    var t2 = uniqueTimes[0] || '';
    if (t2) {
      tsHTML = '<div class="ts-row">' + formatTs(t2) + '</div>';
    }
  } else {
    var first = uniqueTimes[uniqueTimes.length - 1];
    var last = uniqueTimes[0];
    var lastTime = last.split(' - ')[1] ? last.split(' - ')[1].trim() : '';
    tsHTML = '<div class="ts-row ts-range">' + formatTs(first) + ' - ' + lastTime + '</div>';
  }
  var hullDoc = (typeof isHullDoc === 'function') && isHullDoc(doc, uniqueNames);
  var areaHTML = Object.keys(byArea).map(function(area) {
    var chips = byArea[area].map(function(hebrewCity) {
      var display = getCityName(hebrewCity);
      return '<span class="city-chip' + (hullDoc ? ' no-click' : '') + '" data-city="' + hebrewCity.replace(/"/g, '&quot;') + '" data-doc="' + docId + '">' + display + '</span>';
    }).join('');
    return '<div class="alert-area-group"><div class="alert-area-name">' + area + '</div><div class="alert-cities">' + chips + '</div></div>';
  }).join('');
  var html = '<div class="alert-block" id="block-' + docId + '">' +
    '<div class="alert-block-content">' +
    '<div class="alert-header">' +
    '<div class="alert-dot" style="background:' + color + ';color:' + color + '"></div>' +
    '<div class="alert-title-row">' +
    '<div class="alert-type">' + catMeta.text + '</div>' +
    '<div class="alert-count">' + uniqueNames.length + ' ' + t.cities + '</div>' +
    '</div>' +
    '</div>' +
    '<div class="alert-body">' +
    areaHTML +
    '<div class="alert-timestamps">' + tsHTML + '</div>' +
    '<div class="alert-instruction">' + catMeta.instruction + '</div>' +
    '</div>' +
    '</div>' +
    '<div class="alert-cat-tab" style="background:' + color + '">' + catMeta.emoji + '</div>' +
    '</div>';
  var existing = document.getElementById('block-' + docId);
  var container = document.getElementById('alerts-container');
  if (!container) {
    return;
  }
  if (existing) {
    existing.outerHTML = html;
  } else {
    var noAlerts = document.getElementById('no-alerts');
    if (noAlerts) {
      noAlerts.style.display = 'none';
    }
    container.insertAdjacentHTML('afterbegin', html);
  }
  var block = document.getElementById('block-' + docId);
  if (block && !hullDoc) {
    block.querySelectorAll('.city-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        focusCity(chip.getAttribute('data-city'), docId);
      });
    });
  }
  var searchEl = document.getElementById('sidebar-search');
  if (searchEl) {
    searchEl.style.display = document.querySelectorAll('#alerts-container .city-chip').length > 20 ? 'block' : 'none';
  }
}

function removeBlock(docId) {
  var el = document.getElementById('block-' + docId);
  if (el) {
    el.style.transition = 'opacity 0.4s,transform 0.4s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(' + (IS_RTL ? '-' : '') + '20px)';
    setTimeout(function() {
      el.remove();
    }, 400);
  }
  removeMapLayers(docId);
  delete activeAlerts[docId];
  delete _readoutSets[docId];
  stopReadout(docId);
  if (lastAlertDocId === docId) {
    lastAlertDocId = null;
  }
  setTimeout(function() {
    if (!Object.keys(activeAlerts).length) {
      var noAlerts = document.getElementById('no-alerts');
      if (noAlerts) {
        noAlerts.style.display = 'flex';
      }
      stopFaviconPulse();
      if (homeMap) {
        homeMap.setView([31.5, 34.85], 8, { animate: true });
      }
    }
  }, 450);
  setTimeout(function() {
    if (!Object.keys(activeAlerts).length) {
      var searchEl = document.getElementById('sidebar-search');
      if (searchEl) {
        searchEl.style.display = 'none';
        searchEl.value = '';
      }
    }
  }, 450);
}

function scheduleExpiry(docId, lastMs) {
  if (expireTimers[docId]) {
    clearTimeout(expireTimers[docId]);
  }
  var rem = EXPIRE_MS - (Date.now() - lastMs);
  if (rem <= 0) {
    removeBlock(docId);
    return;
  }
  expireTimers[docId] = setTimeout(function() {
    removeBlock(docId);
  }, rem);
}

function rerenderAllMapLayers() {
  Object.keys(activeAlerts).forEach(function(docId) {
    renderMapLayers(docId, activeAlerts[docId]);
    zoomToAlert(docId);
  });
}

function applySelectionFilter() {
  Object.keys(activeAlerts).forEach(function(docId) {
    renderMapLayers(docId, activeAlerts[docId]);
    buildSidebarBlock(docId, activeAlerts[docId]);
  });
}

function onDocUpdate(docId, data, changeType, allowFeedback) {
  var lastMs = Date.now();
  var ts = data.last_updated_ts;
  if (ts) {
    if (ts.seconds) {
      lastMs = ts.seconds * 1000;
    } else if (ts.toMillis) {
      lastMs = ts.toMillis();
    } else if (typeof ts === 'string' || typeof ts === 'number') {
      lastMs = new Date(ts).getTime();
    }
  }
  if (Date.now() - lastMs > EXPIRE_MS) {
    return;
  }
  var allCities = extractCities(data);
  var qualifying = qualifyingCities(allCities);
  activeAlerts[docId] = data;
  if (CIPO_KEYS.length) {
    renderMapLayers(docId, data);
    if (!_homePopupOpen) {
      zoomToAlert(docId);
    }
  }
  buildSidebarBlock(docId, data);
  scheduleExpiry(docId, lastMs);
  lastAlertDocId = docId;
  startFaviconPulse();
  if (allowFeedback !== false) {
    sendBrowserNotif(data, docId);
    triggerAlertFeedback(docId, changeType, qualifying);
  }
}

var _listenerPrimed = false;

function startListener() {
  _listenerPrimed = false;
  var cutoff = new Date(Date.now() - EXPIRE_MS);
  db.collection('alerts_regular').where('last_updated_ts', '>=', cutoff).onSnapshot(function(snapshot) {
    var primed = _listenerPrimed;
    _listenerPrimed = true;
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        removeBlock(change.doc.id);
      } else {
        onDocUpdate(change.doc.id, change.doc.data(), change.type, primed);
      }
    });
  }, function(err) {
    console.error(err);
    setTimeout(startListener, 5000);
  });
}

var _cachedHebrewDate = '';
var _cachedHebrewDateKey = '';

function fetchHebrewDate(dateKey) {
  if (_cachedHebrewDateKey === dateKey) {
    return Promise.resolve(_cachedHebrewDate);
  }
  return fetch('https://www.hebcal.com/converter?cfg=json&date=' + dateKey + '&g2h=1').then(function(r) {
    return r.json();
  }).then(function(j) {
    var hebrew = (j.hebrew || '').replace(/[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, '');
    _cachedHebrewDate = hebrew;
    _cachedHebrewDateKey = dateKey;
    return hebrew;
  }).catch(function() {
    return '';
  });
}

function updateClock() {
  var timeEl = document.getElementById('clock-time');
  var dateEl = document.getElementById('clock-date');
  if (!timeEl || !dateEl) {
    return;
  }
  var tz = 'Asia/Jerusalem';
  var now = new Date();
  timeEl.textContent = now.toLocaleTimeString('he-IL', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  var localeMap = { he: 'he-IL', en: 'en-US', ru: 'ru-RU', ar: 'ar-SA' };
  var locale = localeMap[LANG] || 'he-IL';
  var weekday = now.toLocaleDateString(locale, { timeZone: tz, weekday: 'long' });
  var parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(now);
  var d = '';
  var m = '';
  var y = '';
  parts.forEach(function(p) {
    if (p.type === 'day') {
      d = p.value;
    }
    if (p.type === 'month') {
      m = p.value;
    }
    if (p.type === 'year') {
      y = p.value;
    }
  });
  var gregorian = d + '/' + m + '/' + y;
  var yyyy = now.toLocaleDateString('sv-SE', { timeZone: tz });
  dateEl.textContent = [weekday, gregorian].filter(Boolean).join(', ');
  if (LANG === 'he') {
    fetchHebrewDate(yyyy).then(function(heb) {
      dateEl.textContent = [weekday, heb, gregorian].filter(Boolean).join(', ');
    });
  }
}

function filterCities() {
  var input = document.getElementById('alert-search');
  if (!input) {
    return;
  }
  var q = input.value.trim().toLowerCase();
  document.querySelectorAll('#alert-content li').forEach(function(li) {
    li.style.display = li.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
  });
}

function filterSidebarCities() {
  var input = document.getElementById('sidebar-search');
  if (!input) {
    return;
  }
  var q = input.value.trim().toLowerCase();
  document.querySelectorAll('#alerts-container .city-chip').forEach(function(chip) {
    chip.style.display = chip.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
  });
}

function showHistory() {
  var tabs = document.getElementById('sidebar-tabs');
  if (tabs) {
    tabs.style.display = 'none';
  }
  document.querySelectorAll('.tab-content').forEach(function(c) {
    c.classList.remove('active');
  });
  var view = document.getElementById('history-view');
  if (view) {
    view.classList.add('active');
  }
  loadHistory();
}

function hideHistory() {
  var view = document.getElementById('history-view');
  if (view) {
    view.classList.remove('active');
  }
  var tabs = document.getElementById('sidebar-tabs');
  if (tabs) {
    tabs.style.display = 'flex';
  }
  var alertsBtn = document.querySelector('.tab-btn[data-tab="alerts"]');
  if (alertsBtn) {
    alertsBtn.click();
  }
}

function loadHistory() {
  var container = document.getElementById('history-container');
  if (!container) {
    return;
  }
  container.innerHTML = '<div id="history-loading">' + t.historyLoading + '</div>';
  var cutoff = new Date(Date.now() - HISTORY_WINDOW_MS);
  db.collection('alerts_regular').where('last_updated_ts', '>=', cutoff).orderBy('last_updated_ts', 'desc').get().then(function(snapshot) {
    var expireCutoff = Date.now() - EXPIRE_MS;
    var docs = snapshot.docs.filter(function(doc) {
      var ts = doc.data().last_updated_ts;
      if (!ts) {
        return true;
      }
      var ms = ts.seconds ? ts.seconds * 1000 : (ts.toMillis ? ts.toMillis() : new Date(ts).getTime());
      return ms < expireCutoff;
    });
    if (!docs.length) {
      container.innerHTML = '<div id="history-loading">' + t.historyEmpty + '</div>';
      return;
    }
    var merged = [];
    docs.forEach(function(doc) {
      var data = doc.data();
      var ts = data.last_updated_ts;
      var ms = ts ? (ts.seconds ? ts.seconds * 1000 : (ts.toMillis ? ts.toMillis() : new Date(ts).getTime())) : 0;
      var cat = String(data.cat);
      var cities = data.cities || [];
      var cityNames = cities.map(function(c) {
        return typeof c === 'string' ? c : c.name;
      }).filter(Boolean);
      var sortedCities = cities.slice().sort(function(a, b) {
        var tA = (typeof a === 'string' ? '' : a.time) || '';
        var tB = (typeof b === 'string' ? '' : b.time) || '';
        return tB.localeCompare(tA);
      });
      var uniqueTimes = [];
      sortedCities.forEach(function(e) {
        var time = (typeof e === 'string' ? '' : e.time) || '';
        if (time && uniqueTimes.indexOf(time) === -1) {
          uniqueTimes.push(time);
        }
      });
      var existing = null;
      for (var i = 0; i < merged.length; i++) {
        if (merged[i].cat === cat && Math.abs(merged[i].lastMs - ms) <= EXPIRE_MS) {
          existing = merged[i];
          break;
        }
      }
      if (existing) {
        cityNames.forEach(function(name) {
          if (existing.cities.indexOf(name) === -1) {
            existing.cities.push(name);
          }
        });
        existing.lastMs = Math.max(existing.lastMs, ms);
        uniqueTimes.forEach(function(ut) {
          if (existing.uniqueTimes.indexOf(ut) === -1) {
            existing.uniqueTimes.push(ut);
          }
        });
        existing.ids.push(doc.id);
      } else {
        var uniqueCityNames = [];
        cityNames.forEach(function(name) {
          if (uniqueCityNames.indexOf(name) === -1) {
            uniqueCityNames.push(name);
          }
        });
        merged.push({ cat: cat, title: data.title, cities: uniqueCityNames, lastMs: ms, uniqueTimes: uniqueTimes, ids: [doc.id] });
      }
    });
    container.innerHTML = merged.map(function(group) {
      var color = catColor(group.cat);
      var catMeta = t.cat[group.cat] || { emoji: '🚨', text: getCat10Title(group) || group.title };
      var timeStr = formatHistoryTime(group.uniqueTimes);
      var citiesStr = group.cities.map(function(n) {
        return getCityName(n);
      }).join(' • ');
      var idsAttr = group.ids.join(',');
      return '<div class="history-block" data-ids="' + idsAttr + '" role="button" tabindex="0">' +
        '<div class="history-cat-tab" style="background:' + color + '">' + catMeta.emoji + '</div>' +
        '<div class="history-block-content">' +
        '<div class="history-block-header">' +
        '<div class="history-dot" style="background:' + color + '"></div>' +
        '<div class="history-type">' + catMeta.text + '</div>' +
        '</div>' +
        '<div class="history-time">' + timeStr + '</div>' +
        '<div class="history-cities">' + citiesStr + '</div>' +
        '</div>' +
        '</div>';
    }).join('');
    container.querySelectorAll('.history-block').forEach(function(block) {
      var ids = block.getAttribute('data-ids');
      if (!ids) {
        return;
      }
      block.addEventListener('click', function() {
        openHistoryDetail(ids);
      });
      block.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openHistoryDetail(ids);
        }
      });
    });
  }).catch(function(e) {
    console.error(e);
    container.innerHTML = '<div id="history-loading">' + t.historyError + '</div>';
  });
}

function openHistoryDetail(idsStr) {
  if (!idsStr) {
    return;
  }
  var url = new URL(window.location.href);
  Array.from(url.searchParams.keys()).forEach(function(k) {
    url.searchParams.delete(k);
  });
  url.searchParams.set('histIds', idsStr);
  if (LANG !== 'he') {
    url.searchParams.set('lang', LANG);
  }
  window.open(url.toString(), '_blank', 'noopener');
}

function renderAlertDetailBody(opts) {
  var instructionText = opts.instructionText;
  var cityNames = opts.cityNames;
  var cat = opts.cat;
  var byArea = cipoByArea(cityNames);
  var html = '<p class="detail-instruction">' + (instructionText || '') + '</p>';
  var searchEl = document.getElementById('alert-search');
  if (searchEl) {
    searchEl.style.display = cityNames.length > 20 ? 'block' : 'none';
    searchEl.placeholder = t.searchPlaceholder;
    searchEl.value = '';
  }
  Object.keys(byArea).forEach(function(area) {
    var cities = byArea[area].slice().sort(function(a, b) {
      return getCityName(a).localeCompare(getCityName(b));
    });
    html += '<div class="area">';
    if (area) {
      html += '<h3>' + area + '</h3>';
    }
    html += '<ul>';
    cities.forEach(function(city) {
      html += '<li data-hebrew="' + city.replace(/"/g, '&quot;') + '">' + getCityName(city) + '</li>';
    });
    html += '</ul></div>';
  });
  var content = document.getElementById('alert-content');
  if (content) {
    content.innerHTML = html;
  }
  var controller = createDetailMap(cityNames, cat);
  if (controller) {
    controller.bindCityList();
  }
}

function initAlertPage(id) {
  document.body.style.direction = t.dir;
  loadCipo().then(function() {
    db.collection('alerts_cat10').doc(id).get().then(function(doc) {
      if (!doc.exists) {
        document.body.innerHTML = '<h1 class="error-title">' + t.notFound + '</h1>';
        return;
      }
      var data = doc.data();
      var catKey = String(data.cat);
      var catMeta = t.cat[catKey] || { emoji: '🚨', text: getCat10Title(data) || data.title || '🚨', instruction: '' };
      var localizedTitle = getCat10Title(data);
      var displayTitle = localizedTitle || catMeta.text;
      var titleEl = document.getElementById('alert-title');
      if (titleEl) {
        titleEl.innerText = displayTitle;
      }
      document.title = t.siteTitle;
      var cityNames = extractCities(data);
      var subtitleEl = document.getElementById('alert-subtitle');
      if (subtitleEl) {
        subtitleEl.innerText = data.timestamp || '';
      }
      renderAlertDetailBody({ instructionText: catMeta.instruction, cityNames: cityNames, cat: data.cat });
    }).catch(function(err) {
      console.error(err);
      document.body.innerHTML = '<h1 class="error-title">' + t.loadError + '</h1>';
    });
  });
}

function initHistoryAlertPage(ids) {
  document.body.style.direction = t.dir;
  if (!ids.length) {
    document.body.innerHTML = '<h1 class="error-title">' + t.notFound + '</h1>';
    return;
  }
  loadCipo().then(function() {
    Promise.all(ids.map(function(id) {
      return db.collection('alerts_regular').doc(id).get();
    })).then(function(docs) {
      var validDocs = docs.filter(function(d) {
        return d.exists;
      }).map(function(d) {
        return d.data();
      });
      if (!validDocs.length) {
        document.body.innerHTML = '<h1 class="error-title">' + t.notFound + '</h1>';
        return;
      }
      var cat = String(validDocs[0].cat);
      var catMeta = t.cat[cat] || { emoji: '🚨', text: getCat10Title(validDocs[0]) || validDocs[0].title || '🚨', instruction: '' };
      var cityNames = [];
      var allTimes = [];
      validDocs.forEach(function(data) {
        (data.cities || []).forEach(function(c) {
          var name = typeof c === 'string' ? c : c.name;
          var time = typeof c === 'string' ? '' : c.time;
          if (name && cityNames.indexOf(name) === -1) {
            cityNames.push(name);
          }
          if (time && allTimes.indexOf(time) === -1) {
            allTimes.push(time);
          }
        });
      });
      var titleEl = document.getElementById('alert-title');
      if (titleEl) {
        titleEl.innerText = catMeta.text;
      }
      document.title = t.siteTitle;
      var subtitleEl = document.getElementById('alert-subtitle');
      if (subtitleEl) {
        subtitleEl.innerText = formatHistoryTime(allTimes);
      }
      renderAlertDetailBody({ instructionText: catMeta.instruction, cityNames: cityNames, cat: validDocs[0].cat });
    }).catch(function(err) {
      console.error(err);
      document.body.innerHTML = '<h1 class="error-title">' + t.loadError + '</h1>';
    });
  });
}

function initHomePage() {
  homeMap = createHomeMap();
  function fixHomeMapSize() {
    if (homeMap) {
      homeMap.invalidateSize();
    }
  }
  window.addEventListener('load', fixHomeMapSize);
  setTimeout(fixHomeMapSize, 500);
  var sidebarSearch = document.getElementById('sidebar-search');
  if (sidebarSearch) {
    sidebarSearch.addEventListener('input', filterSidebarCities);
  }
  var alertSearch = document.getElementById('alert-search');
  if (alertSearch) {
    alertSearch.addEventListener('input', filterCities);
  }
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      document.querySelectorAll('.tab-content').forEach(function(c) {
        c.classList.remove('active');
      });
      btn.classList.add('active');
      var tab = document.getElementById('tab-' + btn.dataset.tab);
      if (tab) {
        tab.classList.add('active');
      }
    });
  });
  var historyLink = document.getElementById('history-link');
  if (historyLink) {
    historyLink.addEventListener('click', showHistory);
  }
  var historyBack = document.getElementById('history-back');
  if (historyBack) {
    historyBack.addEventListener('click', hideHistory);
  }
  try {
    if (IS_DESKTOP && localStorage.getItem('radar_notif') === '1' && 'Notification' in window && Notification.permission === 'granted') {
      registerServiceWorker();
    }
  } catch (e) {}
  updateClock();
  setInterval(updateClock, 1000);
  startListener();
}
