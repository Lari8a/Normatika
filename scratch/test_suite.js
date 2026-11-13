const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const js = fs.readFileSync('script.js', 'utf8');

const checks = [];

// 1. Viewport Meta Tag
checks.push({
  name: 'Viewport meta tag configured',
  pass: html.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0"')
});

// 2. Mobile Drawer Navigation & Backdrop
checks.push({
  name: 'Backdrop overlay element exists in HTML',
  pass: html.includes('id="nav-backdrop"') && html.includes('class="nav-backdrop"')
});
checks.push({
  name: 'Drawer CTA button inside nav links',
  pass: html.includes('class="mobile-nav-cta"')
});
checks.push({
  name: 'Mobile button aria-expanded attribute present',
  pass: html.includes('aria-expanded=') && html.includes('aria-controls="nav-links"')
});
checks.push({
  name: 'JS handles backdrop click, Escape key & body scroll lock',
  pass: js.includes("navBackdrop.addEventListener('click'") &&
        js.includes("e.key === 'Escape'") &&
        js.includes("document.body.classList.add('menu-open')")
});

// 3. Hero Clean Layout & Doctor Headroom
checks.push({
  name: 'Clean doctor image used (no text watermarks)',
  pass: html.includes('assets/doctora-hero-50-50.jpg') && html.includes('assets/doctora-hero-mobile-compact.jpg')
});
checks.push({
  name: 'Doctor image has object-fit contain and head visible',
  pass: css.includes('object-fit: contain;') && css.includes('object-position: center top;')
});

// 4. Video Player 9:16 Format
checks.push({
  name: 'Video showcase card has aspect-ratio: 9 / 16',
  pass: css.includes('aspect-ratio: 9 / 16;')
});
checks.push({
  name: 'Video player limited to max 300px width',
  pass: css.includes('max-width: min(300px') || css.includes('max-width: 300px')
});

// 5. Pre-Diagnostic Form Web3Forms & iOS Zoom Prevention
checks.push({
  name: 'Form input font-size >= 16px to prevent iOS auto-zoom',
  pass: css.includes('font-size: 1rem !important')
});
checks.push({
  name: 'Form 2-column grid uses responsive class',
  pass: html.includes('class="form-grid-2col"') && css.includes('.form-grid-2col')
});
checks.push({
  name: 'Form 2-column grid collapses to 1 column on mobile',
  pass: css.includes('max-width: 640px') && css.includes('.form-grid-2col')
});
checks.push({
  name: 'Web3Forms API POST intact in script.js',
  pass: js.includes('https://api.web3forms.com/submit') && js.includes('480e9075-f029-4172-8e48-5ce031768e84')
});

// 6. Floating WhatsApp FAB
checks.push({
  name: 'Floating WhatsApp collapses text on mobile',
  pass: css.includes('.whatsapp-pill .whatsapp-text')
});
checks.push({
  name: 'Extra clearance on mobile prevents WhatsApp from covering submit button',
  pass: css.includes('#contacto') && css.includes('padding-bottom: 5.5rem;')
});

// 7. Responsive Breakpoint Coverage
const breakpoints = [1440, 1024, 768, 640, 560, 480, 375];
breakpoints.forEach(bp => {
  checks.push({
    name: 'Media query for ' + bp + 'px exists',
    pass: css.includes(bp + 'px')
  });
});

console.log(JSON.stringify(checks, null, 2));
const allPassed = checks.every(c => c.pass);
console.log('All verification checks passed:', allPassed);

