const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const {
      veh, svc, from, to, trip, hours, pax,
      pickupName, dropoffName, lang,
      name, email, phone, flight, direction, date, time, notes
    } = req.body;

    const vehNames = { vclass: 'Mercedes V-Class', sprinter: 'Mercedes Sprinter' };
    const vehName = vehNames[veh] || veh;
    let description = vehName + ' · ' + pax + ' pax';

    if (svc === 'hourly') {
      description += ' · ' + hours + 'h';
    } else {
      const pk = pickupName || ('Zone ' + from);
      const dp = dropoffName || ('Zone ' + to);
      const tripLabel = trip === 'round' ? 'Round trip' : 'One way';
      description += ' · ' + pk + ' → ' + dp + ' · ' + tripLabel;
    }
    if (date) description += ' · ' + date;
    if (time) description += ' ' + time;

    const MARKUP = 1.30;
    const ROUND_TO = 5;
    const ROUND_TRIP_FACTOR = 2;
    const ZONE_RANK = { A: 1, B: 2, C: 3, D: 4 };

    const VEHICLES = {
      vclass:  { transfer: { A: 95, B: 100, C: 110, D: 120 }, hourly: { 4: 370, 8: 680, 12: 880, 24: 1300 } },
      sprinter: { transfer: { A: 150, B: 160, C: 170, D: 180 }, hourly: { 4: 450, 8: 780, 12: 990, 24: 1650 } }
    };

    const v = VEHICLES[veh] || VEHICLES.vclass;
    let totalEur;

    if (svc === 'hourly') {
      totalEur = Math.ceil((v.hourly[hours] * MARKUP) / ROUND_TO) * ROUND_TO;
    } else {
      const zone = (ZONE_RANK[from] >= ZONE_RANK[to]) ? from : to;
      const mult = trip === 'round' ? ROUND_TRIP_FACTOR : 1;
      totalEur = Math.ceil((v.transfer[zone] * mult * MARKUP) / ROUND_TO) * ROUND_TO;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Serendipity Travel Ibiza — ' + vehName,
            description: description,
          },
          unit_amount: totalEur * 100,
        },
        quantity: 1,
      }],
      customer_email: email,
      metadata: {
        guest_name: name,
        phone: phone,
        flight: flight || '',
        direction: direction || '',
        date: date || '',
        time: time || '',
        notes: notes || '',
        vehicle: veh,
        service: svc,
        pax: String(pax),
        from: from || '',
        to: to || '',
        trip: trip || '',
        hours: String(hours || ''),
        pickup: pickupName || '',
        dropoff: dropoffName || '',
        lang: lang || 'en',
      },
      success_url: (req.headers.origin || 'https://www.serendipitytravelibiza.com') + '/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: (req.headers.origin || 'https://www.serendipitytravelibiza.com') + '/#rates',
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
};
