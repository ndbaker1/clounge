# Plugin Template

Plugins work by exporting an es6 `default` component, which is of the `RoomPlugin` type
> from the [types](../types/index.ts) definitions

Typescript is used in the build process to make type completion automatic, which greatly improves the developer experience

## Quickstart ⏩

Edit [plugin.ts](./plugin.ts) with plugin logic while utilizing **ONLY** `type` imports from the [types](../types/) or [plugins](../plugins/) libraries.

If you want to use external imports and get their types, consider using a [dynamic import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) with a `devDependency`. It would look something like the following

```js
// example.js
const some_package: typeof import("some_package") =
    await import("https://esm.sh/...some_package");
```

```json
// package.json
{
    ...,
    "devDependencies": {
        ...,
        "some_package": "..."
    }
}
```

## Build  🔨

To build the plugin, run the npm build script:

```bash
npm run build
```

This will output a Javascript module at `build/plugin-template/plugin.js`, which you can upload to any file hosting service and provide its URI for the app to load.

> You could go ahead and just commit this `plugin.js` file if you want to use github raw file links as your plugin URL
