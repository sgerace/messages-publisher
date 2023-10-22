/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Navbar Panel
 */

const EventEmitter = require('eventemitter3');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class NavbarPanel extends EventEmitter {

    #services = null;

    node = null;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor(services) {
        super();
        this.#services = services;
        this.#initialize();
        this.#initializeEvents();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods

    setActive(name) {
        const currentActive = this.node.querySelector('.active');
        if (currentActive) {
            if (currentActive.dataset.name === name) {
                return;
            }
            currentActive.classList.remove('active');
            const currentIcon = currentActive.querySelector('i');
            currentIcon.classList.remove(currentIcon.dataset.alt);
            currentIcon.classList.add(currentIcon.dataset.pri);
        }
        const item = this.node.querySelector(`[data-name="${name}"]`);
        if (item) {
            item.classList.add('active');
            const icon = item.querySelector('i');
            icon.classList.add(icon.dataset.alt);
            icon.classList.remove(icon.dataset.pri);
            this.emit('activeChange', name);
        }
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('mp-navbar-panel');
    }

    #initializeEvents() {
        this.node.addEventListener('click', (ev) => {
            const item = ev.target.closest('.navbar-item');
            if (item) {
                this.setActive(item.dataset.name);
            }
        });
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services) => {
        return new NavbarPanel(services);
    }
};
