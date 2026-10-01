import { db, email } from "hatchable";
export const access = "public";
export const methods = ["POST"];
const TO = "hellojenndepaula@gmail.com";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export default async function(req,res){
  const address=String(req.body?.email||"").trim().toLowerCase();
  if(!address||!address.includes("@")) return res.status(400).json({ok:false,error:"Please enter a valid email."});
  const result=await db.query("INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING id",[address]);
  if(result.rows.length) await email.send({to:TO,subject:"New Picked by Halcyon newsletter signup",html:`<h2>New newsletter signup</h2><p><strong>Email:</strong> ${esc(address)}</p><p>Added: ${new Date().toISOString()}</p>`});
  res.json({ok:true,newSubscriber:!!result.rows.length});
}