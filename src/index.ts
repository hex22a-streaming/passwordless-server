import express, { Express, Request, Response } from 'express';
import Mongo from './services/Mongo';
// import dotenv from 'dotenv';

// dotenv.config();

const app: Express = express();
const mongo = new Mongo();

const port = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.get('/users', async (req: Request, res: Response) => {
  const username: string = req.query.username as string;
  console.log(username);
  await mongo.createUser(username);
  res.send('User created');
});

app.listen(port, async () => {
  await mongo.connect();
  await mongo.seed();
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
