/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Slideshow
 */

const electron = require('electron');
const fspath = require('path');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Modal

class Slideshow {

    // Private globals
    #services = null;

    // Private elements
    #filenameLabel = null;
    #indexLabel = null;
    #prevButton = null;
    #nextButton = null;
    #saveButton = null;
    #closeButton = null;
    #image = null;

    // Private data
    #attachments = null;
    #currentIndex = 0;

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

    open(attachments) {
        this.node.classList.remove('hidden');
        this.#attachments = attachments;
        this.#setCurrentIndex(0);
    }

    supportsMimeType(mimeType) {
        return !!this.#SUPPORTED_IMAGE_TYPES[mimeType];
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #close() {
        this.node.classList.add('hidden');
    }

    #initialize() {
        this.node = document.getElementById('slideshow');
        this.node.classList.add('hidden');

        // Initialize labels
        this.#filenameLabel = document.getElementById('slideshow-filename');
        this.#indexLabel = document.getElementById('slideshow-index');
        this.#image = document.getElementById('slideshow-image');

        // Initialize buttons
        this.#prevButton = document.getElementById('slideshow-header-prev-btn');
        this.#prevButton.addEventListener('click', () => this.#prev());
        this.#nextButton = document.getElementById('slideshow-header-next-btn');
        this.#nextButton.addEventListener('click', () => this.#next());
        this.#saveButton = document.getElementById('slideshow-header-save-btn');
        this.#saveButton.addEventListener('click', () => this.#save());
        this.#closeButton = document.getElementById('slideshow-header-close-btn');
        this.#closeButton.addEventListener('click', () => this.#close());
    }

    #next() {
        if (this.#currentIndex < this.#attachments.length - 1) {
            this.#setCurrentIndex(this.#currentIndex + 1);
        }
    }

    #prev() {
        if (this.#currentIndex > 0) {
            this.#setCurrentIndex(this.#currentIndex - 1);
        }
    }

    async #save() {
        const attachment = this.#attachments[this.#currentIndex];
        await electron.ipcRenderer.invoke('savePhoto', {
            filename: fspath.basename(attachment.filename),
            src: attachment.filename
        });
    }

    #setCurrentIndex(index) {
        const attachment = this.#attachments[index];
        this.#currentIndex = index;
        this.#filenameLabel.textContent = fspath.basename(attachment.filename);
        this.#indexLabel.textContent = `${index + 1} of ${this.#attachments.length}`;
        this.#image.src = `mpimage://${attachment.filename}`;
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Pubic constants

    #SUPPORTED_IMAGE_TYPES = {
        'image/heic': true,
        'image/jpeg': true,
        'image/png': true,
    };
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services) => {
        return new Slideshow(services);
    }
};
