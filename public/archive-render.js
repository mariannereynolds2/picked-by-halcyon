document.addEventListener("DOMContentLoaded",()=> {
  const root=document.querySelector("[data-archive-grid]");
  if(root && window.PBH_ARCHIVE){
    const genre=root.dataset.genre || "";
    const books=genre ? window.PBH_ARCHIVE.filter(b=>b.genres.includes(genre)) : window.PBH_ARCHIVE;
    root.innerHTML=books.map(b=>`
      <a class="archive-card" href="${b.amazon}" target="_blank" rel="noopener noreferrer" aria-label="View ${b.title} by ${b.author} on Amazon">
        <img class="archive-cover" src="${b.image}" alt="${b.title} by ${b.author}" loading="lazy">
        <div class="archive-info">
          <span class="tag">${genre || b.genres[0]}</span>
          <h3>${b.title}</h3>
          <p>${b.author}</p>
          <strong>${b.amazon.includes("/s?k=") ? "Find it on Amazon" : "See it on Amazon"} ↗</strong>
        </div>
      </a>`).join("");
    const count=document.querySelector("[data-archive-count]");
    if(count) count.textContent=books.length;
  }
  document.querySelectorAll("[data-genre-count]").forEach(el=>{
    const g=el.dataset.genreCount;
    el.textContent=window.PBH_ARCHIVE.filter(b=>b.genres.includes(g)).length+" books";
  });
});