/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Sidebar Panel
 */

const ChatsSidebar = new require('./sidebars/chatsSidebar');
const PeopleSidebar = new require('./sidebars/peopleSidebar');


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
        const chats = await this.#services.messages.getChats();
        const handles = await this.#services.messages.getHandles();
        this.sidebars.chats.setChats(chats);
        this.sidebars.people.setHandles(handles);
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
            chats: new ChatsSidebar(this.#services, this.#modals),
            people: new PeopleSidebar(this.#services, this.#modals)
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
