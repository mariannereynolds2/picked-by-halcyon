import { db, email } from "hatchable";
export const access = "public";
export const methods = ["POST"];
const TO = "hellojenndepaula@gmail.com";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export default async function(req,res){
  const b=req.body||{};
  const author=String(b.author_name||b.author||"").trim(), address=String(b.email||"").trim(), title=String(b.book_title||b.title||"").trim(), genre=String(b.genre||"").trim(), link=String(b.book_link||"").trim(), website=String(b.website||"").trim(), summary=String(b.book_summary||b.summary||"").trim(), why=String(b.why_fit||"").trim();
  if(!author||!address||!address.includes("@")||!title||!genre||!why) return res.status(400).json({ok:false,error:"Please complete the required fields."});
  const result=await db.query("INSERT INTO book_submissions (author_name,email,book_title,genre,book_link,website,why_fit,book_summary,cover_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",[author,address,title,genre,link||null,website||null,why,summary||null,null]);
  await email.send({to:TO,subject:`New book submission - ${title}`,html:`<h2>New book submission</h2><p><strong>Author:</strong> ${esc(author)}</p><p><strong>Email:</strong> ${esc(address)}</p><p><strong>Book:</strong> ${esc(title)}</p><p><strong>Genre:</strong> ${esc(genre)}</p><p><strong>Book link:</strong> ${esc(link||"Not provided")}</p><p><strong>Website:</strong> ${esc(website||"Not provided")}</p><p><strong>Summary:</strong><br>${esc(summary||"Not provided")}</p><p><strong>Why it fits:</strong><br>${esc(why)}</p>`});
  res.json({ok:true,id:result.rows[0].id});
}