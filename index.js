import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose'
import dotenv from "dotenv"
import cors from "cors"
import user from './Routes/UserRouter.js';

dotenv.config() 

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/SYSTEMWALLETDB')
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB... ' + err.message));

app.use("/api/sw/user",user)


const PORT = process.env.PORT || 7800;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
export default app;