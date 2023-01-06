/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Message Viewer Component
 */

class MessageViewer {

    node = null;

    #messages = null;
    #messageNodes = [];
    #messageContainer = null;

    // Selections
    #selection = new Set();
    #monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });


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
        const nodes = new Array(messages.length);
        let date = new Date(0);
        let currentYear = date.getFullYear();
        let currentMonth = -1;
        for (let i = 0; i < messages.length; ++i) {
            const message = messages[i];
            const messageDate = new Date(message.date);

            if (messageDate.getFullYear() !== currentYear) {
                const yearDiv = document.createElement('div');
                yearDiv.className = 'year';
                yearDiv.dataset.type = 'year';
                yearDiv.append(this.#createIcon('chevron-down'));
                yearDiv.append(this.#createSpan(messageDate.getFullYear()));
                container.append(yearDiv);
                currentYear = messageDate.getFullYear();
                currentMonth = -1;
            }

            if (messageDate.getMonth() !== currentMonth) {
                const monthDiv = document.createElement('div');
                monthDiv.className = 'month';
                monthDiv.dataset.type = 'month';
                monthDiv.append(this.#createIcon('chevron-down'));
                monthDiv.append(this.#createSpan(this.#monthFormatter.format(messageDate)));
                currentMonth = messageDate.getMonth();
                container.append(monthDiv);
            }

            // Add date marker if previous message is more than 1 hour
            if (message.date - date.valueOf() > 3600000) {
                date = messageDate;
                const dateSpan = document.createElement('span');
                dateSpan.dataset.type = 'date';
                dateSpan.className = 'date';
                dateSpan.textContent = date.toString();
                container.append(dateSpan);
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.dataset.id = message.id;
            messageDiv.dataset.index = i;
            messageDiv.dataset.type = 'message';
            const p = document.createElement('p');
            p.textContent = message.text;

            if (message.is_from_me) {
                messageDiv.classList.add('from-me');
            }

            nodes[i] = messageDiv;

            messageDiv.append(p);
            container.append(messageDiv);
        }

        // Replace current message container
        this.#messageNodes = nodes;
        this.#messageContainer.replaceWith(container);
        this.#messageContainer = container;
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #createSpan(text) {
        const node = document.createElement('span');
        node.textContent = text;
        return node;
    }

    #createIcon(icon) {
        const node = document.createElement('i');
        node.className = 'bi bi-' + icon;
        return node;
    }

    #initialize() {
        this.node = document.createElement('div');
        this.node.className = 'mp-message-viewer';
        this.node.addEventListener('click', (ev) => this.#onClick(ev));

        // Initialize list container and group
        this.#messageContainer = document.createElement('div');
        this.#messageContainer.className = 'message-container';

        // Append to node
        this.node.append(this.#messageContainer);
    }

    #onClick(ev) {
        const target = ev.target.closest('div.year, div.month, div.message');
        if (target) {
            if (target.classList.contains('message')) {
                this.#updateSelection(ev, target);
            } else {
                this.#toggleItems(ev, target, target.dataset.type);
            }
        }
    }

    #toggleItems(ev, node, type) {
        const className = `hidden-${type}`;
        let iter = node.nextSibling;
        while (iter && iter.dataset.type !== type) {
            iter.classList.toggle(className);
            iter = iter.nextSibling;
        }
    }

    #updateSelection(ev, message) {
        // const index = message.dataset.index;
        // @TODO [GH-3] Keep track of selected items in a way that is usable when adding to a book
        message.classList.toggle('selected');
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = MessageViewer;
