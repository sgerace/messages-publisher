/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Message Footer Component
 */

const EventEmitter = require('eventemitter3');

class MessageFooter extends EventEmitter {

    // Private elements
    #clearSpan = null;
    #actionSpan = null;

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
        this.#clearSpan.classList.remove('hidden');
        this.#actionSpan.className = 'action';
        this.#actionSpan.textContent = text;
    }

    setMessage(text) {
        this.#clearSpan.classList.add('hidden');
        this.#actionSpan.className = 'message';
        this.#actionSpan.textContent = text;
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize(node) {
        this.node = node;
        this.node.classList.add('mp-message-footer');

        // Initialize clear span
        this.#clearSpan = document.createElement('span');
        this.#clearSpan.className = 'clear';
        this.#clearSpan.textContent = 'Clear selection';
        this.#clearSpan.addEventListener('click', () => {
            this.emit('clear');
        });

        // Initialize action span
        this.#actionSpan = document.createElement('span');
        this.#actionSpan.textContent = '';
        this.#actionSpan.addEventListener('click', () => {
            if (this.#actionSpan.classList.contains('action')) {
                this.emit('action');
            }
        });

        // Append spans in proper order (based on alignment flag)
        if (this.node.classList.contains('lt')) {
            this.node.append(this.#clearSpan, this.#actionSpan);
        } else {
            this.node.append(this.#actionSpan, this.#clearSpan);
        }
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = MessageFooter;
