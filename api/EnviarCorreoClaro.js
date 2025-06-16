import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY); // guarda tu key en variables de entorno

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { para, cc, asunto, contenido } = req.body;

  try {
    const respuesta = await resend.emails.send({
      from: 'soporte@tudominio.com', // o cualquier correo verificado
      to: para,
      cc: cc,
      subject: asunto,
      html: contenido,
    });

    res.status(200).json({ success: true, id: respuesta.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
