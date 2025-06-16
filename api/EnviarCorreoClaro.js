import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/** @type {import('next').NextApiHandler} */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { asunto, destinatario, copia, contenido } = req.body;

  try {
    const response = await resend.emails.send({
      from: 'Inventario Claro <no-reply@portalgestioninventario.com>',
      to: destinatario,
      cc: copia,
      subject: asunto,
      html: contenido,
    });

    console.log('✅ Email enviado:', response);
    return res.status(200).json({ success: true, message: 'Correo enviado correctamente' });
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    return res.status(500).json({ error: 'Error al enviar correo', detalle: error.message });
  }
}
