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
        }
        const item = this.node.querySelector(`[data-name="${name}"]`);
        if (item) {
            item.classList.add('active');
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
            this.setActive(ev.target.closest('.navbar-item').dataset.name);
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
