import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  console.log("📩 API /api/EnviarCorreoClaro llamada");
  console.log("🔑 Clave RESEND:", process.env.RESEND_API_KEY);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { asunto, destinatario, copia, contenido } = req.body;

  if (!asunto || !destinatario || !contenido) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Soporte Portal Inventario+ <soporte@portalgestioninventario.com>',
      to: [destinatario],
       cc: Array.isArray(copia) ? copia : [], // ✅ corregido
      subject: asunto,
      html: contenido,
    });

    if (error) {
      console.error("Error Resend:", error);
      return res.status(500).json({ error: error.message || 'Error al enviar correo' });
    }

    return res.status(200).json({ message: 'Correo enviado exitosamente', data });
  } catch (err) {
    console.error("Error general:", err);
    return res.status(500).json({ error: 'Error inesperado al enviar correo' });
  }
}

