import express from "express";
import type {Application, Request, Response} from "express";
import router from "./routes/index.js";
const app: Application= express();
app.use(express.json());

app.get('/', (req:Request, res:Response)=>{
    res.status(200).send("Toon Wealth API is running")
})

//URL-encoded parser
app.use(express.urlencoded({extended:true}))

app.use('/api', router)

export default app;