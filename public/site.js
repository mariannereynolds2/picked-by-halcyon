/* Picked by Halcyon — interface behaviour (menu, forms, filters, author kit). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const note = (form, text, kind) => {
    const n = $(".form-note", form);
    if (!n) return;
    n.textContent = text;
    n.classList.toggle("is-ok", kind === "ok");
    n.classList.toggle("is-err", kind === "err");
  };

  const firstInvalid = form => $$("input,select,textarea", form).find(el => !el.checkValidity());

  const describeInvalid = el => {
    const label = el.labels && el.labels[0] ? el.labels[0].textContent.replace("(optional)", "").trim() : "This field";
    if (el.type === "checkbox") return "Please tick the permission box to send your book.";
    if (el.validity.valueMissing) return label + " is required.";
    if (el.validity.typeMismatch && el.type === "email") return "Enter an email address like name@example.com.";
    if (el.validity.typeMismatch && el.type === "url") return label + " needs to be a full link starting with https://";
    if (el.validity.tooLong) return label + " is too long.";
    return "Check " + label.toLowerCase() + ".";
  };

  async function post(url, body, isForm) {
    const r = await fetch(url, isForm ? { method: "POST", body } : {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    let j = {};
    try { j = await r.json(); } catch (_) {}
    if (!r.ok || !j.ok) throw new Error(j.error || "The message did not go through. Check your connection and try again.");
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
      note(f, j.newSubscriber === false ? "You are already on the list. Thank you." : "You are on the list. New picks will come straight to you.", "ok");
      f.reset();
    }, "Signing you up…"));

    /* Book submission */
    const submit = $("[data-book-submit]");
    if (submit) wire(submit, async f => {
      await post("/api/pbh/submit-book", new FormData(f), true);
      note(f, "Sent. Check your inbox for a confirmation; you can reply to it with your cover and photo. We will be in touch either way.", "ok");
      f.reset();
      $$("[data-count],[data-words]", f).forEach(el => el.dispatchEvent(new Event("input")));
    }, "Sending your book…");

    /* Contact */
    $$("[data-contact]").forEach(form => wire(form, async f => {
      const payload = Object.fromEntries(new FormData(f).entries());
      await post("/api/pbh/contact", payload);
      note(f, "Message sent. We will reply to the email you gave.", "ok");
      f.reset();
    }, "Sending…"));

    /* Character and word counters */
    $$("[data-count]").forEach(el => {
      const max = +el.dataset.count, out = document.createElement("p");
      out.className = "counter"; out.setAttribute("aria-live", "polite");
      el.after(out);
      const upd = () => { out.textContent = el.value.length + " of " + max + " characters"; out.classList.toggle("over", el.value.length >= max); };
      el.addEventListener("input", upd); upd();
    });
    $$("[data-words]").forEach(el => {
      const max = +el.dataset.words, out = document.createElement("p");
      out.className = "counter";
      el.after(out);
      const upd = () => { const n = (el.value.trim().match(/\S+/g) || []).length; out.textContent = n + " words (aim for " + max + " or fewer)"; out.classList.toggle("over", n > max); };
      el.addEventListener("input", upd); upd();
    });

    /* Email template: language toggle + copy */
    const langs = $$("[data-lang]");
    langs.forEach(b => b.addEventListener("click", () => {
      langs.forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      $$("[data-template]").forEach(p => { p.hidden = p.dataset.template !== b.dataset.lang; });
    }));
    const copy = $("[data-copy-template]");
    if (copy) copy.addEventListener("click", async () => {
      const shown = $$("[data-template]").find(p => !p.hidden);
      try { await navigator.clipboard.writeText(shown.textContent); }
      catch (_) { const r = document.createRange(); r.selectNodeContents(shown); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand("copy"); }
      copy.textContent = "Copied";
      setTimeout(() => { copy.textContent = "Copy template"; }, 2200);
    });

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
  });
})();
