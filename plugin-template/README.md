# Plugin Template

## Development 🔨

Setup the template by running:

```bash
npm install
```

Then edit [plugin.ts](./plugin.ts) with plugin logic while utilizing types from the `clounge` library core.

## Build 
To build the plugin, run the npm script:

```bash
npm run package
```

This will output a Javascript module at [`build/plugin.js`](./build/plugin.js), which you can upload to any file hosting service and provide its URI for the app to load.