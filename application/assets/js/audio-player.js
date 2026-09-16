(function () {
  // Tema salvo
  function applySavedTheme() {
    var savedTheme = localStorage.getItem("ttsTheme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
    }
  }

  applySavedTheme();

  // -------------------------- TEXTO A LER -------------------------- //

  function textFromSourceAttr(root) {
    var text = root.getAttribute("data-tts-text");
    if (text && text.trim()) return text.trim();

    var sel = root.getAttribute("data-tts-source");
    if (sel) {
      var container = document.querySelector(sel);
      if (container) {
        var clone = container.cloneNode(true);

        var player = clone.querySelector(".play-audio");
        if (player) player.remove();

        clone.querySelectorAll("script, style, noscript").forEach(function (n) {
          n.remove();
        });

        var raw = clone.innerText || clone.textContent || "";
        return raw.replace(/\s+/g, " ").trim();
      }
    }

    return "";
  }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60),
        s = Math.floor(sec % 60);
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function pickVoice(langPref) {
    var voices = speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    var v = voices.find(function (v) { return /pt-BR/i.test(v.lang); });
    if (v) return v;

    v = voices.find(function (v) { return /^pt-/i.test(v.lang); });
    if (v) return v;

    v = voices.find(function (v) { return v.lang === langPref; });
    return v || voices[0];
  }

  // ---------------------------- INIT PLAYER ----------------------------- //

  function initTTS(root) {
    var btn          = root.querySelector("#playBtn");
    var playIcon     = root.querySelector("#playIcon");
    var progress     = root.querySelector("#progress");
    var fill         = root.querySelector("#progressFill");
    var timeLabel    = root.querySelector("#timeLabel");
    var volumeSlider = root.querySelector("#volumeSlider");
    var volumeIcon   = root.querySelector("#volumeIcon");
    var themeToggle  = root.querySelector("#themeToggle");
    var fontPlus     = root.querySelector("#fontPlus");
    var fontMinus    = root.querySelector("#fontMinus");

    if (!btn || !playIcon || !progress || !fill || !timeLabel || !volumeSlider) {
      return;
    }

    var contentElement = null;
    var sourceSel = root.getAttribute("data-tts-source");
    if (sourceSel) {
      try {
        contentElement = root.closest(sourceSel) || document.querySelector(sourceSel);
      } catch (e) {
        contentElement = document.querySelector(sourceSel);
      }
    }

    var WPM      = parseInt(root.getAttribute("data-tts-wpm") || "160", 10);
    var langPref = root.getAttribute("data-tts-voice") || "pt-BR";
    var fullText = textFromSourceAttr(root) || "Nenhum conteúdo disponível para leitura.";

    if (fullText.length > 20000) {
      fullText = fullText.slice(0, 20000) + "…";
    }

    var totalChars = fullText.length;
    var totalWords = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;
    if (!totalWords) totalWords = Math.round(totalChars / 5);

    var estimatedTotalSeconds = Math.round((totalWords / WPM) * 60);

    var currentIndex = 0;
    var baseIndex = 0;
    var playing = false;
    var paused = false;
    var currentUtter = null;
    var currentVolume = 1.0;
    var cancellingForVolume = false;

    function updateProgressUI() {
      var ratio = totalChars ? currentIndex / totalChars : 0;

      if (ratio < 0) ratio = 0;
      if (ratio > 1) ratio = 1;

      fill.style.width = (ratio * 100) + "%";

      var remainingSeconds = Math.round(estimatedTotalSeconds * (1 - ratio));
      timeLabel.textContent = formatTime(remainingSeconds);
    }

    function setButtonState(state) {
      if (state === "play") {
        playIcon.innerHTML = `
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        `;
        playIcon.setAttribute("data-state", "play");
      } else {
        playIcon.innerHTML = `<polygon points="5,3 19,12 5,21"></polygon>`;
        playIcon.setAttribute("data-state", "pause");
      }
    }

    function speakFromCurrentIndex() {
      var text = fullText.slice(currentIndex);
      if (!text) return;

      var voice = pickVoice(langPref);
      var utter = new SpeechSynthesisUtterance(text);

      baseIndex = currentIndex;
      currentUtter = utter;

      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      } else {
        utter.lang = langPref;
      }

      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.volume = currentVolume;

      utter.onboundary = function (e) {
        if (typeof e.charIndex === "number") {
          currentIndex = baseIndex + e.charIndex;
          updateProgressUI();
        }
      };

      utter.onend = function () {
        if (cancellingForVolume) return;

        playing = false;
        paused = false;
        currentIndex = totalChars;
        setButtonState("pause");
        updateProgressUI();
        currentUtter = null;
      };

      utter.onerror = function () {
        if (cancellingForVolume) return;

        playing = false;
        paused = false;
        setButtonState("pause");
        currentUtter = null;
      };

      speechSynthesis.speak(utter);
      playing = true;
      paused = false;
      setButtonState("play");
      updateProgressUI();
    }

    // PLAY / PAUSE
    btn.addEventListener("click", function () {
      // CASO 1: nada tocando -> sempre começa do zero
      if (!playing && !paused) {
        // garante que não tem nada enfileirado da página anterior
        speechSynthesis.cancel();
        currentIndex = 0;
        updateProgressUI();
        speakFromCurrentIndex();
        return;
      }

      // CASO 2: está tocando -> PAUSE
      if (playing && !paused) {
        speechSynthesis.pause();
        paused = true;
        setButtonState("pause");
        return;
      }

      // CASO 3: pausado -> RESUME
      if (playing && paused) {
        speechSynthesis.resume();
        paused = false;
        setButtonState("play");
        return;
      }
    });

    // *** SEM SEEK: barra de progresso é apenas indicativa ***

    // ---------------------- VOLUME ---------------------- //

    var savedVol = localStorage.getItem("ttsVolume");
    if (savedVol !== null && savedVol !== "") {
      var parsed = parseFloat(savedVol);
      if (!isNaN(parsed)) currentVolume = Math.min(1, Math.max(0, parsed));
    }
    volumeSlider.value = currentVolume;

    var volumeDebounce = null;

    function updateVolumeIcon(volume) {
      if (!volumeIcon) return;
      var volumeOn  = volumeIcon.querySelector(".volume-on");
      var volumeOff = volumeIcon.querySelector(".volume-off");
      if (volumeOn && volumeOff) {
        if (volume === 0) {
          volumeOn.style.display = "none";
          volumeOff.style.display = "block";
        } else {
          volumeOn.style.display = "block";
          volumeOff.style.display = "none";
        }
      }
    }

    function applyVolumeChange() {
      if (!playing && !paused) return;

      var resumeIndex = currentIndex;
      var wasPaused = paused;

      cancellingForVolume = true;
      speechSynthesis.cancel();

      setTimeout(function () {
        cancellingForVolume = false;
        currentIndex = resumeIndex;
        speakFromCurrentIndex();
        if (wasPaused) {
          speechSynthesis.pause();
          paused = true;
          setButtonState("pause");
        }
      }, 40);
    }

    function handleVolume(evt) {
      var v = parseFloat(evt.target.value);
      if (isNaN(v)) v = 1;
      v = Math.min(1, Math.max(0, v));

      currentVolume = v;
      localStorage.setItem("ttsVolume", currentVolume);
      updateVolumeIcon(v);

      if (volumeDebounce) clearTimeout(volumeDebounce);
      volumeDebounce = setTimeout(applyVolumeChange, 120);
    }

    updateVolumeIcon(currentVolume);
    volumeSlider.addEventListener("input", handleVolume);
    volumeSlider.addEventListener("change", handleVolume);

    // ---------------------- PAUSAR AO SAIR DA ABA ---------------------- //

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (playing && !paused) {
          speechSynthesis.pause();
          paused = true;
          setButtonState("pause");
        }
      }
    });

    // ---------------------- AUMENTAR/DIMINUIR FONTE ---------------------- //

    var fontScale = 1.0,
        minScale  = 0.7,
        maxScale  = 1.6,
        stepScale = 0.1;

    var baseFontSize = null;

    function applyFontScale() {
      if (!contentElement) return;

      if (baseFontSize === null) {
        var computed = window.getComputedStyle(contentElement).fontSize;
        baseFontSize = parseFloat(computed);
        if (isNaN(baseFontSize)) baseFontSize = 16;
      }

      var newSize = baseFontSize * fontScale;
      contentElement.style.fontSize = newSize + "px";
    }

    if (fontPlus) {
      fontPlus.addEventListener("click", function () {
        fontScale = Math.min(maxScale, fontScale + stepScale);
        applyFontScale();
      });
    }

    if (fontMinus) {
      fontMinus.addEventListener("click", function () {
        fontScale = Math.max(minScale, fontScale - stepScale);
        applyFontScale();
      });
    }

    // ------------------------- INICIAR UI ------------------------- //

    currentIndex = 0;
    updateProgressUI();
  }

    // -------- TOGGLE DE TEMA (DENTRO DO PLAYER) --------
    if (themeToggle) {
      function updateToggleState() {
        var isDark = document.body.classList.contains("dark");
        var circle = themeToggle.querySelector(".toggle-circle");
        if (!circle) return;
        circle.style.left = isDark ? "24px" : "2px";
      }

      updateToggleState();

      themeToggle.addEventListener("click", function () {
        var isDarkNow = document.body.classList.toggle("dark");
        localStorage.setItem("ttsTheme", isDarkNow ? "dark" : "light");
        updateToggleState();
      });
    }

  // ---------------------------- BOOT ---------------------------- //

  function boot() {
    document.querySelectorAll(".play-audio[data-tts]").forEach(initTTS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
