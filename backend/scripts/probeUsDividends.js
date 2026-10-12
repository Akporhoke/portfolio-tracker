require('dotenv').config();
const axios = require('axios');

(async () => {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) throw new Error('Key variable not found in .env, check the name');

  const symbol = (process.argv[2] || 'AAPL').toUpperCase();
  const res = await axios.get('https://api.twelvedata.com/dividends', {
    params: { symbol, range: 'last', apikey: key },
    timeout: 15000
  });

  const data = res.data;
  console.log('Top-level keys:', Object.keys(data));
  if (data.status === 'error') {
    console.log('API error:', data.code, data.message);
    return;
  }
  const list = Array.isArray(data.dividends) ? data.dividends : [];
  console.log('Records:', list.length);
  console.log('First record:', JSON.stringify(list[0], null, 2));
})().catch((e) => { console.error(e.response?.status, e.response?.data || e.message); process.exit(1); });