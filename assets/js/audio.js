var _audioCtx = null;
var _audioEl = null;
var _synthHandle = null;
var _previewAudio = null;
var _previewTimeout = null;
var _previewSynthHandle = null;
var _alertSoundPlaying = false;
var _pendingAlertSound = false;

var SYNTH_PRESETS = [
  { id: 'calm', synth: 'calm' },
  { id: 'chime', synth: 'chime' },
  { id: 'pulse', synth: 'pulse' }
];

var SOUND_NAMES = {
  he: { default: 'ברירת מחדל', siren1: 'אזעקה', siren2: 'פיקוד העורף', siren3: 'צבע אדום', calm: 'צליל רגוע', chime: 'פעמון עדין', pulse: 'פעימה עדינה' },
  en: { default: 'Default', siren1: 'Siren', siren2: 'Home Front Command', siren3: 'Red Alert', calm: 'Calm', chime: 'Soft chime', pulse: 'Soft pulse' },
  ru: { default: 'По умолчанию', siren1: 'Сирена', siren2: 'Командования тыла', siren3: 'Цева Адом', calm: 'Спокойный', chime: 'Мягкий перезвон', pulse: 'Мягкий пульс' },
  ar: { default: 'الافتراضي', siren1: 'صفارة إنذار', siren2: 'قيادة الجبهة الداخلية', siren3: 'اللون الأحمر', calm: 'هادئ', chime: 'رنين ناعم', pulse: 'نبضة ناعمة' }
};

function getAllSounds() {
  return ALERT_SOUNDS.concat(SYNTH_PRESETS);
}

function getSoundName(id) {
  var names = SOUND_NAMES[LANG] || SOUND_NAMES.he;
  return names[id] || id;
}

function getSelectedSoundId() {
  var sel = document.getElementById('sound-select');
  if (sel && sel.value) {
    return sel.value;
  }
  try {
    return localStorage.getItem('radar_sound_choice') || 'default';
  } catch (e) {
    return 'default';
  }
}

function getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
  return _audioCtx;
}

function audioUnlocked() {
  try {
    if (navigator.userActivation) {
      return navigator.userActivation.hasBeenActive;
    }
  } catch (e) {}
  return true;
}

function patternRunner(ctx) {
  var master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);
  var timers = [];
  var oscs = [];
  var stopped = false;
  function later(fn, ms) {
    var id = setTimeout(function() {
      if (!stopped) {
        fn();
      }
    }, ms);
    timers.push(id);
    return id;
  }
  function tone(freq, startTime, duration, volume, type) {
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(volume, startTime + 0.05);
    g.gain.setValueAtTime(volume, startTime + Math.max(0.05, duration - 0.12));
    g.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(g);
    g.connect(master);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    oscs.push(osc);
    return osc;
  }
  function bell(freq, startTime, duration, volume) {
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(volume, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(g);
    g.connect(master);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    oscs.push(osc);
    var o2 = ctx.createOscillator();
    var g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.value = freq * 2;
    g2.gain.setValueAtTime(volume * 0.25, startTime);
    g2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.6);
    o2.connect(g2);
    g2.connect(master);
    o2.start(startTime);
    o2.stop(startTime + duration + 0.05);
    oscs.push(o2);
  }
  function stop() {
    if (stopped) {
      return;
    }
    stopped = true;
    timers.forEach(function(id) {
      clearTimeout(id);
    });
    try {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    } catch (e) {}
    setTimeout(function() {
      oscs.forEach(function(o) {
        try {
          o.stop();
        } catch (e) {}
      });
    }, 150);
  }
  return { master: master, later: later, tone: tone, bell: bell, stop: stop };
}

function defaultPattern(ctx, r) {
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(r.master);
  osc.start();
  var beepOn = false;
  var interval = setInterval(function() {
    beepOn = !beepOn;
    osc.frequency.setValueAtTime(beepOn ? 880 : 660, ctx.currentTime);
    gain.gain.setTargetAtTime(beepOn ? 0.25 : 0, ctx.currentTime, 0.02);
  }, 300);
  return function() {
    clearInterval(interval);
    try {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    } catch (e) {}
    setTimeout(function() {
      try {
        osc.stop();
      } catch (e) {}
    }, 100);
  };
}

