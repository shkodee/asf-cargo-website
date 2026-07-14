# ASF Cargo LLC — Website

Driver-recruiting website for ASF Cargo LLC, a CDL-A trucking company. Static HTML/CSS/JS, no build step.

## Structure
```
asf-cargo/
├── index.html          # homepage
├── apply.html          # driver application form
├── contact.html        # contact info page
├── assets/              # styles, script, logo
└── worker/              # Cloudflare Worker relaying form submissions to Telegram + email
```

## Running locally
Open `asf-cargo/index.html` directly in a browser, or serve the `asf-cargo/` folder with any static file server.

## Deployment
- **Site**: Cloudflare Pages
- **Form relay**: Cloudflare Worker (`asf-cargo/worker/`) — see `asf-cargo/worker/README.md` for setup

See `PROJECT_BRIEF.md` for full project context.
