/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Publisher
 */

const emojiRegex = require('emoji-regex');
const fs = require('fs');
const fspath = require('path');
const os = require('os');
const PdfDocument = require('pdfkit');
const sharp = require('sharp');

const Messages = require('../renderer/services/messages');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Public functions

async function run(window, book, dbPath, outputPath) {

    // Create document
    const doc = new PdfDocument({
        font: fspath.resolve('./assets/fonts/NotoSansEmoji-Regular.ttf'),
        margins: { top: 50, left: 72, bottom: 50, right: 120 }
    });
    doc.pipe(fs.createWriteStream(outputPath));

    // Initialize and open messages client
    const messagesClient = new Messages(dbPath);
    await messagesClient.open();

    // Get messages and attachments
    const messages = await messagesClient.getMessagesById(book.messages);
    const attachments = await messagesClient.getAttachments(book.messages);

    // Render messages
    await createBook(window, doc, book, messages, attachments);

    // End document
    doc.end();
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Private functions

function containsOnly(string, regex) {
    let match;
    let index = 0;
    while ((match = regex.exec(string))) {
        if (match.index !== index) {
            return false;
        }
        index += match[0].length;
    }
    return index > 0 && index === string.length;
}

async function createBook(window, doc, book, messages, attachments) {

    // Define rendering constants
    const pageMaxY = doc.page.height - doc.page.margins.bottom;

    // Initialize variables
    let currentDay = startOfDay(0);
    let y = doc.page.margins.top;

    // Render book title
    doc.fontSize(TITLE_CONSTANTS.fontSize);
    doc.fillColor(TITLE_CONSTANTS.fontColor);
    doc.text(book.name, doc.page.margins.left, y);
    y += doc.heightOfString(book.name, doc.page.margins.left, y) + 12;

    // Render date range
    doc.fontSize(TITLE_DATE_CONSTANTS.fontSize);
    doc.fillColor(TITLE_DATE_CONSTANTS.fontColor);
    const titleDateRange = messages[0].date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) + ', ' + messages[0].date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric'
    }) + ' to ' + messages[messages.length - 1].date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) + ', ' + messages[messages.length - 1].date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric'
    });
    doc.text(titleDateRange, doc.page.margins.left, y);
    y += doc.heightOfString(titleDateRange, doc.page.margins.left, y) + 16;

    // Render participants
    doc.fontSize(TITLE_PARTICIPANTS_HEADER_CONSTANTS.fontSize);
    doc.fillColor(TITLE_PARTICIPANTS_HEADER_CONSTANTS.fontColor);
    doc.text('Participants: ', doc.page.margins.left, y);
    y += doc.heightOfString('Participants: ', doc.page.margins.left, y) + 6;
    doc.fontSize(TITLE_PARTICIPANTS_LIST_CONSTANTS.fontSize);
    doc.fillColor(TITLE_PARTICIPANTS_LIST_CONSTANTS.fontColor);
    for (let i = 0; i < book.people.length; ++i) {
        const person = book.people[i];
        let personText;
        if (person.id === null || person.id === person.name) {
            personText = person.name;
        } else {
            personText = `${person.id}, ${person.name}`;
        }
        doc.text(personText, doc.page.margins.left + 24, y);
        y += doc.heightOfString(personText, doc.page.margins.left + 24, y) + 4;
    }
    y += 36;

    // @TODO: Draw a horizontal rule here

    // Render all messages
    let progress = 0;
    for (let i = 0; i < messages.length; ++i) {
        const message = messages[i];
        const messageDay = startOfDay(message.date);

        // Prepare message elements
        const elements = [];
        if (currentDay.getTime() !== messageDay.getTime()) {
            elements.push(prepareDate(doc, messageDay));
        }
        const messageAttachments = attachments.get(message.id);
        if (messageAttachments) {
            for (let i = 0; i < messageAttachments.length; ++i) {
                const attachment = messageAttachments[i];
                if (SUPPORTED_IMAGE_TYPES[attachment.mime_type]) {
                    elements.push(prepareName(doc, message, book.people));
                    elements.push(await prepareImage(doc, message, attachment));
                }
            }
        }
        if (message.text) {
            const textElement = prepareText(doc, message);
            if (textElement) {
                elements.push(prepareName(doc, message, book.people));
                elements.push(textElement);
            }
        }

        // Layout and render elements
        for (let j = 0; j < elements.length; ++j) {
            const elem = elements[j];
            const height = requiredHeight(elements, j);

            // Ensure item has required height and add page if necesary
            if (height === 0) {
                continue;
            } else if (y + height > pageMaxY) {
                doc.addPage();
                y = doc.page.margins.top;
            }

            // Render element
            if (elem.type === 'date') {
                renderDate(doc, y, elem);
                currentDay = elem.date;
            } else if (elem.type === 'name') {
                renderName(doc, y, elem);
            } else if (elem.type === 'image') {
                renderImage(doc, y, elem);
            } else if (elem.type === 'text') {
                renderText(doc, y, elem);
            }

            // Increment current position
            y += elem.height + elem.margin;
        }

        // Update progress
        const p = Math.round(100 * (i + 1) / messages.length);
        if (p !== progress) {
            progress = p;
            window.sender.send('exportBookProgress', progress);
        }
    }
}

