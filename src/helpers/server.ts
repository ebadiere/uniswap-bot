import express, { Express } from 'express';
import path from 'path';
import http from 'http';
import cors from 'cors';

// SERVER CONFIG
const PORT: number = process.env.PORT || 5000;
const app: Express = express();
const server: http.Server = http.createServer(app).listen(PORT, () => console.log(`Listening on ${PORT}\n`));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({ credentials: true, origin: '*' }));