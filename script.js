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

    // Refresh ScrollTrigger once all images and assets finish loading
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
  }

  // Ensure all cards are 100% visible immediately
  document.querySelectorAll('.feature-card, .team-card, .service-card, .step-card, .package-card').forEach(el => {
    el.style.opacity = '1';
    el.style.visibility = 'visible';
  });

  // ------------------------------------------------------------------------
  // 2. FAQ Accordion Toggle
  // ------------------------------------------------------------------------
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all FAQ items
        faqItems.forEach(el => el.classList.remove('active'));

        // Toggle clicked item
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // Open first FAQ by default
  if (faqItems.length > 0) {
    faqItems[0].classList.add('active');
  }

  // ------------------------------------------------------------------------
  // 3. Mobile Menu Navigation Toggle
  // ------------------------------------------------------------------------
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
      const icon = mobileBtn.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.textContent = navLinks.classList.contains('mobile-open') ? 'close' : 'menu';
      }
    });

    // Close menu when link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        const icon = mobileBtn.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'menu';
      });
    });
  }

  // ------------------------------------------------------------------------
  // 4. Contact Form Submission (Automated WhatsApp Backend Dispatch)
  // ------------------------------------------------------------------------
  const contactForm = document.getElementById('contact-form');

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

      // 1. Validar aceptación del Aviso de Privacidad
      const privacidadCheck = document.getElementById('form-privacidad');
      if (privacidadCheck && !privacidadCheck.checked) {
        if (statusAlert) {
          statusAlert.style.display = 'block';
          statusAlert.style.background = '#fef2f2';
          statusAlert.style.border = '1px solid #f87171';
          statusAlert.style.color = '#991b1b';
          statusAlert.innerHTML = '<strong>Aviso:</strong> Debes aceptar el Aviso de Privacidad para poder procesar tu pre-diagnóstico.';
        }
        privacidadCheck.focus();
        return;
      }

      // 2. Extraer datos del formulario
      const nombre = document.getElementById('form-nombre')?.value.trim() || '';
      const tipo = document.getElementById('form-tipo')?.value.trim() || '';
      const estado = document.getElementById('form-estado')?.value.trim() || '';
      const telefono = document.getElementById('form-telefono')?.value.trim() || '';
      const servicio = document.getElementById('form-servicio')?.value.trim() || '';
      const publicidad = document.getElementById('form-publicidad')?.checked || false;

      // 3. Activar estado de carga en el botón
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.textContent = 'ENVIANDO A WHATSAPP...';
      if (btnIcon) btnIcon.textContent = 'hourglass_top';

      try {
        const response = await fetch('/api/contacto', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre,
            tipo,
            estado,
            telefono,
            servicio,
            privacidad: true,
            publicidad
          })
        });

        const resData = await response.json().catch(() => ({}));

        if (response.ok && resData.success) {
          // ÉXITO: El servidor recibió y procesó el pre-diagnóstico
          showConfirmationModal(
            '¡Pre-Diagnóstico Enviado!',
            `Muchas gracias, ${nombre}. Tus respuestas se han enviado automáticamente a nuestro equipo de WhatsApp. En breve un especialista de Normatika Consultoría revisará tu caso para "${servicio}" y te contactará directamente.`
          );

          // Resetear el formulario solo si el envío fue exitoso
          contactForm.reset();
        } else {
          // ERROR DE SERVIDOR / CREDENCIALES FALTANTES
          // Se mantiene intacta la información en el formulario (NO se borra)
          const errorMsg = resData.error || 'No fue posible completar el envío automático. Por favor verifica tu conexión o intenta nuevamente.';
          
          if (statusAlert) {
            statusAlert.style.display = 'block';
            statusAlert.style.background = '#fffbeb';
            statusAlert.style.border = '1.5px solid #f59e0b';
            statusAlert.style.color = '#92400e';
            statusAlert.innerHTML = `
              <div style="display: flex; align-items: flex-start; gap: 0.65rem;">
                <span class="material-symbols-outlined" style="color: #d97706; font-size: 1.35rem; flex-shrink: 0;">warning</span>
                <div>
                  <strong style="display: block; font-size: 0.875rem; margin-bottom: 0.2rem;">Estado del envío:</strong>
                  <span>${errorMsg}</span>
                  <span style="display: block; font-size: 0.75rem; color: #b45309; margin-top: 0.35rem;">Tus datos no se han borrado. Puedes revisar o volver a intentar en cuanto esté lista la conexión.</span>
                </div>
              </div>
            `;
          }
        }
      } catch (networkErr) {
        // ERROR DE RED
        console.error('Error de red al enviar formulario:', networkErr);
        if (statusAlert) {
          statusAlert.style.display = 'block';
          statusAlert.style.background = '#fef2f2';
          statusAlert.style.border = '1.5px solid #f87171';
          statusAlert.style.color = '#991b1b';
          statusAlert.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 0.65rem;">
              <span class="material-symbols-outlined" style="color: #dc2626; font-size: 1.35rem; flex-shrink: 0;">wifi_off</span>
              <div>
                <strong style="display: block; font-size: 0.875rem; margin-bottom: 0.2rem;">Error de conexión:</strong>
                <span>No se pudo conectar con el servidor local. Tus datos ingresados permanecen en el formulario; por favor verifica que el servidor esté activo.</span>
              </div>
            </div>
          `;
        }
      } finally {
        // Restaurar estado del botón
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'ENVIAR PRE-DIAGNÓSTICO';
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
      if (item.getAttribute('href') === `#${current}`) {
        item.classList.add('active');
      }
    });
  });

  // ------------------------------------------------------------------------
  // 6. Interactive Video Showcase & 3D Tilt Experience
  // ------------------------------------------------------------------------
  const videoElem = document.getElementById('hero-main-video');
  const videoFrame = document.getElementById('video-frame-elem');
  const videoOverlay = document.getElementById('video-overlay-btn');
  const muteBtn = document.getElementById('video-mute-toggle');
  const muteIcon = document.getElementById('mute-icon-sym');
  const progressBar = document.getElementById('video-progress-bar');
  const videoContainer = document.getElementById('hero-video-container');
  const widgetWrapper = document.querySelector('.hero-widget-wrapper');

  if (videoElem && videoFrame) {
    // Toggle play/pause
    const togglePlayback = (e) => {
      if (e.target.closest('#video-mute-toggle')) return; // Ignore clicks on mute button
      
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
          // Ensure it is playing when unmuted
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
  }

  // High-End 3D Mouse Parallax Tilt
  if (widgetWrapper && videoContainer) {
    widgetWrapper.addEventListener('mousemove', (e) => {
      const rect = widgetWrapper.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const rotateY = x * 14; // max 7 deg
      const rotateX = -y * 14;

      videoContainer.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    widgetWrapper.addEventListener('mouseleave', () => {
      videoContainer.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  }
});
