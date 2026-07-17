# AIxTech

A working repository for my **AIxTech** AI fluency programme. It holds my projects,
notes, exercises and reference material as I progress through the programme.

## What I built

Beyond the course starter, this repository adds a containerised development
environment so the whole stack, plus the GitHub Copilot CLI, runs from a single
minimal Podman image:

- A minimal **`Containerfile`** (`node:24-slim`) with the **GitHub Copilot CLI** and
  the `weather_starter` dependencies pre-installed.
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
LTS Node (`node:24-slim`), installs the **GitHub Copilot CLI** (`copilot`), and
pre-installs the `weather_starter` dependencies so the project is ready to run. The
container starts an interactive shell by default, so you run the Copilot CLI and the
app yourself.

### Build

From the repository root (`aixtech/`):

```bash
podman build -t aixtech-dev -f Containerfile .
```

### Run

The weather_starter dev server is published on port **3000**:

```bash
podman run -it --rm -p 3000:3000 aixtech-dev
```

Inside the container:

```bash
copilot            # start the GitHub Copilot CLI (authenticate on first use)
npm run dev:server # start the weather_starter app on 0.0.0.0:3000
```

The image sets `HOST=0.0.0.0` and `PORT=3000`, so once the app is running open it
from your host browser at:

```text
http://localhost:3000
```

Note: use `npm run dev:server` (which runs the Express + Vite server directly),
not `npm run dev`. The default `npm run dev` routes through Portless and a
`.localhost` URL, which is meant for running on the host, not inside the container.

### Persist edits and login across runs

To keep your source edits, the installed `node_modules`, and the Copilot CLI login
between container runs, mount volumes:

```bash
podman run -it --rm -p 3000:3000 \
  -v ./projects/weather_starter:/workspace \
  -v aixtech-node-modules:/workspace/node_modules \
  -v aixtech-copilot:/root/.copilot \
  aixtech-dev
```

Credentials are never baked into the image; you authenticate the Copilot CLI at
runtime, and the `aixtech-copilot` volume keeps that login for next time.

## Licence and credits

My own contributions in this repository (the `Containerfile`, the container tooling
and patches, and my notes) are licensed under **GPL-3.0** — see [`LICENSE`](LICENSE).

The vendored `projects/weather_starter` code is the course-provided starter from
[`AISG-AIAP/weather_starter`](https://github.com/AISG-AIAP/weather_starter), which is
public domain; credit for that code belongs to its original authors. The GPL-3.0
licence applies only to my own additions, not to the public-domain starter.


