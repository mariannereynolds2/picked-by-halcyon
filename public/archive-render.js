document.addEventListener("DOMContentLoaded", () => {
  const escape = value => String(value || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const archive = window.PBH_ARCHIVE || [];
  const current = window.PBH_CURRENT || [];
  const shelves = [...current, ...archive];
  const root = document.querySelector("[data-archive-grid]");
  if (root) {
    const genre = root.dataset.genre || "";
    const books = genre ? shelves.filter(b => b.genres.includes(genre)) : archive;
    root.innerHTML = books.map(b => {
      const url = b.feature || b.amazon;
      const external = !b.feature;
      const cta = b.feature ? "Read why we picked it →" : ((b.amazon || "").includes("/s?k=") ? "Find it on Amazon ↗" : "See it on Amazon ↗");
      return `<a class="archive-card" href="${escape(url)}" ${external ? 'target="_blank" rel="noopener noreferrer"' : ''} aria-label="${escape(b.feature ? 'Read the feature for ' : 'View on Amazon: ')}${escape(b.title)} by ${escape(b.author)}">
        <img class="archive-cover" src="${escape(b.image)}" alt="${escape(b.title)} by ${escape(b.author)}" loading="lazy">
        <div class="archive-info"><span class="tag">${escape(genre || b.genres[0])}</span><h3>${escape(b.title)}</h3><p>${escape(b.author)}</p><strong>${cta}</strong></div>
      </a>`;
    }).join("");
    const count = document.querySelector("[data-archive-count]");
    if (count) count.textContent = books.length;
  }
  document.querySelectorAll("[data-genre-count]").forEach(el => {
    const count = shelves.filter(b => b.genres.includes(el.dataset.genreCount)).length;
    el.textContent = count + (count === 1 ? " book" : " books");
  });
});
