# @fimbul/circular

Angular integration of the [Fimbullinter project](https://github.com/fimbullinter/wotan).

## Install

```sh
npm install --save-dev @fimbul/circular
# or
yarn add -D @fimbul/circular
```

## Linting via Angular CLI

In your `angular.json`, under `projects / <projectName> / architect / lint`, replace the existing TSLint builder as follows:

```json
"lint": {
  "builder": "@fimbul/circular:lint",
  "options": {
  }
}
```

If you now run `ng lint [projectName]`, you are executing Fimbullinter instead of TSLint.

`"options"` can be used to configure the linter using [configuration options of the `wotan` CLI](https://github.com/fimbullinter/wotan/blob/master/packages/wotan/README.md#cli-options). For example `wotan --cache --config wotan:recommended --fix` translates to the following `options` object:

```json
"options": {
  "cache": true,
  "config": "wotan:recommended",
  "fix": true
}
```

If you do not explicitly configure the `project` option, it will automatically use the `tsConfig` options of that project's `build` and `test` targets.

### Global default options for all projects

If you find yourself specifying the same options for all projects, consider creating a [`.fimbullinter.yaml`](https://github.com/fimbullinter/wotan/blob/master/packages/wotan/README.md#adding-cli-defaults-to-fimbullinteryaml). This file contains default options used for all projects and the `wotan` CLI (in case you want to use that too). You can still override specific configurations per project using `"options"` as described above.

### Replacing TSLint

As you might know TSLint reached its end of life. Instead of jumping on the typescript-eslint hype-train, consider Fimbullinter as a replacement.
Spoiler: Fimbullinter will eventually be able to execute ESLint rules, so you can tap into the vast ecosystem of existing rules while using a linter that is actually intended to work with TypeScript.

The [builtin rules](https://github.com/fimbullinter/wotan/blob/master/packages/mimir/README.md#rules) provide improved versions of TSLint rules as well as completely new and original ones.

If you still want to use TSLint rules to ease the transition, there are two possibilites:

* [`@fimbul/valtyr`](https://github.com/fimbullinter/wotan/blob/master/packages/valtyr/README.md) provides full compatibility with TSLint and your existing `tslint.json` with almost no setup.
* [`@fimbul/heimdall`](https://github.com/fimbullinter/wotan/blob/master/packages/heimdall/README.md) allows using TSLint rules and formatters within Fimbullinter, so you can still use the rules you know and love while getting all the benefits of Fimbullinter's builtin rules.

## What's next?

This repository is intended to contain all sorts of Angular-related goodness for Fimbullinter. You can expect the addition of rules and configuration presets in the future.

## License

Apache-2.0 © [Klaus Meinhardt](https://github.com/ajafff)
