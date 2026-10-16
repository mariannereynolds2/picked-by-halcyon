(()=>{"use strict";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safe=s=>{const v=String(s||"");return v.startsWith("/")&&!v.startsWith("//")||/^https:\/\//i.test(v)?esc(v):""};
const $=s=>document.querySelector(s),get=(o,k)=>o?.[k]||"";
const card=b=>{const feature=safe(b.feature),link=feature||safe(b.amazon)||"#";return '<a class="archive-card" href="'+link+'"'+(feature?'':' target="_blank" rel="noopener noreferrer"')+' aria-label="Explore '+esc(b.title)+' by '+esc(b.author)+'"><img class="archive-cover" src="'+safe(b.image)+'" alt="'+esc(b.title)+' by '+esc(b.author)+'" loading="lazy"><div class="archive-info"><span class="tag">'+esc((b.genres||[])[0]||"Book")+'</span><h3>'+esc(b.title)+'</h3><p>'+esc(b.author)+'</p><strong>'+(feature?"Read why we picked it →":"See it on Amazon ↗")+'</strong></div></a>'};
const authorCard=(a,past)=>{const name=esc(a.name),books=(a.books||[]).slice(0,2).join(" · "),photo=safe(a.photo);return '<'+(a.feature?"a":"article")+' class="author-card"'+(a.feature?' href="'+safe(a.feature)+'"':"")+'>'+(photo?'<img class="author-photo" loading="lazy" src="'+photo+'" alt="'+name+'">':'<div class="author-avatar">'+name.split(" ").map(x=>x[0]||"").slice(0,2).join("").toUpperCase()+'</div>')+'<div class="author-meta"><span class="tag">'+(past?"PAST FEATURED AUTHOR":"TODAY'S FEATURED AUTHOR")+'</span><h3>'+name+'</h3><p>'+esc(books)+'</p><p class="author-genre">'+esc((a.genres||[]).join(" · "))+'</p></div></'+(a.feature?"a":"article")+">"};
function paint(d){
 const current=d.books.filter(x=>x.status==="current"),archive=d.books.filter(x=>x.status==="archive");
 const authors=d.authors,all=[...current,...archive];
 window.PBH_CURRENT=current;window.PBH_ARCHIVE=archive;window.PBH_AUTHORS=authors;
 const archiveGrid=$("[data-archive-grid]");
 if(archiveGrid){const genre=archiveGrid.dataset.genre||"";const shown=genre?all.filter(x=>(x.genres||[]).includes(genre)):archive;archiveGrid.innerHTML=shown.map(card).join("")||'<p>No books in this collection yet.</p>';const count=$("[data-archive-count]");if(count)count.textContent=shown.length;}
 document.querySelectorAll("[data-genre-count]").forEach(el=>{const g=el.dataset.genreCount;const n=all.filter(x=>(x.genres||[]).includes(g)).length;el.textContent=n+(n===1?" book":" books")});
 const pickGrid=$(".pick-grid");
 if(pickGrid)pickGrid.innerHTML=current.map(b=>'<a class="pick-card latest-pick" href="'+(safe(b.feature)||safe(b.amazon)||"#")+'"><img class="pick-cover" src="'+safe(b.image)+'" loading="lazy" alt="'+esc(b.title)+'"><div class="pick-body"><span class="tag">'+esc(b.tag||(b.genres||[])[0]||"FEATURED")+'</span><h3>'+esc(b.title)+'</h3><p>'+esc(b.author)+'</p><strong>'+(b.feature?"Why we picked it →":"Explore this book →")+'</strong></div></a>').join("");
 const covers=$(".hero-bookshelf .book-row");
 if(covers)covers.innerHTML=current.slice(0,4).map(b=>'<a class="shelf-book" href="'+(safe(b.feature)||safe(b.amazon)||"#")+'"><img src="'+safe(b.image)+'" alt="'+esc(b.title)+' by '+esc(b.author)+'"></a>').join("");
 const currentNames=new Set(current.map(x=>x.author.toLowerCase()));
 const topStrip=$(".author-strip");
 if(topStrip)topStrip.innerHTML=current.map(b=>{const a=authors.find(x=>x.name.toLowerCase()===b.author.toLowerCase())||{name:b.author,books:[b.title],genres:b.genres||[],photo:b.photo||"",feature:b.feature};return authorCard({...a,books:[b.title],feature:b.feature||a.feature},false)}).join("");
 const authorGrid=$("[data-author-grid]");
 if(authorGrid){authorGrid.innerHTML=authors.filter(x=>!currentNames.has(x.name.toLowerCase())).map(x=>authorCard(x,true)).join("");const c=$("[data-author-count]");if(c)c.textContent=authors.length;}
 const team=$(".team-mini");
 if(team)team.innerHTML=(d.team||[]).map(x=>'<div class="team-card">'+(x.photo?'<img class="team-photo" src="'+safe(x.photo)+'" alt="'+esc(x.name)+'" loading="lazy">':"")+'<div><h3>'+esc(x.name)+'</h3><p>'+esc(x.bio||x.role)+'</p></div></div>').join("");
 window.dispatchEvent(new Event("pbh:catalog"));
}
document.addEventListener("DOMContentLoaded",()=>{
 const path=location.pathname;
 if(path.startsWith("/admin"))return;
 try{const b=new Blob([JSON.stringify({path:path.slice(0,160)})],{type:"application/json"});if(navigator.sendBeacon)navigator.sendBeacon("/api/pbh/visit",b);else fetch("/api/pbh/visit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path}),keepalive:true}).catch(()=>{})}catch(e){}
 fetch("/api/pbh/catalog",{credentials:"same-origin"}).then(r=>r.ok?r.json():Promise.reject()).then(paint).catch(()=>{});
});
})();