const jwt=require('jsonwebtoken'); const User=require('../models/User'); const {jwtSecret}=require('../config/env');
async function auth(req,res,next){ try{ const h=req.headers.authorization||''; if(!h.startsWith('Bearer ')) return res.status(401).json({message:'Authentication required'}); const p=jwt.verify(h.slice(7),jwtSecret); const user=await User.findById(p.sub); if(!user||user.status!=='ACTIVE') return res.status(401).json({message:'Unauthorized'}); req.user=user; next(); }catch(e){return res.status(401).json({message:'Invalid or expired token'});} }
function requireSuperAdmin(req,res,next){ if(req.user?.role!=='SUPER_ADMIN') return res.status(403).json({message:'Super Admin access required'}); next(); }
module.exports={auth,requireSuperAdmin};
