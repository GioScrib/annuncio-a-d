/**
 * Alessandra & Damiano · Un messaggio speciale
 * Interactive Envelope Gestures & Mediterranean Atmosphere
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const envelopeContainer = document.getElementById('envelope-container');
  const envelopeScene = document.getElementById('envelope-scene');
  const backgroundPortrait = document.querySelector('.background-portrait');
  const envelope = document.getElementById('envelope');
  const envelopeShadow = document.querySelector('.envelope-shadow');
  const envelopeTopFlap = document.getElementById('envelope-top-flap');
  const waxSeal = document.getElementById('wax-seal');
  const invitationCard = document.getElementById('invitation-card');
  const invitationImage = document.getElementById('invitation-img');
  const cardInner = document.getElementById('card-inner');
  const introHeadline = document.getElementById('intro-headline');
  const invitationExperience = document.querySelector('.invitation-experience');
  const celebrationPanel = document.getElementById('celebration-panel');
  
  // Controls & Buttons
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
  let pointerStartY = 0;
  let pointerTravel = 0;
  let ignorePointerClickUntil = 0;
  let pullDistance = 0;
  let keyboardPull = 0;
  let sequenceId = 0;
  let geometryPending = false;
  let envelopeHeight = 280;
  let cardHeight = 530;
  let confettiRun = 0;
  let confettiFrame = null;
  const activeAnimations = new Set();
  const paperLayers = [envelope.querySelector('.envelope-back'), envelope.querySelector('.envelope-pocket')];

  // The top 18–54% of this portrait contains both faces. Centre that area in
  // the free space between the text and envelope, with a slight upward bias.
  function positionMobilePortrait() {
    if (!window.matchMedia('(max-width: 700px)').matches) return;
    const portraitHeight = backgroundPortrait.getBoundingClientRect().height;
    const textBottom = invitationExperience.getBoundingClientRect().top + window.scrollY + introHeadline.getBoundingClientRect().height;
    const envelopeTop = envelopeContainer.getBoundingClientRect().top + window.scrollY;
    const faceHeight = portraitHeight * .36;
    const centredFaceTop = textBottom + (envelopeTop - textBottom - faceHeight) / 2 - 16;
    const faceTop = Math.max(textBottom + 12, Math.min(centredFaceTop, envelopeTop - faceHeight - 12));
    backgroundPortrait.style.setProperty('--mobile-portrait-top', `${faceTop - portraitHeight * .18}px`);
  }

  // Fonts, viewport changes and the collapsing introduction change the free space.
  // Moving this absolute background does not resize either observed element.
  if (typeof ResizeObserver !== 'undefined') {
    const portraitObserver = new ResizeObserver(positionMobilePortrait);
    portraitObserver.observe(introHeadline);
    portraitObserver.observe(envelopeScene);
    portraitObserver.observe(invitationExperience);
  }
  window.addEventListener('resize', positionMobilePortrait);
  backgroundPortrait.addEventListener('load', positionMobilePortrait);
  document.fonts?.ready.then(positionMobilePortrait);
  positionMobilePortrait();

  /* ==========================================================================
     1. Envelope Tap, Keyboard & Swipe Gestures
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
  }

  function releasePointer() {
    const pointerId = activePointerId;
    activePointerId = null;
    if (pointerId !== null) ignorePointerClickUntil = performance.now() + 500;
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
    pointerStartY = event.clientY;
    pointerTravel = 0;
    setEnvelopeState('dragging');
    waxSeal.setPointerCapture(event.pointerId);
    renderPull(continuingPull);
  }

  function onPointerMove(event) {
    if (envelopeState !== 'dragging' || event.pointerId !== activePointerId) return;
    const upward = startY - event.clientY;
    const sideways = Math.abs(event.clientX - startX);
    pointerTravel = Math.max(pointerTravel, Math.hypot(event.clientX - startX, event.clientY - pointerStartY));
    // The seal follows an upward pull only; horizontal and downward swipes reset it.
    renderPull(upward > sideways * 1.15 ? upward : 0);
  }

  function onPointerUp(event) {
    if (event.pointerId !== activePointerId) return;
    onPointerMove(event);
    const completedPull = pullDistance >= pullThreshold();
    const tappedSeal = pointerTravel <= 10;
    releasePointer();
    if (completedPull || tappedSeal) openEnvelope();
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
    if (!['closed', 'dragging'].includes(envelopeState) || activePointerId !== null) return;
    cancelAnimations();
    const currentSequence = sequenceId;
    const flapTransform = envelopeTopFlap.style.transform || 'rotateX(0deg)';
    setEnvelopeState('opening');
    introHeadline.inert = true;
    introHeadline.setAttribute('aria-hidden', 'true');
    waxSeal.style.pointerEvents = 'none';
    if (!reducedMotion && navigator.vibrate) {
      try { navigator.vibrate(25); } catch (error) { /* Haptics are optional. */ }
    }

    const sealLift = animateElement(waxSeal, [
      { transform: waxSeal.style.transform || 'translate(-50%, -50%)', opacity: waxSeal.style.opacity || '1' },
      { transform: `translate(-50%, -50%) translate3d(0, ${-pullThreshold() - 32}px, 24px) scale(.94)`, opacity: '0' }
    ], 360);
    const edgeReached = await animateElement(envelopeTopFlap, [{ transform: flapTransform }, { transform: 'rotateX(90deg)' }], 190, 'ease-in');
    if (!edgeReached || sequenceId !== currentSequence) return;
    // Change the layer only at the edge-on frame: the triangle never jumps through paper.
    envelopeTopFlap.style.zIndex = '1';
    const flapOpened = await animateElement(envelopeTopFlap, [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(180deg)' }], 360);
    await sealLift;
    if (!flapOpened || sequenceId !== currentSequence) return;

    setEnvelopeState('revealing');
    invitationCard.style.visibility = 'visible';
    invitationCard.style.opacity = '1';
    invitationCard.style.transition = 'none';
    invitationCard.style.zIndex = '2';
    const tucked = 'translate3d(0, 0, 2px) scale(.44) rotateZ(0deg) rotateY(0deg)';
    const raised = `translate3d(0, ${-cardHeight * .48}px, 2px) scale(.44) rotateZ(0deg) rotateY(0deg)`;
    const lifted = await animateElement(invitationCard, [
      { transform: tucked },
      { transform: raised }
    ], 840, 'cubic-bezier(.35,0,.25,1)');
    if (!lifted || sequenceId !== currentSequence) return;

    invitationCard.style.zIndex = '10';
    const recessPaper = paperLayers.map(layer => animateElement(layer, [
      { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '1' },
      { transform: 'translate3d(0, 52px, -12px) scale(.96)', opacity: '0' }
    ], 650));
    const recessFlap = animateElement(envelopeTopFlap, [
      { transform: 'translate3d(0, 0, 0) rotateX(180deg) scale(1)', opacity: '1' },
      { transform: 'translate3d(0, 52px, -12px) rotateX(180deg) scale(.96)', opacity: '0' }
    ], 650);
    const recessShadow = animateElement(envelopeShadow, [{ opacity: '1' }, { opacity: '0' }], 620);
    // Close the faded introduction while the card settles into the same space.
    // Matching both movements avoids an abrupt layout jump when the reveal ends.
    introHeadline.style.overflow = 'hidden';
    const collapseIntro = animateElement(introHeadline, [
      { height: `${introHeadline.offsetHeight}px`, minHeight: '0px', marginBottom: getComputedStyle(introHeadline).marginBottom, opacity: '0' },
      { height: '0px', minHeight: '0px', marginBottom: '0px', opacity: '0' }
    ], 760, 'cubic-bezier(.25,.6,.3,1)');
    const presented = await animateElement(invitationCard, [
      { transform: raised },
      { transform: 'translate3d(0, 0, 50px) scale(1) rotateZ(0deg) rotateY(0deg)' }
    ], 760, 'cubic-bezier(.25,.6,.3,1)');
    await Promise.all([...recessPaper, recessFlap, recessShadow, collapseIntro]);
    if (!presented || sequenceId !== currentSequence) return;
    setEnvelopeState('open');
    document.title = 'Alessandra & Damiano · Ci sposiamo! · 04.06.2027';
    invitationImage.alt = 'Alessandra e Damiano si sposano! 4 giugno 2027, Sicilia. Tenetevi liberi: vogliamo festeggiare con voi. L’invito ufficiale arriverà presto.';
    invitationCard.style.pointerEvents = 'auto';
    invitationCard.setAttribute('role', 'button');
    invitationCard.setAttribute('aria-label', 'Alessandra e Damiano si sposano il 4 giugno 2027 in Sicilia. Ingrandisci la cartolina');
    updateGeometry();
    positionMobilePortrait();
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
  waxSeal.addEventListener('click', event => {
    event.preventDefault();
    // Pointer gestures are handled on release. Ignore their subsequent click,
    // including clicks after a short or cancelled drag; assistive clicks still open.
    if (performance.now() < ignorePointerClickUntil) return;
    openEnvelope();
  });
  waxSeal.addEventListener('keydown', event => {
    if (['Enter', ' '].includes(event.key) && ['closed', 'dragging'].includes(envelopeState) && activePointerId === null) {
      event.preventDefault();
      openEnvelope();
    } else if (event.key === 'ArrowUp' && ['closed', 'dragging'].includes(envelopeState) && activePointerId === null) {
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
      stopConfetti();
      cardInner.style.transform = '';
    }
  });
  setEnvelopeState('closed');
  updateGeometry();

  /* ==========================================================================
     2. Card Hover Tilt Effect (When opened)
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
     3. Floating Bougainvillea & Citrus Petals Canvas
     ========================================================================== */
  function fitCanvasToViewport(canvas, ctx) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Keep the drawing crisp without allocating a full 3x/4x mobile canvas.
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    return { width, height, pixelRatio };
  }

  function initPetalsCanvas() {
    const ctx = petalsCanvas.getContext('2d');
    if (!ctx) return;
    let { width, height } = fitCanvasToViewport(petalsCanvas, ctx);

    window.addEventListener('resize', () => {
      ({ width, height } = fitCanvasToViewport(petalsCanvas, ctx));
    });

    const petalColors = [
      '#bb6d83', // Muted bougainvillea
      '#cc8993',
      '#b97d62', // Warm terracotta
      '#b7a286',
      '#fffaf2'  // Jasmine petals
    ];

    const numPetals = width < 600 ? 10 : 16;
    const petals = [];

    for (let i = 0; i < numPetals; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 4 + Math.random() * 4,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        speedY: 18 + Math.random() * 30,
        speedX: -5 + Math.random() * 10,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.9,
        swaySpeed: 0.9 + Math.random() * 1.2,
        swayAngle: Math.random() * Math.PI * 2,
        opacity: 0.3 + Math.random() * 0.16
      });
    }

    let petalsFrame = null;
    let lastFrameTime = null;
    function animatePetals(timestamp) {
      petalsFrame = null;
      ctx.clearRect(0, 0, width, height);
      if (reducedMotion || document.hidden) return;
      const seconds = lastFrameTime === null ? 0 : Math.min((timestamp - lastFrameTime) / 1000, .04);
      lastFrameTime = timestamp;

      petals.forEach((p) => {
        p.y += p.speedY * seconds;
        p.swayAngle += p.swaySpeed * seconds;
        p.x += (Math.sin(p.swayAngle) * 24 + p.speedX) * seconds;
        p.rotation += p.rotationSpeed * seconds;

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
      lastFrameTime = null;
      animatePetals(performance.now());
    }
    motionPreference.addEventListener('change', resumePetals);
    document.addEventListener('visibilitychange', resumePetals);
    resumePetals();
  }

  initPetalsCanvas();

  /* ==========================================================================
     4. Confetti: Soft Launch, Air Resistance & Fluttering Descent
     ========================================================================== */
  function stopConfetti() {
    confettiRun++;
    if (confettiFrame !== null) cancelAnimationFrame(confettiFrame);
    confettiFrame = null;
    const ctx = confettiCanvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopConfetti();
  });

  function triggerConfettiBurst() {
    if (reducedMotion || document.hidden) return;
    const ctx = confettiCanvas.getContext('2d');
    if (!ctx) return;
    stopConfetti();
    const currentRun = ++confettiRun;
    let { width, height, pixelRatio } = fitCanvasToViewport(confettiCanvas, ctx);

    const colors = [
      '#c9a96b', '#ecd9a3', // Warm gold
      '#b87685', '#d3aaa9', // Bougainvillea
      '#9caa91', '#fdf9f1'  // Olive and ivory
    ];

    const particles = [];
    const count = width < 600 ? 60 : 80;
    const cardBounds = invitationCard.getBoundingClientRect();
    const originX = cardBounds.left + cardBounds.width / 2;
    const originY = Math.max(80, Math.min(height * 0.72, cardBounds.top + cardBounds.height * 0.28));
    const launchScale = Math.min(1, width / 600 + .25);

    for (let i = 0; i < count; i++) {
      const angle = Math.PI * (1.13 + Math.random() * .74);
      const velocity = (230 + Math.random() * 180) * launchScale;
      particles.push({
        x: originX + (Math.random() - .5) * cardBounds.width * .85,
        y: originY + (Math.random() - .5) * 24,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        gravity: 185 + Math.random() * 75,
        terminalSpeed: 95 + Math.random() * 55,
        sizeW: 5 + Math.random() * 5,
        sizeH: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - .5) * 5,
        phase: Math.random() * Math.PI * 2,
        flutter: 3 + Math.random() * 4,
        wind: 8 + Math.random() * 16,
        delay: i / count * .34,
        lifetime: 3.8 + Math.random() * 1.4
      });
    }

    const startedAt = performance.now();
    let lastFrameTime = startedAt;
    function renderConfetti(timestamp) {
      confettiFrame = null;
      if (currentRun !== confettiRun) return;
      if (reducedMotion || document.hidden) {
        stopConfetti();
        return;
      }
      if (width !== window.innerWidth || height !== window.innerHeight) {
        ({ width, height, pixelRatio } = fitCanvasToViewport(confettiCanvas, ctx));
      }
      const seconds = Math.min((timestamp - lastFrameTime) / 1000, .04);
      const elapsed = (timestamp - startedAt) / 1000;
      lastFrameTime = timestamp;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = elapsed - p.delay;
        if (age < 0) continue;
        if (age >= p.lifetime || (p.y > height + 30 && p.vy > 0) || p.x < -80 || p.x > width + 80) {
          particles.splice(i, 1);
          continue;
        }
        const step = Math.min(seconds, age);
        p.vx *= Math.exp(-1.25 * step);
        p.vy = Math.min(p.terminalSpeed, p.vy + p.gravity * step);
        p.x += (p.vx + Math.sin(age * 2 + p.phase) * p.wind) * step;
        p.y += p.vy * step;
        p.rotation += p.rotSpeed * step;

        const cos = Math.cos(p.rotation);
        const sin = Math.sin(p.rotation);
        const flutterWidth = Math.max(.15, Math.abs(Math.cos(age * p.flutter + p.phase)));
        ctx.setTransform(pixelRatio * cos, pixelRatio * sin, -pixelRatio * sin, pixelRatio * cos, pixelRatio * p.x, pixelRatio * p.y);
        ctx.globalAlpha = Math.min(1, age / .12, (p.lifetime - age) / .85) * .9;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.sizeW * flutterWidth / 2, -p.sizeH / 2, p.sizeW * flutterWidth, p.sizeH);
      }
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.globalAlpha = 1;

      if (particles.length > 0) {
        confettiFrame = requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }

    confettiFrame = requestAnimationFrame(renderConfetti);
  }

  /* ==========================================================================
     5. Calendar Dropdown & Export (.ics & Google Calendar)
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
     6. Lightbox Zoom Fullscreen
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
     7. Toast Notification Helper
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
