// utils/searchClient.js
const { MeiliSearch } = require('meilisearch');

const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
});

module.exports = client;
