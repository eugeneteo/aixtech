---
name: chrome-devtools
description: Browser debugging through Chrome DevTools via MCPorter. Use when asked to inspect a local web page, take a screenshot, inspect network requests, or run a Lighthouse audit.
allowed-tools: shell
---

# Chrome DevTools skill

Drive Chrome DevTools through the MCPorter CLI to inspect local web pages, capture
screenshots, review network traffic, and run Lighthouse audits.

## Check the daemon first

Before running any command, confirm the MCPorter daemon is running:

```bash
mcporter daemon status
```

If it is not running, start it:

```bash
mcporter daemon start
```

## Command format

Call a Chrome DevTools tool through MCPorter with:

```bash
mcporter call chrome-devtools.<tool> [key:"value" ...]
```

## Useful commands

```bash
# Open a page
mcporter call chrome-devtools.navigate_page url:"<url>"

# Capture the accessibility snapshot of the current page
mcporter call chrome-devtools.take_snapshot

# Save a screenshot to a file
mcporter call chrome-devtools.take_screenshot filePath:"dashboard.png"

# List the page's network requests
mcporter call chrome-devtools.list_network_requests

# Run a Lighthouse audit
mcporter call chrome-devtools.lighthouse_audit
```

## Notes

- To see every available tool and its parameters, run
  `mcporter list chrome-devtools`.
- The `chrome-devtools` server is configured in `config/mcporter.json`; add it with
  `mcporter config add chrome-devtools --command "npx -y chrome-devtools-mcp@latest"`.
