# DEVLOG

## 2022-11-26

Tried to get the environment up and running, seems as though I had to work on
Windows directly as WSL was misbehaving.  Also needed to add a `shell: true`
argument to `support/scripts/ops/sass.op.js`.

To get running we need to put `sms.db` in as `data/chat.db`.

For election, the `main.js` is launching the main process. The renderer process
is a separate process running in Chromium. Things in the `main` folder are
going to be associated with this main process.  That process just essentially
launches Chromium (with some node addons) and all of that stuff is in the
`renderer` folder.

The design involves `panels` which are `id`-ed elements in the HTML in
`index.html`, and the semantics are that these persist over the whole lifetime
of the application. Singletons.  And there are also `modals` which are like
`panels` but open and close.  `components` are not singletons, they are
instantiated by panels.  In the current thing, the `messageViewer` is a
`component`. Finally there are `services` which are not in the UI, just backend
stuff.  `messages.js` accesses the `chats.db` sqlite3 database and the
`datastore.js` is our own `sqlite3` database.

The `sass` folder mirrors the `renderer` folder.

`support` has the startup script stuff, developer conveniences.

Sal's way of things is to have each of the panels dom elements only interacted
with in the panel's corresponding module.  To cross panel boundaries you should use either
an event or a public method from the correct panel module.

We decided that the main message renderer is going to operate in 'message
units'.  This requires doing some math to figure out the non-uniform scrolling
that we would have to do to have smooth scrolling in the main window.  We also
have a little buffer of rendered elements with absolute positions before and
after the current state.  We don't use the native scroll bar at all instead
have a sort of minimap with years and months denoted.


## 2023-06-30

Little things:

- Do we need to round the corners of images?
