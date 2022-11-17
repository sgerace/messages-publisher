/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Application
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Services

const Messages = require('./services/messages');

const services = {
    messages: new Messages('./data/chat.db')
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Panels

const sidebarPanel = require('./panels/sidebarPanel').create(services);
const chatPanel = require('./panels/chatPanel').create(services);
const bookPanel = require('./panels/bookPanel').create(services);

sidebarPanel.chatList.on('activeChange', (chat) => chatPanel.setChat(chat));


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Application functions

async function initialize() {

    // Initialize services
    await services.messages.open();

    await sidebarPanel.refresh();

    await bookPanel.load();
}

initialize();
