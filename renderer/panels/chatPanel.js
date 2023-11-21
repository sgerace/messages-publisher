/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Chat Panel
 */

const os = require('os');
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
    #openPhotosButton = null;
    #dateRangeButton = null;
    #editButton = null;

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
        const attachments = await this.#services.messages.getAttachments(messages.map(x => x.id));
        this.#messageViewer.setMessages(messages, attachments);
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

        // Initialize slideshow button
        this.#openPhotosButton = document.getElementById('chat-panel-open-photos-btn');
        this.#openPhotosButton.addEventListener('click', () => this.#openSlideshow());

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
        this.#messageViewer.on('selectionChange', () => this.#updateFooter());
        this.#messageFooter = new MessageFooter(this.node.querySelector('.mp-message-footer'));
        this.#messageFooter.on('action', () => this.#addSelectionToBook());
        this.#messageFooter.on('clear', () => this.#messageViewer.clearSelection());
    }

    #initializeEvents() {
        this.#services.datastore.on('chatNameChange', () => this.#updateChatName());
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

    #updateChatName() {
        this.#chatName = this.#services.datastore.resolveChatName(this.#chat).value;
        this.#headerSpan.textContent = this.#chatName;
    }

    #updateFooter() {
        const selection = this.#messageViewer.selection;
        if (selection.size === 0) {
            this.#messageFooter.setMessage('Select one or more messages to add to book...');
        } else if (!this.#book) {
            this.#messageFooter.setMessage('Open a book to add messages');
        } else if (selection.size === 1) {
            this.#messageFooter.setAction(`Add ${selection.size} message to book`);
        } else { // if (selection.size > 1) {
            this.#messageFooter.setAction(`Add ${selection.size} messages to book`);
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
