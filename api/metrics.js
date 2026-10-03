export const access = "public";
export const methods = ["GET"];

export default async function(req,res){
  return res.json({views:100000,readers:10000,genres:10});
}