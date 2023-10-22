/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Messages Service
 */

// const electron = require('electron');
// const fspath = require('path');
const sqlite = require('sqlite3');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class Messages {

    #db = null;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor() {}


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods

    async open() {

        // Open database
        await new Promise((resolve, reject) => {
            const dbPath = process.env.MESSAGES_DB_PATH;
            this.#db = new sqlite.Database(dbPath, sqlite.OPEN_READONLY, (err) => {
                if (err) { reject(err); } else { resolve(); }
            });
        });
    }

    async getChats() {
        const rows = await this.#all('SELECT chj.chat_id, h.id AS handle_id ' +
            'FROM chat_handle_join chj ' +
            'JOIN handle h ON h.ROWID = chj.handle_id;');
        const lookup = new Map();
        for (let i = 0; i < rows.length; ++i) {
            const row = rows[i];
            let chat = lookup.get(row.chat_id);
            if (!chat) {
                lookup.set(row.chat_id, (chat = {
                    id: row.chat_id,
                    name: null,
                    handles: new Set()
                }));
            }
            chat.handles.add(row.handle_id);
        }
        return lookup;
    }

    async getHandles() {
        const rows = await this.#all('SELECT id FROM handle;');
        const handles = new Set();
        rows.forEach(x => handles.add(x.id));
        return handles;
    }

    async getMessagesByChat(chatId) {
        const rows = await this.#all('SELECT m.ROWID AS id, h.id AS handle_id, m.text, m.attributedBody, ' +
            "datetime(m.date/1000000000 + strftime('%s', '2001-01-01 00:00:00'), 'unixepoch', 'localtime') as date," +
            'm.is_from_me ' +
            'FROM chat_message_join cmj ' +
            'JOIN message m ON m.ROWID = cmj.message_id ' +
            'LEFT JOIN handle h ON h.ROWID = m.handle_id ' +
            'WHERE cmj.chat_id = ?;', [chatId]);
        rows.forEach(x => this.#normalizeRow(x));
        rows.sort((a, b) => a.date - b.date);
        return rows;
    }

    async getMessagesById(ids) {
        const rows = await this.#all('SELECT m.ROWID AS id, h.id AS handle_id, m.text, m.attributedBody, ' +
            "datetime(m.date/1000000000 + strftime('%s', '2001-01-01 00:00:00'), 'unixepoch', 'localtime') as date," +
            'm.is_from_me ' +
            'FROM message m ' +
            'LEFT JOIN handle h ON h.ROWID = m.handle_id ' +
            `WHERE m.ROWID IN (${ids.join(',')});`); // @TODO: Figure out proper escape syntax
        rows.forEach(x => this.#normalizeRow(x));
        rows.sort((a, b) => a.date - b.date);
        return rows;
    }

    async getAttachments(messageIds) {
        const rows = await this.#all('SELECT a.ROWID AS id, maj.message_id, a.filename, a.mime_type ' +
            'FROM message_attachment_join maj ' +
            'JOIN attachment a ON a.ROWID = maj.attachment_id ' +
            `WHERE maj.message_id IN (${messageIds.join(',')}) AND a.filename IS NOT NULL AND a.is_outgoing IS FALSE;`); // @TODO: Figure out proper escape syntax
        const map = new Map();
        for (let i = 0; i < rows.length; ++i) {
            const row = rows[i];
            let attachments = map.get(row.message_id);
            if (!attachments) {
                map.set(row.message_id, (attachments = []));
            }
            attachments.push(row);
        }
        return map;
    }

    // SELECT 
    //   datetime(message.date/1000000000 + strftime('%s', '2001-01-01 00:00:00'), 'unixepoch', 'localtime') as date,
    //   mdb.Files.fileID,
    //   message.is_from_me,
    //   message.handle_id,
    //   attachment.filename,
    //   attachment.mime_type,
    //   replace(replace(message.text, X'0D', ''), X'0A', '\n') as text
    // FROM chat_message_join
    // JOIN message ON message.rowid=chat_message_join.message_id
    // LEFT JOIN message_attachment_join ON message_attachment_join.message_id = message.rowid
    // LEFT JOIN attachment ON message_attachment_join.attachment_id = attachment.rowid
    // LEFT JOIN mdb.Files ON substr(attachment.filename, 3) = mdb.Files.relativePath
    // WHERE chat_message_join.chat_id=11
    // ORDER BY message.date ASC;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    async #all(sql, params) {
        return new Promise((resolve, reject) => {
            this.#db.all(sql, params, (err, result) => {
                if (err) { reject(err); } else { resolve(result); }
            });
        });
    }

    #normalizeRow(row) {

        // Normalize date
        row.date = new Date(row.date);

        // If row does not contain `text` field and contains `attributedBody` (which is a
        // buffer), then the message is encoded in the `attributedBody` field, encoded as an
        // Apple `streamtyped` object. This code is based on the following:
        // https://github.com/ReagentX/imessage-exporter/blob/develop/imessage-database/src/util/streamtyped.rs
        // https://github.com/dgelessus/python-typedstream
        // https://apple.stackexchange.com/questions/421665/how-specificially-do-i-read-a-chat-db-file
        // https://stackoverflow.com/a/75330394
        // https://www.reddit.com/r/osx/comments/uevy32/texts_are_missing_from_mac_chatdb_file_despite/
        if (!row.text && row.attributedBody) {

            // Locate indexes for start and end patterns, then slice the buffer
            const sidx = row.attributedBody.indexOf(Messages.START_ATTRIBUTED_BODY_PATTERN);
            const eidx = row.attributedBody.indexOf(Messages.END_ATTRIBUTED_BODY_PATTERN);
            const textData = row.attributedBody.slice(sidx + 2, eidx);

            // From https://github.com/ReagentX/imessage-exporter, we learn that the number
            // of 'offset' bytes at the beginning of the string is not consistent. Additionally,
            // the offset characters are not always the same. In Rust, it seems that the
            // conversion from binary to UTF8 gives some clue as to whether there is 1 or 3
            // prefix characters. In JavaScript, the best I can come up with is to assume 1
            // prefix character (which will always be present) and then test for the '�'
            // character. If that is the first character, then it seems safe to drop 2 additional
            // characters. If it turns out that other 'secondary' prefix characters are observed,
            // we can add them to the `if` condition below (or develop an alternative approach).
            let str = textData.toString('utf8').substring(1);
            if (str[0] === '�') {
                str = str.substring(2);
            }
            row.text = str;
        }
    }

    async #run(sql, params) {
        return new Promise((resolve, reject) => {
            this.#db.run(sql, params, (err, result) => {
                if (err) { reject(err); } else { resolve(result); }
            });
        });
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private constants

    /// Literals: `[<Start of Heading> (SOH), +]`
    /// - <https://www.compart.com/en/unicode/U+0001>
    /// - <https://www.compart.com/en/unicode/U+002b>
    static START_ATTRIBUTED_BODY_PATTERN = Buffer.from([0x0001, 0x002b]);

    /// Literals: `[<Start of Selected Area> (SSA), <Index> (IND)]`
    /// - <https://www.compart.com/en/unicode/U+0086>
    /// - <https://www.compart.com/en/unicode/U+0084>
    static END_ATTRIBUTED_BODY_PATTERN = Buffer.from([0x0086, 0x0084]);
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = Messages;
