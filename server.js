const http = require('http');
const fs = require('fs');
const path = require('path');

// -----------------------------------------------------------------------------
// 1. Carga de Variables de Entorno (.env)
// -----------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
      console.log('Variables de entorno cargadas desde .env');
    } catch (err) {
      console.error('Error al leer archivo .env:', err.message);
    }
  }
}

loadEnv();

const PORT = parseInt(process.env.PORT, 10) || 3000;
const RECIPIENT_PHONE = process.env.WHATSAPP_RECIPIENT_PHONE || '525564359712';
const WA_API_TOKEN = process.env.WHATSAPP_API_TOKEN ? process.env.WHATSAPP_API_TOKEN.trim() : '';
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ? process.env.WHATSAPP_PHONE_NUMBER_ID.trim() : '';

// -----------------------------------------------------------------------------
// 2. Validación y Normalización de Teléfono Mexicano
// -----------------------------------------------------------------------------
function validateMexicanPhone(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  // 1. Verificación estricta de caracteres permitidos
  const allowedCharsRegex = /^\s*(\+?\s*\(|\(?\s*\+)?[\d\s\-()]+$/;
  if (!allowedCharsRegex.test(trimmed)) {
    return false;
  }

  // El signo '+' solo puede aparecer una vez y al inicio
  const plusCount = (trimmed.match(/\+/g) || []).length;
  if (plusCount > 1) return false;
  if (plusCount === 1) {
    const plusIndex = trimmed.indexOf('+');
    const firstDigitIndex = trimmed.search(/\d/);
    if (firstDigitIndex === -1 || plusIndex > firstDigitIndex) {
      return false;
    }
  }

  // Paréntesis balanceados
  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  if (openParens !== closeParens || openParens > 2) {
    return false;
  }

  // Extraer dígitos
  const digits = trimmed.replace(/\D/g, '');

  // Con prefijo '+' (código de país +52 y 10 dígitos)
  if (trimmed.includes('+')) {
    const normalized = trimmed.replace(/[\s\(\)\-]/g, '');
    if (!normalized.startsWith('+52')) {
      return false;
    }
    if (digits.length !== 12 || !digits.startsWith('52')) {
      return false;
    }
    const nationalDigits = digits.slice(2);
    return nationalDigits.length === 10;
  }

  // Sin '+': exactamente 10 dígitos
  if (digits.length === 10) {
    return true;
  }

  // O 12 dígitos iniciando con 52 separado por espacio, guion o paréntesis
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

// -----------------------------------------------------------------------------
// 3. Directorio de Almacenamiento Local de Leads
// -----------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

function saveLeadLocally(leadData) {
  try {
    let list = [];
    if (fs.existsSync(LEADS_FILE)) {
      const raw = fs.readFileSync(LEADS_FILE, 'utf8');
      list = JSON.parse(raw || '[]');
    }
    list.push(leadData);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('Error al guardar lead en disco local:', err.message);
  }
}

// -----------------------------------------------------------------------------
// 3. Envío a WhatsApp (Make Webhook o WhatsApp Cloud API)
// -----------------------------------------------------------------------------
async function dispatchToWhatsApp(lead) {
  const timestamp = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
  
  // Mensaje estructurado para WhatsApp
  const messageBody = 
`🚨 *NUEVO PRE-DIAGNÓSTICO DESDE LA WEB*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 *Origen:* Formulario Web (normatika.com)
📅 *Fecha:* ${timestamp}

👤 *DATOS DEL SOLICITANTE:*
• *Nombre:* ${lead.nombre}
• *Teléfono / WhatsApp:* ${lead.telefono}
• *Tipo de Establecimiento:* ${lead.tipo}
• *Estado / Ubicación:* ${lead.estado}
• *Servicio de Interés:* ${lead.servicio}

📋 *CONSENTIMIENTO:*
• *Aviso de Privacidad:* Aceptado
• *Desea Novedades / Promociones:* ${lead.publicidad ? 'Sí' : 'No'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Notificación automática de Normatika Consultoría S.A.S. de C.V._`;

  // WhatsApp Business Cloud API de Meta
  if (WA_API_TOKEN && WA_PHONE_ID) {
    console.log('[WhatsApp Dispatch] Enviando mediante WhatsApp Business Cloud API...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const metaUrl = `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`;
    
    // Normalizar número telefónico
    let targetPhone = RECIPIENT_PHONE.replace(/[^\d]/g, '');

    try {
      const response = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WA_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: targetPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: messageBody
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
      const resJson = await response.json().catch(() => ({}));

      if (!response.ok || resJson.error) {
        const msg = resJson.error?.message || `HTTP ${response.status}`;
        throw new Error(`Meta WhatsApp API error: ${msg}`);
      }

      return {
        success: true,
        method: 'meta_cloud_api',
        details: 'Notificación enviada directamente a través de WhatsApp Cloud API.'
      };
    } catch (err) {
      clearTimeout(timeout);
      throw new Error(`Fallo en WhatsApp Cloud API: ${err.message}`);
    }
  }

  // Si no hay ninguna credencial configurada
  throw new Error('MISSING_CREDENTIALS');
}

// -----------------------------------------------------------------------------
// 4. Servidor HTTP (Archivos Estáticos + API REST)
// -----------------------------------------------------------------------------
const SITE_URL = process.env.SITE_URL || 'https://normatika.com';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.mov': 'video/quicktime',
  '.mp4': 'video/mp4'
};

const server = http.createServer(async (req, res) => {
  // Configurar CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = req.url.split('?')[0];

  // ---------------------------------------------------------------------------
  // Endpoint de Diagnóstico de Integración (GET /api/status)
  // ---------------------------------------------------------------------------
  if (req.method === 'GET' && urlPath === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      recipientPhone: RECIPIENT_PHONE,
      hasWhatsAppCloudApi: Boolean(WA_API_TOKEN && WA_PHONE_ID)
    }));
    return;
  }

  // ---------------------------------------------------------------------------
  // Endpoint Receptor del Formulario (POST /api/contacto)
  // ---------------------------------------------------------------------------
  if (req.method === 'POST' && (urlPath === '/api/contacto' || urlPath === '/api/pre-diagnostico')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50000) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');

        // Validaciones de campos obligatorios
        if (!data.nombre || !data.nombre.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'El nombre del profesional o director es obligatorio.' }));
          return;
        }

        if (!data.telefono || !data.telefono.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'El teléfono o WhatsApp de contacto es obligatorio.' }));
          return;
        }

        if (!validateMexicanPhone(data.telefono)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Ingresa un teléfono válido de 10 dígitos. Puedes incluir +52.' 
          }));
          return;
        }

        if (!data.tipo || !data.tipo.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Debes seleccionar el tipo de establecimiento.' }));
          return;
        }

        if (!data.estado || !data.estado.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Debes indicar el estado de la República.' }));
          return;
        }

        if (!data.servicio || !data.servicio.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Debes seleccionar el requerimiento o servicio de interés.' }));
          return;
        }

        if (!data.privacidad) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Debes aceptar el Aviso de Privacidad.' }));
          return;
        }

        // Estructurar el lead con teléfono normalizado
        const lead = {
          id: 'LEAD-' + Date.now(),
          fechaIso: new Date().toISOString(),
          nombre: data.nombre.trim(),
          tipo: data.tipo.trim(),
          estado: data.estado.trim(),
          telefono: normalizeMexicanPhone(data.telefono),
          servicio: data.servicio.trim(),
          privacidad: true,
          publicidad: Boolean(data.publicidad)
        };

        // Guardar copia de seguridad local (para que jamás se pierda ningún prospecto)
        saveLeadLocally(lead);

        // Despachar hacia WhatsApp (Make o Meta Cloud API)
        try {
          const result = await dispatchToWhatsApp(lead);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Tu pre-diagnóstico ha sido recibido y enviado directamente al equipo de WhatsApp.',
            leadId: lead.id,
            method: result.method
          }));
        } catch (dispatchErr) {
          console.error('[Error de Envío a WhatsApp]:', dispatchErr.message);

          if (dispatchErr.message === 'MISSING_CREDENTIALS') {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              code: 'MISSING_CREDENTIALS',
              error: 'El servidor no tiene configurada aún la integración con WhatsApp (falta MAKE_WEBHOOK_URL o credenciales de WhatsApp Cloud API en el archivo .env). Los datos se han respaldado en el servidor pero no pudieron enviarse a WhatsApp.',
              leadSaved: true
            }));
          } else {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              code: 'DISPATCH_FAILED',
              error: `Error al enviar a WhatsApp: ${dispatchErr.message}`,
              leadSaved: true
            }));
          }
        }
      } catch (parseErr) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Formato de datos JSON inválido.' }));
      }
    });

    return;
  }

  // ---------------------------------------------------------------------------
  // Servidor de Archivos Estáticos
  // ---------------------------------------------------------------------------
  let safePath = decodeURI(urlPath);
  if (safePath === '/') safePath = '/index.html';
  if (safePath === '/sitemap') safePath = '/sitemap.xml';
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 No encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Servidor Normatika activo en: http://localhost:${PORT}`);
  console.log(` Receptor WhatsApp: +${RECIPIENT_PHONE}`);
  console.log(` WhatsApp Cloud API configurado: ${WA_API_TOKEN && WA_PHONE_ID ? 'SÍ' : 'NO'}`);
  console.log(`====================================================`);
});
