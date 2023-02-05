/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Chat Panel
 */

const MessageFooter = require('../components/messageFooter');
const MessageViewer = require('../components/messageViewer');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class ChatPanel {

    // Private globals
    #services = null;
    #modals = null;

    // Private data
    #book = null;
    #chat = null;
    #chatName = null;

    // Private elements
    #headerSpan = null;
    #editButton = null;
    #dateRangeButton = null;

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

    async setChat(chat) {
        if (chat === this.#chat) {
            return;
        }
        this.#chat = chat;
        this.#updateChatName();

        const messages = await this.#services.messages.getMessagesByChat(this.#chat.id);
        this.#messageViewer.setMessages(messages);
        this.#updateFooter();
    }

    setBook(book) {
        this.#book = book;
        this.#updateFooter();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #addSelectionToBook() {
        this.#services.datastore.addMessagesToBook(this.#book.id, this.#messageViewer.selection);
    }

    #initialize() {
        this.node = document.getElementById('mp-chat-panel');

        // Initialize header
        this.#headerSpan = document.getElementById('chat-panel-name');

        // Initialize date range button
        this.#dateRangeButton = document.getElementById('chat-panel-select-date-range-btn');
        this.#dateRangeButton.addEventListener('click', async () => {
            const range = await this.#modals.selectDateRange.open({
                min: this.#messageViewer.startDate,
                max: this.#messageViewer.endDate
            });
            if (range) {
                const r1 = range[1];
                const end = new Date(r1.getFullYear(), r1.getMonth(), r1.getDate());
                end.setDate(end.getDate() + 1);
                this.#messageViewer.selectDateRange(range[0], end);
            }
        });

        // Initialize rename button
        this.#editButton = document.getElementById('chat-panel-rename-btn');
        this.#editButton.addEventListener('click', () => {
            const resolved = this.#services.datastore.resolveChatName(this.#chat);
            this.#modals.renameChat.open(this.#chat, resolved.hasName ? resolved.value : '');
        });

        // Initialize message viewer and footer
        this.#messageViewer = new MessageViewer(this.node.querySelector('.mp-message-viewer'));
        this.#messageViewer.on('selectionChange', (selection) => this.#updateFooter(selection));
        this.#messageFooter = new MessageFooter(this.node.querySelector('.mp-message-footer'));
        this.#messageFooter.on('action', () => this.#addSelectionToBook());
        this.#messageFooter.on('clear', () => this.#messageViewer.clearSelection());
    }

    #initializeEvents() {
        this.#services.datastore.on('chatNameChange', () => this.#updateChatName());
    }

    #updateChatName() {
        this.#chatName = this.#services.datastore.resolveChatName(this.#chat).value;
        this.#headerSpan.textContent = this.#chatName;
    }

    #updateFooter() {
        const selection = this.#messageViewer.selection;
        if (selection.size === 0) {
            this.#messageFooter.setMessage('Select one or more messages to add to book');
        } else if (!this.#book) {
            this.#messageFooter.setMessage('Open a book to add messages');
        } else if (selection.size === 1) {
            this.#messageFooter.setAction(`Add ${selection.size} message to book ->`);
        } else { // if (selection.size > 1) {
            this.#messageFooter.setAction(`Add ${selection.size} messages to book ->`);
        }
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services, modals) => {
        return new ChatPanel(services, modals);
    }
};
