/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * People Sidebar
 */

const EventEmitter = require('eventemitter3');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Class

class PeopleSidebar extends EventEmitter {

    // Private globals
    #services = null;
    #modals = null;

    #handles = null;

    node = null;

    #filterOnlyNamed = null;
    #filterInput = null;

    #listContainer = null;
    #listGroup = null;


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

    setHandles(handles) {
        this.#handles = handles;

        // Create list
        const ul = document.createElement('ul');
        ul.className = 'list-group list-group-flush';

        // Initialize items
        for (const id of this.#handles) {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            const resolved = this.#services.datastore.resolveHandleName(id);
            li.textContent = resolved.value;
            li.dataset.id = id;
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
            const id = iter.dataset.id;
            const name = iter.textContent;
            let visible = true;
            if (filterOnlyNamed && iter.dataset.hasName !== 'true') {
                visible = false;
            }
            if (visible) {
                for (let i = 0; i < tokens.length; ++i) {
                    const token = tokens[i];
                    if (!name.includes(token) && !id.includes(token)) {
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
        this.node = document.getElementById('mp-people-sidebar');

        // Initialize filter controls
        this.#filterOnlyNamed = document.getElementById('mp-people-sidebar-filter-only-named');
        this.#filterOnlyNamed.addEventListener('change', () => {
            localStorage.setItem('peopleFilterOnlyNamed', this.#filterOnlyNamed.checked);
            this.#applyFilter();
        });
        this.#filterOnlyNamed.checked = localStorage.getItem('peopleFilterOnlyNamed') === 'true';
        this.#filterInput = document.getElementById('mp-people-sidebar-filter-input');
        this.#filterInput.addEventListener('input', () => this.#applyFilter());

        // Initialize list container and group
        this.#listContainer = document.createElement('div');
        this.#listContainer.className = 'list-container';
        this.#listContainer.addEventListener('click', (ev) => {
            const name = ev.target.dataset.hasName === 'true' ? ev.target.textContent : '';
            this.#modals.renamePerson.open(ev.target.dataset.id, name);
        });
        this.#listGroup = document.createElement('ul');
        this.#listGroup.className = 'list-group list-group-flush';
        this.#listContainer.append(this.#listGroup);

        // Append to node
        this.node.append(this.#listContainer);
    }

    #initializeEvents() {
        this.#services.datastore.on('handleNameChange', () => this.#updateHandles());
    }

    #updateHandles() {
        let iter = this.#listGroup.firstChild;
        let updated = false;
        while (iter) {
            const id = iter.dataset.id;
            const resolved = this.#services.datastore.resolveHandleName(id);
            if (resolved.value !== iter.textContent) {
                iter.textContent = resolved.value;
                updated = true;
            }
            if (resolved.hasName !== (iter.dataset.hasName === 'true')) {
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

module.exports = PeopleSidebar;
