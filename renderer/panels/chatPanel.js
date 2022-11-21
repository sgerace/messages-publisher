/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Chat Panel
 */

const MessageViewer = require('../components/messageViewer');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class ChatPanel {

    // Private globals
    #services = null;
    #modals = null;

    // Private data
    #chat = null;
    #chatName = null;

    // Private elements
    #headerSpan = null;

    // Private components
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
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('mp-chat-panel');

        // Initialize header
        const header = document.createElement('nav');
        header.className = 'navbar navbar-dark bg-dark';
        this.#headerSpan = document.createElement('span');
        this.#headerSpan.className = 'navbar-brand';
        this.#headerSpan.textContent = 'Messages';

        // Initialize rename button
        const renameButton = document.createElement('button');
        renameButton.className = 'btn btn-secondary';
        renameButton.addEventListener('click', () => {
            this.#modals.renameChat.open(this.#chat, this.#chatName);
        });
        const renameIcon = document.createElement('i');
        renameIcon.className = 'bi bi-pencil-square';
        renameButton.append(renameIcon);

        // Append header items
        header.append(this.#headerSpan, renameButton);

        // Initialize message viewer
        this.#messageViewer = new MessageViewer();

        // Append components to node
        this.node.append(header, this.#messageViewer.node);
    }

    #initializeEvents() {
        this.#services.datastore.on('chatNameChange', () => this.#updateChatName());
    }

    #updateChatName() {
        this.#chatName = this.#services.datastore.getChatName(this.#chat);
        this.#headerSpan.textContent = this.#chatName;
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services, modals) => {
        return new ChatPanel(services, modals);
    }
};
