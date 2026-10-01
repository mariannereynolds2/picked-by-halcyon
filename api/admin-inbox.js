import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET"];

export default async function(req,res){
  const [subs,books,msgs]=await Promise.all([
    db.query("SELECT id,email,created_at FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 250"),
    db.query("SELECT id,author_name,email,book_title,genre,book_link,website,why_fit,book_summary,cover_url,created_at FROM book_submissions ORDER BY created_at DESC LIMIT 250"),
    db.query("SELECT id,name,email,subject,message,created_at FROM contact_messages ORDER BY created_at DESC LIMIT 250")
  ]);
  return res.json({ok:true,newsletter:subs.rows,submissions:books.rows,messages:msgs.rows});
}