const TO = "hellojenndepaula@gmail.com";
const FROM = "Picked by Halcyon <jenn@support.halcyonliterary.com>";
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json;charset=UTF-8"}});
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function body(request){
  const type=request.headers.get("content-type")||"";
  if(type.includes("application/json")) return await request.json();
  if(type.includes("form")) return Object.fromEntries((await request.formData()).entries());
  return {};
}
async function send(env,subject,html,replyTo){
  if(!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  const payload={from:FROM,to:[TO],subject,html};
  if(replyTo) payload.reply_to=replyTo;
  const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
  if(!r.ok) throw new Error("Email delivery failed");
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    try{
      if(request.method==="POST"&&url.pathname==="/api/newsletter"){
        const b=await body(request), address=String(b.email||"").trim().toLowerCase();
        if(!address||!address.includes("@")) return json({ok:false,error:"Please enter a valid email."},400);
        await send(env,"New Picked by Halcyon newsletter signup",`<h2>New newsletter signup</h2><p><strong>Email:</strong> ${esc(address)}</p><p>Added: ${new Date().toISOString()}</p>`);
        return json({ok:true,newSubscriber:true});
      }
      if(request.method==="POST"&&url.pathname==="/api/contact"){
        const b=await body(request),name=String(b.name||"").trim(),address=String(b.email||"").trim(),subject=String(b.subject||"").trim(),message=String(b.message||"").trim();
        if(!name||!address||!address.includes("@")||!message) return json({ok:false,error:"Please add your name, email and message."},400);
        await send(env,subject?`New Picked by Halcyon message - ${subject}`:`New Picked by Halcyon message - ${name}`,`<h2>New website message</h2><p><strong>From:</strong> ${esc(name)} &lt;${esc(address)}&gt;</p>${subject?`<p><strong>Subject:</strong> ${esc(subject)}</p>`:""}<p><strong>Message:</strong><br>${esc(message).replace(/\n/g,"<br>")}</p>`,address);
        return json({ok:true});
      }
      if(request.method==="POST"&&url.pathname==="/api/submit-book"){
        const b=await body(request),author=String(b.author_name||b.author||"").trim(),address=String(b.email||"").trim(),title=String(b.book_title||b.title||"").trim(),genre=String(b.genre||"").trim(),link=String(b.book_link||"").trim(),website=String(b.website||"").trim(),summary=String(b.book_summary||b.summary||"").trim(),why=String(b.why_fit||"").trim();
        if(!author||!address||!address.includes("@")||!title||!genre||!why) return json({ok:false,error:"Please complete the required fields."},400);
        await send(env,`New book submission - ${title}`,`<h2>New book submission</h2><p><strong>Author:</strong> ${esc(author)}</p><p><strong>Email:</strong> ${esc(address)}</p><p><strong>Book:</strong> ${esc(title)}</p><p><strong>Genre:</strong> ${esc(genre)}</p><p><strong>Book link:</strong> ${esc(link||"Not provided")}</p><p><strong>Website:</strong> ${esc(website||"Not provided")}</p><p><strong>Summary:</strong><br>${esc(summary||"Not provided")}</p><p><strong>Why it fits:</strong><br>${esc(why)}</p>`,address);
        return json({ok:true});
      }
      if(url.pathname==="/api/metrics") return json({views:100000,readers:10000,genres:8});
      return env.ASSETS.fetch(request);
    }catch(e){return json({ok:false,error:"Something went wrong. Please try again."},500)}
  }
};
