# IslandSignal — Your island, your live updates

A community-powered, mobile-first PWA where people share and check local updates: water / electricity / internet interruptions, ferry & transport updates, road closures, lost & found, missing pets, announcements, events and public notices.

Stack: **Next.js 14 (TypeScript) · Tailwind CSS · Supabase (Postgres, Auth, Storage, Realtime) · Vercel**.

**Live demo:** https://reseachrandomv.github.io/islandsignal/ — runs in **DEMO MODE** (yellow banner). Sample posts are clearly labelled *SAMPLE*, use made-up "Sample Island A/B/C", and everything is stored only in your own browser. It is **not** a live service until you connect Supabase (below).

## What works

| Feature | Demo mode | Live mode (Supabase connected) |
|---|---|---|
| Community feed, filter by island + category, search | ✅ browser storage | ✅ database |
| Report: category, island, area, GPS location, title, description, photo | ✅ (photo kept in browser) | ✅ photo in Supabase Storage (5 MB, JPG/PNG/WebP) |
| Verification badges: Verified source / Trusted contributor / Unconfirmed | ✅ pick role at sign-in | ✅ from the user's role in `profiles` (set by admin) |
| "Still happening" confirmations (1 per user) & 🚩 flags | ✅ | ✅ enforced by DB primary keys |
| Automatic expiry (ferry 12 h, outages 24 h, roads 72 h, events 7 d, lost & found 14 d) + Mark resolved | ✅ | ✅ set by DB trigger |
| Follow islands & categories, browser notifications | ✅ (new posts from another tab) | ✅ while app is open (Realtime) |
| Sign-in | name only, no password | email magic link (Supabase Auth) |
| Admin dashboard: flagged queue, remove/restore, resolve, change trust | ✅ choose "Admin" role | ✅ admins only (RLS + RPC checks) |
| Security | n/a | Row-level security on every table, server-side validation (length checks), rate limit 10 posts/hour/user, users can't self-verify or edit others' posts |
| Installable PWA (manifest, icons, offline cache) | ✅ | ✅ |

Not built yet (needs a later step): background push notifications when the app is closed (needs Web Push/VAPID keys + a Supabase Edge Function), an embedded map view (locations currently open in OpenStreetMap), and SMS/WhatsApp alerts.

## 1. Connect Supabase (≈10 min)
1. Sign up at https://supabase.com → **New project** (pick region *Singapore* for the Maldives). Save the DB password.
2. **SQL Editor → New query** → paste all of `supabase/schema.sql` → **Run**. Then paste `supabase/seed.sql`, edit the island list to the islands you want, → **Run**.
3. **Authentication → URL Configuration**: set *Site URL* to your final URL (e.g. `https://islandsignal.vercel.app`) and add it under *Redirect URLs* (also `http://localhost:3000` for testing).
4. **Project Settings → API**: copy *Project URL* and the *anon public* key.
5. Locally: `cp .env.example .env.local`, paste the two values, then `npm install && npm run dev` → http://localhost:3000. The yellow demo banner disappears when connected.
6. Sign in once with your email, then make yourself admin in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR_EMAIL');
   ```

### Roles
`user` (posts show *Unconfirmed*), `trusted` (*Trusted contributor*), `official` (*Verified source*, e.g. council / utility / ferry operator accounts), `admin` (moderation). Promote someone:
```sql
update public.profiles set role = 'official' where id = (select id from auth.users where email = 'their@email');
```

## 2. Deploy on Vercel
1. Sign in at https://vercel.com with GitHub → **Add New → Project** → import `reseachrandomv/islandsignal`.
2. Framework: Next.js (auto). **Environment Variables**: add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Do **not** set `STATIC_EXPORT` or `BASE_PATH`.
3. **Deploy**. Put the resulting URL into Supabase *Site URL / Redirect URLs* (step 1.3).
- Only the *anon* key goes in the app. Never put the *service_role* key in env vars of this frontend.

## 3. Custom domain
Vercel → Project → **Settings → Domains** → add e.g. `islandsignal.mv` → add the DNS records Vercel shows (A `76.76.21.21` for the root, CNAME `cname.vercel-dns.com` for `www`) at your domain registrar. Then add the domain to Supabase redirect URLs.

## GitHub Pages demo
`npm run export:pages` builds a static export to `out/` with base path `/islandsignal`; it's published from the `gh-pages` branch. It stays in demo mode because no Supabase keys are set.

## Testing checklist
- [ ] Feed loads; island + category filters and search work
- [ ] Sign in by email link; display name change saves
- [ ] Post a report with and without photo / location; validation errors show for short title/description
- [ ] Second account: "Still happening" increments once only; Flag once only
- [ ] Author can Mark resolved; non-author cannot edit
- [ ] Admin: flagged queue shows flagged post; Remove hides it from feed; Restore brings it back; trust change shows new badge
- [ ] Non-admin opening /admin sees "Admins only"; trying `update posts set trust='official'` from the client fails
- [ ] Expired posts disappear (toggle "Show resolved & expired" shows them)
- [ ] Follow an island → open app in two tabs → new matching post triggers a notification
- [ ] Install on phone (Android: Install app; iPhone: Share → Add to Home Screen); opens full-screen

## Launch checklist
- [ ] Real island list in `islands`; sample/demo text removed (live mode never shows sample posts)
- [ ] Your admin + at least one moderator; first official accounts verified
- [ ] Terms of use & privacy note (what's stored: email, display name, posts, optional location/photo)
- [ ] Supabase: enable email rate limits, custom SMTP for sign-in emails (Auth → SMTP), daily backups (Pro plan)
- [ ] Custom domain + HTTPS, Supabase redirect URLs updated

## Maintenance
- Check the Admin dashboard daily for flags. Remove spam; promote reliable reporters to *trusted*.
- Old posts stay in the DB marked expired; to purge yearly: `delete from posts where expires_at < now() - interval '1 year';`
- Update dependencies monthly: `npm outdated && npm update`, then redeploy (Vercel redeploys on every push to `main`).
- Watch Supabase usage (free tier: 500 MB DB, 1 GB storage).

---
Design & build by [Fathimath Malaak Jaufar](https://reseachrandomv.github.io/cv/)
