/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Chat Panel
 */

const MessageViewer = require('../components/messageViewer');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class ChatPanel {

    #messageViewer = null;
    #services = null;

    node = null;

    #chat = null;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor(services) {
        this.#services = services;
        this.#initialize();
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
        const messages = await this.#services.messages.getMessagesByChat(chat.id);
        this.#messageViewer.setMessages(messages);
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('mp-chat-panel');

        // Initialize header
        const header = document.createElement('nav');
        header.className = 'navbar navbar-dark bg-dark';
        const headerSpan = document.createElement('span');
        headerSpan.className = 'navbar-brand';
        headerSpan.textContent = 'Messages';
        header.append(headerSpan);

        // Initialize message viewer
        this.#messageViewer = new MessageViewer();

        // Append components to node
        this.node.append(header, this.#messageViewer.node);
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services) => {
        return new ChatPanel(services);
    }
};
