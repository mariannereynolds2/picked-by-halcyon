/* Picked by Halcyon — live catalog.
   Pages ship with a full static render; this refreshes them from the editorial database
   (/api/pbh/catalog) so picks published in the admin appear without a rebuild. */
(() => {
  "use strict";
  if (window.__pbhLive) return;
  window.__pbhLive = true;

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safe = s => { const v = String(s || ""); return (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//i.test(v) ? esc(v) : ""; };
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const link = b => safe(b.feature) || safe(b.amazon) || "#";
  const ext = h => /^https?:/i.test(h) ? ' target="_blank" rel="noopener noreferrer"' : "";
  const sentence = t => { t = String(t || "").trim(); if (t && t === t.toUpperCase()) { t = t.toLowerCase(); t = t[0].toUpperCase() + t.slice(1); t = t.replace(/\bya\b/gi, "YA"); } return t; };
  const fmtDate = d => { const x = new Date(d + "T12:00:00Z"); return isNaN(x) ? "" : x.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }); };

  const coverCard = b => {
    const h = link(b), feat = !!safe(b.feature);
    return '<a class="cover-card" href="' + h + '"' + ext(h) + ' data-genres="' + esc((b.genres || []).join("|")) + '" data-search="' + esc((b.title + " " + b.author).toLowerCase()) + '">' +
      '<span class="cover"><img src="' + safe(b.image) + '" alt="" loading="lazy" width="320" height="480"></span>' +
      '<h3>' + esc(b.title) + '</h3><p class="by">' + esc(b.author) + '</p>' +
      (feat ? '<p class="where read">Read our feature</p>' : '<p class="where">View on Amazon<span class="sr-only"> (opens in a new tab)</span></p>') + '</a>';
  };
  const pickRow = b => {
    const h = link(b), tag = sentence(b.tag || (b.genres || [])[0] || "Featured");
    return '<article class="pick"><a class="pick-cover" href="' + h + '" tabindex="-1" aria-hidden="true"><img src="' + safe(b.image) + '" alt="" width="300" height="450"><span class="ribbon"></span></a>' +
      '<div><p class="pick-genre">' + esc(tag) + '</p><h3><a href="' + h + '">' + esc(b.title) + '</a></h3><p class="by">by ' + esc(b.author) + '</p>' +
      '<p class="hook">' + esc(b.hook || "") + '</p><a class="text-link" href="' + h + '" aria-label="Why we picked ' + esc(b.title) + '">Why we picked it</a></div></article>';
  };
  const heroBook = b => '<a class="hero-book" href="' + link(b) + '"><img src="' + safe(b.image) + '" alt="' + esc(b.title) + ' by ' + esc(b.author) + '" width="300" height="450"></a>';
  const initials = n => String(n).split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();

  function paint(d) {
    const books = d.books || [], authors = d.authors || [];
    const current = books.filter(b => b.status === "current"), archive = books.filter(b => b.status === "archive");
    const all = current.concat(archive);
    const photoFor = name => { const a = authors.find(x => x.name.toLowerCase() === String(name).toLowerCase()); return (a && a.photo) || (all.find(b => b.author.toLowerCase() === String(name).toLowerCase() && b.photo) || {}).photo || ""; };
    window.PBH_CURRENT = current; window.PBH_ARCHIVE = archive; window.PBH_AUTHORS = authors;

    if (current.length) {
      $$("[data-current-picks]").forEach(el => { el.innerHTML = current.map(pickRow).join(""); });
      $$("[data-hero-books]").forEach(el => { el.innerHTML = current.slice(0, 4).map(heroBook).join(""); });
      $$("[data-current-authors]").forEach(el => {
        el.innerHTML = current.map(b => { const p = safe(b.photo) || safe(photoFor(b.author)); return '<a href="' + link(b) + '#author">' + (p ? '<img src="' + p + '" alt="" loading="lazy" width="240" height="240">' : "") + '<h3>' + esc(b.author) + '</h3><p>' + esc(b.title) + '</p></a>'; }).join("");
      });
    }
    if (archive.length) $$("[data-recent-rail]").forEach(el => { el.innerHTML = archive.slice(0, 14).map(coverCard).join(""); });

    const grid = $("[data-archive-grid]");
    if (grid && all.length) {
      const g = grid.dataset.genre || "";
      const shown = g ? all.filter(b => (b.genres || []).includes(g)) : archive;
      if (shown.length) grid.innerHTML = shown.map(coverCard).join("");
    }
    if (all.length) $$("[data-genre-count]").forEach(el => { const n = all.filter(b => (b.genres || []).includes(el.dataset.genreCount)).length; el.textContent = n + (n === 1 ? " book" : " books"); });

    const ag = $("[data-author-grid]");
    if (ag && authors.length) {
      ag.innerHTML = authors.slice().sort((a, b) => a.name.localeCompare(b.name)).map(a => {
        const bk = a.books || [], p = safe(a.photo) || safe(photoFor(a.name));
        const list = bk.slice(0, 2).join(" and ") + (bk.length > 2 ? " and " + (bk.length - 2) + " more" : "");
        const media = p ? '<img src="' + p + '" alt="" loading="lazy" width="64" height="64">' : '<span class="initials" aria-hidden="true">' + esc(initials(a.name)) + '</span>';
        const inner = media + '<div><h3>' + esc(a.name) + '</h3><p>' + esc(list) + '</p></div>', s = esc((a.name + " " + bk.join(" ")).toLowerCase());
        return safe(a.feature) ? '<a class="author-card" href="' + safe(a.feature) + '#author" data-search="' + s + '">' + inner + '</a>' : '<article class="author-card" data-search="' + s + '">' + inner + '</article>';
      }).join("");
    }

    const promoBooks = archive.filter(b => safe(b.feature)).concat(current.filter(b => safe(b.feature)));
    if (promoBooks.length) $$("[data-promo]").forEach(root => {
      const track = root.querySelector("[data-promo-track]");
      const sig = promoBooks.map(b => b.title).join("|");
      const have = Array.from(track.querySelectorAll("h3")).map(h => h.textContent).join("|");
      if (sig === have) return;
      let colors = {}; try { colors = JSON.parse(root.dataset.colors || "{}"); } catch (_) {}
      const fallback = ["#1E4F5C", "#5A2E3A", "#2F4A2B", "#4A3A1E", "#2E3A5C", "#5C3A1E"];
      const n = promoBooks.length;
      track.innerHTML = promoBooks.map((b, i) => {
        const h = link(b), col = colors[b.image] || fallback[i % fallback.length], on = i === 0, ti = on ? 0 : -1;
        const tag = sentence(b.tag || ""), tags = [tag].concat((b.genres || []).filter(g => !tag.toLowerCase().includes(g.toLowerCase())).slice(0, 2)).filter(Boolean);
        return '<li class="promo-slide' + (on ? " is-active" : "") + '" style="--band:' + esc(col) + '" data-slide aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + n + '"' + (on ? "" : ' aria-hidden="true"') + '>' +
          '<a class="promo-cover" href="' + h + '" tabindex="' + ti + '" aria-label="' + esc(b.title) + ' by ' + esc(b.author) + '"><img src="' + safe(b.image) + '" alt="" width="300" height="450"' + (i < 2 ? "" : ' loading="lazy"') + '></a>' +
          '<div class="promo-band"><div class="promo-copy"><ul class="vibes" aria-label="Vibes">' + tags.map(t => "<li>" + esc(t) + "</li>").join("") + '</ul>' +
          '<h3><a href="' + h + '" tabindex="' + ti + '">' + esc(b.title) + '</a></h3><p class="promo-by">by ' + esc(b.author) + '</p><p class="promo-hook">' + esc(b.hook || "") + '</p></div>' +
          '<a class="btn btn-light promo-cta" href="' + h + '" tabindex="' + ti + '">Why we picked it</a></div></li>';
      }).join("");
      window.dispatchEvent(new Event("pbh:promo"));
    });

    const team = $("[data-team]");
    if (team && (d.team || []).length) team.innerHTML = d.team.map(x => '<article class="team-card">' + (safe(x.photo) ? '<img src="' + safe(x.photo) + '" alt="Portrait of ' + esc(x.name) + '" loading="lazy" width="480" height="600">' : "") + '<h3>' + esc(x.name) + '</h3><p>' + esc(x.bio || x.role) + '</p></article>').join("");

    /* Book feature pages: keep the headline facts in step with edits made in the admin. */
    if (location.pathname.startsWith("/books/")) {
      const sel = all.find(b => b.feature && new URL(b.feature, location.origin).pathname === location.pathname);
      if (sel) {
        const t = $("[data-book-title]"); if (t && sel.title) t.textContent = sel.title;
        const h = $("[data-book-hook]"); if (h && sel.hook) h.textContent = sel.hook;
        const c = $("[data-book-cover]"); if (c && safe(sel.image)) { c.src = sel.image; c.alt = "Cover of " + sel.title + " by " + sel.author; }
        const st = $("[data-book-status] .pill");
        if (st) { const cur = sel.status === "current"; st.textContent = cur ? "Current pick" : "From the archive"; st.classList.toggle("current", cur); }
        const dt = $("[data-feature-date]"); if (dt && sel.featured_date && fmtDate(sel.featured_date)) { dt.dateTime = sel.featured_date; dt.textContent = fmtDate(sel.featured_date); }
      }
    }
    window.dispatchEvent(new Event("pbh:catalog"));
  }

  const needs = "[data-current-picks],[data-hero-books],[data-archive-grid],[data-author-grid],[data-genre-count],[data-team],[data-recent-rail],[data-book-title]";
  const go = () => {
    if (location.pathname.startsWith("/admin") || !document.querySelector(needs)) return;
    fetch("/api/pbh/catalog", { credentials: "same-origin", cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status)).then(d => { if (d && d.ok) paint(d); }).catch(() => {});
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
