import express from 'express';
import jwt from 'jsonwebtoken';
import sql from 'better-sqlite3';
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT;
const KEY = process.env.JWT_KEY;

const db = new sql('database.db');

app.listen(PORT, () => {
	console.log(`Listening at http://localhost:${PORT}`);
});