function prepareDate(doc, date) {
    doc.fontSize(DATE_CONSTANTS.fontSize);
    const messageDay = startOfDay(date);
    const dayString = messageDay.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    return {
        type: 'date',
        text: dayString,
        date: messageDay,
        fontSize: DATE_CONSTANTS.fontSize,
        fontColor: DATE_CONSTANTS.fontColor,
        width: doc.widthOfString(dayString),
        height: doc.heightOfString(dayString, doc.page.margins.left, 0, { align: 'center' }),
        margin: DATE_CONSTANTS.margin
    };
}

async function prepareImage(doc, message, attachment) {
    const filename = attachment.filename.replace(/^~/, os.homedir());
    const { data, info } = await sharp(filename)
        .resize({
            width: IMAGE_CONSTANTS.fitWidth * IMAGE_CONSTANTS.scale,
            height: IMAGE_CONSTANTS.fitHeight * IMAGE_CONSTANTS.scale,
            fit: 'inside',
            withoutEnlargement: true
        })
        .rotate()
        .toFormat('jpeg', { quality: 100 })
        .toBuffer({ resolveWithObject: true });
    let x;
    let align;
    if (message.is_from_me) {
        x = doc.page.width - doc.page.margins.right - IMAGE_CONSTANTS.fitWidth;
        align = 'right';
    } else {
        x = doc.page.margins.left;
        align = 'left';
    }
    return {
        type: 'image',
        data: data,
        content: true,
        date: message.date,
        width: info.width / IMAGE_CONSTANTS.scale,
        height: info.height / IMAGE_CONSTANTS.scale,
        x,
        align,
        fit: [IMAGE_CONSTANTS.fitWidth, IMAGE_CONSTANTS.fitHeight],
        margin: IMAGE_CONSTANTS.margin
    };
}

function prepareName(doc, message, people) {
    doc.fontSize(NAME_CONSTANTS.fontSize);
    const personId = message.is_from_me ? null : message.handle_id;
    const person = people.find(x => x.id === personId);
    const name = person ? person.name : message.handle_id;
    let x;
    let align;
    if (message.is_from_me) {
        x = doc.page.width - doc.page.margins.right;
        align = 'right';
    } else {
        x = doc.page.margins.left;
        align = 'left';
    }
    return {
        type: 'name',
        text: name,
        fontSize: NAME_CONSTANTS.fontSize,
        fontColor: NAME_CONSTANTS.fontColor,
        width: doc.widthOfString(name),
        height: doc.heightOfString(name, doc.page.margins.left, 0, { align }),
        x,
        align,
        margin: NAME_CONSTANTS.margin
    };
}

function prepareText(doc, message) {

    // Replace 'Object Replacement Character' \u{FFFC}
    const text = message.text.replace(/\uFFFC/g, '');
    if (!text) {
        return null;
    }

    // Determine if message text contains only emoji symbols
    const onlyEmoji = containsOnly(text, emojiRegex());

    // Set font size
    const fontSize = onlyEmoji ? TEXT_CONSTANTS.emojiFontSize : TEXT_CONSTANTS.fontSize;
    doc.fontSize(fontSize);

    // Compute text width and height
    const padding = TEXT_CONSTANTS.padding;
    const options = { width: TEXT_CONSTANTS.width - padding.left - padding.right };
    const cwidth = doc.widthOfString(text, options);
    const cheight = doc.heightOfString(text, options);

    // Compute box and text x-coordinate
    let boxx = doc.page.margins.left;
    let txtx = boxx + padding.left;

    // Compute box and text geometry
    const boxh = cheight + padding.top + padding.bottom;
    let boxw = TEXT_CONSTANTS.width;
    if (cwidth < options.width) {
        boxw = cwidth + padding.left + padding.right;
        if (message.is_from_me) {
            txtx = doc.page.width - doc.page.margins.right - cwidth - padding.right;
            boxx = txtx - padding.left;
        }
    } else if (message.is_from_me) {
        boxx = doc.page.width - doc.page.margins.right - boxw;
        txtx = boxx + padding.left;
    }

    // Return text element
    return {
        type: 'text',
        text: text,
        content: true,
        date: message.date,
        fontSize,
        fontColor: message.is_from_me ? COLORS.messageTextMe : COLORS.messageText,
        boxColor: message.is_from_me ? COLORS.messageBackgroundMe : COLORS.messageBackground,
        width: boxw,
        height: boxh,
        margin: TEXT_CONSTANTS.margin,
        textOptions: options,
        boxh,
        boxw,
        boxx,
        txtx
    };
}

