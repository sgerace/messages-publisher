/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Rename Chat Modal
 */

const bootstrap = require('bootstrap');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Modal

class RenameChatModal {

    // Private globals
    #services = null;
    #modal = null;

    // Private elements
    #nameInput = null;
    #submitButton = null;

    // Private data
    #chat = null;

    // Public variables
    node = null;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor(services) {
        this.#services = services;
        this.#initialize();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods

    open(chat, name) {
        this.#chat = chat;
        this.#nameInput.value = name || '';
        this.#modal.show();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('rename-chat-modal');
        this.node.addEventListener('shown.bs.modal', () => this.#nameInput.focus());
        this.node.querySelector('form').addEventListener('submit', (ev) => {
            ev.preventDefault();
            try {
                this.#submit();
            } catch (err) { // Catch error to prevent page reload on errors
                console.error(err);
            }
        });
        this.#modal = new bootstrap.Modal(this.node);
        this.#nameInput = document.getElementById('rename-chat-name');
        const submitButton = document.getElementById('rename-chat-submit');
        submitButton.addEventListener('click', () => this.#submit());
    }

    async #submit() {
        const name = this.#nameInput.value;
        await this.#services.datastore.setChatName(this.#chat.id, name);
        this.#modal.hide();
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services) => {
        return new RenameChatModal(services);
    }
};
