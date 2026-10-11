require('dotenv').config();
const axios = require('axios');

async function probe(symbol) {
  const key = process.env.KOBO_TERMINAL_API_KEY;
  if (!key) throw new Error('KOBO_TERMINAL_API_KEY is not set in backend/.env');

  const res = await axios.get(
    `https://koboterminal.com/api/ngxdata/dividends/${encodeURIComponent(symbol)}`,
    { headers: { 'X-API-Key': key }, timeout: 15000 }
  );

  const data = res.data;
  console.log('Top-level keys:', Object.keys(data));
  const history = Array.isArray(data.history) ? data.history : [];
  console.log('History records:', history.length);
  console.log('First record:', JSON.stringify(history[0], null, 2));
  console.log('Distinct record keys:', [...new Set(history.flatMap(Object.keys))]);
}

probe(process.argv[2] || 'ZENITHBANK').catch(err => {
  console.error('Probe failed:', err.response?.status, err.response?.data || err.message);
  process.exit(1);
});