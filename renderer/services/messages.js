/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Messages Service
 */

const sqlite = require('sqlite3');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class Messages {

    #path = null;
    #db = null;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor(path) {
        this.#path = path;
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods

    async open() {

        // Open database
        await new Promise((resolve, reject) => {
            this.#db = new sqlite.Database(this.#path, sqlite.OPEN_READONLY, (err) => {
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
        const rows = await this.#all('SELECT m.ROWID AS id, h.id AS handle_id, m.text, ' +
            "datetime(m.date/1000000000 + strftime('%s', '2001-01-01 00:00:00'), 'unixepoch', 'localtime') as date," +
            'maj.attachment_id, m.is_from_me ' +
            'FROM chat_message_join cmj ' +
            'JOIN message m ON m.ROWID = cmj.message_id ' +
            'JOIN handle h ON h.ROWID = m.handle_id ' +
            'LEFT JOIN message_attachment_join maj ON maj.message_id = cmj.message_id ' +
            'WHERE cmj.chat_id = ?;', [chatId]);
        rows.forEach(x => x.date = new Date(x.date));
        rows.sort((a, b) => a.date - b.date);
        return rows;
    }

    async getMessagesById(ids) {
        const rows = await this.#all('SELECT m.ROWID AS id, h.id AS handle_id, m.text, ' +
            "datetime(m.date/1000000000 + strftime('%s', '2001-01-01 00:00:00'), 'unixepoch', 'localtime') as date," +
            'maj.attachment_id, m.is_from_me ' +
            'FROM message m ' +
            'JOIN handle h ON h.ROWID = m.handle_id ' +
            'LEFT JOIN message_attachment_join maj ON maj.message_id = m.ROWID ' +
            `WHERE m.ROWID IN (${ids.join(',')});`); // @TODO: Figure out proper escape syntax
        rows.forEach(x => x.date = new Date(x.date));
        rows.sort((a, b) => a.date - b.date);
        return rows;
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


    async #run(sql, params) {
        return new Promise((resolve, reject) => {
            this.#db.run(sql, params, (err, result) => {
                if (err) { reject(err); } else { resolve(result); }
            });
        });
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = Messages;
