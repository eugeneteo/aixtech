# Minimal image to run the GitHub Copilot CLI over the bind-mounted aixtech repo.
# Base: latest LTS Node. node:sqlite (used by the weather_starter backend) is stable
# on Node 24, matching the Node version the Copilot CLI is built with.
FROM node:24-slim

# git + ca-certificates: needed by the Copilot CLI and by npm over HTTPS.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# GitHub Copilot CLI, installed globally so `copilot` is on PATH.
RUN npm install -g @github/copilot

# mcporter: a CLI and TypeScript toolkit for the Model Context Protocol. It discovers the
# MCP servers configured on this image (see the sqlite server below) and lets you call
# their tools from the shell or scripts. Installed globally so `mcporter` is on PATH.
RUN npm install -g mcporter

# Chromium for the chrome-devtools skill (browser debugging via MCPorter). This image is
# arm64 and Google Chrome ships no arm64 build, so we use Debian's chromium. fonts-liberation
# gives rendered pages and screenshots real glyphs.
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# chrome-devtools-mcp resolves the stable channel to /opt/google/chrome/chrome. Placing a
# shim there means the skill's default `npx chrome-devtools-mcp` config works unchanged.
# The flags suit a rootful, display-less container: --no-sandbox (Chrome cannot create its
# own sandbox here and cannot run as root otherwise), --headless=new (no display), and
# --disable-dev-shm-usage (the small container /dev/shm would otherwise crash the browser).
RUN mkdir -p /opt/google/chrome \
    && printf '#!/bin/sh\nexec /usr/bin/chromium --no-sandbox --headless=new --disable-gpu --disable-dev-shm-usage "$@"\n' > /opt/google/chrome/chrome \
    && chmod +x /opt/google/chrome/chrome

# Default Copilot CLI settings: omit the Co-authored-by: Copilot commit trailer.
RUN mkdir -p /root/.copilot \
    && printf '{\n  "includeCoAuthoredBy": false\n}\n' > /root/.copilot/settings.json

# Default MCP servers: expose the weather_starter SQLite DB via mcp-sqlite.
# Added for the "Module 4 - Making it an Agent" exercise.
RUN mkdir -p /root/.copilot \
    && printf '{\n  "mcpServers": {\n    "sqlite": {\n      "type": "local",\n      "command": "npx",\n      "args": ["-y", "mcp-sqlite", "projects/weather_starter/backend/weather.db"],\n      "tools": ["*"]\n    }\n  }\n}\n' > /root/.copilot/mcp-config.json

# The whole aixtech repo is bind-mounted here at runtime (-v ./:/workspace), so
# weather_starter lives at /workspace/projects/weather_starter. No source or
# node_modules are baked in; install dependencies at runtime as needed.
WORKDIR /workspace

# HOST=0.0.0.0 makes the weather_starter server reachable from the host via a
# published port.
ENV HOST=0.0.0.0 \
    PORT=3000 \
    NODE_OPTIONS=--disable-warning=ExperimentalWarning

EXPOSE 3000

# Interactive shell by default: run `copilot` and the app yourself.
CMD ["bash"]
