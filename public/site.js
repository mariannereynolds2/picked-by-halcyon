document.addEventListener("DOMContentLoaded",()=>{
  const menu=document.querySelector("[data-menu]");
  const nav=document.querySelector("[data-nav]");
  if(menu&&nav) menu.addEventListener("click",()=>nav.classList.toggle("open"));

  fetch("/api/metrics").then(r=>r.json()).then(data=>{
    document.querySelectorAll("[data-metric]").forEach(el=>{
      const key=el.dataset.metric;
      const target=Number(data[key]||0);
      const start=performance.now();
      const dur=900;
      const tick=t=>{
        const p=Math.min(1,(t-start)/dur);
        el.textContent=Math.floor(target*(1-Math.pow(1-p,3))).toLocaleString();
        if(p<1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }).catch(()=>{});

  document.querySelectorAll("[data-newsletter]").forEach(form=>{
    form.addEventListener("submit",async e=>{
      e.preventDefault();
      const btn=form.querySelector("button");
      const note=form.querySelector(".form-note");
      btn.disabled=true;
      try{
        const email=form.querySelector('input[name="email"]').value;
        const r=await fetch("/api/newsletter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
        const j=await r.json();
        note.textContent=j.ok?"You're in. We'll send the good stuff.":(j.error||"Something went wrong.");
        if(j.ok) form.reset();
      }catch{note.textContent="Could not sign you up just yet."}
      btn.disabled=false;
    });
  });

  const submit=document.querySelector("[data-book-submit]");
  if(submit){
    submit.addEventListener("submit",async e=>{
      e.preventDefault();
      const btn=submit.querySelector("button[type=submit]");
      const note=submit.querySelector(".form-note");
      btn.disabled=true; note.textContent="Sending...";
      try{
        const r=await fetch("/api/submit-book",{method:"POST",body:new FormData(submit)});
        const j=await r.json();
        if(j.ok){ note.textContent="Got it. Your book is in our review pile."; submit.reset(); }
        else note.textContent=j.error||"Please check the form and try again.";
      }catch{note.textContent="Could not send the submission just yet."}
      btn.disabled=false;
    });
  }

  document.querySelectorAll("[data-contact]").forEach(form=>{
    form.addEventListener("submit",async e=>{
      e.preventDefault();
      const btn=form.querySelector("button[type=submit]");
      const note=form.querySelector(".form-note");
      btn.disabled=true; note.textContent="Sending...";
      try{
        const payload=Object.fromEntries(new FormData(form).entries());
        const r=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        const j=await r.json();
        if(j.ok){note.textContent="Message sent. We’ll get back to you.";form.reset();}
        else note.textContent=j.error||"Please check the form and try again.";
      }catch{note.textContent="Could not send your message just yet."}
      btn.disabled=false;
    });
  });

  const spotlight=document.querySelector("[data-book-spotlight]");
  if(spotlight){
    const current=(window.PBH_CURRENT||[]).map(b=>({...b,link:b.feature,cta:"Open this pick →"}));
    const archive=(window.PBH_ARCHIVE||[]).map(b=>({...b,link:b.feature||b.amazon,cta:b.feature?"Read why we picked it →":"See it on Amazon ↗"}));
    const books=[...current,...archive].filter(b=>b.image&&b.title);
    const cover=spotlight.querySelector("[data-spotlight-cover]");
    const title=spotlight.querySelector("[data-spotlight-title]");
    const author=spotlight.querySelector("[data-spotlight-author]");
    const genre=spotlight.querySelector("[data-spotlight-genre]");
    const line=spotlight.querySelector("[data-spotlight-line]");
    const link=spotlight.querySelector("[data-spotlight-link]");
    const progress=spotlight.querySelector("[data-spotlight-progress]");
    let i=0,timer;

    const genreLine=(g=[])=>{
      const first=(g[0]||"Book").toLowerCase();
      const lines={
        "mystery & thriller":"For readers who want tension, secrets and one-more-chapter pacing.",
        "romance":"For readers looking for chemistry, friction and a love story worth rooting for.",
        "fantasy":"For readers ready to leave this world for a while.",
        "historical fiction":"For readers who like history carried by character and consequence.",
        "literary fiction":"For readers who want character, voice and a story that lingers.",
        "nonfiction":"For curious readers looking for ideas, insight and something useful to take away.",
        "memoir & biography":"For readers drawn to real lives, hard-earned perspective and lived experience.",
        "young adult":"For readers who like big feelings, first choices and high-stakes growing up.",
        "vampire romantasy":"For readers in the mood for vampire romantasy with gothic atmosphere.",
        "political techno-thriller":"For readers who like conspiracies, technology and pressure that keeps climbing.",
        "travel & adventure":"For readers planning a journey, or simply wanting to feel closer to one.",
        "cozy mystery":"For readers who want a clever mystery without living in darkness for 300 pages."
      };
      return lines[first]||("A "+(g[0]||"book")+" pick worth a closer look.");
    };
    const show=n=>{
      if(!books.length)return;
      i=(n+books.length)%books.length;
      const b=books[i];
      spotlight.classList.add("is-changing");
      setTimeout(()=>{
        cover.src=b.image; cover.alt=b.title+" by "+(b.author||"");
        title.textContent=b.title; author.textContent=b.author||"";
        genre.textContent=(b.genres&&b.genres.length?b.genres.join(" · "):"FEATURED BOOK").toUpperCase();
        line.textContent=b.hook||genreLine(b.genres||[]);
        link.href=b.link||b.amazon||"#"; link.textContent=b.cta||"See it on Amazon ↗";
        if(new URL(link.href,location.href).origin!==location.origin){link.target="_blank";link.rel="noopener"}else{link.removeAttribute("target");link.removeAttribute("rel")}
        spotlight.classList.remove("is-changing");
        if(progress){progress.style.animation="none";void progress.offsetWidth;progress.style.animation="spotlightProgress 5s linear forwards";}
      },180);
    };
    const start=()=>{clearInterval(timer);timer=setInterval(()=>show(i+1),5000)};
    spotlight.querySelector(".spotlight-next")?.addEventListener("click",()=>{show(i+1);start()});
    spotlight.querySelector(".spotlight-prev")?.addEventListener("click",()=>{show(i-1);start()});
    spotlight.addEventListener("mouseenter",()=>clearInterval(timer));
    spotlight.addEventListener("mouseleave",start);
    show(0);start();
  }
});