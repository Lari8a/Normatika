const fs = require('fs');
const buf = fs.readFileSync('Paleta de colores Resolumed (1).pdf');
const str = buf.toString('latin1');

// Search for hex colors
const hexMatches = str.match(/#[0-9A-Fa-f]{6}/g);
const uniqueHex = hexMatches ? [...new Set(hexMatches)] : [];
console.log('HEX colors found:', JSON.stringify(uniqueHex));

// Search for PDF color streams (normalized 0-1 RGB)
const rgMatches = str.match(/[\d.]+\s+[\d.]+\s+[\d.]+\s+rg/g);
if (rgMatches) {
  const unique = [...new Set(rgMatches)];
  console.log('PDF rg streams (first 30):');
  unique.slice(0,30).forEach(c => {
    const parts = c.replace(' rg','').trim().split(/\s+/).map(Number);
    const r = Math.round(parts[0]*255);
    const g = Math.round(parts[1]*255);
    const b = Math.round(parts[2]*255);
    console.log(c, '=> rgb('+r+','+g+','+b+')');
  });
}

// Search for CMYK patterns
const cmykMatches = str.match(/[\d.]+\s+[\d.]+\s+[\d.]+\s+[\d.]+\s+k/g);
if (cmykMatches) {
  console.log('CMYK patterns:', [...new Set(cmykMatches)].slice(0,10));
}
