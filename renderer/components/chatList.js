/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Chat List Component
 */

const EventEmitter = require('eventemitter3');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class ChatList extends EventEmitter {

    #services = null;

    #chats = null;

    node = null;

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
            li.textContent = this.#services.datastore.getChatName(value);
            li.dataset.chatId = value.id;
            ul.append(li);
        }

        if (this.#listGroup) {
            this.#listGroup.replaceWith(ul);
            this.#listGroup = ul;
        }
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #applyFilter(value) {
        let iter = this.#listGroup.firstChild;
        if (!value) {
            while (iter) {
                iter.classList.remove('hidden');
                iter = iter.nextSibling;
            }
        } else {
            const tokens = value ? value.split(' ') : null;
            while (iter) {
                const name = iter.textContent;
                let visible = true;
                for (let i = 0; i < tokens.length; ++i) {
                    if (!name.includes(tokens[i])) {
                        visible = false;
                        break;
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
    }

    #initialize() {
        this.node = document.createElement('div');
        this.node.className = 'mp-chat-list';

        // Initialize filter group
        const filterGroup = document.createElement('div');
        filterGroup.className = 'input-group mb-3';
        const filterSpan = document.createElement('label');
        filterSpan.className = 'input-group-text';
        filterSpan.textContent = 'Filter Chats:';
        this.#filterInput = document.createElement('input');
        this.#filterInput.type = 'text';
        this.#filterInput.className = 'form-control';
        this.#filterInput.addEventListener('input', () => {
            this.#applyFilter(this.#filterInput.value);
        });
        filterGroup.append(filterSpan, this.#filterInput);

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
        this.node.append(filterGroup, this.#listContainer);
    }

    #initializeEvents() {
        this.#services.datastore.on('chatNameChange', () => this.#updateChats());
    }

    #updateChats() {
        let iter = this.#listGroup.firstChild;
        while (iter) {
            const chat = this.#chats.get(Number(iter.dataset.chatId));
            const name = this.#services.datastore.getChatName(chat);
            if (name !== iter.textContent) {
                iter.textContent = name;
            }
            iter = iter.nextSibling;
        }
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = ChatList;
