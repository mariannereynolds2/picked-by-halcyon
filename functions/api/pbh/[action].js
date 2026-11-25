const text=v=>String(v??"").trim(),cut=(v,n=250)=>text(v).slice(0,n);
const respond=(obj,status=200,headers={})=>new Response(JSON.stringify(obj),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...headers}});
const failure=(message,status=400)=>respond({ok:false,error:message},status);
const parseArr=v=>{try{return Array.isArray(v)?v:JSON.parse(v||"[]")}catch{return []}};
const safePath=v=>{const s=cut(v,450);return !s||s.startsWith("/")&&!s.startsWith("//")||/^https:\/\//i.test(s)?s:""};
const fields={
 books:["title","author","genres","image","amazon","feature","photo","tag","hook","description","featured_date","status","sort_index"],
 authors:["name","bio","books","photo","feature","genres","status"],
 team:["name","role","bio","photo","sort_index","visible"]
};
const tables={books:"pbh_books",authors:"pbh_authors",team:"pbh_team"};
/* ---- Editorial schema + one-time "four new picks" seed (added) ----
   Runs automatically on the first visit after deploy, so no manual SQL is needed:
   1) adds the description / bio columns if they are missing,
   2) adds the four featured books and their author profiles once (re-uses a row if the title/author already exists),
   3) makes them Today's Picks and moves the previous picks to the archive.
   After that, everything is edited in the admin panel and this never touches your edits again. */
const SEED_NAME="2026-11-25-four-picks";
const EDITORIAL_SEED={"books": [{"id": "pick-harbinger-the-prophets-game", "title": "Harbinger: The Prophet's Game", "author": "Steven Harrison", "genres": ["Mystery & Thriller"], "image": "/images/latest/harbinger-prophets-game.webp", "amazon": "https://www.amazon.co.uk/dp/B0HFN1RQ7G", "feature": "/books/harbinger-the-prophets-game.html", "photo": "/images/featured-authors/steven-harrison.webp", "tag": "Crime Thriller", "hook": "A killer leaves a black feather beside each victim, drawing Detective Sam Rourke into a network of corruption that protects Chicago’s elite.", "description": "Chicago’s wealthiest citizens are being murdered and displayed for the city to see. Beside each victim is a black feather. The press calls the killer the Harbinger, a self-appointed judge targeting people whose money and influence have kept them beyond consequence.\n\nDetective Sam Rourke has no interest in the mythology. Military-trained and carrying the weight of an old war, a fading faith and a father disappearing into dementia, Rourke believes the evidence will tell him what happened if he is patient enough to follow it.\n\nWhen the killer contacts disgraced investigative reporter Miles Carter, Miles sees a chance to reclaim the career he lost. Rourke sees someone trying to get ahead of the investigation by deciding which version of the story the public hears first.\n\nWith each murder, the evidence leads deeper into powerful law firms, fraudulent property developments and Chicago politics. The victims begin to look like pieces of something built to stay buried. And the closer Rourke comes to understanding why they were chosen, the harder it becomes to separate justice from vengeance.\n\nHarbinger: The Prophet’s Game is the first book in the Sam Rourke Thriller Series.", "featured_date": "2026-11-25", "status": "current", "sort_index": 0}, {"id": "pick-the-generals-wife", "title": "The General's Wife", "author": "Suzanne Dana", "genres": ["Mystery & Thriller"], "image": "/images/latest/the-generals-wife.webp", "amazon": "https://www.amazon.com/Generals-Wife-Suzanne-Dana/dp/B0FYK4WGFS", "feature": "/books/the-generals-wife.html", "photo": "/images/featured-authors/suzanne-dana.webp", "tag": "Military Mystery & Suspense", "hook": "A blackmail letter forces a respected military wife to confront a secret buried for nearly thirty years.", "description": "The General's Wife is a compelling novel of secrets, loyalty, and redemption set against the demanding world of the military life.\n\nMargaret Stone appears to be the perfect military spouse—supportive, resilient, and respected as the wife of Brigadier General George “Rocky” Stone. But beneath her carefully composed exterior lies a past shadowed by tragedy and one fateful night that could destroy everything she's built.\n\nWhen a blackmail letter signed “Swimbuddy1980” arrives, Margaret is forced to confront the truth about what really happened during a late-night swim at Coronado Beach nearly thirty years ago. As the threats escalate and her husband faces a career-defining deployment to Afghanistan, Margaret must navigate the complex loyalties of military life while fighting to protect the life she's crafted from the ashes of her troubled youth.\n\nFrom a San Diego tattoo parlor to the formality of Marine Corps ceremonies, Margaret's journey reveals the resilience of the human spirit and the unique bonds forged through shared sacrifice in the military community.\n\nIn this compelling narrative of love, betrayal, and redemption, one woman discovers that while the past shapes us, it need not define us—and that true strength comes from facing the most painful truths of all.", "featured_date": "2026-11-25", "status": "current", "sort_index": 1}, {"id": "pick-between-the-avalanche-and-the-ashes", "title": "Between the Avalanche and the Ashes", "author": "Dorota Chioma", "genres": ["Memoir & Biography"], "image": "/images/latest/between-the-avalanche-and-the-ashes.webp", "amazon": "https://www.amazon.co.uk/dp/1036969312", "feature": "/books/between-the-avalanche-and-the-ashes.html", "photo": "/images/featured-authors/dorota-chioma.webp", "tag": "Memoir & Mental Health", "hook": "A visual artist navigates the extremes of bipolar disorder, discovering that creativity can be both a refuge and a risk.", "description": "Between the Avalanche and the Ashes is an intimate memoir of living with bipolar disorder, navigating emotional extremes and rediscovering oneself through creativity.\n\nThrough personal reflections, diary entries and artistic milestones, Dorota Chioma takes readers through the exhilarating intensity of mania, the devastating weight of depression and the uncertain territory between them.\n\nArt becomes a central thread throughout her journey—sometimes a sanctuary, sometimes an expression of overwhelming energy, and sometimes the only language available when words fail.\n\nRather than presenting recovery as a straightforward journey, the book explores its complexity, contradictions and fragile moments of hope. It raises difficult questions about identity, creativity, illness and the cost of pursuing passion while protecting one’s wellbeing.\n\nUltimately, it is a testament to the courage of continuing, creating and finding meaning in the aftermath.", "featured_date": "2026-11-25", "status": "current", "sort_index": 2}, {"id": "pick-meditation-time", "title": "Meditation Time: Know Yourself and the World Around You", "author": "Laurent Grenier", "genres": ["Nonfiction"], "image": "/images/latest/meditation-time.webp", "amazon": "https://www.amazon.com/Meditation-Time-Yourself-World-Around/dp/B0FV2JLC3S", "feature": "/books/meditation-time.html", "photo": "/images/featured-authors/laurent-grenier.webp", "tag": "Philosophical Essay", "hook": "A lifetime of reflection turns one life-changing question into a thoughtful guide to self-understanding and the world around us.", "description": "Born from the crucible of profound personal adversity, Meditation Time: Know Yourself and the World Around You is a deeply moving philosophical exploration of existence, resilience, and the art of living. At age seventeen, a catastrophic diving accident left Canadian author Laurent Grenier quadriplegic, stripping away the physical freedom of his youth and confronting him with life’s most urgent existential question: Why live?\n\nOver four decades of rigorous contemplation, Grenier transformed that question into a guide for navigating the human condition. Rather than offering quick fixes or rigid self-help formulas, this collection of concise, interconnected essays invites readers to slow down, reflect, and examine reality with clarity and honesty. Drawing from philosophy, science, and lived experience, Grenier bridges the inner landscape of self-awareness with the interconnectedness of the external world. He challenges conventional illusions of control, showing instead how wisdom, agency, and contentment emerge when we align our thoughts with reality rather than fighting against it.\n\nDesigned to be savored and studied rather than rushed, Meditation Time serves as both a mirror and a compass. Grenier’s journey from despair to hard-won enlightenment stands as living proof that even when external circumstances narrow our physical boundaries, the mind remains vast. Ultimately, this book invites readers to awaken to the present, deepen self-understanding, and discover enduring meaning in simply being alive.", "featured_date": "2026-11-25", "status": "current", "sort_index": 3}], "authors": [{"id": "author-harbinger-the-prophets-game", "name": "Steven Harrison", "bio": "Steven Harrison is a British crime thriller author and the creator of the Sam Rourke Thriller Series. He began his working life building PCs and spent his career in IT, solving problems and teaching himself whatever the next shift in technology demanded. That habit of following clues and questioning easy answers now shapes his fiction.\n\nHis debut novel, Harbinger: The Prophet’s Game , introduces a military-trained detective whose pursuit of a serial killer exposes the people and institutions that protect Chicago’s powerful. Steven publishes independently through his imprint, Steven Harrison Creative.", "books": ["Harbinger: The Prophet's Game"], "photo": "/images/featured-authors/steven-harrison.webp", "feature": "/books/harbinger-the-prophets-game.html", "genres": ["Mystery & Thriller"], "status": "published"}, {"id": "author-the-generals-wife", "name": "Suzanne Dana", "bio": "Suzanne Dana is both a general’s daughter and a general’s wife. She graduated from San Diego State University with a degree in journalism and a secondary education credential in English. As a general’s wife, she moved nineteen times and supported her husband through eight deployments, including those to Iraq and Afghanistan. She formerly sat on the Marine Corps Scholarship Foundation board as an Adjunct Director. She enjoys photography, travel, water sports, and volunteering at a local women’s shelter. She resides in Arizona with her husband. The General’s Wife is her debut novel.", "books": ["The General's Wife"], "photo": "/images/featured-authors/suzanne-dana.webp", "feature": "/books/the-generals-wife.html", "genres": ["Mystery & Thriller"], "status": "published"}, {"id": "author-between-the-avalanche-and-the-ashes", "name": "Dorota Chioma", "bio": "Dorota Chioma is a Polish-born British-based visual artist, author and mental health advocate living with bipolar disorder. Her work explores the relationship between creativity, identity, emotional extremes and resilience. Through painting, memoir and reflective essays, she transforms lived experience into accessible conversations about mental health. Her books combine artistic expression with honest personal narratives, challenging stigma without romanticising illness or recovery. Alongside her creative practice, she works full-time. She believes that art is not merely a form of expression, but a means of survival, connection and rediscovery.", "books": ["Between the Avalanche and the Ashes"], "photo": "/images/featured-authors/dorota-chioma.webp", "feature": "/books/between-the-avalanche-and-the-ashes.html", "genres": ["Memoir & Biography"], "status": "published"}, {"id": "author-meditation-time", "name": "Laurent Grenier", "bio": "Laurent Grenier is a philosopher born in France in 1957 to French Canadian parents and raised in Canada. In 1974, as he had grown into an athletic teenager, he suffered a physically disabling neck injury in a diving accident that shattered his dreams of an athletic career. Thereafter, Laurent Grenier dedicated himself to decades of meditation and study, in an effort to develop an art of living and a vision of things that make the world understandable and habitable.", "books": ["Meditation Time: Know Yourself and the World Around You"], "photo": "/images/featured-authors/laurent-grenier.webp", "feature": "/books/meditation-time.html", "genres": ["Nonfiction"], "status": "published"}]};
let editorialReady=false;
async function ensureEditorial(db){
 if(editorialReady)return;
 const has=async(t,c)=>(await db.prepare("PRAGMA table_info("+t+")").all()).results.some(r=>r.name===c);
 if(!await has("pbh_books","description"))await db.prepare("ALTER TABLE pbh_books ADD COLUMN description TEXT NOT NULL DEFAULT ''").run().catch(()=>{});
 if(!await has("pbh_authors","bio"))await db.prepare("ALTER TABLE pbh_authors ADD COLUMN bio TEXT NOT NULL DEFAULT ''").run().catch(()=>{});
 await db.prepare("CREATE TABLE IF NOT EXISTS pbh_seed_log(name TEXT PRIMARY KEY,applied_at TEXT)").run();
 if(!await db.prepare("SELECT name FROM pbh_seed_log WHERE name=?").bind(SEED_NAME).first()){
   const ids=[];
   for(const b of EDITORIAL_SEED.books){
     const ex=await db.prepare("SELECT id FROM pbh_books WHERE lower(title)=lower(?) LIMIT 1").bind(b.title).first(),id=ex?ex.id:b.id;
     ids.push(id);
     const v=[b.title,b.author,JSON.stringify(b.genres),b.image,b.amazon,b.feature,b.photo,b.tag,b.hook,b.description,b.featured_date,"current",b.sort_index];
     if(ex)await db.prepare("UPDATE pbh_books SET title=?,author=?,genres=?,image=?,amazon=?,feature=?,photo=?,tag=?,hook=?,description=?,featured_date=?,status=?,sort_index=?,updated_at=datetime('now') WHERE id=?").bind(...v,id).run();
     else await db.prepare("INSERT INTO pbh_books(id,title,author,genres,image,amazon,feature,photo,tag,hook,description,featured_date,status,sort_index) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,...v).run();
   }
   await db.prepare("UPDATE pbh_books SET status='archive',updated_at=datetime('now') WHERE status='current' AND id NOT IN ("+ids.map(()=>"?").join(",")+")").bind(...ids).run();
   for(const a of EDITORIAL_SEED.authors){
     const ex=await db.prepare("SELECT id FROM pbh_authors WHERE lower(name)=lower(?) LIMIT 1").bind(a.name).first(),id=ex?ex.id:a.id;
     const v=[a.name,a.bio,JSON.stringify(a.books),a.photo,a.feature,JSON.stringify(a.genres),"published"];
     if(ex)await db.prepare("UPDATE pbh_authors SET name=?,bio=?,books=?,photo=?,feature=?,genres=?,status=?,updated_at=datetime('now') WHERE id=?").bind(...v,id).run();
     else await db.prepare("INSERT INTO pbh_authors(id,name,bio,books,photo,feature,genres,status) VALUES(?,?,?,?,?,?,?,?)").bind(id,...v).run();
   }
   await db.prepare("INSERT OR IGNORE INTO pbh_seed_log(name,applied_at) VALUES(?,datetime('now'))").bind(SEED_NAME).run();
 }
 editorialReady=true;
}


const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function sendMail(env,payload){
 if(!env.RESEND_API_KEY)return;
 const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify(payload)});
 if(!r.ok)throw new Error("Email delivery failed: "+r.status+" "+(await r.text().catch(()=>"")).slice(0,200));
}
const FROM="Picked by Halcyon <kate@support.halcyonliterary.com>",INBOX="hello@halcyonliterary.com";
const isEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v||"");
async function sendNotice(env,subject,details,replyTo,attachments){
 const rows=details.filter(([,v])=>text(v)).map(([label,value])=>"<tr><td style='padding:8px 14px 8px 0;vertical-align:top;color:#48595E;white-space:nowrap'><strong>"+escapeHTML(label)+"</strong></td><td style='padding:8px 0'>"+escapeHTML(value).replace(/\n/g,"<br>")+"</td></tr>").join("");
 const html="<div style='font-family:Arial,sans-serif;line-height:1.6;color:#13252B;max-width:680px'><h2 style='font-family:Georgia,serif;font-weight:normal;color:#0A3C48'>"+escapeHTML(subject)+"</h2><table style='border-collapse:collapse;font-size:15px'>"+rows+"</table></div>";
 const payload={from:FROM,to:[INBOX],subject,html};
 if(isEmail(replyTo))payload.reply_to=replyTo;
 if(attachments&&attachments.length)payload.attachments=attachments;
 await sendMail(env,payload);
}
async function sendSubmissionReceipt(env,to,name,title,lang){
 if(!isEmail(to))return;
 const first=escapeHTML(String(name).split(/\s+/)[0]||"");
 const t=escapeHTML(title),fr=lang==="fr";
 const body=fr?
  "<p>Bonjour "+first+",</p>"+
  "<p>Merci d'avoir proposé <em>"+t+"</em> à Picked by Halcyon. Votre proposition est bien arrivée chez nos éditeurs. Nous vous répondons dans les 7 jours, que le livre soit retenu ou non.</p>"+
  "<p>Si vous n'avez pas joint votre couverture et votre photo, il vous suffit de répondre à cet e-mail avec les fichiers en pièce jointe.</p>"+
  "<p>Pour rappel, la mise en avant sur Picked by Halcyon est gratuite. Nous ne vous demanderons jamais de paiement, de coordonnées bancaires ni le fichier de votre livre.</p>"+
  "<p>Bien cordialement,<br>L'équipe Picked by Halcyon<br><a href='https://picked.halcyonliterary.com' style='color:#0E5A6B'>picked.halcyonliterary.com</a></p>"
  :
  "<p>Hello "+(first||"there")+",</p>"+
  "<p>Thank you for sending <em>"+t+"</em> to Picked by Halcyon. It has reached our editors, and we will reply within 7 days whether or not it is picked.</p>"+
  "<p>If you did not include your cover image and author photo, simply reply to this email with them attached.</p>"+
  "<p>As a reminder, features on Picked by Halcyon are free. We will never ask you for payment, card details or your book file.</p>"+
  "<p>Warm regards,<br>The Picked by Halcyon team<br><a href='https://picked.halcyonliterary.com' style='color:#0E5A6B'>picked.halcyonliterary.com</a></p>";
 const subject=fr?"Nous avons bien reçu "+cut(title,120)+" | Picked by Halcyon":"We received "+cut(title,120)+" | Picked by Halcyon";
 await sendMail(env,{from:FROM,to:[to],reply_to:INBOX,subject,html:"<div style='font-family:Arial,sans-serif;line-height:1.65;color:#13252B;max-width:600px'>"+body+"</div>"});
}
async function toAttachment(file,label){
 if(!file||typeof file==="string"||!file.size)return null;
 if(file.size>8*1024*1024)throw new Error("too-big");
 if(!/^image\/(jpeg|png|webp)$/.test(file.type||""))throw new Error("bad-type");
 const bytes=new Uint8Array(await file.arrayBuffer());let bin="";
 for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));
 const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.type];
 const base=String(file.name||label).replace(/\.[^.]+$/,"").replace(/[^\w.-]+/g,"-").slice(0,60)||label;
 return {filename:label+"-"+base+"."+ext,content:btoa(bin)};
}
const reportSecret=env=>env.PBH_REPORT_SECRET||env.PBH_ADMIN_PASSWORD;
async function reportKey(env,page){return (await sign(reportSecret(env),"report:"+page)).slice(0,24)}
function queueNotice(context,subject,details,replyTo,attachments){
 context.waitUntil(sendNotice(context.env,subject,details,replyTo,attachments).catch(e=>console.error("Picked notification",e.message)));
}
async function sign(secret,value){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value));
 return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function equal(a,b){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}

