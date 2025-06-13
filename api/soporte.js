// api.js o api/notificar-teams.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { texto } = req.body;

    const response = await fetch("https://globalhitss.webhook.office.com/webhookb2/e1541f66-6528-4f01-ba60-bdf7893d3c22@5fd5460a-b425-49de-9bd0-fcd26270d30c/IncomingWebhook/6d864cf4f63740ef99b8526f07b6c634/c86799d7-d6be-44ce-bce7-1eddc12a1672/V2ROx9KHr1XlqyMVRQxPJ05g2_P8yxBPWlddqmuzhJHDs1", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto })
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Error al enviar a Teams' });
  }
}