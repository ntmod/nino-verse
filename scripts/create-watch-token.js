/* eslint-disable @typescript-eslint/no-require-imports -- Run directly with Node. */
const { createWatchToken } = require('../lib/auth');

const { token, hash } = createWatchToken();
console.log(`WATCH_TOKEN_SHA256=${hash}`);
console.log(`Watch token (save it now; it will not be shown again): ${token}`);
