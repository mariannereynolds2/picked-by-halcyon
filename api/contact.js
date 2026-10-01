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
  const b=req.body||{}, name=String(b.name||"").trim(), address=String(b.email||"").trim(), subject=String(b.subject||"").trim(), message=String(b.message||"").trim();
  if(!name||!address||!address.includes("@")||!message) return res.status(400).json({ok:false,error:"Please add your name, email and message."});
  const result=await db.query("INSERT INTO contact_messages (name,email,subject,message) VALUES ($1,$2,$3,$4) RETURNING id",[name,address,subject,message]);
  await sendEmail({from:FROM,to:[TO],reply_to:address,subject:subject?`New Picked by Halcyon message — ${subject}`:`New Picked by Halcyon message — ${name}`,html:`<h2>New website message</h2><p><strong>From:</strong> ${e(name)} &lt;${e(address)}&gt;</p>${subject?`<p><strong>Subject:</strong> ${e(subject)}</p>`:""}<p><strong>Message:</strong><br>${e(message).replace(/\\n/g,"<br>")}</p>`});
  return res.json({ok:true,id:result.rows[0].id});
}
function e(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\\"":"&quot;","'":"&#39;"}[c]));}