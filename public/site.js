/* Picked by Halcyon — interface behaviour (menu, forms, filters, author kit, reports). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const FR = (document.documentElement.lang || "").startsWith("fr");
  const T = FR ? {
    tick: "Cochez la case d’autorisation pour envoyer votre livre.",
    required: l => l + " est obligatoire.",
    email: "Saisissez une adresse e-mail comme nom@exemple.fr.",
    url: l => l + " doit être un lien complet commençant par https://",
    long: l => l + " est trop long.",
    check: l => "Vérifiez le champ « " + l + " ».",
    net: "L’envoi n’a pas abouti. Vérifiez votre connexion et réessayez.",
    sending: "Envoi de votre livre…",
    sent: "C’est envoyé. Vous allez recevoir un e-mail de confirmation, et nous vous répondons sous 7 jours.",
    msgSending: "Envoi…", msgSent: "Message envoyé. Nous répondrons à l’adresse indiquée.",
    chars: (n, m) => n + " sur " + m + " caractères",
    words: (n, m) => n + " mots (" + m + " maximum conseillé)",
    big: "Ce fichier dépasse 8 Mo. Choisissez une image plus légère.",
    type: "Choisissez une image JPG, PNG ou WebP.",
    copied: "Copié", copy: "Copier le modèle",
    nlIn: "Vous êtes inscrit. Les nouvelles sélections arriveront directement chez vous.", nlAlready: "Vous êtes déjà inscrit. Merci !", nlSending: "Inscription…"
  } : {
    tick: "Please tick the permission box to send your book.",
    required: l => l + " is required.",
    email: "Enter an email address like name@example.com.",
    url: l => l + " needs to be a full link starting with https://",
    long: l => l + " is too long.",
    check: l => "Check " + l.toLowerCase() + ".",
    net: "The message did not go through. Check your connection and try again.",
    sending: "Sending your book…",
    sent: "Sent. Check your inbox for a confirmation. We reply within 7 days either way.",
    msgSending: "Sending…", msgSent: "Message sent. We will reply to the email you gave.",
    chars: (n, m) => n + " of " + m + " characters",
    words: (n, m) => n + " words (aim for " + m + " or fewer)",
    big: "That file is larger than 8 MB. Please choose a smaller image.",
    type: "Please choose a JPG, PNG or WebP image.",
    copied: "Copied", copy: "Copy template",
    nlIn: "You are on the list. New picks will come straight to you.", nlAlready: "You are already on the list. Thank you.", nlSending: "Signing you up…"
  };

  const note = (form, text, kind) => {
    const n = $(".form-note", form);
    if (!n) return;
    n.textContent = text;
    n.classList.toggle("is-ok", kind === "ok");
    n.classList.toggle("is-err", kind === "err");
  };

  const fileProblem = el => {
    const f = el.files && el.files[0];
    if (!f) return "";
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return T.type;
    if (f.size > 8 * 1024 * 1024) return T.big;
    return "";
  };
  const firstInvalid = form => $$("input,select,textarea", form).find(el => !el.checkValidity() || (el.type === "file" && fileProblem(el)));

  const describeInvalid = el => {
    const label = el.labels && el.labels[0] ? el.labels[0].textContent.replace(/\((optional|facultatif)\)/, "").trim() : "This field";
    if (el.type === "file") return fileProblem(el);
    if (el.type === "checkbox") return T.tick;
    if (el.validity.valueMissing) return T.required(label);
    if (el.validity.typeMismatch && el.type === "email") return T.email;
    if (el.validity.typeMismatch && el.type === "url") return T.url(label);
    if (el.validity.tooLong) return T.long(label);
    return T.check(label);
  };

  async function post(url, body, isForm) {
    const r = await fetch(url, isForm ? { method: "POST", body } : {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    let j = {};
    try { j = await r.json(); } catch (_) {}
    if (!r.ok || !j.ok) throw new Error(j.error || T.net);
    return j;
  }

  function wire(form, handler, pending) {
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const bad = firstInvalid(form);
      if (bad) { note(form, describeInvalid(bad), "err"); bad.focus(); return; }
      const btn = $("button[type=submit]", form);
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = pending;
      note(form, "", "");
      try { await handler(form); }
      catch (err) { note(form, err.message, "err"); }
      finally { btn.disabled = false; btn.textContent = label; }
    });
  }

  const fmtN = n => Number(n || 0).toLocaleString(FR ? "fr-FR" : "en-US");

  document.addEventListener("DOMContentLoaded", () => {
    /* Menu */
    const toggle = $("[data-nav-toggle]"), nav = $("#site-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      document.addEventListener("keydown", e => {
        if (e.key === "Escape" && nav.classList.contains("is-open")) { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }
      });
    }

    /* Newsletter */
    $$("[data-newsletter]").forEach(form => wire(form, async f => {
      const email = $('input[name="email"]', f).value.trim();
      const j = await post("/api/pbh/newsletter", { email });
      note(f, j.newSubscriber === false ? T.nlAlready : T.nlIn, "ok");
      f.reset();
    }, T.nlSending));

    /* Book submission */
    const submit = $("[data-book-submit]");
    if (submit) wire(submit, async f => {
      await post("/api/pbh/submit-book", new FormData(f), true);
      note(f, T.sent, "ok");
      f.reset();
      $$("[data-count],[data-words],input[type=file]", f).forEach(el => el.dispatchEvent(new Event(el.type === "file" ? "change" : "input")));
    }, T.sending);

    /* Contact and testimonial forms */
    $$("[data-contact]").forEach(form => wire(form, async f => {
      const payload = Object.fromEntries(new FormData(f).entries());
      await post("/api/pbh/contact", payload);
      note(f, form.dataset.okText || T.msgSent, "ok");
      f.reset();
    }, T.msgSending));

    /* File pickers: show the chosen file */
    $$("input[type=file]").forEach(el => {
      const out = document.createElement("p");
      out.className = "counter"; out.setAttribute("aria-live", "polite");
      el.after(out);
      el.addEventListener("change", () => {
        const f = el.files && el.files[0], p = fileProblem(el);
        out.classList.toggle("over", !!p);
        out.textContent = !f ? "" : p || (f.name + " · " + (f.size / 1048576).toFixed(1) + " MB");
      });
    });

    /* Character and word counters */
    $$("[data-count]").forEach(el => {
      const max = +el.dataset.count, out = document.createElement("p");
      out.className = "counter"; out.setAttribute("aria-live", "polite");
      el.after(out);
      const upd = () => { out.textContent = T.chars(el.value.length, max); out.classList.toggle("over", el.value.length >= max); };
      el.addEventListener("input", upd); upd();
    });
    $$("[data-words]").forEach(el => {
      const max = +el.dataset.words, out = document.createElement("p");
      out.className = "counter";
      el.after(out);
      const upd = () => { const n = (el.value.trim().match(/\S+/g) || []).length; out.textContent = T.words(n, max); out.classList.toggle("over", n > max); };
      el.addEventListener("input", upd); upd();
    });

    /* Email template: language toggle + copy (also used for badge code) */
    const langs = $$("[data-lang]");
    langs.forEach(b => b.addEventListener("click", () => {
      langs.forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      $$("[data-template]").forEach(p => { p.hidden = p.dataset.template !== b.dataset.lang; });
    }));
    $$("[data-copy-template],[data-copy]").forEach(btn => btn.addEventListener("click", async () => {
      const src = btn.dataset.copy ? $(btn.dataset.copy) : $$("[data-template]").find(p => !p.hidden);
      const text = src.value !== undefined && src.tagName !== "PRE" ? src.value : src.textContent;
      try { await navigator.clipboard.writeText(text); }
      catch (_) { const r = document.createRange(); r.selectNodeContents(src); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand("copy"); }
      const old = btn.textContent; btn.textContent = T.copied;
      setTimeout(() => { btn.textContent = old; }, 2200);
    }));

    /* Filters and search on grids */
    const grid = $("[data-archive-grid]") || $("[data-author-grid]");
    const input = $("[data-search-input]");
    let shelf = "";
    const apply = () => {
      const g = $("[data-archive-grid]") || $("[data-author-grid]");
      if (!g) return;
      const q = (input && input.value || "").trim().toLowerCase();
      let shown = 0;
      Array.from(g.children).forEach(card => {
        const okQ = !q || (card.dataset.search || card.textContent.toLowerCase()).includes(q);
        const okS = !shelf || (card.dataset.genres || "").split("|").includes(shelf);
        card.hidden = !(okQ && okS);
        if (!card.hidden) shown++;
      });
      const count = $("[data-result-count]");
      const noun = g.hasAttribute("data-author-grid") ? (shown === 1 ? "author" : "authors") : (shown === 1 ? "book" : "books");
      if (count) count.textContent = shown + " " + noun + (q || shelf ? " match" : "");
      const empty = $("[data-empty]");
      if (empty) empty.hidden = shown > 0;
    };
    if (grid) {
      if (input) input.addEventListener("input", apply);
      $$("[data-chip]").forEach(chip => chip.addEventListener("click", () => {
        shelf = chip.dataset.chip;
        $$("[data-chip]").forEach(c => c.setAttribute("aria-pressed", String(c === chip)));
        apply();
      }));
      window.addEventListener("pbh:catalog", apply);
    }

    /* Rotating book banner */
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DUR = 6000;
    const initPromo = root => {
      if (root._promo) root._promo.stop();
      const slides = $$("[data-slide]", root);
      if (!slides.length) return;
      const count = $("[data-promo-count]", root), bar = $("[data-promo-bar]", root), pauseBtn = $("[data-promo-pause]", root);
      let i = Math.max(0, slides.findIndex(s => s.classList.contains("is-active"))), timer = null, userPaused = reduce, hover = false;
      const icon = paused => paused ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor"/></svg>';
      const runBar = on => { if (!bar) return; bar.classList.remove("run"); void bar.offsetWidth; if (on) { bar.style.setProperty("--dur", DUR + "ms"); bar.classList.add("run"); } };
      const show = n => {
        i = (n + slides.length) % slides.length;
        slides.forEach((s, k) => {
          const on = k === i;
          s.classList.toggle("is-active", on);
          if (on) s.removeAttribute("aria-hidden"); else s.setAttribute("aria-hidden", "true");
          $$("a", s).forEach(a => a.tabIndex = on ? 0 : -1);
          if (on) $$("img[loading=lazy]", slides[(k + 1) % slides.length]).forEach(img => img.loading = "eager");
        });
        if (count) count.textContent = (i + 1) + " of " + slides.length;
      };
      const stop = () => { clearInterval(timer); timer = null; runBar(false); };
      const play = () => { stop(); if (userPaused || hover || document.hidden) return; runBar(true); timer = setInterval(() => { show(i + 1); runBar(true); }, DUR); };
      const setPaused = p => { userPaused = p; if (pauseBtn) { pauseBtn.innerHTML = icon(p); pauseBtn.setAttribute("aria-label", p ? "Play the rotation" : "Pause the rotation"); } play(); };
      $("[data-promo-next]", root)?.addEventListener("click", () => { show(i + 1); play(); });
      $("[data-promo-prev]", root)?.addEventListener("click", () => { show(i - 1); play(); });
      pauseBtn?.addEventListener("click", () => setPaused(!userPaused));
      const track = $("[data-promo-track]", root);
      track.addEventListener("mouseenter", () => { hover = true; play(); });
      track.addEventListener("mouseleave", () => { hover = false; play(); });
      root.addEventListener("focusin", () => { hover = true; play(); });
      root.addEventListener("focusout", e => { if (!root.contains(e.relatedTarget)) { hover = false; play(); } });
      root.addEventListener("keydown", e => { if (e.key === "ArrowRight") { show(i + 1); play(); } if (e.key === "ArrowLeft") { show(i - 1); play(); } });
      let x0 = null;
      track.addEventListener("pointerdown", e => { x0 = e.clientX; });
      track.addEventListener("pointerup", e => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) { show(i + (dx < 0 ? 1 : -1)); play(); } });
      document.addEventListener("visibilitychange", play);
      root._promo = { stop };
      show(i); setPaused(userPaused);
    };
    $$("[data-promo]").forEach(initPromo);
    window.addEventListener("pbh:promo", () => $$("[data-promo]").forEach(initPromo));

    /* Author's private view report */
    const rep = $("[data-report]");
    if (rep) {
      const q = new URLSearchParams(location.search);
      const show = id => $$("[data-report-state]").forEach(el => { el.hidden = el.dataset.reportState !== id; });
      if (!q.get("page") || !q.get("key")) { show("invalid"); }
      else fetch("/api/pbh/report?page=" + encodeURIComponent(q.get("page")) + "&key=" + encodeURIComponent(q.get("key")), { cache: "no-store" })
        .then(r => r.json()).then(d => {
          if (!d.ok) return show("invalid");
          const b = d.book || {};
          $("[data-r-title]").textContent = b.title || q.get("page");
          $("[data-r-author]").textContent = b.author ? "by " + b.author : "";
          if (b.image) { const i = $("[data-r-cover]"); i.src = b.image; i.hidden = false; }
          $("[data-r-30]").textContent = fmtN(d.views30);
          $("[data-r-total]").textContent = fmtN(d.total);
          $("[data-r-since]").textContent = d.since ? new Date(d.since + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "not yet";
          const link = $("[data-r-link]"); link.href = d.page; link.textContent = location.origin + d.page;
          const days = d.days || [], max = Math.max(1, ...days.map(x => x.views));
          $("[data-r-bars]").innerHTML = days.length ? days.map(x => '<span title="' + x.date + ': ' + x.views + ' views" style="height:' + Math.max(4, Math.round(x.views / max * 100)) + '%"></span>').join("") : "<p>No visits recorded in the last 30 days yet.</p>";
          show("ok");
        }).catch(() => show("invalid"));
    }

    /* Admin helper: list every author's private report link */
    const rl = $("[data-report-links]");
    if (rl) {
      fetch("/api/pbh/report-links", { credentials: "same-origin", cache: "no-store" }).then(r => r.json()).then(d => {
        if (!d.ok) { rl.innerHTML = '<p>Sign in to the <a href="/admin/">website manager</a> first, then reload this page.</p>'; return; }
        const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
        rl.innerHTML = '<ul class="kit-list">' + d.links.map((x, i) => '<li><span></span><div><strong>' + esc(x.title) + '</strong><span>' + esc(x.author) + '</span><div class="button-row" style="margin-top:8px"><input class="sr-only" id="rl' + i + '" value="' + esc(x.link) + '" readonly><button class="btn btn-quiet" type="button" data-copy="#rl' + i + '">Copy link</button><a class="text-link" href="' + esc(x.link) + '" target="_blank" rel="noopener">Open</a></div></div></li>').join("") + "</ul>";
        $$("[data-copy]", rl).forEach(btn => btn.addEventListener("click", async () => { const v = $(btn.dataset.copy).value; try { await navigator.clipboard.writeText(v); } catch (_) {} btn.textContent = "Copied"; setTimeout(() => btn.textContent = "Copy link", 2000); }));
      }).catch(() => { rl.textContent = "Could not load the links. Reload the page to try again."; });
    }
  });
})();