function startPattern(ctx, pattern) {
  var r = patternRunner(ctx);
  var extraStop = null;
  if (pattern === 'calm') {
    var notes = [523.25, 659.25, 783.99, 659.25];
    var idx = 0;
    var playNext = function() {
      var f = notes[idx % notes.length];
      idx += 1;
      r.tone(f, ctx.currentTime, 1.1, 0.07, 'sine');
      r.later(playNext, 950);
    };
    playNext();
  } else if (pattern === 'chime') {
    var figure = function() {
      var t0 = ctx.currentTime;
      r.bell(1046.5, t0, 1.4, 0.15);
      r.bell(1568.0, t0 + 0.7, 1.6, 0.12);
      r.later(figure, 2600);
    };
    figure();
  } else if (pattern === 'pulse') {
    var beat = function() {
      var t0 = ctx.currentTime;
      r.tone(660, t0, 0.16, 0.10, 'sine');
      r.tone(660, t0 + 0.38, 0.16, 0.10, 'sine');
      r.later(beat, 1500);
    };
    beat();
  } else {
    extraStop = defaultPattern(ctx, r);
  }
  return {
    stop: function() {
      if (extraStop) {
        extraStop();
      }
      r.stop();
    }
  };
}

function startSynthAlert(durationMs, pattern) {
  var ctx = getAudioCtx();
  var handle = startPattern(ctx, pattern || 'default');
  var stopTimeout = null;
  function stop() {
    if (stopTimeout) {
      clearTimeout(stopTimeout);
      stopTimeout = null;
    }
    handle.stop();
  }
  if (durationMs) {
    stopTimeout = setTimeout(stop, durationMs);
  }
  return { stop: stop };
}

function playSoundCapped(id) {
  if (_audioEl) {
    _audioEl.pause();
    _audioEl = null;
  }
  if (_synthHandle) {
    _synthHandle.stop();
    _synthHandle = null;
  }
  var all = getAllSounds();
  var entry = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) {
      entry = all[i];
    }
  }
  if (!entry) {
    entry = all[0];
  }
  if (entry.synth) {
    if (!audioUnlocked()) {
      _pendingAlertSound = true;
      return false;
    }
    var ctx = getAudioCtx();
    if (ctx.state === 'suspended') {
      _pendingAlertSound = true;
      return false;
    }
    _synthHandle = startSynthAlert(5000, entry.synth === true ? 'default' : entry.synth);
    return true;
  }
  if (!audioUnlocked()) {
    _pendingAlertSound = true;
    return false;
  }
  var audio = new Audio(entry.file);
  _audioEl = audio;
  audio.play().catch(function(err) {
    if (err && err.name === 'NotAllowedError') {
      _pendingAlertSound = true;
      _alertSoundPlaying = false;
      if (_audioEl === audio) {
        _audioEl = null;
      }
    }
  });
  setTimeout(function() {
    if (_audioEl === audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, 5000);
  return true;
}

function playAlertSound() {
  var toggle = document.getElementById('sound-toggle');
  if (!toggle || !toggle.checked) {
    return;
  }
  if (_alertSoundPlaying) {
    return;
  }
  _alertSoundPlaying = true;
  var started = playSoundCapped(getSelectedSoundId());
  if (started) {
    _pendingAlertSound = false;
    setTimeout(function() {
      _alertSoundPlaying = false;
    }, 5100);
  } else {
    _alertSoundPlaying = false;
  }
}

function hasActiveAlert() {
  return !!document.querySelector('#alerts-container .alert-block');
}

function stopAlertSound() {
  _pendingAlertSound = false;
  _alertSoundPlaying = false;
  if (_audioEl) {
    _audioEl.pause();
    _audioEl = null;
  }
  if (_synthHandle) {
    _synthHandle.stop();
    _synthHandle = null;
  }
}

function unlockAudio() {
  if (_audioCtx && _audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
  if (_pendingAlertSound) {
    var toggle = document.getElementById('sound-toggle');
    if (toggle && toggle.checked && hasActiveAlert()) {
      _pendingAlertSound = false;
      playAlertSound();
    }
  }
}

function onSoundToggleChanged(checked) {
  if (checked) {
    unlockAudio();
    if (hasActiveAlert()) {
      playAlertSound();
    }
  } else {
    stopAlertSound();
  }
}

document.addEventListener('pointerdown', unlockAudio);
document.addEventListener('keydown', unlockAudio);

function stopPreviewSound() {
  if (_previewTimeout) {
    clearTimeout(_previewTimeout);
    _previewTimeout = null;
  }
  if (_previewAudio) {
    _previewAudio.pause();
    _previewAudio.currentTime = 0;
    _previewAudio = null;
  }
  if (_previewSynthHandle) {
    _previewSynthHandle.stop();
    _previewSynthHandle = null;
  }
  var btn = document.getElementById('sound-preview-btn');
  if (btn) {
    btn.textContent = '▶';
  }
}

function isPreviewPlaying() {
  return !!(_previewAudio || _previewSynthHandle);
}

function playPreviewSound(id) {
  stopPreviewSound();
  var all = getAllSounds();
  var entry = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) {
      entry = all[i];
    }
  }
  if (!entry) {
    entry = all[0];
  }
  if (entry.synth) {
    _previewSynthHandle = startSynthAlert(null, entry.synth === true ? 'default' : entry.synth);
    _previewTimeout = setTimeout(stopPreviewSound, 5000);
  } else {
    var audio = new Audio(entry.file);
    _previewAudio = audio;
    audio.addEventListener('ended', stopPreviewSound);
    audio.play().catch(function() {});
    _previewTimeout = setTimeout(stopPreviewSound, 5000);
  }
  var btn = document.getElementById('sound-preview-btn');
  if (btn) {
    btn.textContent = '⏸';
  }
}

