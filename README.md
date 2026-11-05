# Afnan — Portfolio

Personal portfolio of **Abdul Majeed Muhammad Afnan** (display name: **Afnan**) — IT undergraduate (HDIT, ICST University, Sri Lanka) and software developer.

A static, single-page site built with plain HTML, CSS and JavaScript. No build step, no backend, no database.

## Run locally

```bash
# from this folder — any static server works
python -m http.server 8817
# then open http://127.0.0.1:8817
```

Or drag `index.html` into a browser. The contact-form EmailJS call needs an internet connection.

## Previews

- Desktop → resize browser width: guides at 1200px / 900px / 600px
- Mobile → DevTools device mode (360px / 390px / 768px)
- Dark theme → toggle the moon/sun button in the navbar (persists via `localStorage`)

## Project links (verified)

- **Fresh Delivery** → Google Play: `https://play.google.com/store/apps/details?id=com.freshdelivery.customer_app&hl=en`
- **Aaseek Online Shopping** → Google Play: `https://play.google.com/store/apps/details?id=lk.aaseek.multishop&hl=en`
- **Masala Garden – Oluvil** → `https://masalagardenoluvil.com/`
- **UNIQALBi** → `https://uniqalbiabout.netlify.app/`
- **Library Management System** & **School Management Application** → case study shared on request (no public link).
- GitHub: `https://github.com/muhammadafnrha-source`
- LinkedIn: `https://www.linkedin.com/in/mohamed-afnan-2b6561388/`

## Structure

```
afnan portfolio/
├── index.html          # single page — all sections
├── css/style.css       # design system (light default + dark toggle)
├── js/script.js        # nav, theme, filters, modals, FAQ, form
├── js/electric-border.js  # animated lightning viewport border (canvas, rAF)
├── assets/images/      # profile.webp, bg.webp (optimized)
├── favicon.ico / favicon.svg
├── robots.txt          # update sitemap URL after deployment
├── sitemap.xml         # replace placeholder domain after deployment
├── _headers            # Netlify security headers
└── .gitignore
```

## Electric lightning border

`js/electric-border.js` draws a continuous Gemini-style energy trail around all four viewport edges using the Canvas API + `requestAnimationFrame`, with electric particles, a soft breathing pulse, a cursor glow and edge-proximity boost. It is `pointer-events: none` (never blocks clicks), pauses when the tab is hidden, reduces particles on mobile/low-power devices, and renders a static glowing frame when `prefers-reduced-motion` is enabled.

## Deploy

Static host — Netlify, Vercel or GitHub Pages. No build command; publish the folder as-is.

After deploying:
1. Replace the commented canonical in `index.html` with your real URL.
2. Update `robots.txt` Sitemap and `sitemap.xml` loc.
3. CSP headers are already in a `<meta>` tag; `_headers` adds HSTS/X-Content-Type-Options for Netlify.

## Contact form

Uses EmailJS (public key + service/template IDs already in `js/script.js`). To switch accounts, replace:
- `EMAILJS_PUBLIC_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID` in `js/script.js`
- The template must expose these fields: `from_name`, `reply_to`, `service`, `subject`, `message`

Security note: EmailJS public keys are public by design, but restrict the service by domain in the EmailJS dashboard, and never claim client-side validation alone prevents abuse — a serverless relay is recommended for serious spam protection.
