/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Application
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Bootstrap Modules

require('bootstrap');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Services

const Datastore = require('./services/datastore');
const Messages = require('./services/messages');

const services = {
    datastore: new Datastore(),
    messages: new Messages('./data/chat.db')
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Modals

const modals = {
    alert: require('./modals/alertModal').create(services),
    deleteBook: require('./modals/deleteBookModal').create(services),
    exportBook: require('./modals/exportBookModal').create(services),
    renameChat: require('./modals/renameChatModal').create(services),
    renamePerson: require('./modals/renamePersonModal').create(services),
    selectDateRange: require('./modals/selectDateRangeModal').create(services),
    slideshow: require('./modals/slideshow').create(services),
    upsertBook: require('./modals/upsertBookModal').create(services)
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Panels

const navbarPanel = require('./panels/navbarPanel').create(services);
const sidebarPanel = require('./panels/sidebarPanel').create(services, modals);
const chatPanel = require('./panels/chatPanel').create(services, modals);
const bookPanel = require('./panels/bookPanel').create(services, modals);

// Manage and initialize active sidebar
navbarPanel.on('activeChange', (active) => {
    sidebarPanel.setActive(active);
    localStorage.setItem('activeSidebar', active);
});
navbarPanel.setActive(localStorage.getItem('activeSidebar') || 'chats');

// Connect active channge events
sidebarPanel.sidebars.chats.on('activeChange', (chat) => {
    if (chat) {
        localStorage.setItem('activeChat', chat.id);
    } else {
        localStorage.removeItem('activeChat');
    }
    chatPanel.setChat(chat);
});
sidebarPanel.sidebars.books.on('activeChange', (book) => {
    if (book) {
        localStorage.setItem('activeBook', book.id);
    } else {
        localStorage.removeItem('activeBook');
    }
    chatPanel.setBook(book);
    bookPanel.setBook(book);
});


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Application functions

async function initialize() {

    // Initialize datastore service
    await services.datastore.open();

    // Initialize messages service
    try {
        await services.messages.open();
    } catch (err) {
        if (err.code === 'SQLITE_CANTOPEN') {
            modals.alert.open('Additional Permissions Required', 'full-disk-access');
        } else {
            modals.alert.open('Unknown Error', 'unknown-error');
        }
        return;
    }

    // Initialize panels
    await sidebarPanel.refresh();

    // Restore state of application
    sidebarPanel.sidebars.chats.setActive(localStorage.getItem('activeChat'));
    sidebarPanel.sidebars.books.setActive(localStorage.getItem('activeBook'));
}

initialize();
