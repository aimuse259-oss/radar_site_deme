var selectedAreas = [];
var selectedCities = [];

function loadSelectionState() {
  try {
    var a = localStorage.getItem('radar_areas');
    if (a) {
      selectedAreas = JSON.parse(a) || [];
    }
    var c = localStorage.getItem('radar_cities');
    if (c) {
      selectedCities = JSON.parse(c) || [];
    }
  } catch (e) {}
}

function saveSelectionState() {
  try {
    localStorage.setItem('radar_areas', JSON.stringify(selectedAreas));
    localStorage.setItem('radar_cities', JSON.stringify(selectedCities));
  } catch (e) {}
}

function saveToggleState() {
  try {
    var s = document.getElementById('sound-toggle');
    if (s) {
      localStorage.setItem('radar_sound', s.checked ? '1' : '0');
    }
    var n = document.getElementById('notif-toggle');
    if (n) {
      localStorage.setItem('radar_notif', n.checked ? '1' : '0');
    }
    var r = document.getElementById('readout-toggle');
    if (r) {
      localStorage.setItem('radar_readout', r.checked ? '1' : '0');
    }
    var sel = document.getElementById('sound-select');
    if (sel) {
      localStorage.setItem('radar_sound_choice', sel.value);
    }
  } catch (e) {}
}

function cityQualifies(cityKey) {
  if (!selectedAreas.length && !selectedCities.length) {
    return true;
  }
  if (selectedCities.indexOf(cityKey) !== -1) {
    return true;
  }
  var entry = CIPO[cityKey];
  if (entry && entry.area && selectedAreas.indexOf(entry.area.hebrew) !== -1) {
    return true;
  }
  return false;
}

function qualifyingCities(cityNames) {
  var out = [];
  for (var i = 0; i < cityNames.length; i++) {
    var k = cityNames[i];
    if (cityQualifies(k) && out.indexOf(k) === -1) {
      out.push(k);
    }
  }
  return out;
}

function renderAreasList() {
  var container = document.getElementById('area-list');
  if (!container) {
    return;
  }
  var searchEl = document.getElementById('area-search');
  var q = searchEl ? searchEl.value.trim().toLowerCase() : '';
  var districts = getDistricts().slice().sort(function(a, b) { return a.name.localeCompare(b.name, LANG); });
  var html = '';
  var shown = 0;
  districts.forEach(function(d) {
    if (q && d.name.toLowerCase().indexOf(q) === -1 && d.hebrew.toLowerCase().indexOf(q) === -1) {
      return;
    }
    shown += 1;
    var checked = selectedAreas.indexOf(d.hebrew) !== -1 ? ' checked' : '';
    html += '<label class="area-row"><input type="checkbox" data-area="' + d.hebrew.replace(/"/g, '&quot;') + '"' + checked + '><span>' + d.name + '</span></label>';
  });
  if (!shown) {
    html = '<div class="area-empty">' + t.noAreasFound + '</div>';
  }
  container.innerHTML = html;
  container.querySelectorAll('input[type="checkbox"]').forEach(function(box) {
    box.addEventListener('change', function() {
      var area = box.getAttribute('data-area');
      if (box.checked) {
        if (selectedAreas.indexOf(area) === -1) {
          selectedAreas.push(area);
        }
      } else {
        selectedAreas = selectedAreas.filter(function(a) {
          return a !== area;
        });
      }
      saveSelectionState();
      if (typeof applySelectionFilter === 'function') {
        applySelectionFilter();
      }
      updateAreasSummary();
    });
  });
  updateAreasSummary();
}

function renderSelectedCities() {
  var container = document.getElementById('selected-cities');
  if (!container) {
    return;
  }
  var html = '';
  selectedCities.forEach(function(key) {
    html += '<div class="city-row"><span class="city-row-name">' + getCityName(key) + '</span><span class="city-row-area">' + getAreaName(key) + '</span><button type="button" class="city-remove-btn" data-city="' + key.replace(/"/g, '&quot;') + '">✕</button></div>';
  });
  container.innerHTML = html;
  container.querySelectorAll('.city-remove-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = btn.getAttribute('data-city');
      selectedCities = selectedCities.filter(function(c) {
        return c !== key;
      });
      saveSelectionState();
      renderSelectedCities();
      if (typeof applySelectionFilter === 'function') {
        applySelectionFilter();
      }
    });
  });
}

