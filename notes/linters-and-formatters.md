# Linting, formatting, and type checking

Three kinds of tool keep a codebase healthy, and they do different jobs:

- A **linter** analyses source for likely bugs, questionable patterns, and style problems,
  and reports them as warnings or errors.
- A **formatter** rewrites source to a consistent layout, so spacing, quotes, and line
  breaks stop being a matter of opinion.
- A **type checker** verifies that values are used consistently with their declared or
  inferred types, catching a class of errors before the code runs.

The tables below list widely used tools by language, followed by how this repository
installs and runs a formatter and a linter.

## Popular linters

| Language | Linter |
| --- | --- |
| JavaScript / TypeScript | [ESLint](https://eslint.org/), [Biome](https://biomejs.dev/), [Oxlint](https://oxc.rs/docs/guide/usage/linter) |
| Python | [Ruff](https://docs.astral.sh/ruff/), [Pylint](https://pylint.readthedocs.io/) |
| Go | [golint](https://github.com/golang/lint) |
| Rust | [Clippy](https://github.com/rust-lang/rust-clippy) |
| Java | [Checkstyle](https://checkstyle.org/) |

- **ESLint**, the established, highly configurable linter for JavaScript and TypeScript.
- **Biome**, a fast Rust-based toolchain that lints and formats JavaScript, TypeScript, and
  more from one binary.
- **Oxlint**, a very fast Rust-based linter from the Oxc project.
- **Ruff**, an extremely fast Python linter from Astral that also formats.
- **Pylint**, a thorough, long-standing Python linter.
- **golint** is deprecated and archived. Its README states it is frozen with no drop-in
  replacement, and recommends `go vet` and Staticcheck instead. `golangci-lint` is the
  common aggregator for Go linting today.
- **Clippy**, the official Rust linter, run as `cargo clippy`.
- **Checkstyle**, a style and convention checker for Java.

## Popular formatters

| Language | Formatter |
| --- | --- |
| Python | [Black](https://black.readthedocs.io/), [isort](https://pycqa.github.io/isort/) |
| TypeScript / JavaScript | [Prettier](https://prettier.io/) |
| Go | [gofmt](https://pkg.go.dev/cmd/gofmt) |
| Rust | [rustfmt](https://github.com/rust-lang/rustfmt) |

- **Black**, the opinionated Python formatter maintained under the Python Software
  Foundation.
- **isort**, sorts and groups Python imports, and is commonly paired with Black.
- **Prettier**, the opinionated formatter for JavaScript, TypeScript, CSS, Markdown, and
  more.
- **gofmt**, the standard Go formatter that ships with the Go toolchain.
- **rustfmt**, the official Rust formatter, run as `cargo fmt`.

## Common type checkers

| Language | Type checker |
| --- | --- |
| Python | [Ty](https://github.com/astral-sh/ty), [Pyright](https://github.com/microsoft/pyright), [Mypy](https://github.com/python/mypy), [BasedPyright](https://github.com/DetachHead/basedpyright), [Pyrefly](https://pyrefly.org/) |
| JavaScript | [Flow](https://flow.org/) |
| TypeScript | Built-in (`tsc`) |

- **Ty**, a fast Rust-based Python type checker from Astral, the makers of Ruff and uv, in
  preview.
- **Pyright**, Microsoft's Python type checker and the engine behind Pylance in VS Code.
- **Mypy**, the original reference Python type checker, maintained under the Python
  organisation.
- **BasedPyright**, a community fork of Pyright with additional features.
- **Pyrefly**, Meta's Rust-based Python type checker and the successor to Pyre.
- **Flow**, Meta's static type checker for JavaScript.
- **TypeScript** checks types as part of the language: the compiler `tsc` reports type
  errors, so the checker is built in.

## Install a code formatter

Prompt used in this repository:

> Install and configure Prettier for the codebase. Use one shared Prettier config at the
> project root. It should format both the frontend and backend. Add an npm script called
> format.

This added, under `projects/weather_starter`:

- `.prettierrc.json`, a single shared config at the project root, so one set of rules
  formats both the `frontend` and `backend` workspaces.
- `.prettierignore`, to skip build output, dependencies, and data artefacts.
- a `format` npm script (`prettier --write .`), with a `format:check` companion for
  verification.

## Add a linter

Prompt used in this repository:

> Install and configure ESLint for the codebase. It should lint the React frontend and
> TypeScript backend. Add an npm script called lint.

This added a single ESLint flat config (`eslint.config.js`) that lints the React frontend
and the TypeScript backend, with React and React Hooks rules scoped to the frontend and
`eslint-config-prettier` last so ESLint does not duplicate Prettier's formatting. It also
added a `lint` npm script (`eslint .`), with a `lint:fix` companion.

## Run the tools

From `projects/weather_starter`:

```bash
npm run format   # apply Prettier across the frontend and backend
npm run lint     # check the code with ESLint
```

In this repository both currently pass cleanly: `format` reports every file unchanged, and
`lint` reports no problems.

## Sources

- ESLint: <https://eslint.org/>
- Biome: <https://biomejs.dev/>
- Oxlint (Oxc): <https://oxc.rs/docs/guide/usage/linter>
- Ruff: <https://docs.astral.sh/ruff/>
- Pylint: <https://pylint.readthedocs.io/>
- golint (deprecated, archived): <https://github.com/golang/lint>
- Clippy: <https://github.com/rust-lang/rust-clippy>
- Checkstyle: <https://checkstyle.org/>
- Black: <https://black.readthedocs.io/>
- isort: <https://pycqa.github.io/isort/>
- Prettier: <https://prettier.io/>
- gofmt: <https://pkg.go.dev/cmd/gofmt>
- rustfmt: <https://github.com/rust-lang/rustfmt>
- Ty: <https://github.com/astral-sh/ty>
- Pyright: <https://github.com/microsoft/pyright>
- Mypy: <https://github.com/python/mypy>
- BasedPyright: <https://github.com/DetachHead/basedpyright>
- Pyrefly: <https://pyrefly.org/>
- Flow: <https://flow.org/>
- TypeScript: <https://www.typescriptlang.org/>
