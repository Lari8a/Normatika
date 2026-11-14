// ==========================================================================
// NORMATIKA CONSULTORÍA - INTERACTIVE SCRIPT & ROBUST MOTION
// Rock-solid visibility: Nothing ever gets hidden or cut off
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // ------------------------------------------------------------------------
  // 1. Safe, Non-Destructive Motion (GSAP)
  // ------------------------------------------------------------------------
  const hasGSAP = typeof gsap !== 'undefined';
  const hasScrollTrigger = typeof ScrollTrigger !== 'undefined';

  if (hasGSAP && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // Subtle header & hero entrance that immediately clears inline styles
    gsap.from('.site-header', {
      y: -40,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      clearProps: 'all'
    });

    gsap.from('.hero-content', {
      y: 20,
      duration: 0.7,
      ease: 'power2.out',
      clearProps: 'all'
    });

    gsap.from('.hero-widget-wrapper', {
      scale: 0.95,
      duration: 0.8,
      ease: 'power2.out',
      clearProps: 'all'
    });

    // Metric counter for 5 years
    const metricsGrid = document.querySelector('.metrics-grid');
    if (metricsGrid) {
      ScrollTrigger.create({
        trigger: metricsGrid,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          const firstNum = document.querySelector('.metric-num');
          if (firstNum && firstNum.textContent.trim() === '5') {
            const countObj = { val: 0 };
            gsap.to(countObj, {
              val: 5,
              duration: 1.5,
              ease: 'power2.out',
              onUpdate: () => {
                firstNum.textContent = Math.round(countObj.val);
              }
            });
          }
        }
      });
    }

    // ScrollTrigger will be refreshed in coordination with anchor navigation on window load
  }

  // Ensure all cards are 100% visible immediately
  document.querySelectorAll('.feature-card, .team-card, .service-card, .step-card, .package-card').forEach(el => {
    el.style.opacity = '1';
    el.style.visibility = 'visible';
  });

  // ------------------------------------------------------------------------
  // 2. FAQ Accordion Toggle & ARIA Accessibility
  // ------------------------------------------------------------------------
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all FAQ items
        faqItems.forEach(el => {
          el.classList.remove('active');
          const otherBtn = el.querySelector('.faq-btn');
          if (otherBtn) {
            otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle clicked item
        if (!isActive) {
          item.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    }
  });

  // Open first FAQ by default and sync aria-expanded
  if (faqItems.length > 0) {
    faqItems[0].classList.add('active');
    const firstBtn = faqItems[0].querySelector('.faq-btn');
    if (firstBtn) {
      firstBtn.setAttribute('aria-expanded', 'true');
    }
  }

  // ------------------------------------------------------------------------
  // 3. Mobile Menu Navigation Toggle & Accessible Drawer
  // ------------------------------------------------------------------------
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  const navBackdrop = document.getElementById('nav-backdrop');

  function openMobileMenu() {
    if (!navLinks) return;
    navLinks.classList.add('mobile-open');
    if (navBackdrop) navBackdrop.classList.add('active');
    document.body.classList.add('menu-open');
    if (mobileBtn) {
      mobileBtn.setAttribute('aria-expanded', 'true');
      const icon = mobileBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = 'close';
    }
  }

  function closeMobileMenu() {
    if (!navLinks) return;
    navLinks.classList.remove('mobile-open');
    if (navBackdrop) navBackdrop.classList.remove('active');
    document.body.classList.remove('menu-open');
    if (mobileBtn) {
      mobileBtn.setAttribute('aria-expanded', 'false');
      const icon = mobileBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = 'menu';
    }
  }

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.contains('mobile-open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    // Close menu when any navigation link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMobileMenu();
      });
    });

    // Close menu when backdrop is clicked
    if (navBackdrop) {
      navBackdrop.addEventListener('click', () => {
        closeMobileMenu();
      });
    }

    // Close menu with Escape key for keyboard accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('mobile-open')) {
        closeMobileMenu();
        mobileBtn.focus();
      }
    });
  }

  // ------------------------------------------------------------------------
  // Helper: Validación y Normalización de Teléfono Mexicano
  // ------------------------------------------------------------------------
  function validateMexicanPhone(value) {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;

    // 1. Verificación estricta de caracteres permitidos:
    // Solo dígitos 0-9, espacios, guiones (-), paréntesis () y '+' inicial opcional.
    // Rechaza de inmediato letras y caracteres especiales no permitidos.
    const allowedCharsRegex = /^\s*(\+?\s*\(|\(?\s*\+)?[\d\s\-()]+$/;
    if (!allowedCharsRegex.test(trimmed)) {
      return false;
    }

    // El signo '+' solo puede aparecer una vez y debe estar al inicio antes de los dígitos
    const plusCount = (trimmed.match(/\+/g) || []).length;
    if (plusCount > 1) return false;
    if (plusCount === 1) {
      const plusIndex = trimmed.indexOf('+');
      const firstDigitIndex = trimmed.search(/\d/);
      if (firstDigitIndex === -1 || plusIndex > firstDigitIndex) {
        return false;
      }
    }

    // Paréntesis balanceados (máximo un par de apertura y cierre)
    const openParens = (trimmed.match(/\(/g) || []).length;
    const closeParens = (trimmed.match(/\)/g) || []).length;
    if (openParens !== closeParens || openParens > 2) {
      return false;
    }

    // Extraer únicamente los dígitos una vez verificados los caracteres
    const digits = trimmed.replace(/\D/g, '');

    // Caso A: Con prefijo '+' (debe ser código de país +52 y 10 dígitos nacionales)
    if (trimmed.includes('+')) {
      const normalized = trimmed.replace(/[\s\(\)\-]/g, '');
      if (!normalized.startsWith('+52')) {
        return false;
      }
      if (digits.length !== 12 || !digits.startsWith('52')) {
        return false;
      }
      const nationalDigits = digits.slice(2);
      if (nationalDigits.length !== 10) {
        return false;
      }
      return true;
    }

    // Caso B: Sin '+'
    // Exactamente 10 dígitos nacionales
    if (digits.length === 10) {
      return true;
    }

    // O 12 dígitos iniciando con 52 con separación explícita (espacio, guion o paréntesis)
    if (digits.length === 12 && digits.startsWith('52')) {
      const match52Sep = trimmed.match(/^\(?52[\s\)\-]/);
      if (match52Sep) {
        return true;
      }
    }

    return false;
  }

  function normalizeMexicanPhone(value) {
    if (!value) return '';
    const trimmed = value.trim();
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('52')) {
      return `+52 ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
    }
    if (digits.length === 10) {
      return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
    }
    return trimmed;
  }

  // ------------------------------------------------------------------------
  // 4. Contact Form Submission (Web3Forms Direct API Integration)
  // ------------------------------------------------------------------------
  const contactForm = document.getElementById('contact-form');
  const telefonoInput = document.getElementById('form-telefono');
  const telefonoError = document.getElementById('telefono-error');

  function showPhoneError(msg) {
    if (telefonoInput) {
      telefonoInput.classList.add('is-invalid');
      telefonoInput.setAttribute('aria-invalid', 'true');
    }
    if (telefonoError) {
      telefonoError.textContent = msg || 'Ingresa un teléfono válido de 10 dígitos. Puedes incluir +52.';
      telefonoError.style.display = 'block';
    }
  }

  function clearPhoneError() {
    if (telefonoInput) {
      telefonoInput.classList.remove('is-invalid');
      telefonoInput.removeAttribute('aria-invalid');
    }
    if (telefonoError) {
      telefonoError.style.display = 'none';
    }
  }

  if (telefonoInput) {
    // Al escribir, limpiar error cuando el valor sea válido o esté en corrección
    telefonoInput.addEventListener('input', () => {
      const raw = telefonoInput.value.trim();
      if (!raw) {
        clearPhoneError();
      } else if (validateMexicanPhone(raw)) {
        clearPhoneError();
      }
    });

    // Al perder el foco (blur), si el campo tiene valor o es obligatorio, validar
    telefonoInput.addEventListener('blur', () => {
      const raw = telefonoInput.value.trim();
      const isRequired = telefonoInput.hasAttribute('required') || telefonoInput.required;
      if (!raw) {
        if (isRequired) {
          showPhoneError();
        } else {
          clearPhoneError();
        }
      } else if (!validateMexicanPhone(raw)) {
        showPhoneError();
      } else {
        clearPhoneError();
      }
    });

    // Al presionar Enter en el campo de teléfono, interceptar y validar de inmediato
    telefonoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const raw = telefonoInput.value.trim();
        const isRequired = telefonoInput.hasAttribute('required') || telefonoInput.required;
        const isInvalid = !raw ? isRequired : !validateMexicanPhone(raw);
        if (isInvalid) {
          e.preventDefault();
          showPhoneError();
          telefonoInput.focus();
        }
      }
    });
  }

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('form-submit-btn');
      const btnText = document.getElementById('btn-text');
      const btnIcon = document.getElementById('btn-icon');
      const statusAlert = document.getElementById('form-status-alert');

      // Clear previous alert messages
      if (statusAlert) {
        statusAlert.style.display = 'none';
        statusAlert.innerHTML = '';
      }

      // 1. Validar campos obligatorios y teléfono
      const nombreInput = document.getElementById('form-nombre');
      const tipoInput = document.getElementById('form-tipo');
      const estadoInput = document.getElementById('form-estado');
      const servicioInput = document.getElementById('form-servicio');
      const privacidadCheck = document.getElementById('form-privacidad');
      const botcheckInput = document.getElementById('botcheck');

      const nombre = nombreInput?.value.trim() || '';
      const tipo = tipoInput?.value.trim() || '';
      const estado = estadoInput?.value.trim() || '';
      const telefono = telefonoInput?.value.trim() || '';
      const servicio = servicioInput?.value.trim() || '';

      // Validación estricta del campo de teléfono
      const isPhoneRequired = telefonoInput ? (telefonoInput.hasAttribute('required') || telefonoInput.required) : true;
      let isPhoneInvalid = false;
      if (!telefono) {
        if (isPhoneRequired) isPhoneInvalid = true;
      } else if (!validateMexicanPhone(telefono)) {
        isPhoneInvalid = true;
      }

      if (isPhoneInvalid) {
        showPhoneError('Ingresa un teléfono válido de 10 dígitos. Puedes incluir +52.');
        telefonoInput?.focus();
        return; // Detiene el envío: NO se realiza ninguna petición fetch
      } else {
        clearPhoneError();
      }

      if (!nombre || !tipo || !estado || !servicio) {
        if (statusAlert) {
          statusAlert.style.display = 'block';
          statusAlert.style.background = '#fef2f2';
          statusAlert.style.border = '1.5px solid #f87171';
          statusAlert.style.color = '#991b1b';
          statusAlert.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <span class="material-symbols-outlined" style="color: #dc2626; font-size: 1.35rem; flex-shrink: 0;">error</span>
              <span>Por favor completa todos los campos requeridos del formulario.</span>
            </div>
          `;
        }
        if (!nombre) nombreInput?.focus();
        else if (!tipo) tipoInput?.focus();
        else if (!estado) estadoInput?.focus();
        else if (!servicio) servicioInput?.focus();
        return;
      }

      // Validar aceptación obligatoria del aviso de privacidad
      if (!privacidadCheck || !privacidadCheck.checked) {
        if (statusAlert) {
          statusAlert.style.display = 'block';
          statusAlert.style.background = '#fef2f2';
          statusAlert.style.border = '1.5px solid #f87171';
          statusAlert.style.color = '#991b1b';
          statusAlert.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <span class="material-symbols-outlined" style="color: #dc2626; font-size: 1.35rem; flex-shrink: 0;">lock_clock</span>
              <span>Debes aceptar el Aviso de Privacidad para poder enviar tu solicitud.</span>
            </div>
          `;
        }
        privacidadCheck?.focus();
        return;
      }

      // 2. Activar estado de carga en el botón (mostrar "Enviando…" y desactivar)
      if (submitBtn) submitBtn.disabled = true;
      const originalText = btnText ? btnText.textContent : 'ENVIAR PRE-DIAGNÓSTICO';
      if (btnText) btnText.textContent = 'Enviando…';
      if (btnIcon) btnIcon.textContent = 'hourglass_top';

      // 3. Preparar carga útil con etiquetas claras
      const timestampMX = new Date().toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        dateStyle: 'full',
        timeStyle: 'long'
      });

      const payload = {
        access_key: '480e9075-f029-4172-8e48-5ce031768e84',
        subject: 'Nueva solicitud de pre-diagnóstico — Normatika',
        from_name: 'Página web de Normatika',
        botcheck: botcheckInput && botcheckInput.checked ? 'true' : '',
        'Nombre del profesional o director': nombre,
        'Tipo de establecimiento': tipo,
        'Estado de la República': estado,
        'Teléfono / WhatsApp de contacto': normalizeMexicanPhone(telefono),
        'Servicio o paquete de interés': servicio,
        'Aceptación del aviso de privacidad': privacidadCheck && privacidadCheck.checked ? 'Sí' : 'No',
        'Fecha y hora del envío': timestampMX
      };

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        // Comprobar tanto el estado HTTP (200) como success en la respuesta JSON
        if (response.status === 200 && data.success === true) {
          // ÉXITO: Limpiar campos, restablecer casillas y mostrar mensaje exacto
          contactForm.reset();

          if (statusAlert) {
            statusAlert.style.display = 'block';
            statusAlert.style.background = '#ecfdf5';
            statusAlert.style.border = '1.5px solid #10b981';
            statusAlert.style.color = '#065f46';
            statusAlert.innerHTML = `
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <span class="material-symbols-outlined" style="color: #059669; font-size: 1.45rem; flex-shrink: 0;">check_circle</span>
                <span style="font-size: 0.9rem; font-weight: 600;">Gracias. Recibimos tu solicitud y pronto nos pondremos en contacto contigo</span>
              </div>
            `;
          }
        } else {
          // FALLA / RECHAZO: Conservar los datos ingresados y mostrar mensaje exacto
          if (statusAlert) {
            statusAlert.style.display = 'block';
            statusAlert.style.background = '#fef2f2';
            statusAlert.style.border = '1.5px solid #f87171';
            statusAlert.style.color = '#991b1b';
            statusAlert.innerHTML = `
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <span class="material-symbols-outlined" style="color: #dc2626; font-size: 1.35rem; flex-shrink: 0;">error</span>
                <span style="font-size: 0.9rem; font-weight: 600;">No pudimos enviar tu solicitud. Inténtalo nuevamente</span>
              </div>
            `;
          }
        }
      } catch (err) {
        // ERROR DE RED / FETCH: Conservar los datos y mostrar mensaje exacto
        console.error('Error al enviar formulario a Web3Forms:', err);
        if (statusAlert) {
          statusAlert.style.display = 'block';
          statusAlert.style.background = '#fef2f2';
          statusAlert.style.border = '1.5px solid #f87171';
          statusAlert.style.color = '#991b1b';
          statusAlert.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <span class="material-symbols-outlined" style="color: #dc2626; font-size: 1.35rem; flex-shrink: 0;">wifi_off</span>
              <span style="font-size: 0.9rem; font-weight: 600;">No pudimos enviar tu solicitud. Inténtalo nuevamente</span>
            </div>
          `;
        }
      } finally {
        // Reactivar el botón para permitir reintentar
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = originalText;
        if (btnIcon) btnIcon.textContent = 'send';
      }
    });
  }

  // Modal de Confirmación de Éxito
  function showConfirmationModal(title, text) {
    const modalBg = document.createElement('div');
    modalBg.style.position = 'fixed';
    modalBg.style.inset = '0';
    modalBg.style.backgroundColor = 'rgba(20, 77, 92, 0.75)';
    modalBg.style.backdropFilter = 'blur(10px)';
    modalBg.style.zIndex = '2000';
    modalBg.style.display = 'flex';
    modalBg.style.alignItems = 'center';
    modalBg.style.justifyContent = 'center';
    modalBg.style.padding = '1.5rem';

    modalBg.innerHTML = `
      <div style="background: linear-gradient(155deg, #ffffff 0%, #f6f1f3 100%); border-radius: 1.5rem; max-width: 28rem; width: 100%; padding: 2.25rem; text-align: center; box-shadow: 0 25px 50px rgba(20, 77, 92, 0.3); border: 1.5px solid rgba(198, 178, 183, 0.6); position: relative;">
        <div style="width: 4rem; height: 4rem; border-radius: 50%; background: #d1fae5; color: #10b981; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto;">
          <span class="material-symbols-outlined" style="font-size: 2.5rem;">check_circle</span>
        </div>
        <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 800; color: #144D5C; margin-bottom: 0.5rem;">${title}</h3>
        <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9375rem; color: #516d75; line-height: 1.55; margin-bottom: 1.5rem;">${text}</p>
        <button id="close-modal-btn" class="btn btn-primary" style="width: 100%; justify-content: center; border: none; cursor: pointer; padding: 0.85rem;">Entendido</button>
      </div>
    `;

    document.body.appendChild(modalBg);

    const closeBtn = modalBg.querySelector('#close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (modalBg.parentNode) {
          modalBg.parentNode.removeChild(modalBg);
        }
      });
    }
  }

  // ------------------------------------------------------------------------
  // 5. Scroll Active Header Link Highlight
  // ------------------------------------------------------------------------
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 130;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navItems.forEach(item => {
      item.classList.remove('active');
      const itemHref = item.getAttribute('href');
      if (itemHref === `#${current}` || itemHref === `/#${current}`) {
        item.classList.add('active');
      }
    });
  });

  // ------------------------------------------------------------------------
  // 6. Interactive Video Showcase & 3D Tilt Experience
  // ------------------------------------------------------------------------
  function setupVideoPlayer(config) {
    const videoElem = document.getElementById(config.videoId);
    const videoFrame = document.getElementById(config.frameId);
    const videoOverlay = document.getElementById(config.overlayId);
    const muteBtn = document.getElementById(config.muteBtnId);
    const muteIcon = document.getElementById(config.muteIconId);
    const progressBar = document.getElementById(config.progressBarId);
    const videoContainer = document.getElementById(config.containerId);
    const wrapper = config.wrapperSelector ? document.querySelector(config.wrapperSelector) : null;

    if (!videoElem || !videoFrame) return;

    // Toggle play/pause
    const togglePlayback = (e) => {
      if (muteBtn && e.target.closest(`#${config.muteBtnId}`)) return;

      if (videoElem.paused) {
        videoElem.play().then(() => {
          if (videoOverlay) videoOverlay.classList.add('is-playing');
        }).catch(err => {
          console.warn('Playback error:', err);
        });
      } else {
        videoElem.pause();
        if (videoOverlay) videoOverlay.classList.remove('is-playing');
      }
    };

    videoFrame.addEventListener('click', togglePlayback);

    videoElem.addEventListener('play', () => {
      if (videoOverlay) videoOverlay.classList.add('is-playing');
    });

    videoElem.addEventListener('pause', () => {
      if (videoOverlay) videoOverlay.classList.remove('is-playing');
    });

    // Sound toggle
    if (muteBtn && muteIcon) {
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        videoElem.muted = !videoElem.muted;
        if (videoElem.muted) {
          muteIcon.textContent = 'volume_off';
          muteBtn.title = 'Activar sonido';
        } else {
          muteIcon.textContent = 'volume_up';
          muteBtn.title = 'Silenciar';
          if (videoElem.paused) {
            videoElem.play();
          }
        }
      });
    }

    // Video progress bar
    videoElem.addEventListener('timeupdate', () => {
      if (progressBar && videoElem.duration) {
        const pct = (videoElem.currentTime / videoElem.duration) * 100;
        progressBar.style.width = `${pct}%`;
      }
    });

    // High-End 3D Mouse Parallax Tilt
    if (wrapper && videoContainer) {
      wrapper.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        const rotateY = x * 10;
        const rotateX = -y * 10;

        videoContainer.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      wrapper.addEventListener('mouseleave', () => {
        videoContainer.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    }
  }

  // Setup About Video (Diseño sin título 3)
  setupVideoPlayer({
    videoId: 'about-main-video',
    frameId: 'about-video-frame',
    overlayId: 'about-video-overlay-btn',
    muteBtnId: 'about-mute-toggle',
    muteIconId: 'about-mute-icon',
    progressBarId: 'about-progress-bar',
    containerId: 'about-video-container',
    wrapperSelector: '.about-image-box'
  });

  // Setup Hero Video (if present)
  setupVideoPlayer({
    videoId: 'hero-main-video',
    frameId: 'video-frame-elem',
    overlayId: 'video-overlay-btn',
    muteBtnId: 'video-mute-toggle',
    muteIconId: 'mute-icon-sym',
    progressBarId: 'video-progress-bar',
    containerId: 'hero-video-container',
    wrapperSelector: '.hero-widget-wrapper'
  });

  // ------------------------------------------------------------------------
  // 7. Section Navigation & Anchor Scroll Synchronization
  // ------------------------------------------------------------------------
  // Prevent browser scrollRestoration from interfering with deep anchor targeting
  if ('scrollRestoration' in history && window.location.hash) {
    history.scrollRestoration = 'manual';
  }

  function getHeaderOffset() {
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.getBoundingClientRect().height : (window.innerWidth <= 768 ? 72 : 80);
    const buffer = window.innerWidth <= 768 ? 12 : 16;
    return headerHeight + buffer;
  }

  function scrollToHashTarget(smooth = false) {
    const hash = window.location.hash;
    if (!hash || hash === '#') return;
    try {
      const targetId = decodeURIComponent(hash.slice(1));
      if (targetId === 'inicio') {
        window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
        return;
      }
      const targetElement = document.getElementById(targetId) || document.querySelector(`[name="${targetId}"]`);
      if (!targetElement) return;

      const headerOffset = getHeaderOffset();
      const elementTop = targetElement.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
      const finalPosition = Math.max(0, elementTop - headerOffset);

      window.scrollTo({
        top: finalPosition,
        behavior: smooth ? 'smooth' : 'auto'
      });
    } catch (e) {
      console.error('Error scrolling to hash target:', e);
    }
  }

  // 1. Initial jump as soon as DOM is ready (double-rAF guarantees initial layout & paint are committed)
  if (window.location.hash) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToHashTarget(false);
      });
    });
  }

  // 2. Re-synchronize when all assets/images finish loading & ScrollTrigger refreshes
  window.addEventListener('load', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
    if (window.location.hash) {
      requestAnimationFrame(() => {
        scrollToHashTarget(false);
      });
    }
  });

  // If already complete (e.g. cached/fast load), run sync in next frame
  if (document.readyState === 'complete' && window.location.hash) {
    requestAnimationFrame(() => {
      scrollToHashTarget(false);
    });
  }

  // 3. Handle browser Back/Forward navigation and external hash changes
  window.addEventListener('hashchange', () => {
    if (window.location.hash && window.location.hash !== '#') {
      scrollToHashTarget(true);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // 4. Popstate handling for clean history navigation
  window.addEventListener('popstate', () => {
    if (window.location.hash && window.location.hash !== '#') {
      scrollToHashTarget(true);
    } else if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // 5. Smooth in-page anchor click navigation (for <a href="#..."> and <a href="/#...">)
  document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const rawHref = anchor.getAttribute('href');
      const hashIndex = rawHref.indexOf('#');
      if (hashIndex === -1) return;
      const targetId = rawHref.slice(hashIndex + 1);
      if (!targetId) return;

      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        e.preventDefault();
        const hashStr = '#' + targetId;
        if (window.location.hash !== hashStr) {
          history.pushState(null, '', hashStr);
        }
        if (targetId === 'inicio') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const headerOffset = getHeaderOffset();
          const elementTop = targetElement.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
          const finalPosition = Math.max(0, elementTop - headerOffset);
          window.scrollTo({
            top: finalPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
});
