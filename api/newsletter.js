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
  const address=String(req.body?.email||"").trim().toLowerCase();
  if(!address||!address.includes("@")) return res.status(400).json({ok:false,error:"Enter a valid email."});
  const result=await db.query("INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING id",[address]);
  if(result.rowCount){
    await sendEmail({from:FROM,to:[TO],subject:"New Picked by Halcyon newsletter signup",html:`<h2>New newsletter signup</h2><p><strong>Email:</strong> ${e(address)}</p><p><strong>Received:</strong> ${new Date().toISOString()}</p>`});
  }
  return res.json({ok:true,alreadySubscribed:!result.rowCount});
}
function e(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\\"":"&quot;","'":"&#39;"}[c]));}