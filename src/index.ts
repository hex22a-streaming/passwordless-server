import express, { Express, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import cors from 'cors';
import Mongo from './services/Mongo';

// import dotenv from 'dotenv';

// dotenv.config();

const app: Express = express();
const mongo = new Mongo();

const port = 3000;

app.use(cors());

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.get('/users', async (req: Request, res: Response) => {
  const username: string = req.query.username as string;
  const userId = await mongo.createUser(username);
  if (userId !== '') {
    const challenge = nanoid(22);
    const publicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'passwordless',
        id: 'localhost',
      },
      user: {
        id: userId,
        displayName: username,
        name: username,
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: {
        requireResidentKey: false,
        userVerification: 'discouraged',
      },
      timeout: 60000,
      attestation: 'direct',
    };
    res.json(publicKeyCredentialCreationOptions);
  } else {
    res.send('User already exists');
  }
});

app.listen(port, async () => {
  await mongo.connect();
  await mongo.seed();
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
