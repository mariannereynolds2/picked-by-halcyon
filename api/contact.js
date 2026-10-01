import { db, email } from "hatchable";
export const access = "public";
export const methods = ["POST"];
const TO = "hellojenndepaula@gmail.com";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export default async function(req,res){
  const b=req.body||{}, name=String(b.name||"").trim(), address=String(b.email||"").trim(), subject=String(b.subject||"").trim(), message=String(b.message||"").trim();
  if(!name||!address||!address.includes("@")||!message) return res.status(400).json({ok:false,error:"Please add your name, email and message."});
  const result=await db.query("INSERT INTO contact_messages (name,email,subject,message) VALUES ($1,$2,$3,$4) RETURNING id",[name,address,subject,message]);
  await email.send({to:TO,subject:subject?`New Picked by Halcyon message - ${subject}`:`New Picked by Halcyon message - ${name}`,html:`<h2>New website message</h2><p><strong>From:</strong> ${esc(name)} &lt;${esc(address)}&gt;</p>${subject?`<p><strong>Subject:</strong> ${esc(subject)}</p>`:""}<p><strong>Message:</strong><br>${esc(message).replace(/\n/g,"<br>")}</p>`});
  res.json({ok:true,id:result.rows[0].id});
}