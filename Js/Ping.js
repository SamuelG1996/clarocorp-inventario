// /api/ping.js

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const supabaseUrl = 'https://bsrtuievwjtzwejuxqee.supabase.co';
  const supabaseKey =  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnR1aWV2d2p0endlanV4cWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTEyNjYsImV4cCI6MjA2NDEyNzI2Nn0.A9tCs-Zi-7jw5LUFs7ViIR2vHb9tNMj6c7YeeNOdmWI"
  const tableName = 'ping_log';

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ origen: 'uptimerobot' })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: "Supabase error", details: errorText });
    }

    return res.status(200).send('OK');
  } catch (error) {
    return res.status(500).json({ error: 'Error interno', details: error.message });
  }
}