# AIxTech

A working repository for my **AIxTech** AI fluency programme. It holds my projects,
notes, exercises and reference material as I progress through the programme.

## What I built

Beyond the course starter, this repository adds a containerised development
environment so the whole stack, plus the GitHub Copilot CLI, runs from a single
minimal Podman image:

- A minimal **`Containerfile`** (`node:24-slim`) with the **GitHub Copilot CLI**
  pre-installed. The repo itself is bind-mounted at runtime, so the app source and
  dependencies are never baked into the image.
- A small, backward-compatible patch so the app can bind `0.0.0.0` and be reached
  from the host on a published port, plus a container-friendly `dev:server` script.
- Setup and run instructions (see "Run in a container (Podman)" below).

## Layout

| Folder                     | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| `projects/`                | Full projects and starters worked on for the course. |
| `notes/`                   | Programme notes, concepts and summaries.             |
| `exercises/`               | Small drills and experiments.                        |
| `resources/`               | Links, references and cheat-sheets.                  |

## Projects

### `projects/weather_starter`

The AISG AIAP weather starter, a minimal TypeScript full-stack app (Express
backend, React/Vite frontend, Drizzle ORM over SQLite). Its README lists nine
progressive feature tasks. See `projects/weather_starter/README.md` for setup and
usage.

Cloned from the course-provided starter at
[`AISG-AIAP/weather_starter`](https://github.com/AISG-AIAP/weather_starter) (public
domain) and vendored into this repository, as instructed by the programme.

## Run in a container (Podman)

A minimal Podman image is provided in `Containerfile`. It is based on the latest
LTS Node (`node:24-slim`) and installs the **GitHub Copilot CLI** (`copilot`). The
image carries no application source or dependencies: the whole repository is
bind-mounted at runtime with `-v`, and you install the `weather_starter`
dependencies inside the container as needed. The container starts an interactive
shell by default, so you run the Copilot CLI and the app yourself.

### Build

From the repository root (`aixtech/`):

```bash
podman build -t aixtech-dev -f Containerfile .
```

### Run

Run from **inside the repository root (`aixtech/`)** and bind-mount the whole repo
into the container. Podman requires the mount source to be an absolute path or one
that begins with `./`, so `./` resolves to the repo only when this is your working
directory. The weather_starter dev server is published on port **3000**, the MCP Inspector
UI on port **6274**, and the MCP Inspector proxy on port **6277**:

```bash
podman run -it --rm -p 3000:3000 -p 6274:6274 -p 6277:6277 -v ./:/workspace aixtech-dev
```

Ports **6274** and **6277** are both published so the MCP Inspector works from your
host browser at `http://localhost:6274` when you run it inside the container. The UI
(6274) talks to the Inspector proxy (6277), so both must be reachable or the UI shows
"Error Connecting to MCP Inspector Proxy".

(Equivalently, `-v "$(pwd)":/workspace`. If you run from elsewhere, pass the
absolute path to the repo instead of `./`.)

Inside the container:

```bash
copilot                              # start the GitHub Copilot CLI (authenticate on first use)
cd projects/weather_starter
npm install --ignore-scripts         # first run, or whenever dependencies change
npm run dev:server                   # start the weather_starter app on 0.0.0.0:3000
```

`--ignore-scripts` skips the Husky "prepare" hook, whose git root differs from the
mounted repo root. Because `node_modules` is written into the bind-mounted repo, the
install persists on the host across runs, so you only re-run `npm install` when
dependencies change.

The image sets `HOST=0.0.0.0` and `PORT=3000`, so once the app is running open it
from your host browser at:

```text
http://localhost:3000
```

Note: use `npm run dev:server` (which runs the Express + Vite server directly),
not `npm run dev`. The default `npm run dev` routes through Portless and a
`.localhost` URL, which is meant for running on the host, not inside the container.

### Persistence and login

Your source edits and installed `node_modules` live in the bind-mounted repo on the
host, so they persist automatically between container runs. The Copilot CLI login is
**not** persisted with this single-mount setup: because `--rm` removes the container
(and its `/root/.copilot`) on exit, you authenticate the Copilot CLI again on each
run. Credentials are never baked into the image.

## Licence and credits

My own contributions in this repository (the `Containerfile`, the container tooling
and patches, and my notes) are licensed under **GPL-3.0** — see [`LICENSE`](LICENSE).

The vendored `projects/weather_starter` code is the course-provided starter from
[`AISG-AIAP/weather_starter`](https://github.com/AISG-AIAP/weather_starter), which is
public domain; credit for that code belongs to its original authors. The GPL-3.0
licence applies only to my own additions, not to the public-domain starter.


