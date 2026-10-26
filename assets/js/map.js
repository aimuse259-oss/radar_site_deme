var CIPO = {};
var CIPO_KEYS = [];
var CIPO_INDEX = {};
var NATIONAL_HULL = null;

function loadCipo() {
  if (CIPO_KEYS.length) {
    return Promise.resolve(CIPO);
  }
  return fetch('cipo.json').then(function(r) {
    return r.json();
  }).then(function(data) {
    CIPO = data || {};
    CIPO_KEYS = Object.keys(CIPO);
    CIPO_INDEX = {};
    for (var i = 0; i < CIPO_KEYS.length; i++) {
      CIPO_INDEX[CIPO_KEYS[i]] = i + 1;
    }
    return CIPO;
  }).catch(function(e) {
    console.error('loadCipo error:', e);
    return CIPO;
  });
}

function cityPosition(cityKey) {
  return CIPO_INDEX[cityKey] || 0;
}

function areaFieldName() {
  if (LANG === 'en') {
    return 'english';
  }
  if (LANG === 'ru') {
    return 'russian';
  }
  if (LANG === 'ar') {
    return 'arabic';
  }
  return 'hebrew';
}

function getCityName(hebrewKey) {
  var entry = CIPO[hebrewKey];
  if (!entry) {
    return hebrewKey;
  }
  if (LANG === 'he') {
    return hebrewKey;
  }
  var field = areaFieldName();
  if (field === 'hebrew') {
    return hebrewKey;
  }
  return entry[field] || hebrewKey;
}

function getAreaName(hebrewKey) {
  var entry = CIPO[hebrewKey];
  if (!entry || !entry.area) {
    return hebrewKey;
  }
  var field = areaFieldName();
  return entry.area[field] || entry.area.hebrew || hebrewKey;
}

function getDistricts() {
  var seen = {};
  var out = [];
  for (var i = 0; i < CIPO_KEYS.length; i++) {
    var entry = CIPO[CIPO_KEYS[i]];
    if (!entry || !entry.area || !entry.area.hebrew) {
      continue;
    }
    var heb = entry.area.hebrew;
    if (seen[heb]) {
      continue;
    }
    seen[heb] = true;
    var field = areaFieldName();
    out.push({ hebrew: heb, name: entry.area[field] || heb });
  }
  return out;
}

function citiesOfArea(areaHebrew) {
  var out = [];
  for (var i = 0; i < CIPO_KEYS.length; i++) {
    var entry = CIPO[CIPO_KEYS[i]];
    if (entry && entry.area && entry.area.hebrew === areaHebrew) {
      out.push(CIPO_KEYS[i]);
    }
  }
  return out;
}

function cipoByArea(cityNames) {
  var byArea = {};
  for (var i = 0; i < cityNames.length; i++) {
    var area = getAreaName(cityNames[i]);
    if (!byArea[area]) {
      byArea[area] = [];
    }
    byArea[area].push(cityNames[i]);
  }
  return byArea;
}

function cipoMarkers(cityNames) {
  var out = [];
  for (var i = 0; i < cityNames.length; i++) {
    var entry = CIPO[cityNames[i]];
    if (!entry || entry.latitude == null || entry.longitude == null) {
      continue;
    }
    out.push({ name: cityNames[i], displayName: getCityName(cityNames[i]), lat: entry.latitude, lng: entry.longitude });
  }
  return out;
}

function cipoPolygons(cityNames) {
  var out = [];
  for (var i = 0; i < cityNames.length; i++) {
    var entry = CIPO[cityNames[i]];
    if (entry && entry.polygon && entry.polygon.length >= 3) {
      out.push(entry.polygon);
    }
  }
  return out;
}

function isWholeCountry(cityNames) {
  return cityNames.indexOf('ברחבי הארץ') !== -1;
}

function isHullDoc(doc, cityNames) {
  var cat = String(doc.cat);
  return cat === '10' || cat === '10e' || isWholeCountry(cityNames);
}

function cross(o, a, b) {
  return (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]);
}

function convexHull(points) {
  var seen = {};
  var pts = [];
  for (var i = 0; i < points.length; i++) {
    var key = points[i][0] + ',' + points[i][1];
    if (!seen[key]) {
      seen[key] = true;
      pts.push(points[i]);
    }
  }
  if (pts.length < 3) {
    return pts;
  }
  pts.sort(function(a, b) {
    if (a[1] !== b[1]) {
      return a[1] - b[1];
    }
    return a[0] - b[0];
  });
  var lower = [];
  for (var j = 0; j < pts.length; j++) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pts[j]) <= 0) {
      lower.pop();
    }
    lower.push(pts[j]);
  }
  var upper = [];
  for (var k = pts.length - 1; k >= 0; k--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pts[k]) <= 0) {
      upper.pop();
    }
    upper.push(pts[k]);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function hullPointsForCities(cityNames) {
  var points = [];
  for (var i = 0; i < cityNames.length; i++) {
    var entry = CIPO[cityNames[i]];
    if (!entry) {
      continue;
    }
    if (entry.polygon && entry.polygon.length >= 3) {
      for (var j = 0; j < entry.polygon.length; j++) {
        points.push(entry.polygon[j]);
      }
    } else if (entry.latitude != null && entry.longitude != null) {
      points.push([entry.latitude, entry.longitude]);
    }
  }
  return convexHull(points);
}

