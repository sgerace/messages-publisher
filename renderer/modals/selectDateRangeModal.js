/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Select Date Range Modal
 */

const bootstrap = require('bootstrap');
const flatpickr = require('flatpickr');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Modal

class SelectDateRangeModal {

    // Private globals
    #services = null;
    #modal = null;

    // Private elements
    #flatpickr = null;
    #resolver = null;

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

    async open(options) {

        // Clear date input
        this.#flatpickr.clear();
        this.#flatpickr.config.minDate = options.min;
        this.#flatpickr.config.maxDate = options.max;
        this.#flatpickr.jumpToDate(options.min);

        // Show modal
        this.#modal.show();

        // Create promise
        return new Promise((resolve) => this.#resolver = resolve);
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('select-date-range-modal');
        this.node.addEventListener('hidden.bs.modal', () => {
            const range = this.#flatpickr.selectedDates;
            this.#resolver(range && range.length === 2 ? range : null);
        });
        this.node.querySelector('form').addEventListener('submit', (ev) => {
            ev.preventDefault();
        });
        this.#modal = new bootstrap.Modal(this.node);

        // Initialize date range input
        this.#flatpickr = flatpickr(this.node.querySelector('input'), {
            allowInput: false,
            enableTime: false,
            clickOpens: true,
            mode: 'range'
        });

        // this.#nameInput = document.getElementById('upsert-book-name');
        const submitButton = document.getElementById('select-date-range-submit');
        submitButton.addEventListener('click', () => this.#submit());
    }

    #submit() {
        this.#modal.hide();
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services) => {
        return new SelectDateRangeModal(services);
    }
};
