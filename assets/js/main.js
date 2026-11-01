function setText(id, val) {
  var el = document.getElementById(id);
  if (el) {
    el.textContent = val;
  }
}

function setPlaceholder(id, val) {
  var el = document.getElementById(id);
  if (el) {
    el.placeholder = val;
  }
}

function applyStaticTranslations() {
  setText('site-title', t.siteTitle);
  setText('no-alerts-text', t.noAlerts);
  setText('history-link', t.toHistory);
  setText('history-back', t.backToAlerts);
  setText('history-title', t.historyTitle);
  setText('history-loading', t.historyLoading);
  setText('tab-btn-alerts', t.tabAlerts);
  setText('tab-btn-settings', t.tabSettings);
  setText('settings-target-label', t.settingsTargetLabel);
  setText('settings-target-sub', t.settingsTargetSub);
  setText('settings-sound-group-label', t.settingsSoundGroupLabel);
  setText('settings-sound-group-sub', t.settingsSoundGroupSub);
  setText('settings-areas-label', t.settingsAreasLabel);
  setText('settings-areas-sub', t.settingsAreasSub);
  setPlaceholder('area-search', t.areaSearchPlaceholder);
  setText('clear-areas-btn', t.clearSelection);
  setText('settings-cities-label', t.settingsCitiesLabel);
  setText('settings-cities-sub', t.settingsCitiesSub);
  setPlaceholder('city-search', t.cityPlaceholder);
  setText('clear-cities-btn', t.clearSelection);
  setText('settings-loc-label', t.locLabel);
  setText('settings-loc-sub', t.locSub);
  setText('loc-btn', t.locBtn);
  setText('loc-choice-city', t.locCityOnly);
  setText('loc-choice-area', t.locAreaOnly);
  setText('loc-choice-both', t.locBoth);
  setText('sound-label', t.soundLabel);
  setText('sound-sub', t.soundSub);
  setText('notif-label', t.notifLabel);
  setText('notif-sub', t.notifSub);
  setText('readout-label', t.readoutLabel);
  setText('readout-sub', t.readoutSub);
  setText('platforms-label', t.platforms);
  setPlaceholder('alert-search', t.searchPlaceholder);
  setText('legal-label', t.legalTitle);
  var legalContent = document.getElementById('legal-content');
  if (legalContent) {
    legalContent.innerHTML = legalHTML();
    initLegalTabs();
  }
  document.title = t.siteTitle;
}

function applySavedToggles() {
  try {
    var soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
      soundToggle.checked = localStorage.getItem('radar_sound') === '1';
    }
    var notifToggle = document.getElementById('notif-toggle');
    if (notifToggle) {
      notifToggle.checked = localStorage.getItem('radar_notif') === '1';
    }
    var readoutToggle = document.getElementById('readout-toggle');
    if (readoutToggle) {
      readoutToggle.checked = localStorage.getItem('radar_readout') === '1';
    }
  } catch (e) {}
}

(function boot() {
  var logoImg = document.getElementById('site-logo');
  if (logoImg) {
    logoImg.src = LOGO_URL;
  }
  var fav = document.querySelector("link[rel='icon']");
  if (!fav) {
    fav = document.createElement('link');
    fav.rel = 'icon';
    document.head.appendChild(fav);
  }
  fav.href = LOGO_URL;

  var logoLink = document.getElementById('site-logo-link');
  if (logoLink) {
    logoLink.href = './' + (LANG === 'he' ? '' : '?lang=' + LANG);
  }

  var themeBtn = document.getElementById('theme-btn');
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem('radar_theme', theme);
    } catch (e) {}
    if (themeBtn) {
      themeBtn.textContent = theme === 'light' ? '🌙' : '☀️';
    }
  }
  if (themeBtn) {
    themeBtn.title = t.themeHint;
    themeBtn.textContent = currentTheme() === 'light' ? '🌙' : '☀️';
    themeBtn.addEventListener('click', function() {
      applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
    });
  }

  var contactBtn = document.getElementById('contact-btn');
  var contactModal = document.getElementById('contact-modal');
  var contactClose = document.getElementById('contact-modal-close');
  setText('contact-modal-title', t.contactTitle);
  setText('contact-modal-text', t.contactText);
  setText('contact-modal-link', t.contactLink);
  if (contactBtn && contactModal) {
    contactBtn.title = t.contactTitle;
    contactBtn.addEventListener('click', function() {
      contactModal.style.display = 'flex';
    });
  }
  if (contactClose && contactModal) {
    contactClose.addEventListener('click', function() {
      contactModal.style.display = 'none';
    });
  }
  if (contactModal) {
    contactModal.addEventListener('click', function(e) {
      if (e.target === contactModal) {
        contactModal.style.display = 'none';
      }
    });
  }

  var langBtn = document.getElementById('lang-btn');
  var langDropdown = document.getElementById('lang-dropdown');
  if (langBtn && langDropdown) {
    langDropdown.innerHTML = SUPPORTED_LANGS.filter(function(l) {
      return l !== LANG;
    }).map(function(l) {
      return '<a class="lang-option" data-lang="' + l + '" href="' + getLangUrl(l) + '">' + LANG_NAMES[l] + '</a>';
    }).join('');
    langDropdown.addEventListener('click', function(e) {
      var a = e.target.closest ? e.target.closest('.lang-option') : null;
      if (a) {
        try {
          localStorage.setItem('radar_lang', a.getAttribute('data-lang'));
        } catch (err) {}
      }
    });
    langBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      langDropdown.style.display = langDropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', function() {
      langDropdown.style.display = 'none';
    });
  }

  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    try {
      firebase.initializeApp(firebaseConfig);
    } catch (e) {}
    try {
      db = firebase.firestore();
    } catch (e) {}
  }

  applyStaticTranslations();
  applySavedToggles();

  if (typeof updateClock === 'function') {
    updateClock();
    setInterval(updateClock, 1000);
  }

  var params = new URLSearchParams(window.location.search);
  var alertId = params.get('id');
  var histIds = params.get('histIds');
  var homeView = document.getElementById('home-view');
  var alertView = document.getElementById('alert-view');
  if (alertId) {
    if (homeView) {
      homeView.classList.remove('active');
    }
    if (alertView) {
      alertView.classList.add('active');
    }
    initAlertPage(alertId);
  } else if (histIds) {
    if (homeView) {
      homeView.classList.remove('active');
    }
    if (alertView) {
      alertView.classList.add('active');
    }
    initHistoryAlertPage(histIds.split(',').map(function(s) {
      return s.trim();
    }).filter(Boolean));
  } else {
    if (homeView) {
      homeView.classList.add('active');
    }
    initHomePage();
    loadCipo().then(function() {
      rerenderAllMapLayers();
      initSettings();
      applySelectionFilter();
    });
  }
})();
