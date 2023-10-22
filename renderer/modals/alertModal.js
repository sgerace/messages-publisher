/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Delete Book Modal
 */

const bootstrap = require('bootstrap');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Modal

class AlertModal {

    // Private globals
    #services = null;
    #modal = null;

    // Private elements
    #titleNode = null;
    #messageNode = null;

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

    open(title, code) {
        this.#titleNode.textContent = title;
        this.node.querySelectorAll('.alert').forEach(x => {
            if (x.dataset.code === code) {
                x.classList.remove('hidden');
            } else {
                x.classList.add('hidden');
            }
        });
        this.#modal.show();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('alert-modal');
        this.#titleNode = this.node.querySelector('h1.modal-title');
        this.#messageNode = this.node.querySelector('p.alert-message');
        this.#modal = new bootstrap.Modal(this.node, {
            backdrop: 'static',
            keyboard: false
        });
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services) => {
        return new AlertModal(services);
    }
};
