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
        this.#headerSpan = document.getElementById('chat-panel-name');

        // Initialize rename button
        document.getElementById('chat-panel-rename-btn').addEventListener('click', () => {
            const resolved = this.#services.datastore.resolveChatName(this.#chat);
            this.#modals.renameChat.open(this.#chat, resolved.hasName ? resolved.value : '');
        });

        // Initialize message viewer
        this.#messageViewer = new MessageViewer();

        // Append components to node
        this.node.append(this.#messageViewer.node);
    }

    #initializeEvents() {
        this.#services.datastore.on('chatNameChange', () => this.#updateChatName());
    }

    #updateChatName() {
        this.#chatName = this.#services.datastore.resolveChatName(this.#chat).value;
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
