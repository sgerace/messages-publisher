/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Message Viewer Component
 */

const os = require('os');
const EventEmitter = require('eventemitter3');

class MessageViewer extends EventEmitter {

    node = null;

    #messages = null;
    #messageContainer = null;

    #attachments = new Map();

    // Selections
    #selection = new Set();
    #monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });
    #showImages = false;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor(node) {
        super();
        this.#initialize(node);
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public properties

    get attachments() { return this.#attachments; }

    get endDate() { return this.#messages[this.#messages.length - 1].date; }

    get messages() { return this.#messages; }

    get selection() { return this.#selection; }

    get startDate() { return this.#messages[0].date; }

    get showImages() { return this.#showImages; }
    set showImages(value) {
        this.#showImages = value;
        if (this.#messages && this.#attachments) {
            this.setMessages(this.#messages, this.#attachments);
        }
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods

    clearSelection() {
        this.#selection.clear();
        let iter = this.#messageContainer.firstChild;
        let change = false;
        while (iter) {
            if (iter.dataset.type === 'message' && iter.classList.contains('selected')) {
                iter.classList.remove('selected');
                change = true;
            }
            iter = iter.nextSibling;
        }
        if (change) {
            this.emit('selectionChange', this.#selection);
        }
    }

    selectDateRange(start, end) {
        let iter = this.#messageContainer.firstChild;
        let change = false;
        while (iter) {
            if (iter.dataset.type === 'message') {
                const message = this.#messages[Number(iter.dataset.index)];
                const id = Number(iter.dataset.id);
                if (start <= message.date && message.date < end && !this.#selection.has(id)) {
                    this.#selection.add(id);
                    iter.classList.toggle('selected');
                    change = true;
                }
            }
            iter = iter.nextSibling;
        }
        if (change) {
            this.emit('selectionChange', this.#selection);
        }
    }

    setMessages(messages, attachments) {
        this.#messages = messages;
        this.#attachments = attachments;

        // Clear selection (remembering if items were selected)
        const selectionChange = this.#selection.size;
        this.#selection.clear();

        // Create container
        const container = document.createElement('div');
        container.className = 'message-container';

        // Construct messages
        let date = new Date(0);
        let currentYear = date.getFullYear();
        let currentMonth = -1;
        for (let i = 0; i < messages.length; ++i) {
            const message = messages[i];
            const messageDate = new Date(message.date);

            if (messageDate.getFullYear() !== currentYear) {
                const yearDiv = document.createElement('div');
                yearDiv.className = 'date-sep year expanded';
                yearDiv.dataset.type = 'year';
                yearDiv.append(this.#createIcon('chevron-down'));
                yearDiv.append(this.#createSpan(messageDate.getFullYear()));
                container.append(yearDiv);
                currentYear = messageDate.getFullYear();
                currentMonth = -1;
            }

            if (messageDate.getMonth() !== currentMonth) {
                const monthDiv = document.createElement('div');
                monthDiv.className = 'date-sep month expanded';
                monthDiv.dataset.type = 'month';
                monthDiv.append(this.#createIcon('chevron-down'));
                const monthStr = this.#monthFormatter.format(messageDate);
                monthDiv.append(this.#createSpan(`${monthStr} ${messageDate.getFullYear()}`));
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

            // Create div for message
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            if (message.is_from_me) {
                messageDiv.classList.add('from-me');
            }
            messageDiv.dataset.id = message.id;
            messageDiv.dataset.index = i;
            messageDiv.dataset.type = 'message';
            const p = document.createElement('p');
            p.textContent = message.text;
            messageDiv.append(p);
            container.append(messageDiv);

            // Create lazy-loaded images for attachments
            if (this.#showImages) {
                const messageAttachments = this.#attachments.get(message.id);
                if (messageAttachments) {
                    for (let j = 0; j < messageAttachments.length; ++j) {
                        const attachment = messageAttachments[j];
                        const imgDiv = document.createElement('div');
                        imgDiv.className = 'image';
                        imgDiv.dataset.message = message.id;
                        if (message.is_from_me) {
                            imgDiv.classList.add('from-me');
                        }
                        const img = document.createElement('img');
                        img.src = `mpimage://${attachment.filename.replace(/^~/, os.homedir())}`;
                        img.loading = 'lazy';
                        imgDiv.append(img);
                        container.append(imgDiv);
                    }
                }
            }
        }

        // Replace current message container
        this.#messageContainer.replaceWith(container);
        this.#messageContainer = container;

        // Emit change event
        if (selectionChange) {
            this.emit('selectionChange', this.#selection);
        }
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

    #initialize(node) {
        this.node = node;
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

        // Update expanded state
        node.classList.toggle('expanded');

        // Update chevron
        const icon = node.querySelector('i.bi');
        icon.classList.toggle('bi-chevron-down');
        icon.classList.toggle('bi-chevron-right');

        // Hide all child items
        let iter = node.nextSibling;
        const className = `hidden-${type}`;
        while (iter && iter.dataset.type !== 'year' && iter.dataset.type !== type) {
            iter.classList.toggle(className);
            iter = iter.nextSibling;
        }
    }

    #updateSelection(ev, message) {
        const id = Number(message.dataset.id);
        if (this.#selection.has(id)) {
            this.#selection.delete(id);
        } else {
            this.#selection.add(id);
        }
        message.classList.toggle('selected');
        let iter = message.nextSibling;
        while (iter && iter.dataset.message === message.dataset.id) {
            iter.classList.toggle('selected');
            iter = iter.nextSibling;
        }
        this.emit('selectionChange', this.#selection);
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = MessageViewer;
