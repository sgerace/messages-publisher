/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Delete Book Modal
 */

const bootstrap = require('bootstrap');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Modal

class DeleteBookModal {

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
        this.#nameInput.value = name || '';
        this.#modal.show();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('delete-book-modal');
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
        this.#nameInput = document.getElementById('delete-book-name');
        const submitButton = document.getElementById('delete-book-submit');
        submitButton.addEventListener('click', () => this.#submit());
    }

    async #submit() {
        if (this.#nameInput.value === this.#book.name) {
            await this.#services.datastore.deleteBook(this.#book.id);
            this.#modal.hide();
        }
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services) => {
        return new DeleteBookModal(services);
    }
};
