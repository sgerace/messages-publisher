/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Upsert Book Modal
 */

const bootstrap = require('bootstrap');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Modal

class UpsertBookModal {

    // Private globals
    #services = null;
    #modal = null;

    // Private elements
    #nameInput = null;
    #submitButton = null;

    // Private data
    #book = null;

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

    open(book) {
        this.#book = book;
        this.#nameInput.value = this.#book ? this.#book.name : '';

        // Configure modal for creating or editing
        const title = document.getElementById('upsert-book-title');
        title.textContent = this.#book ? 'Rename Book' : 'Create Book';

        // Show modal
        this.#modal.show();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('upsert-book-modal');
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
        this.#nameInput = document.getElementById('upsert-book-name');
        const submitButton = document.getElementById('upsert-book-submit');
        submitButton.addEventListener('click', () => this.#submit());
    }

    async #submit() {
        const name = this.#nameInput.value;
        if (this.#book) {
            await this.#services.datastore.setBookInfo(this.#book.id, { name });
        } else {
            await this.#services.datastore.createBook(name);
        }
        this.#modal.hide();
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services) => {
        return new UpsertBookModal(services);
    }
};
