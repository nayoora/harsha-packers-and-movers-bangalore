# Harsha Packers and Movers Bangalore — Website

Static website (HTML/CSS/JS) for [harshapackersandmoversbangalore.com](https://harshapackersandmoversbangalore.com).
The contents of this repository are the **ready-to-serve site** — the repo root maps
directly to the web root (`public_html`).

## Deploy on Hostinger (auto-pull from GitHub)
1. Hostinger hPanel → **Advanced → GIT**.
2. Repository: this repo's URL · Branch: `main` · Directory: `public_html`.
3. Click **Create** — Hostinger clones the site into `public_html`.
4. For future updates, push to `main` and click **Deploy** (or set up the auto-deploy webhook).

## Notes
- `submit.php` is the optional email handler (the quote form primarily sends to WhatsApp).
- `.htaccess` forces HTTPS, sets caching, and blocks the leads file.
- Free SSL: hPanel → Security → SSL.
