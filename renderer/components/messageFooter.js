/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Message Footer Component
 */

const EventEmitter = require('eventemitter3');

class MessageFooter extends EventEmitter {

    // Private elements
    #message = null;
    #clearButton = null;
    #actionButton = null;
    #actionButtonSpan = null;

    // Public variables
    node = null;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor(node) {
        super();
        this.#initialize(node);
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods

    setAction(text) {
        this.#message.classList.add('hidden');
        this.#clearButton.classList.remove('hidden');
        this.#actionButton.classList.remove('hidden');
        this.#actionButtonSpan.textContent = text;
    }

    setMessage(text) {
        this.#clearButton.classList.add('hidden');
        this.#actionButton.classList.add('hidden');
        this.#message.classList.remove('hidden');
        this.#message.textContent = text;
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize(node) {
        this.node = node;
        this.node.classList.add('mp-message-footer');

        // Initialize message
        this.#message = document.createElement('span');
        this.#message.className = 'message';

        // Initialize clear button
        this.#clearButton = document.createElement('button');
        this.#clearButton.className = 'clear';
        this.#clearButton.textContent = 'Clear selection';
        this.#clearButton.addEventListener('click', () => this.emit('clear'));

        // Initialize action button
        this.#actionButton = document.createElement('button');
        this.#actionButtonSpan = document.createElement('span');
        const actionButtonIcon = document.createElement('i');
        this.#actionButton.addEventListener('click', () => this.emit('action'));

        // Append spans in proper order (based on alignment flag)
        if (this.node.classList.contains('lt')) {
            actionButtonIcon.className = 'bi bi-chevron-double-right';
            this.#actionButton.append(this.#actionButtonSpan, actionButtonIcon);
            this.node.append(this.#message, this.#clearButton, this.#actionButton);
        } else {
            actionButtonIcon.className = 'bi bi-chevron-double-left';
            this.#actionButton.append(actionButtonIcon, this.#actionButtonSpan);
            this.node.append(this.#message, this.#actionButton, this.#clearButton);
        }
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = MessageFooter;
