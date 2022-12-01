/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Rename Person Modal
 */

const bootstrap = require('bootstrap');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Modal

class RenamePersonModal {

    // Private globals
    #services = null;
    #modal = null;

    // Private elements
    #nameInput = null;
    #submitButton = null;

    // Private data
    #id = null;

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

    open(id, name) {
        this.#id = id;
        this.#nameInput.value = name || '';
        this.#modal.show();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('rename-person-modal');
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
        this.#nameInput = document.getElementById('rename-person-name');
        const submitButton = document.getElementById('rename-person-submit');
        submitButton.addEventListener('click', () => this.#submit());
    }

    async #submit() {
        const name = this.#nameInput.value;
        await this.#services.datastore.setHandleName(this.#id, name);
        this.#modal.hide();
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services) => {
        return new RenamePersonModal(services);
    }
};
