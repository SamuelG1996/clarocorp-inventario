const express = require("express");
const router = express.Router();
const resend = require("resend");
const { createTablaHTMLSeries } = require("./utilsSeries");

const resendClient = new resend.Resend("TU_API_KEY_RENDIMIENTO");

router.post("/api/notificarSeries", async (req, res) => {
  try {
    const { dataSeries } = req.body;

    for (const [empresa, registros] of Object.entries(dataSeries)) {
      const html = createTablaHTMLSeries(empresa, registros);

      await resendClient.emails.send({
        from: "ClaroCorp+ <notificaciones@clarocorp.pe>",
        to: [`${empresa}@ejemplo.com`], // Reemplaza esto por los correos reales de cada empresa
        subject: `Resumen de estados de tus equipos - ${empresa}`,
        html,
      });
    }

    res.status(200).json({ message: "Correos enviados correctamente." });
  } catch (error) {
    console.error("Error al enviar correos:", error);
    res.status(500).json({ error: "Error al enviar correos." });
  }
});

module.exports = router;