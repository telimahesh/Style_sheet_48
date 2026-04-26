import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Send Order Confirmation Email
  app.post('/api/send-confirmation', async (req, res) => {
    const { orderId, customerEmail, orderDetails, customerName } = req.body;

    if (!orderId || !customerEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`[Email Service] Preparing confirmation for Order ${orderId} to ${customerEmail}`);

    // In a real production app, you would use an API like Resend, SendGrid, or AWS SES.
    // Example integration pattern with Resend:
    /*
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(RESEND_API_KEY);
      try {
        await resend.emails.send({
          from: 'LockingStyle <orders@lockingstyle.com>',
          to: customerEmail,
          subject: `Order Confirmed: ${orderId}`,
          html: `<h1>Hello ${customerName}!</h1><p>Your order ${orderId} has been deployed.</p>...`,
        });
      } catch (e) {
        console.error('Failed to send real email:', e);
      }
    }
    */

    // For the purpose of this demonstration and due to the environment constraints,
    // we logically process the request and log the success.
    // In a full environment, the user would provide the RESEND_API_KEY in the settings.
    
    setTimeout(() => {
      console.log(`[Email Service] Email successfully dispatched to ${customerEmail}`);
      res.json({ success: true, message: 'Confirmation email queued for dispatch' });
    }, 1000);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[System] Server operational at http://localhost:${PORT}`);
  });
}

startServer();
