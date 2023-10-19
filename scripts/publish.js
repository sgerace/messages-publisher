/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Publish Task
 */
'use strict';

const fs = require('fs');

const publisher = require('../main/publisher');

const book = JSON.parse(fs.readFileSync('./data/book3.json'));

publisher.run(book, './data/chat.db', './data/test.pdf');
