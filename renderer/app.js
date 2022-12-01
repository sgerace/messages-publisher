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
    renameChat: require('./modals/renameChatModal').create(services),
    renamePerson: require('./modals/renamePersonModal').create(services)
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Panels

const navbarPanel = require('./panels/navbarPanel').create(services);
const sidebarPanel = require('./panels/sidebarPanel').create(services, modals);
const chatPanel = require('./panels/chatPanel').create(services, modals);
const bookPanel = require('./panels/bookPanel').create(services);


sidebarPanel.sidebars.chats.on('activeChange', (chat) => chatPanel.setChat(chat));


// Manage and initialize active sidebar
navbarPanel.on('activeChange', (active) => {
    sidebarPanel.setActive(active);
    localStorage.setItem('activeSidebar', active);
});
navbarPanel.setActive(localStorage.getItem('activeSidebar') || 'chats');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Application functions

async function initialize() {

    // Initialize services
    await services.datastore.open();
    await services.messages.open();

    // Initialize panels
    await sidebarPanel.refresh();
    await bookPanel.load();
}

initialize();
