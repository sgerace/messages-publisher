/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Books Sidebar
 */

const EventEmitter = require('eventemitter3');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class BooksSidebar extends EventEmitter {

    // Private globals
    #services = null;
    #modals = null;

    #books = null;

    node = null;

    #createButton = null;
    #filterInput = null;

    #listContainer = null;
    #listGroup = null;

    #selectedBook = null;


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

    refresh() {
        this.#updateBooks();
    }

    setActive(bookId) {
        if (typeof bookId !== 'number') {
            bookId = Number(bookId);
        }
        const book = this.#services.datastore.books.find(x => x.id === bookId) || null;
        if (this.#selectedBook !== book) {
            const active = this.#listGroup.querySelector('.active');
            if (active) {
                active.classList.remove('active');
            }
            if (book) {
                this.#listGroup.querySelector(`#book-${book.id}`).classList.add('active');
            }
            this.#selectedBook = book;
            this.emit('activeChange', this.#selectedBook);
        }
    }

    show() {
        this.node.classList.remove('hidden');
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Private methods

    #applyFilter() {
        const filterValue = this.#filterInput.value;
        const tokens = filterValue ? filterValue.split(' ') : [];
        let iter = this.#listGroup.firstChild;
        while (iter) {
            const book = this.#services.datastore.books[Number(iter.dataset.index)];

            // const name = iter.textContent;
            let visible = true;
            for (let i = 0; i < tokens.length; ++i) {
                const token = tokens[i].toLowerCase();
                let tokenValid = false;
                if (book.name.toLowerCase().includes(token)) {
                    tokenValid = true;
                }
                if (!tokenValid) {
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

    #createBook() {
        this.#modals.upsertBook.open();
    }

    #initialize() {
        this.node = document.getElementById('mp-books-sidebar');

        // Initialize buttons
        this.#createButton = document.getElementById('mp-books-sidebar-create-button');
        this.#createButton.addEventListener('click', () => this.#createBook());

        // Initialize filter controls
        this.#filterInput = document.getElementById('mp-books-sidebar-filter-input');
        this.#filterInput.addEventListener('input', () => this.#applyFilter());

        // Initialize list container and group
        this.#listContainer = document.createElement('div');
        this.#listContainer.className = 'list-container';
        this.#listContainer.addEventListener('click', (ev) => {
            const bookNode = ev.target.closest('.list-group-item');
            if (!bookNode) { return; }
            this.setActive(bookNode.dataset.id);
        });
        this.#listGroup = document.createElement('ul');
        this.#listGroup.className = 'list-group list-group-flush';
        this.#listContainer.append(this.#listGroup);

        // Append to node
        this.node.append(this.#listContainer);
    }

    #initializeEvents() {
        this.#services.datastore.on('booksChange', () => this.#updateBooks());
    }

    #updateBooks() {

        // Create list
        const ul = document.createElement('ul');
        ul.className = 'list-group list-group-flush';

        // Initialize items
        let foundSelectedBook = false;
        for (let i = 0; i < this.#services.datastore.books.length; ++i) {
            const book = this.#services.datastore.books[i];
            const li = document.createElement('li');
            li.id = `book-${book.id}`;
            li.className = 'list-group-item';
            li.textContent = book.name;
            li.dataset.index = i;
            li.dataset.id = book.id;
            if (this.#selectedBook === book) {
                li.classList.add('active');
                foundSelectedBook = true;
            }
            ul.append(li);
        }

        // Reset selected book
        if (this.#selectedBook && !foundSelectedBook) {
            this.#selectedBook = null;
            this.emit('activeChange', this.#selectedBook);
        }

        // Replace list group
        this.#listGroup.replaceWith(ul);
        this.#listGroup = ul;

        // Apply filter
        this.#applyFilter();
    }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = BooksSidebar;
