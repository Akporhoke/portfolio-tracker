/*
 * Internal price event channel (publish / subscribe).
 *
 * It lives in the server's memory: no database, no extra service, no cost.
 * The price code announces "this stock has a new price"; any part of Gaze
 * that cares (alerts now, others later) listens. The announcer does not
 * know who is listening.
 *
 * Rules:
 *   - publishing never slows down or breaks a price lookup
 *   - a listener that fails is logged and does not affect other listeners
 *   - events are not stored: a listener that was not running misses them
 *     (alerts remember their own last price, so nothing is lost for them)
 *
 * Works for ONE server instance. With two instances, each one only hears
 * its own events.
 */

const { EventEmitter } = require('events');

const emitter = new EventEmitter();

emitter.setMaxListeners(20);


/*
 * event = {
 *   ticker, market, price, source,
 *   sourceTimestamp,   // time of the last trade, if the provider says
 *   fetchedAt          // when the data was fetched
 * }
 */
function publishPrice(event) {
    // Detach from the caller: it must never wait for a listener
    setImmediate(() => {
        try {
            emitter.emit('price', event);
        } catch (error) {
            console.error(
                '[PriceEvents] publish failed:',
                error.message
            );
        }
    });
}


// Returns a function that stops listening
function subscribePrice(handler) {
    const wrapped = event => {
        Promise.resolve()
            .then(() => handler(event))
            .catch(error => {
                console.error(
                    '[PriceEvents] listener failed:',
                    error.message
                );
            });
    };

    emitter.on('price', wrapped);

    return () => emitter.off('price', wrapped);
}


module.exports = {
    publishPrice,
    subscribePrice
};