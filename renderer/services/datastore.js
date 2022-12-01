/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Datastore Service
 */

const EventEmitter = require('eventemitter3');
const fspath = require('path');
const sqlite = require('sqlite3');

const electron = require('electron');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class Datastore extends EventEmitter {

    #db = null;

    #chatNames = new Map();
    #handleNames = new Map();


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor() {
        super();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods

    async open() {

        // Get user data path and append database name
        const userDataPath = await electron.ipcRenderer.invoke('getUserDataPath');
        const path = fspath.join(userDataPath, 'datastore.db');

        // Open database
        await new Promise((resolve, reject) => {
            const mode = sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE | sqlite.OPEN_FULLMUTEX;
            this.#db = new sqlite.Database(path, mode, (err) => {
                if (err) { reject(err); } else { resolve(); }
            });
        });

        // Create tables
        await this.#createTables();

        // Initialize data
        await this.#initializeChatNames();
        await this.#initializeHandleNames();
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
        const name = this.#handleNames.get(id);
        return {
            hasName: !!name,
            value: name ? name : id
        };
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
            this.#db.run(sql, params, (err, result) => {
                if (err) { reject(err); } else { resolve(result); }
            });
        });
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = Datastore;
