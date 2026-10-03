(() => {
  const grid = document.querySelector('[data-author-grid]');
  if (!grid) return;
  const escape = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const authors = window.PBH_AUTHORS || [];
  grid.innerHTML = authors.map(a => {
    const initials = a.name.split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join('').toUpperCase();
    const books = a.books.slice(0,2).join(' · ') + (a.books.length > 2 ? ' +' + (a.books.length-2) + ' more' : '');
    const media = a.photo ? `<img class="author-photo" src="${escape(a.photo)}" alt="${escape(a.name)}" loading="lazy" data-initials="${escape(initials)}">` : `<div class="author-avatar">${escape(initials)}</div>`;
    const tag = a.feature ? 'a' : 'article';
    const link = a.feature ? ` href="${escape(a.feature)}"` : '';
    const genres = a.genres ? `<p class="author-genre">${escape(a.genres.join(' · '))}</p>` : '';
    return `<${tag} class="author-card"${link}>${media}<div class="author-meta"><span class="tag">PAST FEATURED AUTHOR</span><h3>${escape(a.name)}</h3><p>${escape(books)}</p>${genres}${a.feature ? '<p class="author-feature-link">Read the book feature →</p>' : ''}</div></${tag}>`;
  }).join('');
  grid.querySelectorAll('img[data-initials]').forEach(img => {
    const fallback = () => { const avatar = document.createElement('div'); avatar.className = 'author-avatar'; avatar.textContent = img.dataset.initials; img.replaceWith(avatar); };
    img.addEventListener('error', fallback, {once:true});
    if (img.complete && !img.naturalWidth) fallback();
  });
  const count = document.querySelector('[data-author-count]');
  if (count) count.textContent = authors.length;
})();