function cityAutocomplete(q) {
  var box = document.getElementById('city-autocomplete');
  if (!box) {
    return;
  }
  q = (q || '').trim().toLowerCase();
  if (q.length < 1) {
    box.innerHTML = '';
    box.style.display = 'none';
    return;
  }
  var matches = [];
  var langField = LANG === 'en' ? 'english' : LANG === 'ru' ? 'russian' : LANG === 'ar' ? 'arabic' : null;
  for (var i = 0; i < CIPO_KEYS.length; i++) {
    var key = CIPO_KEYS[i];
    if (selectedCities.indexOf(key) !== -1) {
      continue;
    }
    var entry = CIPO[key];
    var translated = langField ? (entry[langField] || key) : key;
    if (translated.toLowerCase().indexOf(q) !== -1 || key.toLowerCase().indexOf(q) !== -1) {
      matches.push(key);
    }
    if (matches.length >= 5) {
      break;
    }
  }
  if (!matches.length) {
    box.innerHTML = '';
    box.style.display = 'none';
    return;
  }
  box.innerHTML = matches.map(function(key) {
    return '<div class="autocomplete-item" data-city="' + key.replace(/"/g, '&quot;') + '"><div class="ac-name">' + getCityName(key) + '</div><div class="ac-area">' + getAreaName(key) + '</div></div>';
  }).join('');
  box.style.display = 'block';
  box.querySelectorAll('.autocomplete-item').forEach(function(item) {
    item.addEventListener('mousedown', function(e) {
      e.preventDefault();
      var key = item.getAttribute('data-city');
      if (selectedCities.indexOf(key) === -1) {
        selectedCities.push(key);
      }
      saveSelectionState();
      renderSelectedCities();
      var input = document.getElementById('city-search');
      if (input) {
        input.value = '';
      }
      box.innerHTML = '';
      box.style.display = 'none';
      if (typeof applySelectionFilter === 'function') {
        applySelectionFilter();
      }
    });
  });
}

function areaDisplayName(hebrew) {
  var districts = getDistricts();
  for (var i = 0; i < districts.length; i++) {
    if (districts[i].hebrew === hebrew) {
      return districts[i].name;
    }
  }
  return hebrew;
}

function updateAreasSummary() {
  var el = document.getElementById('settings-areas-summary');
  if (!el) {
    return;
  }
  if (!selectedAreas.length) {
    el.textContent = t.areasSummaryAll;
    return;
  }
  var names = selectedAreas.map(areaDisplayName).join(', ');
  if (names.length > 80) {
    names = names.slice(0, 80) + '…';
  }
  el.textContent = names;
}

function setAreasCollapsed(collapsed) {
  var body = document.getElementById('settings-areas-body');
  var chev = document.getElementById('settings-areas-chevron');
  if (body) {
    body.style.display = collapsed ? 'none' : '';
  }
  if (chev) {
    chev.textContent = collapsed ? '▾' : '▴';
  }
  try {
    localStorage.setItem('radar_areas_collapsed', collapsed ? '1' : '0');
  } catch (e) {}
}

function initSettings() {
  loadSelectionState();
  var soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) {
    try {
      soundToggle.checked = localStorage.getItem('radar_sound') === '1';
    } catch (e) {}
    soundToggle.addEventListener('change', saveToggleState);
  }
  var notifToggle = document.getElementById('notif-toggle');
  if (notifToggle) {
    try {
      notifToggle.checked = localStorage.getItem('radar_notif') === '1';
    } catch (e) {}
    notifToggle.addEventListener('change', function() {
      if (notifToggle.checked && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(function(p) {
          if (p !== 'granted') {
            notifToggle.checked = false;
          } else if (typeof registerServiceWorker === 'function') {
            registerServiceWorker();
          }
          saveToggleState();
        });
      } else {
        if (notifToggle.checked && typeof registerServiceWorker === 'function') {
          registerServiceWorker();
        }
        saveToggleState();
      }
    });
  }
  var readoutToggle = document.getElementById('readout-toggle');
  if (readoutToggle) {
    try {
      readoutToggle.checked = localStorage.getItem('radar_readout') === '1';
    } catch (e) {}
    readoutToggle.addEventListener('change', function() {
      if (!readoutToggle.checked) {
        stopReadout();
      }
      saveToggleState();
    });
  }
  var soundSelect = document.getElementById('sound-select');
  if (soundSelect) {
    soundSelect.innerHTML = getAllSounds().map(function(s) {
      return '<option value="' + s.id + '">' + getSoundName(s.id) + '</option>';
    }).join('');
    try {
      var saved = localStorage.getItem('radar_sound_choice');
      if (saved) {
        soundSelect.value = saved;
      }
    } catch (e) {}
    soundSelect.addEventListener('change', function() {
      stopPreviewSound();
      saveToggleState();
    });
  }
  var previewBtn = document.getElementById('sound-preview-btn');
  if (previewBtn) {
    previewBtn.addEventListener('click', function() {
      if (isPreviewPlaying()) {
        stopPreviewSound();
      } else {
        playPreviewSound(getSelectedSoundId());
      }
    });
  }
  var areaSearch = document.getElementById('area-search');
  if (areaSearch) {
    areaSearch.addEventListener('input', renderAreasList);
  }
  var clearAreas = document.getElementById('clear-areas-btn');
  if (clearAreas) {
    clearAreas.addEventListener('click', function() {
      selectedAreas = [];
      saveSelectionState();
      renderAreasList();
      if (typeof applySelectionFilter === 'function') {
        applySelectionFilter();
      }
    });
  }
  var citySearch = document.getElementById('city-search');
  if (citySearch) {
    citySearch.addEventListener('input', function() {
      cityAutocomplete(citySearch.value);
    });
    citySearch.addEventListener('focus', function() {
      cityAutocomplete(citySearch.value);
    });
    citySearch.addEventListener('blur', function() {
      setTimeout(function() {
        var box = document.getElementById('city-autocomplete');
        if (box) {
          box.innerHTML = '';
          box.style.display = 'none';
        }
      }, 150);
    });
  }
  var clearCities = document.getElementById('clear-cities-btn');
  if (clearCities) {
    clearCities.addEventListener('click', function() {
      selectedCities = [];
      saveSelectionState();
      renderSelectedCities();
      if (typeof applySelectionFilter === 'function') {
        applySelectionFilter();
      }
    });
  }
  document.addEventListener('click', function(e) {
    var box = document.getElementById('city-autocomplete');
    if (box && !e.target.closest('#city-search-wrap') && !e.target.closest('#city-autocomplete')) {
      box.innerHTML = '';
      box.style.display = 'none';
    }
  });
  renderAreasList();
  renderSelectedCities();
  var areasHead = document.getElementById('settings-areas-head');
  if (areasHead) {
    areasHead.addEventListener('click', function() {
      var body = document.getElementById('settings-areas-body');
      setAreasCollapsed(!body || body.style.display !== 'none');
    });
  }
  try {
    setAreasCollapsed(localStorage.getItem('radar_areas_collapsed') === '1');
  } catch (e) {}
  initLocationChoice();
}

