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

    async getMessagesByChat(chatId) {
        const rows = await this.#all('SELECT m.handle_id, m.text, m.date, maj.attachment_id ' +
            'FROM chat_message_join cmj ' +
            'JOIN message m ON m.ROWID = cmj.message_id ' +
            'LEFT JOIN message_attachment_join maj ON maj.message_id = cmj.message_id ' +
            'WHERE cmj.chat_id = ?', [chatId]);
        rows.sort((a, b) => a.date - b.date);
        return rows;
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    async #all(sql, params) {
        return new Promise((resolve, reject) => {
            this.#db.all(sql, params, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }


    async #run(sql, params) {
        return new Promise((resolve, reject) => {
            this.#db.run(sql, params, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = Messages;
