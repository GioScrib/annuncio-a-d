/**
 * Alessandra & Damiano · Annuncio di Nozze
 * Interactive Envelope Gestures, 3D Physics & Mediterranean Atmosphere
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const envelopeScene = document.getElementById('envelope-scene');
  const envelopeContainer = document.getElementById('envelope-container');
  const envelope = document.getElementById('envelope');
  const envelopeTopFlap = document.getElementById('envelope-top-flap');
  const waxSeal = document.getElementById('wax-seal');
  const invitationCard = document.getElementById('invitation-card');
  const cardInner = document.getElementById('card-inner');
  const gestureHint = document.getElementById('gesture-hint');
  const introHeadline = document.getElementById('intro-headline');
  const celebrationPanel = document.getElementById('celebration-panel');
  
  // Controls & Buttons
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const shareBtn = document.getElementById('share-btn');
  const addCalendarBtn = document.getElementById('add-calendar-btn');
  const calendarActionWrap = document.querySelector('.calendar-action-wrapper');
  const calGoogle = document.getElementById('cal-google');
  const calAppleIcs = document.getElementById('cal-apple-ics');
  const calOutlook = document.getElementById('cal-outlook');
  const zoomCardBtn = document.getElementById('zoom-card-btn');
  const reEnvelopeBtn = document.getElementById('re-envelope-btn');
  
  // Lightbox & Toast
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lightboxClose = document.getElementById('lightbox-close');
  const toastNotification = document.getElementById('toast-notification');

  // Canvases
  const petalsCanvas = document.getElementById('petals-canvas');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // State
  let isEnvelopeOpened = false;
  let isDragging = false;
  let startY = 0;
  let startX = 0;
  let currentY = 0;
  let dragDistanceY = 0;
  let dragStartTime = 0;
  let isAudioPlaying = false;
  let audioContext = null;
  let audioLoopTimer = null;

  /* ==========================================================================
     1. Sound Synthesis Engine (Web Audio API - 100% Offline & Pure)
     ========================================================================== */
  function initAudioContext() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }

  // Soft chime arpeggio upon opening ("sbustamento")
  function playOpenChime() {
    if (!audioContext) initAudioContext();
    if (!audioContext) return;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    const now = audioContext.currentTime;

    notes.forEach((freq, idx) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.3);
    });
  }

  // Soft paper rustle sound when dragging
  function playPaperRustle() {
    if (!audioContext) return;
    try {
      const now = audioContext.currentTime;
      const bufferSize = audioContext.sampleRate * 0.05;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioContext.createBufferSource();
      noise.buffer = buffer;

      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.8, now);

      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);

      noise.start(now);
    } catch (e) {
      // Audio fallback silent
    }
  }

  // Gentle romantic Mediterranean acoustic chords loop
  function playMediterraneanAmbientMelody() {
    if (!audioContext) initAudioContext();
    if (!audioContext) return;

    // Mediterranean chord progressions (warm arpeggiated nylon strings)
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // C maj 7
      [220.00, 261.63, 329.63, 440.00], // A min 7
      [174.61, 261.63, 329.63, 392.00], // F maj 7
      [196.00, 246.94, 293.66, 392.00]  // G 7
    ];

    let chordIdx = 0;

    function playNextChord() {
      if (!isAudioPlaying || !audioContext) return;
      const now = audioContext.currentTime;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach((freq, noteIdx) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        // Warm triangle/sine blend
        osc.type = noteIdx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + noteIdx * 0.22);

        gain.gain.setValueAtTime(0, now + noteIdx * 0.22);
        gain.gain.linearRampToValueAtTime(0.04, now + noteIdx * 0.22 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + noteIdx * 0.22 + 2.8);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start(now + noteIdx * 0.22);
        osc.stop(now + noteIdx * 0.22 + 3.0);
      });

      audioLoopTimer = setTimeout(playNextChord, 2800);
    }

    playNextChord();
  }

  function toggleAudio() {
    initAudioContext();
    isAudioPlaying = !isAudioPlaying;

    if (isAudioPlaying) {
      body.classList.add('audio-playing');
      audioToggleBtn.setAttribute('aria-label', 'Disattiva musica');
      playMediterraneanAmbientMelody();
      showToast('Musica d’atmosfera attivata 🎶');
    } else {
      body.classList.remove('audio-playing');
      audioToggleBtn.setAttribute('aria-label', 'Attiva musica');
      if (audioLoopTimer) clearTimeout(audioLoopTimer);
      showToast('Musica disattivata');
    }
  }

  audioToggleBtn.addEventListener('click', toggleAudio);

  /* ==========================================================================
     2. Gesture & Swipe Physics ("Sbustare")
     ========================================================================== */
  function onPointerDown(e) {
    if (isEnvelopeOpened) return;

    initAudioContext();
    isDragging = true;
    dragStartTime = Date.now();
    startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    currentY = startY;
    dragDistanceY = 0;

    body.classList.add('is-dragging');
    envelope.classList.add('is-dragging-gesture');
  }

  function onPointerMove(e) {
    if (!isDragging || isEnvelopeOpened) return;

    currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    dragDistanceY = currentY - startY;

    // We respond when dragging UPWARDS (negative dy)
    if (dragDistanceY < 0) {
      const pullUp = Math.abs(dragDistanceY);

      // Card is made visible only once the flap starts lifting
      if (pullUp > 12) {
        invitationCard.style.visibility = 'visible';
        invitationCard.style.pointerEvents = 'auto';
        const cardOpacity = Math.min(1, (pullUp - 12) / 35);
        invitationCard.style.opacity = cardOpacity;
      } else {
        invitationCard.style.visibility = 'hidden';
        invitationCard.style.opacity = '0';
        invitationCard.style.pointerEvents = 'none';
      }

      // Real-time top flap 3D angle (from 0deg up to 180deg)
      const flapAngle = Math.min(180, (pullUp / 110) * 180);
      envelopeTopFlap.style.transform = `rotateX(${flapAngle}deg)`;

      // Wax seal fades & rotates slightly
      const sealOpacity = Math.max(0, 1 - (pullUp / 90));
      const sealScale = Math.max(0.7, 1 - (pullUp / 300));
      waxSeal.style.opacity = sealOpacity;
      waxSeal.style.transform = `translateX(-50%) scale(${sealScale})`;

      // Card slides up smoothly out of pocket
      const cardShift = Math.max(-130, -pullUp * 0.9);
      invitationCard.style.transform = `translateY(${cardShift}px)`;

      // Occasional gentle rustle
      if (Math.random() < 0.1) {
        playPaperRustle();
      }
    }
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    body.classList.remove('is-dragging');
    envelope.classList.remove('is-dragging-gesture');

    if (isEnvelopeOpened) return;

    const pullUp = Math.abs(Math.min(0, dragDistanceY));
    const dragDuration = Date.now() - dragStartTime;
    const velocity = pullUp / (dragDuration || 1);

    // Threshold check: pulled up > 55px or fast flick upwards
    if (pullUp > 55 || (velocity > 0.45 && pullUp > 25)) {
      openEnvelope();
    } else {
      // Snap back to closed state
      resetEnvelopeRestingState();
    }
  }

  function resetEnvelopeRestingState() {
    envelopeTopFlap.style.transition = 'transform 0.5s var(--ease-spring)';
    envelopeTopFlap.style.transform = 'rotateX(0deg)';
    
    waxSeal.style.transition = 'all 0.4s var(--ease-spring)';
    waxSeal.style.opacity = '1';
    waxSeal.style.transform = 'translateX(-50%) scale(1)';

    invitationCard.style.transition = 'transform 0.5s var(--ease-spring), opacity 0.35s ease, visibility 0.35s ease';
    invitationCard.style.transform = 'translateY(0)';
    invitationCard.style.opacity = '0';
    invitationCard.style.visibility = 'hidden';
    invitationCard.style.pointerEvents = 'none';
  }

  // Open the envelope and extract the card
  function openEnvelope() {
    if (isEnvelopeOpened) return;
    isEnvelopeOpened = true;

    // Haptic feedback for mobile
    if (navigator.vibrate) {
      try {
        navigator.vibrate([35, 45, 65]);
      } catch (err) {}
    }

    // Play celebratory sound
    playOpenChime();

    // Visual sequence
    envelope.classList.add('flap-open');
    envelopeTopFlap.style.transform = 'rotateX(180deg)';
    envelopeTopFlap.style.zIndex = '1';

    // Show card and animate
    invitationCard.style.visibility = 'visible';
    invitationCard.style.opacity = '1';
    invitationCard.style.pointerEvents = 'auto';

    // Sbustamento climax
    setTimeout(() => {
      body.classList.add('envelope-opened');
      invitationCard.style.transform = '';
      invitationCard.style.opacity = '';
      invitationCard.style.visibility = '';
      
      // Trigger confetti & petals burst
      triggerConfettiBurst();

      // Show toast
      showToast('💌 Abbiamo una cosa da dirvi!');
    }, 320);
  }

  // Re-envelope (Riponi nella busta)
  function closeEnvelope() {
    if (!isEnvelopeOpened) return;
    isEnvelopeOpened = false;

    body.classList.remove('envelope-opened');
    envelope.classList.remove('flap-open');

    envelopeTopFlap.style.zIndex = '';
    resetEnvelopeRestingState();

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Partecipazione riposta nella busta ✉️');
  }

  // Attach Gesture Listeners to Envelope Container & Wax Seal
  envelopeContainer.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  envelopeContainer.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp, { passive: true });
  window.addEventListener('touchcancel', onPointerUp, { passive: true });

  // Direct Click/Tap on Wax Seal or Hint to Open
  waxSeal.addEventListener('click', (e) => {
    e.stopPropagation();
    openEnvelope();
  });

  gestureHint.addEventListener('click', openEnvelope);

  reEnvelopeBtn.addEventListener('click', closeEnvelope);

  /* ==========================================================================
     3. 3D Card Hover / Gyroscope Tilt Effect (When opened)
     ========================================================================== */
  invitationCard.addEventListener('mousemove', (e) => {
    if (!isEnvelopeOpened) return;
    const rect = invitationCard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6; // max 6 deg
    const rotateY = ((x - centerX) / centerX) * 6;

    cardInner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
  });

  invitationCard.addEventListener('mouseleave', () => {
    cardInner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
  });

  /* ==========================================================================
     4. Floating Bougainvillea & Citrus Petals Canvas
     ========================================================================== */
  function initPetalsCanvas() {
    const ctx = petalsCanvas.getContext('2d');
    let width = (petalsCanvas.width = window.innerWidth);
    let height = (petalsCanvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = petalsCanvas.width = window.innerWidth;
      height = petalsCanvas.height = window.innerHeight;
    });

    const petalColors = [
      '#e91e63', // Magenta Bougainvillea
      '#d81b60',
      '#c2185b',
      '#f06292', // Soft pink petal
      '#fff9c4', // Jasmine/Citrus blossom pale yellow
      '#ffffff'  // White blossom
    ];

    const numPetals = width < 600 ? 25 : 45;
    const petals = [];

    for (let i = 0; i < numPetals; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 7 + Math.random() * 11,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        speedY: 0.6 + Math.random() * 1.2,
        speedX: -0.3 + Math.random() * 0.6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        swaySpeed: 0.015 + Math.random() * 0.02,
        swayAngle: Math.random() * Math.PI * 2,
        opacity: 0.4 + Math.random() * 0.45
      });
    }

    function animatePetals() {
      ctx.clearRect(0, 0, width, height);

      petals.forEach((p) => {
        p.y += p.speedY;
        p.swayAngle += p.swaySpeed;
        p.x += Math.sin(p.swayAngle) * 0.8 + p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        // Draw organic petal curve
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.6);
        ctx.bezierCurveTo(p.size * 0.5, -p.size * 0.4, p.size * 0.6, p.size * 0.4, 0, p.size * 0.7);
        ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.4, -p.size * 0.5, -p.size * 0.4, 0, -p.size * 0.6);
        ctx.fill();

        ctx.restore();
      });

      requestAnimationFrame(animatePetals);
    }

    animatePetals();
  }

  initPetalsCanvas();

  /* ==========================================================================
     5. Celebratory Sbustamento Confetti Burst Canvas
     ========================================================================== */
  function triggerConfettiBurst() {
    const ctx = confettiCanvas.getContext('2d');
    let width = (confettiCanvas.width = window.innerWidth);
    let height = (confettiCanvas.height = window.innerHeight);

    const colors = [
      '#d4af37', '#f4df91', // Gold foil
      '#e91e63', '#d81b60', // Bougainvillea pink
      '#ffd54f', '#f9a825', // Lemon gold
      '#2e7d32', '#4caf50', // Olive leaf green
      '#ffffff'
    ];

    const particles = [];
    const count = 90;
    const originX = width / 2;
    const originY = height * 0.45;

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) + Math.PI; // Upwards cone burst
      const velocity = 8 + Math.random() * 16;
      particles.push({
        x: originX + (Math.random() - 0.5) * 80,
        y: originY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * velocity + (Math.random() - 0.5) * 6,
        vy: Math.sin(angle) * velocity - 2,
        gravity: 0.35 + Math.random() * 0.15,
        drag: 0.94,
        sizeW: 6 + Math.random() * 8,
        sizeH: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        opacity: 1
      });
    }

    let burstActive = true;
    function renderConfetti() {
      if (!burstActive) return;
      ctx.clearRect(0, 0, width, height);
      let aliveCount = 0;

      particles.forEach((p) => {
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.opacity -= 0.007;

        if (p.opacity > 0 && p.y < height + 30) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;

          ctx.fillRect(-p.sizeW / 2, -p.sizeH / 2, p.sizeW, p.sizeH);
          ctx.restore();
        }
      });

      if (aliveCount > 0) {
        requestAnimationFrame(renderConfetti);
      } else {
        burstActive = false;
        ctx.clearRect(0, 0, width, height);
      }
    }

    renderConfetti();
  }

  /* ==========================================================================
     6. Countdown Timer (Target: 4 Giugno 2027)
     ========================================================================== */
  function initCountdown() {
    const targetDate = new Date('2027-06-04T11:00:00+02:00').getTime();
    const daysEl = document.getElementById('days-val');
    const hoursEl = document.getElementById('hours-val');
    const minsEl = document.getElementById('minutes-val');
    const secsEl = document.getElementById('seconds-val');

    function updateTimer() {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        daysEl.textContent = '0';
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      daysEl.textContent = days.toString();
      hoursEl.textContent = hours.toString().padStart(2, '0');
      minsEl.textContent = mins.toString().padStart(2, '0');
      secsEl.textContent = secs.toString().padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  initCountdown();

  /* ==========================================================================
     7. Calendar Dropdown & Export (.ics & Google Calendar)
     ========================================================================== */
  addCalendarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = calendarActionWrap.classList.contains('dropdown-open');
    if (isOpen) {
      calendarActionWrap.classList.remove('dropdown-open');
      addCalendarBtn.setAttribute('aria-expanded', 'false');
    } else {
      calendarActionWrap.classList.add('dropdown-open');
      addCalendarBtn.setAttribute('aria-expanded', 'true');
    }
  });

  window.addEventListener('click', () => {
    calendarActionWrap.classList.remove('dropdown-open');
    addCalendarBtn.setAttribute('aria-expanded', 'false');
  });

  // Google Calendar Link
  calGoogle.addEventListener('click', () => {
    calendarActionWrap.classList.remove('dropdown-open');
    const title = encodeURIComponent('Matrimonio Alessandra & Damiano');
    const details = encodeURIComponent(
      'Abbiamo una cosa da dirvi... Alessandra & Damiano si sposano!\n\n04.06.2027 · Sicilia\nTenetevi liberi... vogliamo festeggiare con voi!'
    );
    const location = encodeURIComponent('Sicilia, Italia');
    // All day or 11:00 CEST to 23:59 CEST
    const dates = '20270604T090000Z/20270604T220000Z';
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(gCalUrl, '_blank', 'noopener,noreferrer');
    showToast('Apertura di Google Calendar... 📅');
  });

  // Apple Calendar & Universale (.ics file)
  function downloadIcsFile() {
    calendarActionWrap.classList.remove('dropdown-open');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Alessandra e Damiano//Matrimonio//IT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:matrimonio-alessandra-damiano-20270604@sicilia',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      'DTSTART;VALUE=DATE:20270604',
      'DTEND;VALUE=DATE:20270605',
      'SUMMARY:💍 Matrimonio Alessandra & Damiano',
      'DESCRIPTION:Abbiamo una cosa da dirvi... Alessandra & Damiano si sposano!\\n\\n04.06.27 · Sicilia\\nTenetevi liberi... vogliamo festeggiare con voi!\\nLa Sicilia ci aspetta...',
      'LOCATION:Sicilia\\, Italia',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'BEGIN:VALARM',
      'TRIGGER:-P30D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Manca 1 mese al matrimonio di Alessandra & Damiano!',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Matrimonio-Alessandra-Damiano-04-06-2027.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Promemoria scaricato! Aggiungilo al calendario 🗓️');
  }

  calAppleIcs.addEventListener('click', downloadIcsFile);
  calOutlook.addEventListener('click', downloadIcsFile);

  /* ==========================================================================
     8. Lightbox Zoom Fullscreen
     ========================================================================== */
  function openLightbox() {
    lightboxModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxModal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  zoomCardBtn.addEventListener('click', openLightbox);
  invitationCard.addEventListener('click', () => {
    if (isEnvelopeOpened) {
      openLightbox();
    }
  });
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxBackdrop.addEventListener('click', closeLightbox);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxModal.classList.contains('is-open')) {
      closeLightbox();
    }
  });

  /* ==========================================================================
     9. Share Link
     ========================================================================== */
  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: 'Alessandra & Damiano · Ci Sposiamo!',
      text: 'Abbiamo una cosa da dirvi... 04.06.27 Sicilia. Segna la data sul tuo calendario!',
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Grazie per la condivisione! ✨');
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Copy to clipboard fallback
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copiato negli appunti! Condividilo 💌');
      } catch (err) {
        showToast('Copia il link dalla barra degli indirizzi!');
      }
    }
  });

  /* ==========================================================================
     10. Toast Notification Helper
     ========================================================================== */
  let toastTimer = null;
  function showToast(message) {
    toastNotification.textContent = message;
    toastNotification.classList.add('is-visible');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.remove('is-visible');
    }, 3200);
  }
});
