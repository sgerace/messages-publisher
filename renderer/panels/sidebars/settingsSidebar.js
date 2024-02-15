/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Settings Sidebar
 */

const _ = require('lodash');
const EventEmitter = require('eventemitter3');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class SettingsSidebar extends EventEmitter {

    // Private globals
    #services = null;
    #modals = null;

    node = null;

    #personalIdInput = null;
    #showImagesChat = null;
    #showImagesBook = null;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor(services, modals) {
        super();
        this.#services = services;
        this.#modals = modals;
        this.#initialize();
        this.#initializeEvents();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods

    hide() {
        this.node.classList.add('hidden');
    }

    isVisible() {
        return !this.node.classList.contains('hidden');
    }

    show() {
        this.node.classList.remove('hidden');
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('mp-settings-sidebar');

        // Personal identifier input
        this.#personalIdInput = document.getElementById('mp-settings-sidebar-personal-id');
        this.#personalIdInput.addEventListener('input', _.throttle(() => this.#savePersonalId(), 1000));

        // Show images in chat
        this.#showImagesChat = document.getElementById('mp-settings-sidebar-show-images-chat');
        this.#showImagesChat.addEventListener('change', async () => {
            await this.#services.datastore.setSetting('showImagesChat', this.#showImagesChat.checked);
        });
        this.#showImagesChat.checked = this.#services.datastore.getSetting('showImagesChat');

        // Show images in book
        this.#showImagesBook = document.getElementById('mp-settings-sidebar-show-images-book');
        this.#showImagesBook.addEventListener('change', async () => {
            await this.#services.datastore.setSetting('showImagesBook', this.#showImagesBook.checked);
        });
        this.#showImagesBook.checked = this.#services.datastore.getSetting('showImagesBook');
    }

    #initializeEvents() {
        this.#services.datastore.on('settingChange', (key, value) => this.#settingChange(key, value));
    }

    #savePersonalId() {
        this.#services.datastore.setSetting('personalId', this.#personalIdInput.value);
    }

    #settingChange(key, value) {
        if (key === 'personalId') {
            this.#personalIdInput.value = value;
        } else if (key === 'showImagesBook') {
            this.#showImagesBook.checked = value;
        } else if (key === 'showImagesChat') {
            this.#showImagesChat.checked = value;
        }
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = SettingsSidebar;