var _readoutQueue = [];
var _readoutAudio = null;
var _readoutTimer = null;
var _readoutDocId = null;

function readoutFileFor(cityKey) {
  var pos = cityPosition(cityKey);
  if (!pos) {
    return null;
  }
  var num = String(pos);
  while (num.length < 4) {
    num = '0' + num;
  }
  return AUDIO_BASE_URL + 'cities/C' + num + '.' + LANG + '.mp3';
}

function stopReadout(docId) {
  if (docId && _readoutDocId !== null && _readoutDocId !== docId) {
    return;
  }
  _readoutQueue = [];
  _readoutDocId = null;
  if (_readoutTimer) {
    clearTimeout(_readoutTimer);
    _readoutTimer = null;
  }
  if (_readoutAudio) {
    _readoutAudio.pause();
    _readoutAudio = null;
  }
}

function playNextReadout() {
  if (!_readoutQueue.length) {
    _readoutDocId = null;
    return;
  }
  var url = _readoutQueue.shift();
  var audio = new Audio(url);
  _readoutAudio = audio;
  var done = false;
  function next() {
    if (done) {
      return;
    }
    if (_readoutAudio !== audio) {
      return;
    }
    done = true;
    if (_readoutTimer) {
      clearTimeout(_readoutTimer);
      _readoutTimer = null;
    }
    _readoutAudio = null;
    playNextReadout();
  }
  audio.addEventListener('ended', next);
  audio.addEventListener('error', next);
  _readoutTimer = setTimeout(next, 8000);
  audio.play().catch(function() {
    if (_readoutAudio === audio) {
      next();
    }
  });
}

function startReadout(docId, cityKeys) {
  stopReadout();
  var urls = [];
  for (var i = 0; i < cityKeys.length; i++) {
    var url = readoutFileFor(cityKeys[i]);
    if (url) {
      urls.push(url);
    }
  }
  if (!urls.length) {
    return;
  }
  _readoutQueue = urls;
  _readoutDocId = docId;
  playNextReadout();
}
