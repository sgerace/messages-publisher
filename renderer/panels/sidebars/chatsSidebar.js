/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Chats Sidebar
 */

const EventEmitter = require('eventemitter3');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class ChatsSidebar extends EventEmitter {

    // Private globals
    #services = null;

    #chats = null;

    node = null;

    #filterOnlyNamed = null;
    #filterInput = null;

    #listContainer = null;
    #listGroup = null;

    #selectedChat = null;


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

    async open() {
        return false;
    }

    setChats(chats) {
        this.#chats = chats;

        const ul = document.createElement('ul');
        ul.className = 'list-group list-group-flush';

        for (const [ /* key */ , value] of this.#chats) {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            const resolved = this.#services.datastore.resolveChatName(value);
            li.textContent = resolved.value;
            li.dataset.chatId = value.id;
            li.dataset.hasName = resolved.hasName;
            ul.append(li);
        }

        if (this.#listGroup) {
            this.#listGroup.replaceWith(ul);
            this.#listGroup = ul;
        }
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #applyFilter() {
        const filterOnlyNamed = this.#filterOnlyNamed.checked;
        const filterValue = this.#filterInput.value;
        const tokens = filterValue ? filterValue.split(' ') : [];
        let iter = this.#listGroup.firstChild;
        while (iter) {
            const name = iter.textContent;
            let visible = true;
            if (filterOnlyNamed && iter.dataset.hasName !== 'true') {
                visible = false;
            }
            if (visible) {
                for (let i = 0; i < tokens.length; ++i) {
                    if (!name.includes(tokens[i])) {
                        visible = false;
                        break;
                    }
                }
            }
            if (visible) {
                iter.classList.remove('hidden');
            } else {
                iter.classList.add('hidden');
            }
            iter = iter.nextSibling;
        }
    }

    #initialize() {
        this.node = document.getElementById('mp-chats-sidebar');

        // Initialize filter controls
        this.#filterOnlyNamed = document.getElementById('mp-chats-sidebar-filter-only-named');
        this.#filterOnlyNamed.addEventListener('change', () => this.#applyFilter());
        this.#filterInput = document.getElementById('mp-chats-sidebar-filter-input');
        this.#filterInput.addEventListener('input', () => this.#applyFilter());

        // Initialize list container and group
        this.#listContainer = document.createElement('div');
        this.#listContainer.className = 'list-container';
        this.#listContainer.addEventListener('click', (ev) => {
            const chat = this.#chats.get(Number(ev.target.dataset.chatId));
            if (!this.#selectedChat || this.#selectedChat.id !== chat.id) {
                const active = this.#listGroup.querySelector('.active');
                if (active) {
                    active.classList.remove('active');
                }
                ev.target.classList.add('active');
                this.emit('activeChange', chat);
            }
        });
        this.#listGroup = document.createElement('ul');
        this.#listGroup.className = 'list-group list-group-flush';
        this.#listContainer.append(this.#listGroup);

        // Append to node
        this.node.append(this.#listContainer);
    }

    #initializeEvents() {
        this.#services.datastore.on('chatNameChange', () => this.#updateChats());
    }

    #updateChats() {
        let iter = this.#listGroup.firstChild;
        let updated = false;
        while (iter) {
            const chat = this.#chats.get(Number(iter.dataset.chatId));
            const resolved = this.#services.datastore.resolveChatName(chat);
            if (resolved.value !== iter.textContent) {
                iter.textContent = resolved.value;
                updated = true;
            }
            if (resolved.hasName !== iter.dataset.hasName) {
                iter.dataset.hasName = resolved.hasName;
                updated = true;
            }
            iter = iter.nextSibling;
        }
        if (updated) {
            this.#applyFilter();
        }
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = ChatsSidebar;