function renderDate(doc, y, elem) {
    doc.fontSize(elem.fontSize);
    doc.fillColor(elem.fontColor);
    doc.text(elem.text, doc.page.margins.left, y, { align: 'center' });
}

function renderImage(doc, y, elem) {
    doc.image(elem.data, elem.x, y, {
        fit: elem.fit,
        align: elem.align
    });

    // Render time
    renderTime(doc, y, elem);
}

function renderName(doc, y, elem) {
    doc.fontSize(elem.fontSize);
    doc.fillColor(elem.fontColor);
    doc.text(elem.text, doc.page.margins.left + NAME_CONSTANTS.offset, y, {
        align: elem.align,
        width: doc.page.width -
            doc.page.margins.left - doc.page.margins.right - 2 * NAME_CONSTANTS.offset
    });
}

function renderText(doc, y, elem) {

    // Set font size
    doc.fontSize(elem.fontSize);

    // Compute box and text geometry
    const padding = TEXT_CONSTANTS.padding;

    // Render box (message bubble)
    doc.fillColor(elem.boxColor);
    doc.roundedRect(elem.boxx, y, elem.boxw, elem.boxh, 8).fill();

    // Render text
    doc.fillColor(elem.fontColor);
    doc.text(elem.text, elem.txtx, y + padding.top, elem.textOptions);

    // Render time
    renderTime(doc, y, elem);
}

function renderTime(doc, y, elem) {
    doc.fontSize(TIME_CONSTANTS.fontSize);
    doc.fillColor(TIME_CONSTANTS.fontColor);
    const text = elem.date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric'
    });
    const xt = doc.page.width - doc.page.margins.right + 10;
    const height = doc.heightOfString(text, { align: 'left' });
    const yt = y + Math.round(elem.height / 2) - Math.round(height / 2);
    doc.text(text, xt, yt, { align: 'left' });
}

function requiredHeight(elements, index) {
    let elemIndex = index;
    let height = 0;
    let prev = null;
    while (elemIndex < elements.length) {
        const elem = elements[elemIndex];
        if (prev) {
            height += prev.margin;
        }
        height += elem.height;
        if (elem.content) {
            return height;
        }
        prev = elem;
        elemIndex++;
    }
    return 0;
}

function startOfDay(value) {
    const date = new Date(value);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Constants

const DATE_CONSTANTS = {
    fontSize: 10,
    fontColor: '#737b83',
    margin: 2
};

const IMAGE_CONSTANTS = {
    fitWidth: 250,
    fitHeight: 200,
    scale: 2,
    margin: 6
};

const NAME_CONSTANTS = {
    fontSize: 10,
    fontColor: '#737b83',
    margin: 0,
    offset: 5
};

const TEXT_CONSTANTS = {
    fontSize: 12,
    emojiFontSize: 26,
    other: {
        width: 400
    },
    me: {
        width: 400
    },
    margin: 6,
    padding: {
        top: 2,
        bottom: 4,
        left: 10,
        right: 10
    },
    width: 400
};

const TIME_CONSTANTS = {
    fontSize: 9,
    fontColor: '#737b83'
};

const TITLE_CONSTANTS = {
    fontSize: 22,
    fontColor: 'black'
};

const TITLE_DATE_CONSTANTS = {
    fontSize: 12,
    fontColor: '#737b83'
};

const TITLE_PARTICIPANTS_HEADER_CONSTANTS = {
    fontSize: 12,
    fontColor: 'black'
};

const TITLE_PARTICIPANTS_LIST_CONSTANTS = {
    fontSize: 11,
    fontColor: 'black'
};

const COLORS = {
    messageBackground: '#e6e6e6',
    messageBackgroundMe: '#4bad47',
    messageText: 'black',
    messageTextMe: 'white'
};

const SUPPORTED_IMAGE_TYPES = {
    'image/heic': true,
    'image/jpeg': true,
    'image/png': true,
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = {
    run
};