function nationalHullPoints() {
  if (NATIONAL_HULL) {
    return NATIONAL_HULL;
  }
  var points = [];
  for (var i = 0; i < CIPO_KEYS.length; i++) {
    var entry = CIPO[CIPO_KEYS[i]];
    if (!entry) {
      continue;
    }
    if (entry.polygon && entry.polygon.length >= 3) {
      for (var j = 0; j < entry.polygon.length; j++) {
        points.push(entry.polygon[j]);
      }
    } else if (entry.latitude != null && entry.longitude != null) {
      points.push([entry.latitude, entry.longitude]);
    }
  }
  NATIONAL_HULL = convexHull(points);
  return NATIONAL_HULL;
}

function catColor(cat) {
  return CAT_COLORS[String(cat)] || '#FF0000';
}

function makeIcon(color) {
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="' + color + '" stroke="#000" stroke-width="1.2"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>';
  return L.divIcon({ html: svg, className: '', iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36] });
}

function addGoogleTiles(map) {
  L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=' + LANG, { attribution: '© Google Maps' }).addTo(map);
}

function createHomeMap() {
  var map = L.map('map-home', { zoomControl: false, attributionControl: true }).setView([31.5, 34.85], 8);
  addGoogleTiles(map);
  map.setMaxBounds(L.latLngBounds([29.4, 34.2], [33.4, 35.9]));
  map.options.maxBoundsViscosity = 1.0;
  map.setMinZoom(7);
  return map;
}

function hullLayerFor(map, points, color) {
  var layer = null;
  if (points.length >= 3) {
    layer = L.polygon(points, { color: color, fillColor: color, fillOpacity: 0.25, weight: 2 }).addTo(map);
  } else if (points.length === 2) {
    layer = L.polyline(points, { color: color, weight: 3 }).addTo(map);
  } else if (points.length === 1) {
    layer = L.circleMarker(points[0], { color: color, fillColor: color, fillOpacity: 0.5, radius: 10, weight: 2 }).addTo(map);
  }
  return layer;
}

function buildHomeLayers(map, doc, filteredNames) {
  var color = catColor(doc.cat);
  var layers = [];
  var markers = [];
  if (isHullDoc(doc, filteredNames)) {
    var points = isWholeCountry(filteredNames) ? nationalHullPoints() : hullPointsForCities(filteredNames);
    var hull = hullLayerFor(map, points, color);
    if (hull) {
      layers.push(hull);
    }
    return { layers: layers, markers: markers };
  }
  var polygons = cipoPolygons(filteredNames);
  for (var i = 0; i < polygons.length; i++) {
    var poly = polygons[i];
    if (poly.length < 3) {
      continue;
    }
    layers.push(L.polygon(poly.map(function(p) { return [p[0], p[1]]; }), { color: color, fillColor: color, fillOpacity: 0.25, weight: 2 }).addTo(map));
  }
  var marks = cipoMarkers(filteredNames);
  for (var j = 0; j < marks.length; j++) {
    var m = marks[j];
    var marker = L.marker([m.lat, m.lng], { icon: makeIcon(color) }).addTo(map);
    marker._cityName = m.name;
    layers.push(marker);
    markers.push({ marker: marker, name: m.name, displayName: m.displayName });
  }
  return { layers: layers, markers: markers };
}

