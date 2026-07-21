# Copilot skills

Skills in this directory are discovered by Copilot CLI. Each skill lives in its own
folder with a `SKILL.md` whose front matter (`name`, `description`, `allowed-tools`)
tells the agent when and how to use it.

| Skill | Purpose |
| --- | --- |
| `agent-browser` | Browser automation CLI (navigate, fill forms, screenshot, scrape, test web apps). |
| `chrome-devtools` | Chrome DevTools via MCPorter (inspect pages, network, Lighthouse audits). |
| `sg-weather-api` | Reference for Singapore's data.gov.sg real-time weather and air-quality API. |

## Adding or updating a vendored skill

Some skills are vendored from an upstream source with the [`skills`](https://skills.sh)
CLI, which records the source and a content hash in `skills-lock.json` at the repository
root. `agent-browser` is one of these.

```bash
# Fetch the skill from its source (-y skips the interactive scope prompt)
npx -y skills add vercel-labs/agent-browser -y
# The CLI writes to .agents/skills/; relocate it so Copilot CLI discovers it
mv .agents/skills/agent-browser .github/skills/agent-browser
```

Re-run the same `skills add` command to update the skill; it refreshes the vendored
`SKILL.md` and the hash in `skills-lock.json`. Keep the vendored `SKILL.md` unmodified so
these updates apply cleanly; repository-specific notes belong here, not in the skill file.

## agent-browser and the container image

The `agent-browser` CLI is installed globally in the container image (see the
[`Containerfile`](../../Containerfile)), so it is already on `PATH`. On the arm64 image
`agent-browser install` cannot download a Chrome for Testing build, because that channel
publishes no Linux ARM64 binary. The Containerfile therefore tolerates that failure and
points agent-browser at the Debian `chromium` already installed in the image via
`AGENT_BROWSER_EXECUTABLE_PATH`. agent-browser also auto-adds `--no-sandbox` when it runs
as root, so it drives the system chromium without any further setup.
