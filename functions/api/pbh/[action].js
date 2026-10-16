const text=v=>String(v??"").trim(),cut=(v,n=250)=>text(v).slice(0,n);
const respond=(obj,status=200,headers={})=>new Response(JSON.stringify(obj),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...headers}});
const failure=(message,status=400)=>respond({ok:false,error:message},status);
const parseArr=v=>{try{return Array.isArray(v)?v:JSON.parse(v||"[]")}catch{return []}};
const safePath=v=>{const s=cut(v,450);return !s||s.startsWith("/")&&!s.startsWith("//")||/^https:\/\//i.test(s)?s:""};
const fields={
 books:["title","author","genres","image","amazon","feature","photo","tag","hook","featured_date","status","sort_index"],
 authors:["name","books","photo","feature","genres","status"],
 team:["name","role","bio","photo","sort_index","visible"]
};
const tables={books:"pbh_books",authors:"pbh_authors",team:"pbh_team"};

const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function sendNotice(env,subject,details,replyTo){
 if(!env.RESEND_API_KEY)return;
 const html="<div style='font-family:Arial,sans-serif;line-height:1.7;color:#2b211d'><h2>"+escapeHTML(subject)+"</h2>"+details.map(([label,value])=>"<p><strong>"+escapeHTML(label)+":</strong> "+escapeHTML(value).replace(/\\n/g,"<br>")+"</p>").join("")+"</div>";
 const payload={from:"Picked by Halcyon <kate@support.halcyonliterary.com>",to:["hello@halcyonliterary.com"],subject,html};
 if(/^\\S+@\\S+\\.\\S+$/.test(replyTo||""))payload.reply_to=replyTo;
 const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify(payload)});
 if(!r.ok)throw new Error("Notification delivery failed: "+r.status);
}
function queueNotice(context,subject,details,replyTo){
 context.waitUntil(sendNotice(context.env,subject,details,replyTo).catch(e=>console.error("Picked notification",e.message)));
}
async function sign(secret,value){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value));
 return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function equal(a,b){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}
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
   const b=ct.includes("multipart/form-data")?Object.fromEntries(await req.formData()):await req.json().catch(()=>({}));
   const author=cut(b.author_name||b.author,160),email=cut(b.email,250),title=cut(b.book_title||b.title,230),genre=cut(b.genre,120),why=cut(b.why_fit,3500);
   if(!author||!title||!why||!genre||!/^\S+@\S+\.\S+$/.test(email))return failure("Complete author, email, book, genre and why it fits.");
   if(b.honeypot||b.website_url)return respond({ok:true});
   await db.prepare("INSERT INTO pbh_submissions(author_name,email,book_title,genre,book_link,website,why_fit,book_summary) VALUES(?,?,?,?,?,?,?,?)").bind(author,email,title,genre,safePath(b.book_link),safePath(b.website),why,cut(b.book_summary||b.summary,7000)).run();
   queueNotice(context,"New Picked by Halcyon book submission — "+title,[["Author",author],["Email",email],["Book",title],["Genre",genre],["Book link",safePath(b.book_link)],["Website",safePath(b.website)],["Why it fits",why],["Book summary",cut(b.book_summary||b.summary,7000)]],email);
   return respond({ok:true});
 }
 if(action==="newsletter"&&method==="POST"){
   const b=await req.json().catch(()=>({})),email=cut(b.email,250).toLowerCase();
   if(!/^\S+@\S+\.\S+$/.test(email))return failure("Enter a valid email address.");
   const r=await db.prepare("INSERT OR IGNORE INTO pbh_newsletter(email) VALUES(?)").bind(email).run();
   if((r.meta?.changes||0)>0)queueNotice(context,"New Picked by Halcyon newsletter signup",[["Email",email]],email);
   return respond({ok:true,newSubscriber:(r.meta?.changes||0)>0});
 }
 if(action==="contact"&&method==="POST"){
   const b=await req.json().catch(()=>({})),name=cut(b.name,160),email=cut(b.email,250),message=cut(b.message,6000);
   if(!name||!message||!/^\S+@\S+\.\S+$/.test(email))return failure("Provide your name, email and message.");
   if(b.honeypot)return respond({ok:true});
   await db.prepare("INSERT INTO pbh_messages(name,email,subject,message) VALUES(?,?,?,?)").bind(name,email,cut(b.subject,250),message).run();
   queueNotice(context,"New Picked by Halcyon message"+(b.subject?" — "+cut(b.subject,80):""),[["Name",name],["Email",email],["Subject",cut(b.subject,250)],["Message",message]],email);
   return respond({ok:true});
 }
 if(action==="login"&&method==="POST"){
   if(!env.PBH_ADMIN_PASSWORD)return failure("Admin login is not configured. Add PBH_ADMIN_PASSWORD as a Cloudflare Pages secret.",503);
   const b=await req.json().catch(()=>({}));
   const ip=req.headers.get("CF-Connecting-IP")||"unknown";
   const lockKey=await sign(env.PBH_ADMIN_PASSWORD,"login:"+ip);
   const attempts=await db.prepare("SELECT failures,updated_at FROM pbh_login_attempts WHERE key=?").bind(lockKey).first();
   if(attempts?.failures>=8&&Date.now()-attempts.updated_at<30*60*1000)return failure("Too many attempts. Try again in 30 minutes.",429);
   const username=cut(b.username,120),password=String(b.password||"");
   const success=equal(username,env.PBH_ADMIN_USERNAME||"admin")&&equal(password,env.PBH_ADMIN_PASSWORD);
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
     else v=cut(v,col==="hook"||col==="bio"?3000:col==="name"||col==="title"?240:500);
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