/* ---- Admin credential store + password reset (added) ----
   Password/username changes are stored (salted PBKDF2 hash) in D1, so they work
   without touching Cloudflare secrets. If nothing is stored yet, the original
   PBH_ADMIN_USERNAME / PBH_ADMIN_PASSWORD Cloudflare values still apply. */
let authTablesReady=false;
async function ensureAuthTables(db){
 if(authTablesReady)return;
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS pbh_admin_auth(id INTEGER PRIMARY KEY CHECK(id=1),username TEXT NOT NULL,salt TEXT NOT NULL,hash TEXT NOT NULL,updated_at INTEGER NOT NULL)"),
  db.prepare("CREATE TABLE IF NOT EXISTS pbh_reset_tokens(token_hash TEXT PRIMARY KEY,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL)")
 ]);
 authTablesReady=true;
}
const toHex=buf=>[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
const randomHex=n=>toHex(crypto.getRandomValues(new Uint8Array(n)));
async function sha256hex(v){return toHex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)))}
async function pbkdf2(password,saltHex){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
 const salt=new Uint8Array(saltHex.match(/../g).map(h=>parseInt(h,16)));
 return toHex(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:100000},key,256));
}
async function getCreds(db){await ensureAuthTables(db);return await db.prepare("SELECT username,salt,hash FROM pbh_admin_auth WHERE id=1").first()}
async function saveCreds(db,username,password){
 const salt=randomHex(16),hash=await pbkdf2(password,salt);
 await db.prepare("INSERT INTO pbh_admin_auth(id,username,salt,hash,updated_at) VALUES(1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET username=excluded.username,salt=excluded.salt,hash=excluded.hash,updated_at=excluded.updated_at").bind(username,salt,hash,Date.now()).run();
}
async function checkPassword(db,env,password){
 const c=await getCreds(db);
 if(c)return equal(await pbkdf2(password,c.salt),c.hash);
 return equal(password,env.PBH_ADMIN_PASSWORD||"");
}
async function currentUsername(db,env){const c=await getCreds(db);return c?c.username:(env.PBH_ADMIN_USERNAME||"admin2026")}
const MIN_PASSWORD=10;
async function authorized(req,env){
 if(!env.PBH_ADMIN_PASSWORD)return false;
 const cookie=(req.headers.get("Cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("pbh_session="));
 if(!cookie)return false;
 const parts=cookie.slice("pbh_session=".length).split(".");
 if(parts.length!==3)return false;
 const issued=Number(parts[0]);if(!Number.isFinite(issued)||issued>Date.now()+60000||Date.now()-issued>28800000)return false;
 const s=await sign(env.PBH_ADMIN_PASSWORD,"picked-session."+parts[0]+"."+parts[1]);
 return equal(s,parts[2]);
}
const toBook=r=>({...r,genres:parseArr(r.genres)});
const toAuthor=r=>({...r,books:parseArr(r.books),genres:parseArr(r.genres)});
async function publicCatalog(db){
 const [a,b,t]=await Promise.all([
 db.prepare("SELECT * FROM pbh_authors WHERE status='published' ORDER BY name").all(),
 db.prepare("SELECT * FROM pbh_books WHERE status != 'draft' ORDER BY CASE status WHEN 'current' THEN 0 ELSE 1 END,sort_index,created_at DESC").all(),
 db.prepare("SELECT * FROM pbh_team WHERE visible=1 ORDER BY sort_index,name").all()
 ]);
 return {ok:true,authors:a.results.map(toAuthor),books:b.results.map(toBook),team:t.results};
}
async function readAdmin(db){
 const results=await Promise.all([
 db.prepare("SELECT * FROM pbh_books ORDER BY CASE status WHEN 'current' THEN 0 WHEN 'archive' THEN 1 ELSE 2 END,sort_index").all(),
 db.prepare("SELECT * FROM pbh_authors ORDER BY name").all(),
 db.prepare("SELECT * FROM pbh_team ORDER BY sort_index,name").all(),
 db.prepare("SELECT * FROM pbh_submissions ORDER BY created_at DESC,id DESC LIMIT 500").all(),
 db.prepare("SELECT * FROM pbh_newsletter ORDER BY created_at DESC LIMIT 500").all(),
 db.prepare("SELECT * FROM pbh_messages ORDER BY created_at DESC LIMIT 300").all(),
 db.prepare("SELECT date,SUM(views) views FROM pbh_visits WHERE date>=date('now','-29 day') GROUP BY date ORDER BY date").all(),
 db.prepare("SELECT path,SUM(views) views FROM pbh_visits WHERE date>=date('now','-29 day') GROUP BY path ORDER BY views DESC LIMIT 25").all(),
 db.prepare("SELECT COALESCE(SUM(views),0) n FROM pbh_visits WHERE date>=date('now','-29 day')").first()
 ]);
 return {ok:true,books:results[0].results.map(toBook),authors:results[1].results.map(toAuthor),team:results[2].results,submissions:results[3].results,newsletter:results[4].results,messages:results[5].results,days:results[6].results,pages:results[7].results,views30:results[8]?.n||0};
}
export async function onRequest(context){
 const {request:req,env,params}=context,action=String(params.action||""),db=env.PBH_DB;
 if(!db)return failure("Dashboard storage is not configured.",503);
 const method=req.method,url=new URL(req.url);
 if(action==="catalog"||action==="admin")await ensureEditorial(db).catch(e=>console.error("Editorial setup",e.message));
 if(method==="POST"&&req.headers.get("Origin")&&req.headers.get("Origin")!==url.origin)return failure("Invalid request origin.",403);
 try{
 if(action==="catalog"&&method==="GET")return respond(await publicCatalog(db));
 if(action==="metrics"&&method==="GET"){
   const [views,readers]=await Promise.all([
    db.prepare("SELECT COALESCE(SUM(views),0) n FROM pbh_visits WHERE date>=date('now','-29 day')").first(),
    db.prepare("SELECT count(*) n FROM pbh_newsletter").first()
   ]);
   return respond({views:views?.n||0,readers:readers?.n||0,genres:10,period:"past 30 days",tracking_since:"2026-10-16"});
 }
 if(action==="visit"&&method==="POST"){
   const ct=req.headers.get("content-type")||"";
   const body=ct.includes("application/json")?await req.json().catch(()=>({})):Object.fromEntries(await req.formData().catch(()=>new FormData()));
   const path=cut(body.path||"",160);
   if(!path.startsWith("/")||path.startsWith("/admin")||path.includes(".."))return failure("Invalid page path");
   await db.prepare("INSERT INTO pbh_visits(date,path,views) VALUES(date('now'),?,1) ON CONFLICT(date,path) DO UPDATE SET views=views+1").bind(path).run();
   return respond({ok:true});
 }
 if(action==="submit-book"&&method==="POST"){
   const ct=req.headers.get("Content-Type")||"";
   const b=ct.includes("multipart/form-data")||ct.includes("application/x-www-form-urlencoded")?Object.fromEntries(await req.formData()):await req.json().catch(()=>({}));
   if(b.honeypot||b.website_url)return respond({ok:true});
   const author=cut(b.author_name||b.author,160),email=cut(b.email,250),title=cut(b.book_title||b.title,230),genre=cut(b.genre,120),why=cut(b.why_fit,3500);
   if(!author||!title||!why||!genre||!isEmail(email))return failure("Please add your name, email, the book title, its shelf and why readers will love it.");
   const link=v=>{const x=cut(v,450);return /^https?:\/\/[^\s]+$/i.test(x)?x:""};
   const extra={
     "Language":cut(b.language,80),
     "One-line hook":cut(b.hook,200),
     "Who it suits / content notes":cut(b.audience,1500),
     "Author bio":cut(b.author_bio,2500),
     "Cover image":link(b.cover_url),
     "Author photo":link(b.photo_url),
     "Other stores":cut(b.other_links,1500),
     "Social links":cut(b.socials,600),
     "Permission given":b.rights?"Yes":""
   };
   const lang=b.lang==="fr"?"fr":"en";
   let files=[];
   try{files=(await Promise.all([toAttachment(b.cover_file,"cover"),toAttachment(b.photo_file,"author-photo")])).filter(Boolean)}
   catch(e){return failure(e.message==="too-big"?(lang==="fr"?"Chaque image doit faire 8 Mo maximum.":"Each image must be 8 MB or smaller."):(lang==="fr"?"Les images doivent être au format JPG, PNG ou WebP.":"Images must be JPG, PNG or WebP files."))}
   if(files.length)extra["Files attached to this email"]=files.map(f=>f.filename).join(", ");
   const description=cut(b.book_summary||b.summary,4000);
   // Extra kit fields are stored with the description so no database migration is needed.
   const stored=[description?"DESCRIPTION\n"+description:"",...Object.entries(extra).filter(([,v])=>v).map(([k,v])=>k.toUpperCase()+"\n"+v)].filter(Boolean).join("\n\n");
   await db.prepare("INSERT INTO pbh_submissions(author_name,email,book_title,genre,book_link,website,why_fit,book_summary) VALUES(?,?,?,?,?,?,?,?)").bind(author,email,title,genre,link(b.book_link)||safePath(b.book_link),link(b.website)||safePath(b.website),why,cut(stored,7000)).run();
   queueNotice(context,"New book submission: "+title,[["Author",author],["Email",email],["Book",title],["Shelf",genre],["Language",extra["Language"]],["One-line hook",extra["One-line hook"]],["Description",description],["Why readers will love it",why],["Who it suits / content notes",extra["Who it suits / content notes"]],["Author bio",extra["Author bio"]],["Cover image",extra["Cover image"]],["Author photo",extra["Author photo"]],["Main buy link",link(b.book_link)],["Other stores",extra["Other stores"]],["Website",link(b.website)],["Social links",extra["Social links"]],["Permission given",extra["Permission given"]],["Files attached",extra["Files attached to this email"]],["Form language",lang==="fr"?"French":"English"]],email,files);
   context.waitUntil(sendSubmissionReceipt(env,email,author,title,lang).catch(e=>console.error("Picked receipt",e.message)));
   return respond({ok:true});
 }
 if(action==="report"&&method==="GET"){
   const page=cut(url.searchParams.get("page"),160),key=cut(url.searchParams.get("key"),40);
   if(!reportSecret(env)||!/^\/books\/[\w-]+\.html$/.test(page)||!key||!equal(key,await reportKey(env,page)))return failure("This report link is not valid. Ask us for a new one.",403);
   const [book,d30,all,days]=await Promise.all([
     db.prepare("SELECT title,author,image,featured_date FROM pbh_books WHERE feature=? LIMIT 1").bind(page).first(),
     db.prepare("SELECT COALESCE(SUM(views),0) n FROM pbh_visits WHERE path=? AND date>=date('now','-29 day')").bind(page).first(),
     db.prepare("SELECT COALESCE(SUM(views),0) n,MIN(date) first FROM pbh_visits WHERE path=?").bind(page).first(),
     db.prepare("SELECT date,SUM(views) views FROM pbh_visits WHERE path=? AND date>=date('now','-29 day') GROUP BY date ORDER BY date").bind(page).all()
   ]);
   return respond({ok:true,page,book:book||null,views30:d30?.n||0,total:all?.n||0,since:all?.first||null,days:days.results});
 }
 if(action==="report-links"&&method==="GET"){
   if(!await authorized(req,env))return failure("Login required.",401);
   const r=await db.prepare("SELECT title,author,feature,status FROM pbh_books WHERE feature!='' AND status!='draft' ORDER BY title").all();
   const out=[];for(const x of r.results){if(/^\/books\/[\w-]+\.html$/.test(x.feature||""))out.push({...x,link:url.origin+"/report.html?page="+encodeURIComponent(x.feature)+"&key="+(await reportKey(env,x.feature))})}
   return respond({ok:true,links:out});
 }
 if(action==="newsletter"&&method==="POST"){
   const b=await req.json().catch(()=>({})),email=cut(b.email,250).toLowerCase();
   if(!isEmail(email))return failure("Enter an email address like name@example.com.");
   const r=await db.prepare("INSERT OR IGNORE INTO pbh_newsletter(email) VALUES(?)").bind(email).run();
   if((r.meta?.changes||0)>0)queueNotice(context,"New Picked by Halcyon newsletter signup",[["Email",email]],email);
   return respond({ok:true,newSubscriber:(r.meta?.changes||0)>0});
 }
 if(action==="contact"&&method==="POST"){
   const b=await req.json().catch(()=>({})),name=cut(b.name,160),email=cut(b.email,250),message=cut(b.message,6000);
   if(!name||!message||!isEmail(email))return failure("Provide your name, email and message.");
   if(b.honeypot)return respond({ok:true});
   await db.prepare("INSERT INTO pbh_messages(name,email,subject,message) VALUES(?,?,?,?)").bind(name,email,cut(b.subject,250),message).run();
   queueNotice(context,"New Picked by Halcyon message"+(b.subject?" — "+cut(b.subject,80):""),[["Name",name],["Email",email],["Subject",cut(b.subject,250)],["Message",message]],email);
   return respond({ok:true});
 }
 if(action==="image"&&method==="GET"){
   const key=cut(url.searchParams.get("key"),80);
   if(!/^editorial-[0-9a-f-]{36}\\.(jpg|png|webp)$/.test(key))return failure("Image not found.",404);
   if(!env.PBH_IMAGES)return failure("Image storage is not configured.",503);
   const object=await env.PBH_IMAGES.get(key);
   if(!object)return failure("Image not found.",404);
   const ext=key.split(".").pop(),type={jpg:"image/jpeg",png:"image/png",webp:"image/webp"}[ext];
   return new Response(object.body,{headers:{"Content-Type":object.httpMetadata?.contentType||type,"Cache-Control":"public, max-age=31536000, immutable","X-Content-Type-Options":"nosniff",...(object.httpEtag?{"ETag":object.httpEtag}:{})}});
 }
 if(action==="upload-image"&&method==="POST"){
   if(!await authorized(req,env))return failure("Login required.",401);
   if(!env.PBH_IMAGES)return failure("Image storage is not configured yet. Create an R2 bucket and bind it as PBH_IMAGES.",503);
   const form=await req.formData(),file=form.get("image");
   if(!file||typeof file==="string"||!file.size)return failure("Choose an image file first.");
   if(file.size>8*1024*1024)return failure("Each image must be 8 MB or smaller.");
   const types={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
   if(!types[file.type])return failure("Images must be JPG, PNG or WebP.");
   const key="editorial-"+crypto.randomUUID()+"."+types[file.type];
   await env.PBH_IMAGES.put(key,file.stream(),{httpMetadata:{contentType:file.type,cacheControl:"public, max-age=31536000, immutable"}});
   return respond({ok:true,url:"/api/pbh/image?key="+encodeURIComponent(key)});
 }
 if(action==="login"&&method==="POST"){
   if(!env.PBH_ADMIN_PASSWORD)return failure("Admin login is not configured. Add PBH_ADMIN_PASSWORD as a Cloudflare Pages secret.",503);
   const b=await req.json().catch(()=>({}));
   const ip=req.headers.get("CF-Connecting-IP")||"unknown";
   const lockKey=await sign(env.PBH_ADMIN_PASSWORD,"login:"+ip);
   const attempts=await db.prepare("SELECT failures,updated_at FROM pbh_login_attempts WHERE key=?").bind(lockKey).first();
   if(attempts?.failures>=8&&Date.now()-attempts.updated_at<30*60*1000)return failure("Too many attempts. Try again in 30 minutes.",429);
   const username=cut(b.username,120),password=String(b.password||"");
   const success=equal(username,await currentUsername(db,env))&&await checkPassword(db,env,password);
   if(!success){
     const f=attempts&&Date.now()-attempts.updated_at<30*60*1000?attempts.failures+1:1;
     await db.prepare("INSERT INTO pbh_login_attempts(key,failures,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET failures=excluded.failures,updated_at=excluded.updated_at").bind(lockKey,f,Date.now()).run();
     return failure("Incorrect username or password.",401);
   }
   await db.prepare("DELETE FROM pbh_login_attempts WHERE key=?").bind(lockKey).run();
   const issued=String(Date.now()),nonce=crypto.randomUUID();
   const sig=await sign(env.PBH_ADMIN_PASSWORD,"picked-session."+issued+"."+nonce);
   return respond({ok:true},200,{"Set-Cookie":"pbh_session="+issued+"."+nonce+"."+sig+"; Path=/api/pbh; Max-Age=28800; HttpOnly; Secure; SameSite=Strict"});
 }

 if(action==="forgot"&&method==="POST"){
   await ensureAuthTables(db);
   /* Always answer the same way so the form never reveals anything. At most 3 emails per hour. */
   const recent=await db.prepare("SELECT COUNT(*) n FROM pbh_reset_tokens WHERE created_at>?").bind(Date.now()-3600000).first();
   if((recent?.n||0)<3){
     const raw=randomHex(32),now=Date.now();
     await db.prepare("DELETE FROM pbh_reset_tokens WHERE expires_at<?").bind(now).run();
     await db.prepare("INSERT INTO pbh_reset_tokens(token_hash,created_at,expires_at) VALUES(?,?,?)").bind(await sha256hex(raw),now,now+30*60000).run();
     const uname=await currentUsername(db,env);
     const link=(env.PBH_SITE_URL||url.origin)+"/admin/?reset="+raw;
     const html="<div style='font-family:Arial,sans-serif;line-height:1.6;color:#13252B;max-width:560px'><h2 style='font-family:Georgia,serif;font-weight:normal'>Reset your admin password</h2><p>Your admin username is: <strong>"+escapeHTML(uname)+"</strong></p><p>To choose a new password, open this link. It works once and expires in 30 minutes.</p><p><a href='"+link+"' style='display:inline-block;background:#a16c45;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none'>Choose a new password</a></p><p style='color:#6b7a7f;font-size:13px'>If you did not ask for this, ignore this email. Nothing has changed.</p></div>";
     context.waitUntil(sendMail(env,{from:FROM,to:[INBOX],subject:"Reset your Picked by Halcyon admin password",html}).catch(e=>console.error("Reset email",e.message)));
   }
   return respond({ok:true});
 }
 if(action==="reset"&&method==="POST"){
   const b=await req.json().catch(()=>({}));
   const password=String(b.password||"");
   if(password.length<MIN_PASSWORD)return failure("Choose a password with at least "+MIN_PASSWORD+" characters.");
   await ensureAuthTables(db);
   const row=await db.prepare("SELECT expires_at FROM pbh_reset_tokens WHERE token_hash=?").bind(await sha256hex(cut(b.token,200))).first();
   if(!row||row.expires_at<Date.now())return failure("This reset link is invalid or has expired. Request a new one.");
   const username=cut(b.username,120)||await currentUsername(db,env);
   await saveCreds(db,username,password);
   await db.prepare("DELETE FROM pbh_reset_tokens").run();
   return respond({ok:true,username});
 }
 if(action==="change-password"&&method==="POST"){
   if(!await authorized(req,env))return failure("Login required.",401);
   const b=await req.json().catch(()=>({}));
   const password=String(b.password||"");
   if(password.length<MIN_PASSWORD)return failure("Choose a password with at least "+MIN_PASSWORD+" characters.");
   if(!await checkPassword(db,env,String(b.current||"")))return failure("Your current password is not correct.",403);
   await saveCreds(db,cut(b.username,120)||await currentUsername(db,env),password);
   return respond({ok:true});
 }
 if(action==="logout"&&method==="POST")return respond({ok:true},200,{"Set-Cookie":"pbh_session=; Path=/api/pbh; Max-Age=0; HttpOnly; Secure; SameSite=Strict"});
 if(action==="admin"){
   if(!await authorized(req,env))return failure("Login required.",401);
   if(method==="GET")return respond(await readAdmin(db));
   if(method!=="POST")return failure("Method not allowed.",405);
   const b=await req.json().catch(()=>({})),entity=cut(b.entity,30),op=cut(b.op,30);
   if(entity==="submissions"&&op==="status"){
     const id=Number(b.id),status=cut(b.status,20);
     if(!Number.isInteger(id)||!["new","reviewing","approved","declined"].includes(status))return failure("Invalid status");
     await db.prepare("UPDATE pbh_submissions SET status=? WHERE id=?").bind(status,id).run();
     return respond({ok:true});
   }
   const table=tables[entity],cols=fields[entity];
   if(!table)return failure("Unknown record type");
   if(op==="delete"){
     if(!b.id)return failure("Missing record identifier");
     await db.prepare("DELETE FROM "+table+" WHERE id=?").bind(String(b.id)).run();
     return respond({ok:true});
   }
   if(op!=="save")return failure("Unknown action");
   const row={},input=b.data||{};
   for(const col of cols){
     let v=input[col];
     if(col==="genres"||col==="books")v=JSON.stringify(Array.isArray(v)?v:String(v||"").split(",").map(x=>x.trim()).filter(Boolean));
     else if(col==="sort_index")v=Math.max(0,parseInt(v,10)||0);
     else if(col==="visible")v=v===false||v===0||v==="0"?0:1;
     else if(["amazon","feature","image","photo"].includes(col))v=safePath(v);
     else v=cut(v,["hook","bio","description"].includes(col)?6000:col==="name"||col==="title"?240:500);
     row[col]=v;
   }
   if(!row[entity==="books"?"title":"name"])return failure("A title or name is required");
   if(entity==="books"&&!row.author)return failure("Book author is required");
   if(entity==="books"&&!["current","archive","draft"].includes(row.status))return failure("Choose a valid book status");
   if(entity==="authors"&&!["published","hidden"].includes(row.status))return failure("Choose a valid author status");

   const id=cut(b.id,110)||crypto.randomUUID();
   const previous=b.id?await db.prepare("SELECT * FROM "+table+" WHERE id=?").bind(String(b.id)).first():null;
   const promoting=entity==="books"&&row.status==="current"&&(!previous||previous.status!=="current");
   if(promoting){
     await db.prepare("UPDATE pbh_books SET sort_index=sort_index+1 WHERE status='current'").run();
     row.sort_index=0;
     if(!row.featured_date)row.featured_date=new Date().toISOString().slice(0,10);
   }
   const allCols=["id",...cols],vals=[id,...cols.map(k=>row[k])];
   const query="INSERT INTO "+table+"("+allCols.join(",")+") VALUES("+allCols.map(()=>"?").join(",")+") ON CONFLICT(id) DO UPDATE SET "+cols.map(k=>k+"=excluded."+k).join(",")+(entity==="books"||entity==="authors"?",updated_at=datetime('now')":"");
   await db.prepare(query).bind(...vals).run();
   if(entity==="books"){
     // Today’s Picks has four slots. The oldest one moves to the archive automatically.
     if(promoting)await db.prepare("UPDATE pbh_books SET status='archive' WHERE id IN (SELECT id FROM pbh_books WHERE status='current' ORDER BY sort_index ASC,updated_at DESC LIMIT -1 OFFSET 4)").run();
     const name=row.author;
     const existingAuthor=await db.prepare("SELECT id,books,genres,photo,feature FROM pbh_authors WHERE lower(name)=lower(?) LIMIT 1").bind(name).first();
     if(!existingAuthor){
       await db.prepare("INSERT INTO pbh_authors(id,name,books,photo,feature,genres,status) VALUES(?,?,?,?,?,?,'published')").bind(crypto.randomUUID(),name,JSON.stringify([row.title]),row.photo||"",row.feature||"",row.genres).run();
     }else{
       const bs=parseArr(existingAuthor.books).filter(v=>v!==previous?.title||previous?.author?.toLowerCase()!==name.toLowerCase());
       if(!bs.includes(row.title))bs.push(row.title);
       const gs=[...new Set([...parseArr(existingAuthor.genres),...parseArr(row.genres)])];
       await db.prepare("UPDATE pbh_authors SET books=?,genres=?,photo=CASE WHEN photo='' THEN ? ELSE photo END,feature=CASE WHEN feature='' THEN ? ELSE feature END,updated_at=datetime('now') WHERE id=?").bind(JSON.stringify(bs),JSON.stringify(gs),row.photo||"",row.feature||"",existingAuthor.id).run();
     }
     if(previous&&previous.author?.toLowerCase()!==name.toLowerCase()){
       const oldAuthor=await db.prepare("SELECT id,books FROM pbh_authors WHERE lower(name)=lower(?) LIMIT 1").bind(previous.author).first();
       if(oldAuthor)await db.prepare("UPDATE pbh_authors SET books=?,updated_at=datetime('now') WHERE id=?").bind(JSON.stringify(parseArr(oldAuthor.books).filter(v=>v!==previous.title)),oldAuthor.id).run();
     }
   }
   if(entity==="authors"&&previous?.name!==row.name){
     await db.prepare("UPDATE pbh_books SET author=?,updated_at=datetime('now') WHERE lower(author)=lower(?)").bind(row.name,previous.name).run();
   }
   return respond({ok:true,id,published:entity==="books"?row.status!=="draft":true});
 }
 return failure("Unknown endpoint",404);
 }catch(e){console.error("Picked by Halcyon API",action,e);return failure("Unable to complete this request. Please retry.",500)}
}