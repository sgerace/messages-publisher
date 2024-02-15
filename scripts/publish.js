/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Publish Task
 */
'use strict';

process.env.MESSAGES_DB_PATH = './data/chat.db';

const fs = require('fs');

const publisher = require('../main/publisher');

const book = JSON.parse(fs.readFileSync('./data/book4.json'));

publisher.run({
    book,
    outputPath: './data/test.pdf'
});
