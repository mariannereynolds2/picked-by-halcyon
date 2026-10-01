import { db, config } from "hatchable";
export const access = "public";
export const methods = ["POST"];
const TO="hellojenndepaula@gmail.com";
const FROM="Picked by Halcyon <jenn@support.halcyonliterary.com>";
async function sendEmail(payload){
  const key=await config.get("RESEND_API_KEY");
  const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},body:JSON.stringify(payload)});
  if(!r.ok) throw new Error("Resend "+r.status+": "+await r.text());
  return r.json();
}
export default async function(req,res){
  const b=req.body||{};
  const author_name=String(b.author_name||"").trim(), address=String(b.email||"").trim(), book_title=String(b.book_title||"").trim(), genre=String(b.genre||"").trim(), why_fit=String(b.why_fit||"").trim();
  if(!author_name||!address||!address.includes("@")||!book_title||!genre||!why_fit) return res.status(400).json({ok:false,error:"Please complete the required fields."});
  const book_link=String(b.book_link||"").trim(), website=String(b.website||"").trim(), book_summary=String(b.book_summary||"").trim();
  const result=await db.query("INSERT INTO book_submissions (author_name,email,book_title,genre,book_link,website,why_fit,book_summary,cover_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",[author_name,address,book_title,genre,book_link,website,why_fit,book_summary,null]);
  await sendEmail({from:FROM,to:[TO],reply_to:address,subject:`New book submission — ${book_title}`,html:`<h2>New Picked by Halcyon book submission</h2><p><strong>Author:</strong> ${e(author_name)}<br><strong>Email:</strong> ${e(address)}<br><strong>Book:</strong> ${e(book_title)}<br><strong>Genre:</strong> ${e(genre)}</p>${book_link?`<p><strong>Book link:</strong> ${e(book_link)}</p>`:""}${website?`<p><strong>Author website:</strong> ${e(website)}</p>`:""}${book_summary?`<p><strong>Summary:</strong><br>${e(book_summary)}</p>`:""}<p><strong>Why it fits:</strong><br>${e(why_fit)}</p>`});
  return res.json({ok:true,id:result.rows[0].id});
}
function e(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\\"":"&quot;","'":"&#39;"}[c]));}