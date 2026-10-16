export async function onRequest({request,env,next,waitUntil}){
 const response=await next();
 try{
  if(request.method!=="GET"||!env.PBH_DB||response.status!==200)return response;
  const url=new URL(request.url),path=url.pathname;
  if(path.startsWith("/api/")||path.startsWith("/admin")||path.startsWith("/cdn-cgi/")||path.startsWith("/images/")||path.startsWith("/fonts/")||path.includes(".."))return response;
  if(!/\/$|\.html$/.test(path))return response;
  const ct=response.headers.get("Content-Type")||"";
  if(!ct.includes("text/html"))return response;
  const ua=(request.headers.get("user-agent")||"").toLowerCase();
  if(/bot|crawl|spider|headless|preview|monitor|facebookexternalhit|whatsapp|googleother/.test(ua))return response;
  waitUntil(env.PBH_DB.prepare("INSERT INTO pbh_visits(date,path,views) VALUES(date('now'),?,1) ON CONFLICT(date,path) DO UPDATE SET views=views+1").bind(path.slice(0,160)).run().catch(e=>console.error("Analytics write failed",e)));
 }catch(e){console.error("Analytics middleware",e)}
 return response;
}