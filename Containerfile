# Minimal image to run the GitHub Copilot CLI and the weather_starter app.
# Base: latest LTS Node. node:sqlite (used by the backend) is stable on Node 24,
# and this matches the Node version the Copilot CLI is built with.
FROM node:24-slim

# git + ca-certificates: needed by the Copilot CLI and by npm over HTTPS.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# GitHub Copilot CLI, installed globally so `copilot` is on PATH.
RUN npm install -g @github/copilot

WORKDIR /workspace

# Install dependencies first so this layer is cached across source changes.
# --ignore-scripts skips the Husky "prepare" hook, which needs a git repo.
COPY projects/weather_starter/package.json projects/weather_starter/package-lock.json ./
COPY projects/weather_starter/frontend/package.json ./frontend/
COPY projects/weather_starter/backend/package.json ./backend/
RUN npm install --ignore-scripts

# Application source (includes the HOST-aware server patch).
COPY projects/weather_starter/ ./

# HOST=0.0.0.0 makes the server reachable from the host via a published port.
ENV HOST=0.0.0.0 \
    PORT=3000 \
    NODE_OPTIONS=--disable-warning=ExperimentalWarning

EXPOSE 3000

# Interactive shell by default: run `copilot` and `npm run dev:server` yourself.
CMD ["bash"]
