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
    renameChat: require('./modals/renameChatModal').create(services)
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Panels

const sidebarPanel = require('./panels/sidebarPanel').create(services);
const chatPanel = require('./panels/chatPanel').create(services, modals);
const bookPanel = require('./panels/bookPanel').create(services);

sidebarPanel.chatsSidebar.on('activeChange', (chat) => chatPanel.setChat(chat));


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
