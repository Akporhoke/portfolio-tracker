// Proves the circuit breaker works. No database, no provider, no quota.
//
// Run from the backend folder:  node scripts/breaker-test.js
//
// Cooldowns are shortened to 1 second just for this test.

process.env.BREAKER_BASE_COOLDOWN_SECONDS = '1';
process.env.BREAKER_FAILURE_THRESHOLD = '5';

const breaker =
    require('../services/circuitBreaker');

const KEY = 'finnhub:quote';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const timeout = { code: 'ECONNABORTED', message: 'timeout of 15000ms exceeded' };


function show(label) {
    const s =
        breaker.getSnapshot().find(item => item.key === KEY);

    console.log(
        `${label.padEnd(58)} ` +
        `state: ${s.state}, failures: ${s.failures}` +
        (s.state === 'open' ? `, retry in ${s.retryInSeconds}s` : '')
    );
}


function fail(times) {
    for (let i = 0; i < times; i++) {
        breaker.recordFailure(KEY, timeout);
    }
}


(async () => {
    console.log('What counts as a provider failure:');
    console.log('  timeout (no answer):        ', breaker.isProviderFailure(timeout));
    console.log('  HTTP 503:                   ', breaker.isProviderFailure({ response: { status: 503 } }));
    console.log('  HTTP 429:                   ', breaker.isProviderFailure({ response: { status: 429 } }));
    console.log('  HTTP 401 (key rejected):    ', breaker.isProviderFailure({ response: { status: 401 } }));
    console.log('  HTTP 404 (unknown stock):   ', breaker.isProviderFailure({ response: { status: 404 } }));
    console.log('  our own "paused" error:     ', breaker.isProviderFailure({ circuitOpen: true }));
    console.log('');

    show('start');

    fail(4);
    show('1. four failures in a row (limit is 5)');

    breaker.recordSuccess(KEY);
    show('2. one success resets the count');

    fail(5);
    show('3. five failures in a row');

    console.log(
        '   request allowed right now?                              ',
        breaker.beforeRequest(KEY).allowed
    );

    await sleep(1100);

    const probe = breaker.beforeRequest(KEY);
    const second = breaker.beforeRequest(KEY);

    console.log('');
    console.log(
        '4. after the cooldown: first request allowed (test):    ',
        probe.allowed, probe.probe ? '(it is the test request)' : ''
    );
    console.log(
        '   second request at the same time allowed?             ',
        second.allowed
    );

    breaker.recordFailure(KEY, timeout);
    show('5. the test request fails: open again, longer pause');

    await sleep(1100);

    console.log(
        '   allowed after only 1.1s (pause is now 2s)?           ',
        breaker.beforeRequest(KEY).allowed
    );

    await sleep(1000);

    console.log(
        '   allowed after 2.1s (test request)?                   ',
        breaker.beforeRequest(KEY).allowed
    );

    breaker.recordSuccess(KEY);
    show('6. the test request works: closed again');

    console.log('');
    console.log(
        'Expected: step 1 closed (4); step 2 closed (0); step 3 open and ' +
        'blocked; step 4 first true, second false; step 5 open again; ' +
        'then false, then true; step 6 closed.'
    );
})();