function createDetailMap(cityNames, cat) {
  var el = document.getElementById('alert-map');
  if (!el) {
    return null;
  }
  var color = catColor(cat);
  var markers = cipoMarkers(cityNames);
  var polygons = cipoPolygons(cityNames);
  var whole = isWholeCountry(cityNames);
  var hullDoc = String(cat) === '10' || String(cat) === '10e' || whole;
  var hullPoints = hullDoc ? (whole ? nationalHullPoints() : hullPointsForCities(cityNames)) : [];
  if (!markers.length && !polygons.length && !hullPoints.length) {
    return null;
  }
  el.style.display = 'block';
  var map = L.map('alert-map', { zoomControl: false }).setView([31.5, 34.9], 8);
  addGoogleTiles(map);
  function fixDetailMapSize() {
    map.invalidateSize();
  }
  window.addEventListener('load', fixDetailMapSize);
  setTimeout(fixDetailMapSize, 500);
  var markersByCity = {};
  var bounds = [];
  var hullLayer = null;
  if (hullDoc) {
    hullLayer = hullLayerFor(map, hullPoints, color);
    for (var h = 0; h < hullPoints.length; h++) {
      bounds.push(hullPoints[h]);
    }
  } else {
    for (var i = 0; i < polygons.length; i++) {
      var ll = polygons[i].map(function(p) { return [p[0], p[1]]; });
      L.polygon(ll, { color: color, fillColor: color, fillOpacity: 0.3, weight: 2 }).addTo(map);
      for (var j = 0; j < ll.length; j++) {
        bounds.push(ll[j]);
      }
    }
    for (var k = 0; k < markers.length; k++) {
      (function(m) {
        var popupContent = '<div style="display:flex;align-items:center;gap:4px;direction:' + (IS_RTL ? 'rtl' : 'ltr') + '"><b>' + m.displayName + '</b><span class="popup-close-btn" data-city="' + m.name + '" style="cursor:pointer;margin-' + (IS_RTL ? 'right' : 'left') + ':8px;font-weight:bold;color:#888;font-size:14px;line-height:1;">✕</span></div>';
        var marker = L.marker([m.lat, m.lng], { icon: makeIcon(color) }).addTo(map).bindPopup(popupContent, { closeButton: false });
        marker.on('popupopen', function() {
          var popupEl = marker.getPopup().getElement();
          if (popupEl) {
            popupEl.querySelectorAll('.popup-close-btn').forEach(function(btn) {
              btn.addEventListener('click', function(e) {
                e.stopPropagation();
                deactivateDetailCity();
              });
              btn.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                deactivateDetailCity();
              });
            });
          }
        });
        marker.on('popupclose', function() {
          if (_detailActiveLi && _detailActiveMarker === marker) {
            _detailActiveLi.classList.remove('active-city');
            _detailActiveLi = null;
            _detailActiveMarker = null;
          }
        });
        bounds.push([m.lat, m.lng]);
        markersByCity[m.name] = { lat: m.lat, lng: m.lng, marker: marker };
      })(markers[k]);
    }
  }
  if (bounds.length) {
    map.fitBounds(bounds, { padding: [30, 30] });
  }
  var _detailActiveLi = null;
  var _detailActiveMarker = null;
  function fitAll() {
    if (!map) {
      return;
    }
    map.closePopup();
    var b = L.latLngBounds();
    if (hullLayer && hullLayer.getBounds) {
      b.extend(hullLayer.getBounds());
    }
    Object.keys(markersByCity).forEach(function(key) {
      b.extend([markersByCity[key].lat, markersByCity[key].lng]);
    });
    if (b.isValid()) {
      map.fitBounds(b, { padding: [30, 30], animate: true });
    }
  }
  function deactivateDetailCity() {
    if (_detailActiveLi) {
      _detailActiveLi.classList.remove('active-city');
      _detailActiveLi = null;
    }
    if (_detailActiveMarker) {
      _detailActiveMarker.closePopup();
      _detailActiveMarker = null;
    }
    fitAll();
  }
  function focusCity(cityKey) {
    if (!map) {
      return;
    }
    var li = document.querySelector('#alert-content li[data-hebrew="' + cityKey.replace(/"/g, '\\"') + '"]');
    var isAlreadyActive = li && li.classList.contains('active-city');
    if (_detailActiveLi && _detailActiveLi !== li) {
      _detailActiveLi.classList.remove('active-city');
    }
    if (_detailActiveMarker) {
      _detailActiveMarker.closePopup();
      _detailActiveMarker = null;
    }
    if (isAlreadyActive) {
      if (li) {
        li.classList.remove('active-city');
      }
      _detailActiveLi = null;
      _detailActiveMarker = null;
      fitAll();
      return;
    }
    var entry = markersByCity[cityKey];
    if (!entry) {
      fitAll();
      return;
    }
    if (li) {
      li.classList.add('active-city');
      _detailActiveLi = li;
    }
    document.getElementById('alert-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
    map.setView([entry.lat, entry.lng], 13, { animate: true });
    _detailActiveMarker = entry.marker;
    entry.marker.openPopup();
  }
  function bindCityList() {
    document.querySelectorAll('#alert-content li').forEach(function(li) {
      var key = li.getAttribute('data-hebrew');
      if (!key) {
        return;
      }
      if (markersByCity[key] || hullLayer) {
        li.classList.add('clickable');
        li.style.cursor = 'pointer';
        li.addEventListener('click', function() {
          focusCity(key);
        });
        li.addEventListener('touchend', function(e) {
          e.preventDefault();
          focusCity(key);
        });
      }
    });
  }
  return { map: map, markersByCity: markersByCity, hullLayer: hullLayer, fitAll: fitAll, focusCity: focusCity, bindCityList: bindCityList };
}
