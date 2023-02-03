/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Message Footer Component
 */

const EventEmitter = require('eventemitter3');

class MessageFooter extends EventEmitter {

    // Private elements
    #span = null;

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
        this.#span.className = 'action';
        this.#span.textContent = text;
    }

    setMessage(text) {
        this.#span.className = 'message';
        this.#span.textContent = text;
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize(node) {
        this.node = node;
        this.node.className = 'mp-message-footer';
        // this.node.addEventListener('click', (ev) => this.#onClick(ev));

        // Initialize span
        this.#span = document.createElement('span');
        this.#span.textContent = '';
        this.#span.addEventListener('click', () => {
            if (this.#span.classList.contains('action')) {
                this.emit('action');
            }
        });
        this.node.append(this.#span);
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = MessageFooter;
