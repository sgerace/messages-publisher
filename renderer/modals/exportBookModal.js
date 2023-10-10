/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Export Book Modal
 */

const bootstrap = require('bootstrap');
const electron = require('electron');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Modal

class ExportBookModal {

    // Private globals
    #services = null;
    #modal = null;

    // Private elements
    #progress = null;

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

    async open(book, path) {
        this.#book = book;
        this.#modal.show();

        // Initialize progress bar
        this.#progress.style.width = '0%';

        // Export book
        const progressHandler = (sender, value) => this.#setProgress(value);
        electron.ipcRenderer.on('exportBookProgress', progressHandler);
        await electron.ipcRenderer.invoke('exportBook', book, path);
        electron.ipcRenderer.off('exportBookProgress', progressHandler);

        // @TODO: Need to understand why this only works with a 500ms+ delay
        setTimeout(() => this.#modal.hide(), 500);
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('export-book-modal');
        this.#modal = new bootstrap.Modal(this.node);

        // @TODO: Figure out how to prevent the modal from closing when clicking on the backdrop

        this.#progress = document.getElementById('export-book-progress');
    }

    #setProgress(value) {
        this.#progress.style.width = `${value}%`;
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services) => {
        return new ExportBookModal(services);
    }
};
