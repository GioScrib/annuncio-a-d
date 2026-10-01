/**
 * Alessandra & Damiano · Un messaggio speciale
 * Interactive Envelope Gestures, 3D Physics & Mediterranean Atmosphere
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const envelopeContainer = document.getElementById('envelope-container');
  const envelope = document.getElementById('envelope');
  const envelopeShadow = document.querySelector('.envelope-shadow');
  const envelopeTopFlap = document.getElementById('envelope-top-flap');
  const waxSeal = document.getElementById('wax-seal');
  const invitationCard = document.getElementById('invitation-card');
  const invitationImage = document.getElementById('invitation-img');
  const cardInner = document.getElementById('card-inner');
  const introHeadline = document.getElementById('intro-headline');
  const celebrationPanel = document.getElementById('celebration-panel');
  
  // Controls & Buttons
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const shareBtn = document.getElementById('share-btn');
  const addCalendarBtn = document.getElementById('add-calendar-btn');
  const calendarActionWrap = document.querySelector('.calendar-action-wrapper');
  const calendarDropdown = document.getElementById('calendar-dropdown');
  const calGoogle = document.getElementById('cal-google');
  const calAppleIcs = document.getElementById('cal-apple-ics');
  const calOutlook = document.getElementById('cal-outlook');
  
  // Lightbox & Toast
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lightboxClose = document.getElementById('lightbox-close');
  const toastNotification = document.getElementById('toast-notification');

  // Canvases
  const petalsCanvas = document.getElementById('petals-canvas');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // The gesture and the reveal have separate states so a cancelled pull never opens.
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionPreference.matches;
  let envelopeState = 'closed';
  let isEnvelopeOpened = false;
  let activePointerId = null;
  let startY = 0;
  let startX = 0;
  let pullDistance = 0;
  let keyboardPull = 0;
  let sequenceId = 0;
  let geometryPending = false;
  let envelopeHeight = 280;
  let cardHeight = 530;
  let confettiRun = 0;
  const activeAnimations = new Set();
  const paperLayers = [envelope.querySelector('.envelope-back'), envelope.querySelector('.envelope-pocket')];
  const introLead = introHeadline.querySelector('.intro-lead');
  const introSub = introHeadline.querySelector('.intro-sub');
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
    if (!isAudioPlaying) return;
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
    if (!isAudioPlaying || !audioContext) return;
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
    isAudioPlaying = !isAudioPlaying;
    audioToggleBtn.setAttribute('aria-pressed', String(isAudioPlaying));

    if (isAudioPlaying) {
      initAudioContext();
      body.classList.add('audio-playing');
      audioToggleBtn.setAttribute('aria-label', 'Disattiva musica');
      playMediterraneanAmbientMelody();
      showToast('Musica d’atmosfera attivata 🎶');
    } else {
      body.classList.remove('audio-playing');
      audioToggleBtn.setAttribute('aria-label', 'Attiva musica');
      if (audioLoopTimer) clearTimeout(audioLoopTimer);
      if (audioContext) audioContext.suspend();
      showToast('Musica disattivata');
    }
  }

  audioToggleBtn.addEventListener('click', toggleAudio);
  audioToggleBtn.setAttribute('aria-pressed', 'false');

  /* ==========================================================================
     2. Gesture & Swipe Physics ("Sbustare")
     ========================================================================== */
  function updateGeometry() {
    if (['opening', 'revealing', 'dragging'].includes(envelopeState)) {
      geometryPending = true;
      return;
    }
    envelopeHeight = envelopeContainer.clientWidth * 2 / 3;
    envelopeContainer.style.setProperty('--envelope-height', `${envelopeHeight}px`);
    cardHeight = invitationCard.offsetHeight + 24;
    envelopeContainer.style.setProperty('--card-height', `${cardHeight}px`);
    geometryPending = false;
  }

  function pullThreshold() {
    return Math.max(48, Math.min(80, envelopeHeight * 0.24));
  }

  function setEnvelopeState(state) {
    envelopeState = state;
    isEnvelopeOpened = state === 'open';
    body.classList.remove('is-dragging', 'envelope-opening', 'envelope-revealing', 'envelope-opened');
    const className = { dragging: 'is-dragging', opening: 'envelope-opening', revealing: 'envelope-revealing', open: 'envelope-opened' }[state];
    if (className) body.classList.add(className);
    envelope.classList.toggle('is-dragging-gesture', state === 'dragging');
    celebrationPanel.inert = state !== 'open';
    celebrationPanel.setAttribute('aria-hidden', String(state !== 'open'));
    invitationCard.inert = state !== 'open';
    invitationCard.tabIndex = state === 'open' ? 0 : -1;
    invitationCard.setAttribute('aria-hidden', String(state !== 'open'));
    waxSeal.setAttribute('aria-disabled', String(!['closed', 'dragging'].includes(state)));
    waxSeal.tabIndex = ['closed', 'dragging'].includes(state) ? 0 : -1;
  }

  // Commit the final frame to inline styles and release the Animation object.
  // Cancellation resolves false, allowing each awaited stage to stop cleanly.
  function animateElement(element, frames, duration, easing = 'cubic-bezier(.22,.68,.25,1)') {
    if (!element) return Promise.resolve(true);
    const finalFrame = frames[frames.length - 1];
    const commitFinalFrame = () => {
      for (const [property, value] of Object.entries(finalFrame)) {
        if (!['offset', 'easing', 'composite'].includes(property)) element.style[property] = value;
      }
    };
    if (reducedMotion || !element.animate) {
      commitFinalFrame();
      return Promise.resolve(true);
    }
    const animation = element.animate(frames, { duration, easing, fill: 'forwards' });
    activeAnimations.add(animation);
    return animation.finished.then(() => {
      commitFinalFrame();
      activeAnimations.delete(animation);
      animation.cancel();
      return true;
    }, () => {
      activeAnimations.delete(animation);
      return false;
    });
  }

  function cancelAnimations() {
    sequenceId++;
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations.clear();
  }

  function renderPull(distance) {
    pullDistance = Math.max(0, distance);
    const progress = Math.min(1, pullDistance / pullThreshold());
    envelopeTopFlap.style.transition = 'none';
    waxSeal.style.transition = 'none';
    envelopeTopFlap.style.transform = `rotateX(${progress * 65}deg)`;
    waxSeal.style.transform = `translate(-50%, -50%) translate3d(0, ${-Math.min(pullDistance, pullThreshold() * 1.3)}px, 14px) rotate(${-progress * 8}deg) scale(${1 + progress * 0.06})`;
    waxSeal.style.opacity = String(1 - progress * 0.12);
    waxSeal.style.setProperty('--pull-progress', String(progress));
    waxSeal.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    waxSeal.setAttribute('aria-valuetext', progress === 0 ? 'Sigillo chiuso' : `Sigillo sollevato al ${Math.round(progress * 100)} per cento`);
  }

  function releasePointer() {
    const pointerId = activePointerId;
    activePointerId = null;
    if (pointerId !== null && waxSeal.hasPointerCapture(pointerId)) waxSeal.releasePointerCapture(pointerId);
  }

  function onPointerDown(event) {
    if (!['closed', 'dragging'].includes(envelopeState) || activePointerId !== null || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    const continuingPull = envelopeState === 'dragging' ? keyboardPull : 0;
    cancelAnimations();
    keyboardPull = 0;
    activePointerId = event.pointerId;
    startY = event.clientY + continuingPull;
    startX = event.clientX;
    setEnvelopeState('dragging');
    waxSeal.setPointerCapture(event.pointerId);
    renderPull(continuingPull);
  }

  function onPointerMove(event) {
    if (envelopeState !== 'dragging' || event.pointerId !== activePointerId) return;
    const upward = startY - event.clientY;
    const sideways = Math.abs(event.clientX - startX);
    // The seal follows an upward pull only; horizontal and downward swipes reset it.
    renderPull(upward > sideways * 1.15 ? upward : 0);
  }

  function onPointerUp(event) {
    if (event.pointerId !== activePointerId) return;
    onPointerMove(event);
    const completedPull = pullDistance >= pullThreshold();
    releasePointer();
    if (completedPull) openEnvelope();
    else returnSealToRest();
  }

  function onPointerCancel(event) {
    if (event.pointerId !== activePointerId) return;
    releasePointer();
    returnSealToRest();
  }

  async function returnSealToRest() {
    cancelAnimations();
    const currentSequence = sequenceId;
    const flapTransform = envelopeTopFlap.style.transform || 'rotateX(0deg)';
    const sealTransform = waxSeal.style.transform || 'translate(-50%, -50%)';
    setEnvelopeState('closed');
    keyboardPull = 0;
    pullDistance = 0;
    waxSeal.setAttribute('aria-valuenow', '0');
    waxSeal.setAttribute('aria-valuetext', 'Sigillo chiuso');
    await Promise.all([
      animateElement(envelopeTopFlap, [{ transform: flapTransform }, { transform: 'rotateX(0deg)' }], 360),
      animateElement(waxSeal, [{ transform: sealTransform, opacity: waxSeal.style.opacity || '1' }, { transform: 'translate(-50%, -50%)', opacity: '1' }], 360)
    ]);
    if (sequenceId !== currentSequence) return;
    envelopeTopFlap.style.removeProperty('transition');
    waxSeal.style.removeProperty('transition');
    waxSeal.style.removeProperty('--pull-progress');
    if (geometryPending) updateGeometry();
  }

  async function openEnvelope() {
    if (envelopeState !== 'dragging') return;
    cancelAnimations();
    const currentSequence = sequenceId;
    const pullAngle = Math.min(1, pullDistance / pullThreshold()) * 65;
    setEnvelopeState('opening');
    waxSeal.style.pointerEvents = 'none';
    playOpenChime();
    if (!reducedMotion && navigator.vibrate) {
      try { navigator.vibrate(25); } catch (error) { /* Haptics are optional. */ }
    }

    const sealLift = animateElement(waxSeal, [
      { transform: waxSeal.style.transform, opacity: waxSeal.style.opacity || '1' },
      { transform: `translate(-50%, -50%) translate3d(12px, ${-pullThreshold() - 52}px, 70px) rotate(-22deg) scale(.8)`, opacity: '0' }
    ], 420);
    const edgeReached = await animateElement(envelopeTopFlap, [{ transform: `rotateX(${pullAngle}deg)` }, { transform: 'rotateX(90deg)' }], 170, 'ease-in');
    if (!edgeReached || sequenceId !== currentSequence) return;
    // Change the layer only at the edge-on frame: the triangle never jumps through paper.
    envelopeTopFlap.style.zIndex = '1';
    const flapOpened = await animateElement(envelopeTopFlap, [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(180deg)' }], 420);
    await sealLift;
    if (!flapOpened || sequenceId !== currentSequence) return;

    setEnvelopeState('revealing');
    introLead.textContent = 'Ci sposiamo!';
    introSub.textContent = 'E vogliamo festeggiare con te.';
    invitationCard.style.visibility = 'visible';
    invitationCard.style.opacity = '1';
    invitationCard.style.transition = 'none';
    invitationCard.style.zIndex = '2';
    const tucked = 'translate3d(0, 0, 2px) scale(.44) rotateZ(0deg) rotateY(0deg)';
    const raised = `translate3d(0, ${-cardHeight * .47}px, 2px) scale(.44) rotateZ(-4deg) rotateY(0deg)`;
    const released = `translate3d(0, ${-cardHeight * .5}px, 16px) scale(.48) rotateZ(-4deg) rotateY(-12deg)`;
    const lifted = await animateElement(invitationCard, [
      { transform: tucked, offset: 0 },
      { transform: raised, offset: .82 },
      { transform: released, offset: 1 }
    ], 1060, 'cubic-bezier(.35,0,.2,1)');
    if (!lifted || sequenceId !== currentSequence) return;

    invitationCard.style.zIndex = '10';
    const recessPaper = paperLayers.map(layer => animateElement(layer, [
      { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '1' },
      { transform: 'translate3d(0, 160px, -30px) scale(.88)', opacity: '0' }
    ], 760));
    const recessFlap = animateElement(envelopeTopFlap, [
      { transform: 'translate3d(0, 0, 0) rotateX(180deg) scale(1)', opacity: '1' },
      { transform: 'translate3d(0, 160px, -30px) rotateX(180deg) scale(.88)', opacity: '0' }
    ], 760);
    const recessShadow = animateElement(envelopeShadow, [{ opacity: '1' }, { opacity: '0' }], 620);
    const presented = await animateElement(invitationCard, [
      { transform: released, offset: 0 },
      { transform: 'translate3d(0, -35px, 50px) scale(1.04) rotateZ(2deg) rotateY(0deg)', offset: .68 },
      { transform: 'translate3d(0, 0, 50px) scale(1) rotateZ(0deg) rotateY(0deg)', offset: 1 }
    ], 900, 'cubic-bezier(.2,.65,.25,1)');
    await Promise.all([...recessPaper, recessFlap, recessShadow]);
    if (!presented || sequenceId !== currentSequence) return;
    setEnvelopeState('open');
    document.title = 'Alessandra & Damiano · Ci sposiamo! · 04.06.2027';
    invitationImage.alt = 'Alessandra e Damiano si sposano! 4 giugno 2027, Sicilia. Tenetevi liberi: vogliamo festeggiare con voi. L’invito ufficiale arriverà presto.';
    invitationCard.style.pointerEvents = 'auto';
    invitationCard.setAttribute('role', 'button');
    invitationCard.setAttribute('aria-label', 'Ingrandisci la partecipazione di Alessandra e Damiano');
    updateGeometry();
    invitationCard.focus({ preventScroll: true });
    const cardBottom = invitationCard.getBoundingClientRect().bottom;
    if (cardBottom > window.innerHeight - 28) {
      window.scrollBy({ top: cardBottom - window.innerHeight + 28, behavior: reducedMotion ? 'auto' : 'smooth' });
    }
    triggerConfettiBurst();
  }

  waxSeal.style.touchAction = 'none';
  waxSeal.addEventListener('pointerdown', onPointerDown);
  waxSeal.addEventListener('pointermove', onPointerMove);
  waxSeal.addEventListener('pointerup', onPointerUp);
  waxSeal.addEventListener('pointercancel', onPointerCancel);
  waxSeal.addEventListener('lostpointercapture', onPointerCancel);
  // A tap/click deliberately does nothing. ArrowUp performs the same upward pull.
  waxSeal.addEventListener('click', event => event.preventDefault());
  waxSeal.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp' && ['closed', 'dragging'].includes(envelopeState) && activePointerId === null) {
      event.preventDefault();
      cancelAnimations();
      setEnvelopeState('dragging');
      keyboardPull += pullThreshold() / 3;
      renderPull(keyboardPull);
      if (keyboardPull >= pullThreshold() - .01) openEnvelope();
    } else if (event.key === 'ArrowDown' && envelopeState === 'dragging' && activePointerId === null) {
      event.preventDefault();
      keyboardPull = Math.max(0, keyboardPull - pullThreshold() / 3);
      renderPull(keyboardPull);
      if (keyboardPull === 0) returnSealToRest();
    } else if (['Escape', 'Home'].includes(event.key) && envelopeState === 'dragging' && activePointerId === null) {
      event.preventDefault();
      returnSealToRest();
    }
  });
  waxSeal.addEventListener('blur', () => {
    if (envelopeState === 'dragging' && activePointerId === null) returnSealToRest();
  });
  window.addEventListener('blur', () => {
    if (envelopeState === 'dragging') {
      releasePointer();
      returnSealToRest();
    }
  });
  window.addEventListener('resize', updateGeometry);
  invitationCard.querySelector('img')?.addEventListener('load', updateGeometry);
  motionPreference.addEventListener('change', event => {
    reducedMotion = event.matches;
    if (reducedMotion) {
      activeAnimations.forEach(animation => animation.finish());
      confettiRun++;
      confettiCanvas.getContext('2d')?.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      cardInner.style.transform = '';
    }
  });
  setEnvelopeState('closed');
  updateGeometry();

  /* ==========================================================================
     3. 3D Card Hover / Gyroscope Tilt Effect (When opened)
     ========================================================================== */
  invitationCard.addEventListener('mousemove', (e) => {
    if (!isEnvelopeOpened || reducedMotion || !window.matchMedia('(hover: hover)').matches) return;
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
    if (!ctx) return;
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

    const numPetals = width < 600 ? 12 : 20;
    const petals = [];

    for (let i = 0; i < numPetals; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 4 + Math.random() * 7,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        speedY: 0.6 + Math.random() * 1.2,
        speedX: -0.3 + Math.random() * 0.6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        swaySpeed: 0.015 + Math.random() * 0.02,
        swayAngle: Math.random() * Math.PI * 2,
        opacity: 0.18 + Math.random() * 0.26
      });
    }

    let petalsFrame = null;
    function animatePetals() {
      petalsFrame = null;
      ctx.clearRect(0, 0, width, height);
      if (reducedMotion || document.hidden) return;

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

      petalsFrame = requestAnimationFrame(animatePetals);
    }

    function resumePetals() {
      if (petalsFrame !== null) cancelAnimationFrame(petalsFrame);
      animatePetals();
    }
    motionPreference.addEventListener('change', resumePetals);
    document.addEventListener('visibilitychange', resumePetals);
    animatePetals();
  }

  initPetalsCanvas();

  /* ==========================================================================
     5. Celebratory Sbustamento Confetti Burst Canvas
     ========================================================================== */
  function triggerConfettiBurst() {
    if (reducedMotion) return;
    const ctx = confettiCanvas.getContext('2d');
    if (!ctx) return;
    const currentRun = ++confettiRun;
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
    const count = 65;
    const cardBounds = invitationCard.getBoundingClientRect();
    const originX = cardBounds.left + cardBounds.width / 2;
    const originY = Math.min(height * 0.75, cardBounds.top + cardBounds.height * 0.35);

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
      if (!burstActive || currentRun !== confettiRun) return;
      ctx.clearRect(0, 0, width, height);
      if (reducedMotion || document.hidden) return;
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
     6. Calendar Dropdown & Export (.ics & Google Calendar)
     ========================================================================== */
  function setCalendarMenuOpen(isOpen) {
    calendarActionWrap.classList.toggle('dropdown-open', isOpen);
    addCalendarBtn.setAttribute('aria-expanded', String(isOpen));
    calendarDropdown.inert = !isOpen;
    calendarDropdown.setAttribute('aria-hidden', String(!isOpen));
  }

  addCalendarBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    setCalendarMenuOpen(addCalendarBtn.getAttribute('aria-expanded') !== 'true');
  });

  window.addEventListener('click', () => setCalendarMenuOpen(false));
  calendarActionWrap.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !calendarDropdown.inert) {
      event.preventDefault();
      setCalendarMenuOpen(false);
      addCalendarBtn.focus();
    }
  });

  // Google Calendar Link
  calGoogle.addEventListener('click', () => {
    setCalendarMenuOpen(false);
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
    setCalendarMenuOpen(false);
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
     7. Lightbox Zoom Fullscreen
     ========================================================================== */
  let lightboxTrigger = null;
  let savedBodyOverflow = '';
  let modalBackgroundState = [];
  lightboxModal.inert = true;
  lightboxModal.setAttribute('aria-hidden', 'true');

  function openLightbox() {
    if (!isEnvelopeOpened || lightboxModal.classList.contains('is-open')) return;
    lightboxTrigger = document.activeElement;
    savedBodyOverflow = body.style.overflow;
    modalBackgroundState = [...body.children]
      .filter(element => element !== lightboxModal && element !== toastNotification)
      .map(element => ({ element, inert: element.inert }));
    modalBackgroundState.forEach(({ element }) => { element.inert = true; });
    lightboxModal.inert = false;
    lightboxModal.setAttribute('aria-hidden', 'false');
    lightboxModal.classList.add('is-open');
    body.style.overflow = 'hidden';
    lightboxClose.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lightboxModal.classList.contains('is-open')) return;
    lightboxModal.classList.remove('is-open');
    lightboxModal.inert = true;
    lightboxModal.setAttribute('aria-hidden', 'true');
    body.style.overflow = savedBodyOverflow;
    modalBackgroundState.forEach(({ element, inert }) => { element.inert = inert; });
    modalBackgroundState = [];
    if (lightboxTrigger?.isConnected) lightboxTrigger.focus({ preventScroll: true });
  }

  invitationCard.addEventListener('click', () => {
    if (isEnvelopeOpened) {
      openLightbox();
    }
  });
  invitationCard.addEventListener('keydown', event => {
    if (isEnvelopeOpened && ['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      openLightbox();
    }
  });
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxBackdrop.addEventListener('click', closeLightbox);

  window.addEventListener('keydown', (e) => {
    if (!lightboxModal.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === 'Tab') {
      const focusable = [...lightboxModal.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter(element => !element.disabled && !element.inert && element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) {
        e.preventDefault();
      } else if (e.shiftKey && (document.activeElement === first || !lightboxModal.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !lightboxModal.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ==========================================================================
     8. Share Link
     ========================================================================== */
  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: 'Alessandra & Damiano · Una sorpresa per te',
      text: 'Abbiamo una cosa da dirvi... Apri la busta e scopri il nostro messaggio.',
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
     9. Toast Notification Helper
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
