const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

// GET /webhook — Verificación del Webhook por Meta
router.get('/', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('[WEBHOOK] Solicitud de verificación recibida');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[WEBHOOK] Verificación exitosa. Respondiendo con challenge.');
    return res.status(200).send(challenge);
  }

  console.warn('[WEBHOOK] Token inválido o mode incorrecto. Rechazando.');
  return res.sendStatus(403);
});

// POST /webhook — Recepción de mensajes entrantes de WhatsApp
// En serverless (Vercel) el proceso muere al enviar la respuesta,
// por eso se await el insert ANTES de responder. Supabase es <200ms,
// bien dentro del timeout de 20s que permite Meta.
router.post('/', async (req, res) => {
  await procesarMensaje(req.body);
  res.sendStatus(200);
});

async function procesarMensaje(body) {
  try {
    if (body.object !== 'whatsapp_business_account') {
      console.log('[WEBHOOK] Payload ignorado: object no es whatsapp_business_account');
      return;
    }

    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      console.log('[WEBHOOK] Payload sin mensajes (puede ser status update). Ignorando.');
      return;
    }

    if (message.type !== 'text') {
      console.log(`[WEBHOOK] Tipo de mensaje no soportado: ${message.type}. Ignorando.`);
      return;
    }

    const telefono = message.from;
    const texto    = message.text.body;

    console.log(`[WEBHOOK] Mensaje recibido de ${telefono}: "${texto}"`);

    const { error } = await supabase
      .from('mensajes')
      .insert({
        telefono,
        mensaje: texto,
        origen:  'whatsapp',
        leido:   false,
      });

    if (error) {
      console.error('[SUPABASE] Error al insertar mensaje:', error.message);
    } else {
      console.log(`[SUPABASE] Mensaje de ${telefono} guardado correctamente.`);
    }
  } catch (err) {
    console.error('[WEBHOOK] Error inesperado procesando payload:', err.message);
  }
}

module.exports = router;
