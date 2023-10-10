/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Book Panel
 */

const electron = require('electron');
const MessageFooter = require('../components/messageFooter');
const MessageViewer = require('../components/messageViewer');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class BookPanel {

    // Private globals
    #services = null;
    #modals = null;

    // Private data
    #book = null;

    // Private elements
    #headerSpan = null;
    #deleteButton = null;
    #editButton = null;
    #exportButton = null;

    // Private components
    #messageFooter = null;
    #messageViewer = null;

    // Public variables
    node = null;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor(services, modals) {
        this.#services = services;
        this.#modals = modals;
        this.#initialize();
        this.#initializeEvents();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public properties

    get messageViewer() { return this.#messageViewer; }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods    

    async setBook(book) {
        if (book === this.#book) {
            return;
        } else if (!book) {
            this.#book = null;
            this.#headerSpan.textContent = 'Book';
            this.#messageViewer.setMessages([]);
            this.#updateFooter();
            return;
        }

        // Set book and update information
        this.#book = book;
        this.#updateBookName();

        // Query messages
        this.#updateBookMessages();
        this.#updateFooter();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #deleteBook() {
        this.#modals.deleteBook.open(this.#book);
    }

    #editBook() {
        this.#modals.upsertBook.open(this.#book);
    }

    async #exportBook() {

        // Resolve book details
        const messages = this.#messageViewer.messages;
        const people = [];
        const peopleLookup = new Set();
        for (let i = 0; i < messages.length; ++i) {
            const m = messages[i];
            const resolved = this.#services.datastore.resolveHandleName(m.handle_id);
            if (!peopleLookup.has(resolved.id)) {
                peopleLookup.add(resolved.id);
                people.push({
                    id: resolved.id,
                    name: resolved.value
                });
            }
        }
        const book = {
            name: this.#book.name,
            messages: messages.map(x => x.id),
            people: people
        };

        // Determine path
        const path = await electron.ipcRenderer.invoke('showSaveDialog', {
            filename: book.name
        });

        // Export book
        if (path) {
            await this.#modals.exportBook.open(book, path);
        }
    }

    #initialize() {
        this.node = document.getElementById('mp-book-panel');

        // Initialize header
        this.#headerSpan = document.getElementById('book-panel-name');

        // Initialize buttons
        this.#deleteButton = document.getElementById('book-panel-delete-btn');
        this.#deleteButton.addEventListener('click', () => this.#deleteBook());
        this.#editButton = document.getElementById('book-panel-edit-btn');
        this.#editButton.addEventListener('click', () => this.#editBook());
        this.#exportButton = document.getElementById('book-panel-export-btn');
        this.#exportButton.addEventListener('click', () => this.#exportBook());

        // Initialize message viewer
        this.#messageViewer = new MessageViewer(this.node.querySelector('.mp-message-viewer'));
        this.#messageViewer.on('selectionChange', (selection) => this.#updateFooter(selection));
        this.#messageFooter = new MessageFooter(this.node.querySelector('.mp-message-footer'));
        this.#messageFooter.on('action', () => this.#removeSelectionFromBook());
        this.#messageFooter.on('clear', () => this.#messageViewer.clearSelection());

        // Set book
        this.setBook(null);
    }

    #initializeEvents() {
        this.#services.datastore.on('bookChange', (book) => {
            if (book === this.#book) {
                this.#updateBookName();
            }
        });
        this.#services.datastore.on('bookMessagesAdd', (bookId) => {
            if (this.#book && bookId === this.#book.id) {
                this.#updateBookMessages();
            }
        });
        this.#services.datastore.on('bookMessagesRemove', (bookId) => {
            if (this.#book && bookId === this.#book.id) {
                this.#updateBookMessages();
            }
        });
    }

    #removeSelectionFromBook() {
        const selection = this.#messageViewer.selection;
        this.#services.datastore.removeMessagesFromBook(this.#book.id, selection);
    }

    #updateBookName() {
        this.#headerSpan.textContent = this.#book.name;
    }

    async #updateBookMessages() {
        const messageIds = await this.#services.datastore.getMessagesByBook(this.#book.id);
        const messages = await this.#services.messages.getMessagesById(messageIds);
        this.#messageViewer.setMessages(messages);
    }

    #updateFooter() {
        const selection = this.#messageViewer.selection;
        if (selection.size === 0) {
            this.#messageFooter.setMessage('Select one or more messages to remove from book');
        } else if (selection.size === 1) {
            this.#messageFooter.setAction(`<- Remove ${selection.size} message from book`);
        } else { // if (selection.size > 1) {
            this.#messageFooter.setAction(`<- Remove ${selection.size} messages from book`);
        }
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services, modals) => {
        return new BookPanel(services, modals);
    }
};