var detectedLoc = null;

function pointInPolygon(lat, lng, poly) {
  var inside = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    var latI = poly[i][0];
    var lngI = poly[i][1];
    var latJ = poly[j][0];
    var lngJ = poly[j][1];
    if (((lngI > lng) !== (lngJ > lng)) && (lat < (latJ - latI) * (lng - lngI) / (lngJ - lngI) + latI)) {
      inside = !inside;
    }
  }
  return inside;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  var r = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * r * Math.asin(Math.sqrt(a));
}

function findCityForLocation(lat, lng) {
  for (var i = 0; i < CIPO_KEYS.length; i++) {
    var key = CIPO_KEYS[i];
    var entry = CIPO[key];
    if (entry && entry.polygon && entry.polygon.length >= 3 && pointInPolygon(lat, lng, entry.polygon)) {
      return { key: key, nearest: false };
    }
  }
  var best = null;
  var bestD = Infinity;
  for (var j = 0; j < CIPO_KEYS.length; j++) {
    var k = CIPO_KEYS[j];
    var e = CIPO[k];
    if (!e || typeof e.latitude !== 'number' || typeof e.longitude !== 'number') {
      continue;
    }
    var d = haversineKm(lat, lng, e.latitude, e.longitude);
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  return best ? { key: best, nearest: true } : null;
}

function showLocStatus(msg) {
  var status = document.getElementById('loc-status');
  if (status) {
    status.textContent = msg;
    status.style.display = 'block';
  }
}

function initLocationChoice() {
  var group = document.getElementById('settings-loc-group');
  var btn = document.getElementById('loc-btn');
  var choicesEl = document.getElementById('loc-choices');
  if (!btn) {
    return;
  }
  if (!('geolocation' in navigator)) {
    if (group) {
      group.style.display = 'none';
    }
    return;
  }
  btn.addEventListener('click', function() {
    var status = document.getElementById('loc-status');
    if (status) {
      status.style.display = 'none';
    }
    if (choicesEl) {
      choicesEl.style.display = 'none';
    }
    detectedLoc = null;
    btn.disabled = true;
    btn.textContent = t.locDetecting;
    navigator.geolocation.getCurrentPosition(function(pos) {
      btn.disabled = false;
      btn.textContent = t.locBtn;
      var found = findCityForLocation(pos.coords.latitude, pos.coords.longitude);
      if (!found) {
        showLocStatus(t.locError);
        return;
      }
      detectedLoc = found;
      var cityDisplay = getCityName(found.key);
      var areaDisplay = getAreaName(found.key);
      if (found.nearest) {
        showLocStatus(t.locNearest + ' ' + cityDisplay + ' · ' + t.locArea + ': ' + areaDisplay);
      } else {
        showLocStatus(t.locCity + ': ' + cityDisplay + ' · ' + t.locArea + ': ' + areaDisplay);
      }
      if (choicesEl) {
        choicesEl.style.display = 'flex';
      }
    }, function(err) {
      btn.disabled = false;
      btn.textContent = t.locBtn;
      showLocStatus(err && err.code === 1 ? t.locDenied : t.locError);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  });
  if (choicesEl) {
    choicesEl.querySelectorAll('.loc-choice-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        if (!detectedLoc) {
          return;
        }
        var mode = b.getAttribute('data-loc-choice');
        var entry = CIPO[detectedLoc.key];
        var areaHe = entry && entry.area ? entry.area.hebrew : null;
        if ((mode === 'city' || mode === 'both') && selectedCities.indexOf(detectedLoc.key) === -1) {
          selectedCities.push(detectedLoc.key);
        }
        if ((mode === 'area' || mode === 'both') && areaHe && selectedAreas.indexOf(areaHe) === -1) {
          selectedAreas.push(areaHe);
        }
        saveSelectionState();
        renderAreasList();
        renderSelectedCities();
        if (typeof applySelectionFilter === 'function') {
          applySelectionFilter();
        }
        showLocStatus(t.locApplied);
        choicesEl.style.display = 'none';
      });
    });
  }
}
