const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { createTablaHTMLSeries } = require("./utilsSeries");
const resend = require("resend");

// Conexión a Supabase
const supabase = createClient('https://bsrtuievwjtzwejuxqee.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnR1aWV2d2p0endlanV4cWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTEyNjYsImV4cCI6MjA2NDEyNzI2Nn0.A9tCs-Zi-7jw5LUFs7ViIR2vHb9tNMj6c7YeeNOdmWI');

// Cliente de Resend
const resendClient = new resend.Resend("re_dHbT7BFx_LTwQP6eqY86nGCY29NPTGYJk");

router.post("/api/notificarSeries", async (req, res) => {
  try {
    // Obtener todos los registros de series_contrata
    const { data: registros, error } = await supabase
      .from("series_contrata")
      .select("*");

    if (error) throw error;

    // Agrupar por empresa
    const agrupados = {};
    for (const item of registros) {
      const empresa = item.empresa || "SIN EMPRESA";
      if (!agrupados[empresa]) agrupados[empresa] = [];
      agrupados[empresa].push(item);
    }

    // Para cada empresa, obtener sus correos y enviar resumen
    for (const [empresa, registrosEmpresa] of Object.entries(agrupados)) {
      // Consultar tabla contacto_empresa para obtener correos
      const { data: contactos, error: errorContacto } = await supabase
        .from("contacto_empresa")
        .select("correo_contacto")
        .eq("empresa", empresa);

      if (errorContacto) {
        console.error(`Error obteniendo correos de ${empresa}:`, errorContacto);
        continue;
      }

      const correos = contactos.map(c => c.correo_contacto);
      if (correos.length === 0) {
        console.warn(`⚠️ No hay correos registrados para la empresa: ${empresa}`);
        continue;
      }

      // Crear HTML del resumen
      const html = createTablaHTMLSeries(empresa, registrosEmpresa);

      // Enviar correo
      await resendClient.emails.send({
        from: "ClaroCorp+ <notificaciones@clarocorp.pe>",
        to: correos,
        subject: `📊 Resumen de estados de tus equipos - ${empresa}`,
        html,
      });
    }

    res.status(200).json({ message: "Correos enviados correctamente." });
  } catch (err) {
    console.error("❌ Error general:", err);
    res.status(500).json({ error: "Error al enviar correos." });
  }
});

module.exports = router;
