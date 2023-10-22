/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Datastore Service
 */

const EventEmitter = require('eventemitter3');
const sqlite = require('sqlite3');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class Datastore extends EventEmitter {

    #db = null;

    #books = [];
    #chatNames = new Map();
    #handleNames = new Map();


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor() {
        super();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public properties

    get books() { return this.#books; }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods

    async addMessagesToBook(bookId, messages) {
        const items = new Array();
        for (const messageId of messages) {
            items.push([bookId, messageId]);
        }
        const v = items.map(x => `(${x.join(',')})`).join(',');
        // @TODO: Figure out proper escape syntax for query (to avoid SQL injection)
        await this.#run(`INSERT OR REPLACE INTO book_messages (book_id, message_id) VALUES ${v};`);
        this.emit('bookMessagesAdd', bookId, messages);
    }

    async createBook(name) {
        const id = await this.#run('INSERT INTO books (name) VALUES ($name);', {
            $name: name
        });
        this.#books.push({ id, name });
        this.#books.sort((a, b) => a.name.localeCompare(b.name));
        this.emit('booksChange');
    }

    async deleteBook(id) {
        await this.#run('DELETE FROM books WHERE id = $id;', {
            $id: id
        });
        const index = this.#books.findIndex(x => x.id === id);
        this.#books.splice(index, 1);
        this.emit('booksChange');
    }

    async getMessagesByBook(bookId) {
        return (await this.#all('SELECT message_id FROM book_messages WHERE book_id = $id;', {
            $id: bookId
        })).map(x => x.message_id);
    }

    async open() {

        // Open database
        await new Promise((resolve, reject) => {
            const mode = sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE | sqlite.OPEN_FULLMUTEX;
            this.#db = new sqlite.Database(process.env.DATASTORE_DB_PATH, mode, (err) => {
                if (err) { reject(err); } else { resolve(); }
            });
        });

        // Create tables
        await this.#createTables();

        // Initialize data
        await this.#initializeBooks();
        await this.#initializeChatNames();
        await this.#initializeHandleNames();
    }

    async removeMessagesFromBook(bookId, messages) {
        const ids = new Array();
        for (const messageId of messages) {
            ids.push(messageId);
        }

        // @TODO: Improve the efficiency of this query, this is pretty horrible
        await this.#run(`DELETE FROM book_messages WHERE book_id = $bookId AND message_id IN (${ids.join(',')});`, {
            $bookId: bookId
        });
        this.emit('bookMessagesRemove', bookId, messages);
    }

    resolveChatName(chat) {
        const name = this.#chatNames.get(chat.id);
        return {
            hasName: !!name,
            value: name ? name : Array.from(chat.handles.values()).map(handleId => {
                return this.resolveHandleName(handleId).value;
            }).join(', ')
        };
    }

    resolveHandleName(id) {
        if (id === null) {
            return { id: null, value: 'Me' }; // @TODO: Eventually set this in the database
        }
        const name = id ? this.#handleNames.get(id) : undefined;
        return {
            id: id,
            hasName: !!name,
            value: name ? name : id
        };
    }

    async setBookInfo(id, info) {
        await this.#run('UPDATE books SET name = $name WHERE id = $id;', {
            $id: id,
            $name: info.name
        });
        const book = this.#books.find(x => x.id === id);
        book.name = info.name;
        this.emit('booksChange');
        this.emit('bookChange', book);
    }

    async setChatName(id, name) {
        await this.#run('INSERT OR REPLACE INTO chats (chat_id, name) VALUES ($id, $name);', {
            $id: id,
            $name: name
        });
        this.#chatNames.set(id, name);
        this.emit('chatNameChange', id, name);
    }

    async setHandleName(id, name) {
        await this.#run('INSERT OR REPLACE INTO handles (handle_id, name) VALUES ($id, $name);', {
            $id: id,
            $name: name
        });
        this.#handleNames.set(id, name);
        this.emit('handleNameChange', id, name);
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    async #all(sql, params) {
        return new Promise((resolve, reject) => {
            this.#db.all(sql, params, (err, result) => {
                if (err) { reject(err); } else { resolve(result); }
            });
        });
    }

    async #createTables() {

        // Ensure chat table exists
        await this.#run([
            'CREATE TABLE IF NOT EXISTS chats (',
            '  chat_id INTEGER PRIMARY KEY,',
            '  name TEXT NOT NULL',
            ');'
        ].join(''));

        // Ensure handles table exists
        await this.#run([
            'CREATE TABLE IF NOT EXISTS handles (',
            '  handle_id TEXT PRIMARY KEY,',
            '  name TEXT NOT NULL',
            ');'
        ].join(''));

        // Ensure books table exists
        await this.#run([
            'CREATE TABLE IF NOT EXISTS books (',
            '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
            '  name TEXT NOT NULL',
            ');'
        ].join(''));

        // Ensure book messages table exists
        await this.#run([
            'CREATE TABLE IF NOT EXISTS book_messages (',
            '  book_id INTEGER,',
            '  message_id INTEGER,',
            '  PRIMARY KEY (book_id, message_id),',
            '  CONSTRAINT book_messages_book_id_FK',
            '    FOREIGN KEY (book_id)',
            '    REFERENCES books (id)',
            '    ON DELETE CASCADE',
            '    ON UPDATE NO ACTION',
            ');'
        ].join(''));
    }

    async #initializeBooks() {
        this.#books = await this.#all('SELECT * FROM books;');
        this.#books.sort((a, b) => a.name.localeCompare(b.name));
        this.emit('booksChange');
    }

    async #initializeChatNames() {
        const chatNames = await this.#all('SELECT * FROM chats;');
        chatNames.forEach(x => this.#chatNames.set(x.chat_id, x.name));
    }

    async #initializeHandleNames() {
        const handleNames = await this.#all('SELECT * FROM handles;');
        handleNames.forEach(x => this.#handleNames.set(x.handle_id, x.name));
    }

    async #run(sql, params) {
        return new Promise((resolve, reject) => {
            this.#db.run(sql, params, function(err) {
                if (err) { reject(err); } else { resolve(this.lastID); }
            });
        });
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = Datastore;
