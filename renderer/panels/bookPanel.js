/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Book Panel
 */

const electron = require('electron');
const os = require('os');
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
    #openPhotosButton = null;
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
        if (!peopleLookup.has(null)) {
            peopleLookup.add(null);
            people.push({
                id: null,
                name: this.#services.datastore.resolveMeName()
            });
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
        this.#openPhotosButton = document.getElementById('book-panel-open-photos-btn');
        this.#openPhotosButton.addEventListener('click', () => this.#openSlideshow());
        this.#deleteButton = document.getElementById('book-panel-delete-btn');
        this.#deleteButton.addEventListener('click', () => this.#deleteBook());
        this.#editButton = document.getElementById('book-panel-edit-btn');
        this.#editButton.addEventListener('click', () => this.#editBook());
        this.#exportButton = document.getElementById('book-panel-export-btn');
        this.#exportButton.addEventListener('click', () => this.#exportBook());

        // Initialize message viewer
        this.#messageViewer = new MessageViewer(this.node.querySelector('.mp-message-viewer'));
        this.#messageViewer.showImages = this.#services.datastore.getSetting('showImagesBook');
        this.#messageViewer.on('selectionChange', () => this.#updateFooter());
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
        this.#services.datastore.on('settingChange', (key, value) => this.#settingChange(key, value));
    }

    async #openSlideshow() {
        const selection = this.#messageViewer.selection;
        let messages = this.#messageViewer.messages;
        if (selection.size) {
            messages = messages.filter(x => selection.has(x.id));
        }
        const attachments = [];
        for (let i = 0; i < messages.length; ++i) {
            const m = messages[i];
            const a = this.#messageViewer.attachments.get(m.id);
            if (a) {
                attachments.push(...a.filter(x => {
                    return this.#modals.slideshow.supportsMimeType(x.mime_type);
                }).map(x => ({
                    date: m.date,
                    filename: x.filename.replace(/^~/, os.homedir())
                })));
            }
        }
        if (attachments.length) {
            await this.#modals.slideshow.open(attachments);
        }
    }

    async #removeSelectionFromBook() {
        const selection = this.#messageViewer.selection;
        await this.#services.datastore.removeMessagesFromBook(this.#book.id, selection);
        this.#messageViewer.clearSelection();
    }

    #settingChange(key, value) {
        if (key === 'showImagesBook') {
            this.#messageViewer.showImages = value;
        }
    }

    #updateBookName() {
        this.#headerSpan.textContent = this.#book.name;
    }

    async #updateBookMessages() {
        const messageIds = await this.#services.datastore.getMessagesByBook(this.#book.id);
        const messages = await this.#services.messages.getMessagesById(messageIds);
        const attachments = await this.#services.messages.getAttachments(messages.map(x => x.id));
        this.#messageViewer.setMessages(messages, attachments);
    }

    #updateFooter() {
        const selection = this.#messageViewer.selection;
        if (selection.size === 0) {
            this.#messageFooter.setMessage('Select one or more messages to remove from book...');
        } else if (selection.size === 1) {
            this.#messageFooter.setAction(`Remove ${selection.size} message from book`);
        } else { // if (selection.size > 1) {
            this.#messageFooter.setAction(`Remove ${selection.size} messages from book`);
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
