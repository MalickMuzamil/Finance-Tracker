const express=require('express');const cors=require('cors');const morgan=require('morgan');const connectDB=require('./config/db');const {port,clientUrl}=require('./config/env');const routes=require('./routes');const errorHandler=require('./middleware/error');
const app=express();app.use(cors({origin:clientUrl}));app.use(express.json());app.use(morgan('dev'));app.get('/api/health',(req,res)=>res.json({ok:true}));app.use('/api',routes);app.use(errorHandler);
connectDB().then(()=>app.listen(port,()=>console.log(`API running on ${port}`))).catch(e=>{console.error(e);process.exit(1)});
