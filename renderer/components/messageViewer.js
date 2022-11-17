/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Message Viewer Component
 */

class MessageViewer {

    node = null;

    #messages = null;
    #messageContainer = null;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor() {
        this.#initialize();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public properties



    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods

    setMessages(messages) {
        this.#messages = messages;

        // Create container
        const container = document.createElement('div');
        container.className = 'message-container';

        // Construct messages
        for (let i = 0; i < messages.length; ++i) {
            const message = messages[i];
            const messageDiv = document.createElement('div');
            const p = document.createElement('p');
            p.textContent = message.text;
            messageDiv.append(p);

            container.append(messageDiv);
        }

        // Replace current message container
        this.#messageContainer.replaceWith(container);
        this.#messageContainer = container;
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.createElement('div');
        this.node.className = 'mp-message-viewer';

        // Initialize list container and group
        this.#messageContainer = document.createElement('div');
        this.#messageContainer.className = 'message-container';

        // Append to node
        this.node.append(this.#messageContainer);
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = MessageViewer;
