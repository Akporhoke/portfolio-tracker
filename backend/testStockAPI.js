const API_URL =
    'https://top-us-stock-tickers.zyhe.me/api/v2/tickers?collection=us&limit=5';

async function testAPI() {
    try {
        console.log('Testing stock directory API...');

        const response = await fetch(API_URL, {
            headers: {
                'User-Agent': 'Gaze-Stock-Directory/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(
                `API request failed: ${response.status}`
            );
        }

        const data = await response.json();

        console.log('');
        console.log('API RESPONSE:');

        console.log(
            JSON.stringify(data, null, 2)
        );

    } catch (error) {
        console.error('');
        console.error(
            '❌ API test failed:'
        );

        console.error(
            error.message
        );
    }
}

testAPI();