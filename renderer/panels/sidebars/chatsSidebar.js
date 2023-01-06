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

    hide() {
        this.node.classList.add('hidden');
    }

    isVisible() {
        return !this.node.classList.contains('hidden');
    }

    setChats(chats) {
        this.#chats = chats;

        // Create list
        const ul = document.createElement('ul');
        ul.className = 'list-group list-group-flush';

        // Initialize items
        for (const [ /* key */ , value] of this.#chats) {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            const resolved = this.#services.datastore.resolveChatName(value);
            li.textContent = resolved.value;
            li.dataset.id = value.id;
            li.dataset.hasName = resolved.hasName;
            ul.append(li);
        }

        // Replace list group
        this.#listGroup.replaceWith(ul);
        this.#listGroup = ul;

        // Apply filter
        this.#applyFilter();
    }

    show() {
        this.node.classList.remove('hidden');
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #applyFilter() {
        const filterOnlyNamed = this.#filterOnlyNamed.checked;
        const filterValue = this.#filterInput.value;
        const tokens = filterValue ? filterValue.split(' ') : [];
        let iter = this.#listGroup.firstChild;
        while (iter) {
            const chat = this.#chats.get(Number(iter.dataset.id));
            const resolved = this.#services.datastore.resolveChatName(chat);

            // const name = iter.textContent;
            let visible = true;
            if (filterOnlyNamed && iter.dataset.hasName !== 'true') {
                visible = false;
            }
            if (visible) {
                for (let i = 0; i < tokens.length; ++i) {
                    const token = tokens[i].toLowerCase();
                    let tokenValid = false;
                    if (resolved.hasName && resolved.value.toLowerCase().includes(token)) {
                        tokenValid = true;
                    } else {
                        for (const handle of chat.handles) {
                            if (handle.toLowerCase().includes(token)) {
                                tokenValid = true;
                                break;
                            }
                            const res = this.#services.datastore.resolveHandleName(handle);
                            if (res.hasName && res.value.toLowerCase().includes(token)) {
                                tokenValid = true;
                                break;
                            }
                        }
                    }
                    if (!tokenValid) {
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
        this.#filterOnlyNamed.addEventListener('change', () => {
            localStorage.setItem('chatsFilterOnlyNamed', this.#filterOnlyNamed.checked);
            this.#applyFilter();
        });
        this.#filterOnlyNamed.checked = localStorage.getItem('chatsFilterOnlyNamed') === 'true';
        this.#filterInput = document.getElementById('mp-chats-sidebar-filter-input');
        this.#filterInput.addEventListener('input', () => this.#applyFilter());

        // Initialize list container and group
        this.#listContainer = document.createElement('div');
        this.#listContainer.className = 'list-container';
        this.#listContainer.addEventListener('click', (ev) => {
            const chatNode = ev.target.closest('.list-group-item');
            if (!chatNode) { return; }
            const chat = this.#chats.get(Number(chatNode.dataset.id));
            if (!this.#selectedChat || this.#selectedChat.id !== chat.id) {
                const active = this.#listGroup.querySelector('.active');
                if (active) {
                    active.classList.remove('active');
                }
                chatNode.classList.add('active');
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
        this.#services.datastore.on('handleNameChange', () => this.#updateChats());
    }

    #updateChats() {
        let iter = this.#listGroup.firstChild;
        let updated = false;
        while (iter) {
            const chat = this.#chats.get(Number(iter.dataset.id));
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
