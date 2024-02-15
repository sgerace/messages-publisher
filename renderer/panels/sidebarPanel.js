/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Sidebar Panel
 */

const BooksSidebar = new require('./sidebars/booksSidebar');
const ChatsSidebar = new require('./sidebars/chatsSidebar');
const PeopleSidebar = new require('./sidebars/peopleSidebar');
const SettingsSidebar = new require('./sidebars/settingsSidebar');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class SidebarPanel {

    // Private globals
    #services = null;
    #modals = null;

    // Public variables
    node = null;
    sidebars = null;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor(services, modals) {
        this.#services = services;
        this.#modals = modals;
        this.#initialize();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods

    async refresh() {
        this.sidebars.chats.setChats(await this.#services.messages.getChats());
        this.sidebars.people.setHandles(await this.#services.messages.getHandles());
    }

    setActive(name) {
        if (this.sidebars[name].isVisible()) {
            return;
        }
        for (const p in this.sidebars) {
            if (p === name) {
                this.sidebars[p].show();
            } else {
                this.sidebars[p].hide();
            }
        }
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('mp-sidebar-panel');

        // Initialize sidebars
        this.sidebars = {
            books: new BooksSidebar(this.#services, this.#modals),
            chats: new ChatsSidebar(this.#services, this.#modals),
            people: new PeopleSidebar(this.#services, this.#modals),
            settings: new SettingsSidebar(this.#services, this.#modals)
        };
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services, modals) => {
        return new SidebarPanel(services, modals);
    }
};
