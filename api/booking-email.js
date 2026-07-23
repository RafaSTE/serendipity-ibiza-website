module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, vehicle, route, date, time, flight,
          pax, notes, direction, amount, method, tag, lang } = req.body;

  if (!name || !email || !amount || !method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const T = {
    en: {
      subjectCustomer: 'Booking Received — Serendipity Travel Ibiza — Action Required',
      subjectInternal: '🚨 New ' + method + ' Booking — ' + name + ' — €' + amount,
      greeting: 'Dear ' + name,
      received: 'We have received your booking request. Please complete the payment to confirm your reservation.',
      payTitle: 'Payment Instructions',
      step1: '1. Open your ' + method + ' app',
      step2: '2. Send exactly €' + amount + ' to:',
      step3: '3. Share your payment receipt with us via WhatsApp or email within 1 hour',
      warning: '⏰ Important: Payment must be received within 1 hour or the reservation will be automatically cancelled.',
      details: 'Your booking details:',
      vehicleLbl: 'Vehicle', routeLbl: 'Route', dateLbl: 'Date', timeLbl: 'Time',
      paxLbl: 'Passengers', flightLbl: 'Flight', amountLbl: 'Amount due',
      receiptTitle: 'How to send your receipt:',
      receiptWA: 'WhatsApp: Click here or message +52 984 138 6226',
      receiptEmail: 'Email: rafael@serendipitytravelexperiences.com',
      departure: '✈️ For airport departures, we recommend leaving at least 3 hours before your flight.',
      thanks: 'Thank you for choosing Serendipity Travel Ibiza!',
    },
    es: {
      subjectCustomer: 'Reserva Recibida — Serendipity Travel Ibiza — Acción Requerida',
      subjectInternal: '🚨 Nueva Reserva ' + method + ' — ' + name + ' — €' + amount,
      greeting: 'Estimado/a ' + name,
      received: 'Hemos recibido tu solicitud de reserva. Por favor completa el pago para confirmar tu reservación.',
      payTitle: 'Instrucciones de Pago',
      step1: '1. Abre tu app de ' + method,
      step2: '2. Envía exactamente €' + amount + ' a:',
      step3: '3. Comparte tu comprobante de pago por WhatsApp o correo dentro de 1 hora',
      warning: '⏰ Importante: El pago debe recibirse en un máximo de 1 hora o la reserva se cancelará automáticamente.',
      details: 'Detalles de tu reserva:',
      vehicleLbl: 'Vehículo', routeLbl: 'Ruta', dateLbl: 'Fecha', timeLbl: 'Hora',
      paxLbl: 'Pasajeros', flightLbl: 'Vuelo', amountLbl: 'Monto a pagar',
      receiptTitle: 'Cómo enviar tu comprobante:',
      receiptWA: 'WhatsApp: Haz clic aquí o escribe al +52 984 138 6226',
      receiptEmail: 'Email: rafael@serendipitytravelexperiences.com',
      departure: '✈️ Para salidas de aeropuerto, recomendamos salir al menos 3 horas antes de tu vuelo.',
      thanks: '¡Gracias por elegir Serendipity Travel Ibiza!',
    },
    fr: {
      subjectCustomer: 'Réservation Reçue — Serendipity Travel Ibiza — Action Requise',
      subjectInternal: '🚨 Nouvelle Réservation ' + method + ' — ' + name + ' — €' + amount,
      greeting: 'Cher(e) ' + name,
      received: 'Nous avons reçu votre demande de réservation. Veuillez effectuer le paiement pour confirmer.',
      payTitle: 'Instructions de Paiement',
      step1: '1. Ouvrez votre application ' + method,
      step2: '2. Envoyez exactement ' + amount + '€ à :',
      step3: '3. Partagez votre reçu de paiement via WhatsApp ou e-mail dans l\'heure',
      warning: '⏰ Important : Le paiement doit être reçu dans l\'heure, sinon la réservation sera automatiquement annulée.',
      details: 'Détails de votre réservation :',
      vehicleLbl: 'Véhicule', routeLbl: 'Trajet', dateLbl: 'Date', timeLbl: 'Heure',
      paxLbl: 'Passagers', flightLbl: 'Vol', amountLbl: 'Montant dû',
      receiptTitle: 'Comment envoyer votre reçu :',
      receiptWA: 'WhatsApp : Cliquez ici ou écrivez au +52 984 138 6226',
      receiptEmail: 'Email : rafael@serendipitytravelexperiences.com',
      departure: '✈️ Pour les départs d\'aéroport, quittez votre logement au moins 3 heures avant votre vol.',
      thanks: 'Merci d\'avoir choisi Serendipity Travel Ibiza !',
    },
    de: {
      subjectCustomer: 'Buchung Erhalten — Serendipity Travel Ibiza — Aktion Erforderlich',
      subjectInternal: '🚨 Neue ' + method + ' Buchung — ' + name + ' — €' + amount,
      greeting: 'Sehr geehrte/r ' + name,
      received: 'Wir haben Ihre Buchungsanfrage erhalten. Bitte schließen Sie die Zahlung ab, um Ihre Reservierung zu bestätigen.',
      payTitle: 'Zahlungsanweisungen',
      step1: '1. Öffnen Sie Ihre ' + method + ' App',
      step2: '2. Senden Sie genau ' + amount + '€ an:',
      step3: '3. Teilen Sie Ihren Zahlungsbeleg innerhalb von 1 Stunde per WhatsApp oder E-Mail',
      warning: '⏰ Wichtig: Die Zahlung muss innerhalb von 1 Stunde eingehen, sonst wird die Reservierung automatisch storniert.',
      details: 'Ihre Buchungsdetails:',
      vehicleLbl: 'Fahrzeug', routeLbl: 'Route', dateLbl: 'Datum', timeLbl: 'Uhrzeit',
      paxLbl: 'Personen', flightLbl: 'Flug', amountLbl: 'Fälliger Betrag',
      receiptTitle: 'So senden Sie Ihren Beleg:',
      receiptWA: 'WhatsApp: Hier klicken oder +52 984 138 6226 anschreiben',
      receiptEmail: 'E-Mail: rafael@serendipitytravelexperiences.com',
      departure: '✈️ Bei Abflügen empfehlen wir, mindestens 3 Stunden vor dem Flug aufzubrechen.',
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
      <h1 style="text-align:center;font-family:Georgia,serif;font-size:22px;font-weight:500;color:#1d1d1f;margin:0 0 8px">${t.subjectCustomer.split(' — ')[0]}</h1>
      <p style="color:#86868b;font-size:15px;margin:14px 0">${t.greeting},<br><br>${t.received}</p>

      <!-- Payment Instructions -->
      <div style="background:#00272B;border-radius:12px;padding:24px;margin:20px 0;color:#fff">
        <h3 style="margin:0 0 14px;font-size:16px;font-weight:600">${t.payTitle}</h3>
        <p style="margin:0 0 6px;font-size:14px;color:rgba(255,255,255,.85)">${t.step1}</p>
        <p style="margin:0 0 6px;font-size:14px;color:rgba(255,255,255,.85)">${t.step2}</p>
        <div style="background:rgba(255,255,255,.12);border-radius:8px;padding:12px 16px;margin:8px 0 12px;text-align:center">
          <span style="font-size:18px;font-weight:700;color:#4aa6a8;letter-spacing:.02em">${tag}</span>
        </div>
        <p style="margin:0 0 0;font-size:14px;color:rgba(255,255,255,.85)">${t.step3}</p>
      </div>

      <!-- Warning -->
      <div style="background:#fff3f3;border:1px solid #f5c6c6;border-radius:10px;padding:14px 16px;margin:16px 0">
        <p style="margin:0;font-size:14px;color:#c0392b;font-weight:600;line-height:1.5">${t.warning}</p>
      </div>

      <!-- Booking details -->
      <h3 style="font-size:15px;color:#1d1d1f;margin:24px 0 12px">${t.details}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1d1d1f">
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#86868b">${t.vehicleLbl}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500">${vehicle}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#86868b">${t.routeLbl}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500">${route}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#86868b">${t.dateLbl}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500">${date || 'N/A'}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#86868b">${t.timeLbl}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500">${time || 'N/A'}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#86868b">${t.paxLbl}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500">${pax || 'N/A'}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#86868b">${t.flightLbl}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500">${flight || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#86868b">${t.amountLbl}</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#046567;font-size:18px">€${amount}</td></tr>
      </table>

      <!-- How to send receipt -->
      <div style="background:#eef3f3;border-radius:10px;padding:16px;margin-top:20px">
        <h3 style="font-size:14px;color:#1d1d1f;margin:0 0 10px">${t.receiptTitle}</h3>
        <p style="margin:0 0 6px;font-size:14px">📱 <a href="https://wa.me/529841386226" style="color:#046567;font-weight:600">${t.receiptWA}</a></p>
        <p style="margin:0;font-size:14px">📧 <a href="mailto:rafael@serendipitytravelexperiences.com" style="color:#046567;font-weight:600">${t.receiptEmail}</a></p>
      </div>

      <!-- Departure tip -->
      <div style="background:#eef3f3;border-radius:10px;padding:14px 16px;margin-top:12px;font-size:13px;color:#1d1d1f;line-height:1.5">
        ${t.departure}
      </div>
    </div>
    <p style="text-align:center;font-size:13px;color:#86868b;margin-top:24px">${t.thanks}</p>
    <p style="text-align:center;font-size:12px;color:#aaa;margin-top:8px;letter-spacing:.1em">SERENDIPITY TRAVEL IBIZA</p>
  </div>
</body>
</html>`;

  // Internal notification for Rafael
  const internalMsg = [
    '🚨 NEW BOOKING — ' + method.toUpperCase() + ' — Serendipity Travel Ibiza',
    '',
    '⚠️ PAYMENT PENDING — ' + method + ' to ' + tag,
    '',
    '👤 ' + name,
    '📧 ' + email,
    '📱 ' + (phone || 'N/A'),
    '',
    '🚘 ' + vehicle,
    '📍 ' + route,
    '📅 ' + (date || 'N/A') + ' ' + (time || ''),
    '👥 ' + (pax || 'N/A') + ' passengers',
    '✈️ Flight: ' + (flight || '—'),
    '🧭 Direction: ' + (direction || '—'),
    '',
    '💰 €' + amount + ' via ' + method + ' (' + tag + ')',
    '',
    '📝 Notes: ' + (notes || '—'),
    '',
    '⏰ Payment window: 1 hour. If not received, auto-cancel.',
    '⚡ Action: Verify payment receipt, then book with provider.',
  ].join('\n');

  // Send emails via internal /api/send-email endpoint (uses nodemailer SMTP)
  async function sendEmail(to, subject, textBody, htmlBody) {
    const baseUrl = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://www.serendipitytravelibiza.com';
    const response = await fetch(baseUrl + '/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.STRIPE_SECRET_KEY },
      body: JSON.stringify({ to, subject, text: textBody, html: htmlBody }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error('send-email ' + response.status + ': ' + err);
    }
    return response.json();
  }

  try {
    // 1. Customer confirmation with payment instructions
    await sendEmail(email, t.subjectCustomer, internalMsg, customerHtml);

    // 2. Internal notification to Rafael
    const internalHtml = '<pre style="font-family:sans-serif;font-size:14px;line-height:1.8;padding:20px">' + internalMsg.replace(/\n/g,'<br>') + '</pre>';
    await sendEmail('rafael@serendipitytravelexperiences.com', t.subjectInternal, internalMsg, internalHtml);

    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: err.message });
  }
};
