# Searching text in hidden and ignored files

By default, `ripgrep` (and most editor "find in files" tools built on it) skips two
kinds of paths: hidden files and directories whose names start with a dot (such as
`.env` or `.git`), and anything matched by ignore rules like `.gitignore` and
`.ignore` (such as `node_modules`). This keeps everyday searches fast and focused on
your own source, but it also means a plain search will silently miss content in those
places.

Reference: <https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md>

## The flags that widen the search

- `--hidden` includes dotfiles and dot-directories in the search.
- `--no-ignore` stops honouring `.gitignore`, `.ignore`, and similar ignore files, so
  ignored paths like `node_modules` are searched too.
- `-uu` is the combined shorthand: it is equivalent to `--hidden --no-ignore`. (A single
  `-u` only disables `.gitignore`-style rules; `-uuu` also searches binary files.)

## Worked example

Given comments hidden in a dotfile, an ignored dependency, and a normal source file:

```bash
# Default search misses the .env and node_modules matches:
rg "Hidden Code"

# Include hidden files and ignored paths to find all of them:
rg --hidden --no-ignore "Hidden Code"
```

The second command finds the comment in `.env`, in a file under `node_modules`, and in
the frontend source, whereas the first only finds the source file.

## Caveats

- `.git/` is a hidden directory, so it is only searched once you pass `--hidden`
  (verified with ripgrep 13). If you want everything except version-control internals,
  exclude it with a glob, for example `rg --hidden --no-ignore -g '!.git' PATTERN`.
- `--no-ignore` can be slow and noisy in large trees, since it will descend into
  `node_modules`, build output, and caches. Scope the search with a path argument or a
  glob (`-g 'src/**'`) to keep it fast.
