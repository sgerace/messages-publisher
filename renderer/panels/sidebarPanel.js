/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Sidebar Panel
 */

const ChatList = new require('../components/chatList');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class Sidebar {

    #chatList = null;
    #services = null;

    node = null;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Constructor

    constructor(services) {
        this.#services = services;
        this.#initialize();
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public properties

    get chatList() { return this.#chatList; }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public methods

    async open() {
        return false;
    }

    async refresh() {
        const chats = await this.#services.messages.getChats();
        this.#chatList.setChats(chats);
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #initialize() {
        this.node = document.getElementById('mp-sidebar-panel');

        // Initialize header
        const header = document.createElement('nav');
        header.className = 'navbar navbar-dark bg-dark';
        const headerSpan = document.createElement('span');
        headerSpan.className = 'navbar-brand';
        headerSpan.textContent = 'Conversations';
        header.append(headerSpan);

        this.#chatList = new ChatList();

        this.node.append(header, this.#chatList.node);
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Export singleton

module.exports = {
    create: (services) => {
        return new Sidebar(services);
    }
};
