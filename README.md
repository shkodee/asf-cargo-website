# ASF Cargo LLC — Website

Driver-recruiting website for ASF Cargo LLC, a CDL-A trucking company. React + TypeScript + Vite.

## Structure
```
asf-cargo/
├── index.html / apply.html   # Vite entry points (homepage, application form)
├── src/                        # components, pages, hooks, data, styles
├── public/logo.png
└── worker/                     # Cloudflare Worker relaying form submissions to Telegram + email
```

## Running locally
```
cd asf-cargo
npm install
npm run dev       # dev server
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

## Deployment
- **Site**: Cloudflare Workers (static assets), auto-deploys from `main` via GitHub — requires
  the Build command `npm run build` set in the Cloudflare project's settings
- **Form relay**: separate Cloudflare Worker (`asf-cargo/worker/`) — see `asf-cargo/worker/README.md`

See `PROJECT_BRIEF.md` for full project context.
