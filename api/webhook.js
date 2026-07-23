const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  // If webhook secret is configured, verify signature
  if (endpointSecret && sig) {
    try {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  } else {
    event = req.body;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};

    const vehNames = { vclass: 'Mercedes V-Class', sprinter: 'Mercedes Sprinter' };
    const vehicle = vehNames[meta.vehicle] || meta.vehicle || 'N/A';

    // Build booking summary
    let route = '';
    if (meta.service === 'hourly') {
      route = vehicle + ' · ' + meta.hours + ' hours';
    } else {
      route = (meta.pickup || 'Zone ' + meta.from) + ' → ' + (meta.dropoff || 'Zone ' + meta.to);
      route += ' · ' + (meta.trip === 'round' ? 'Round trip' : 'One way');
    }

    const amount = (session.amount_total / 100).toFixed(0);
    const currency = (session.currency || 'eur').toUpperCase();

    // Internal notification message for Rafael
    const internalMsg = [
      '🚨 NEW BOOKING — Serendipity Travel Ibiza',
      '',
      '👤 ' + (meta.guest_name || 'N/A'),
      '📧 ' + (session.customer_email || meta.email || 'N/A'),
      '📱 ' + (meta.phone || 'N/A'),
      '',
      '🚘 ' + vehicle,
      '📍 ' + route,
      '📅 ' + (meta.date || 'N/A') + ' ' + (meta.time || ''),
      '👥 ' + (meta.pax || 'N/A') + ' passengers',
      '✈️ Flight: ' + (meta.flight || '—'),
      '🧭 Direction: ' + (meta.direction || '—'),
      '',
      '💰 €' + amount + ' ' + currency + ' — Paid by card (Stripe)',
      '🔖 Ref: ' + (session.id || '').slice(-8),
      '',
      '📝 Notes: ' + (meta.notes || '—'),
      '',
      '⚡ Action required: Book with provider.',
    ].join('\n');

    // Customer confirmation email
    const lang = meta.lang || 'en';
    const T = {
      en: {
        subject: 'Booking Confirmed — Serendipity Travel Ibiza',
        greeting: 'Dear ' + (meta.guest_name || 'Guest'),
        confirmed: 'Your transfer has been confirmed! Here are your booking details:',
        vehicle: 'Vehicle',
        route: 'Route',
        date: 'Date',
        time: 'Time',
        pax: 'Passengers',
        flight: 'Flight',
        paid: 'Paid',
        tip: '✈️ For airport departures, we recommend leaving your accommodation at least 3 hours before your flight.',
        chauffeur: 'Your chauffeur details will be sent 24 hours before your transfer.',
        changes: 'Need to make changes? Contact us:',
        thanks: 'Thank you for choosing Serendipity Travel Ibiza!',
      },
      es: {
        subject: 'Reserva Confirmada — Serendipity Travel Ibiza',
        greeting: 'Estimado/a ' + (meta.guest_name || 'Huésped'),
        confirmed: '¡Tu traslado ha sido confirmado! Aquí están los detalles de tu reserva:',
        vehicle: 'Vehículo',
        route: 'Ruta',
        date: 'Fecha',
        time: 'Hora',
        pax: 'Pasajeros',
        flight: 'Vuelo',
        paid: 'Pagado',
        tip: '✈️ Para salidas de aeropuerto, recomendamos salir de tu alojamiento al menos 3 horas antes de tu vuelo.',
        chauffeur: 'Los datos de tu chofer se enviarán 24 horas antes de tu traslado.',
        changes: '¿Necesitas hacer cambios? Contáctanos:',
        thanks: '¡Gracias por elegir Serendipity Travel Ibiza!',
      },
      fr: {
        subject: 'Réservation Confirmée — Serendipity Travel Ibiza',
        greeting: 'Cher(e) ' + (meta.guest_name || 'Client'),
        confirmed: 'Votre transfert est confirmé ! Voici les détails de votre réservation :',
        vehicle: 'Véhicule',
        route: 'Trajet',
        date: 'Date',
        time: 'Heure',
        pax: 'Passagers',
        flight: 'Vol',
        paid: 'Payé',
        tip: "✈️ Pour les départs d'aéroport, nous recommandons de quitter votre logement au moins 3 heures avant votre vol.",
        chauffeur: 'Les détails de votre chauffeur vous seront envoyés 24 heures avant votre transfert.',
        changes: 'Besoin de modifier ? Contactez-nous :',
        thanks: "Merci d'avoir choisi Serendipity Travel Ibiza !",
      },
      de: {
        subject: 'Buchung Bestätigt — Serendipity Travel Ibiza',
        greeting: 'Sehr geehrte/r ' + (meta.guest_name || 'Gast'),
        confirmed: 'Ihr Transfer ist bestätigt! Hier sind Ihre Buchungsdetails:',
        vehicle: 'Fahrzeug',
        route: 'Route',
        date: 'Datum',
        time: 'Uhrzeit',
        pax: 'Personen',
        flight: 'Flug',
        paid: 'Bezahlt',
        tip: '✈️ Bei Abflügen empfehlen wir, Ihre Unterkunft mindestens 3 Stunden vor dem Flug zu verlassen.',
        chauffeur: 'Die Details Ihres Chauffeurs werden 24 Stunden vor Ihrem Transfer gesendet.',
        changes: 'Änderungen nötig? Kontaktieren Sie uns:',
        thanks: 'Vielen Dank, dass Sie Serendipity Travel Ibiza gewählt haben!',
      }
    };

    const t = T[lang] || T.en;

    const customerHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7">
  <div style="max-width:560px;margin:0 auto;padding:30px 20px">
    <div style="text-align:center;margin-bottom:30px">
      <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:500;letter-spacing:.1em;color:#1d1d1f;margin:0">SERENDIPITY <span style="font-style:italic;color:#046567">Ibiza</span></h2>
    </div>
    <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,.06)">
      <div style="text-align:center;margin-bottom:24px">
        <div style="width:56px;height:56px;border-radius:50%;background:#046567;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:28px">✓</div>
      </div>
      <h1 style="text-align:center;font-family:Georgia,serif;font-size:24px;font-weight:500;color:#1d1d1f;margin:0 0 8px">${t.subject.split(' — ')[0]}</h1>
      <p style="text-align:center;color:#86868b;font-size:15px;margin:0 0 24px">${t.greeting},<br>${t.confirmed}</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px;color:#1d1d1f">
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#86868b">${t.vehicle}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500">🚘 ${vehicle}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#86868b">${t.route}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500">📍 ${route}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#86868b">${t.date}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500">📅 ${meta.date || 'N/A'}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#86868b">${t.time}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500">🕐 ${meta.time || 'N/A'}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#86868b">${t.pax}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500">👥 ${meta.pax || 'N/A'}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#86868b">${t.flight}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500">✈️ ${meta.flight || '—'}</td></tr>
        <tr><td style="padding:10px 0;color:#86868b">${t.paid}</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#046567">€${amount}</td></tr>
      </table>
      <div style="background:#eef3f3;border-radius:10px;padding:14px 16px;margin-top:20px;font-size:14px;color:#1d1d1f;line-height:1.5">
        ${t.tip}
      </div>
      <p style="font-size:14px;color:#86868b;margin-top:18px;line-height:1.5">${t.chauffeur}</p>
      <p style="font-size:14px;color:#86868b;margin-top:14px">${t.changes}</p>
      <p style="font-size:14px;margin:8px 0">
        📱 <a href="https://wa.me/529841386226" style="color:#046567;font-weight:600">WhatsApp</a><br>
        📧 <a href="mailto:rafael@serendipitytravelexperiences.com" style="color:#046567;font-weight:600">rafael@serendipitytravelexperiences.com</a>
      </p>
    </div>
    <p style="text-align:center;font-size:13px;color:#86868b;margin-top:24px">${t.thanks}</p>
    <p style="text-align:center;font-size:12px;color:#aaa;margin-top:8px;letter-spacing:.1em">SERENDIPITY TRAVEL IBIZA</p>
  </div>
</body>
</html>`;

    // Send emails directly via nodemailer SMTP
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'rafael@serendipitytravelexperiences.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    try {
      // Send internal notification to Rafael
      await transporter.sendMail({
        from: 'Serendipity Travel Ibiza <rafael@serendipitytravelexperiences.com>',
        to: 'rafael@serendipitytravelexperiences.com',
        subject: '🚨 New Booking — ' + (meta.guest_name || 'Guest') + ' — €' + amount,
        text: internalMsg,
        html: '<pre style="font-family:sans-serif;font-size:14px;line-height:1.6">' + internalMsg.replace(/\n/g,'<br>') + '</pre>'
      });

      // Send customer confirmation
      if (session.customer_email) {
        await transporter.sendMail({
          from: 'Serendipity Travel Ibiza <rafael@serendipitytravelexperiences.com>',
          to: session.customer_email,
          subject: t.subject,
          html: customerHtml
        });
      }
    } catch (emailErr) {
      console.error('Email notification error:', emailErr);
      // Don't fail the webhook for email errors
    }
  }

  return res.status(200).json({ received: true });
};
