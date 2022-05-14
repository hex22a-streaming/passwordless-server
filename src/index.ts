import express, { Express, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import cors from 'cors';
import bodyParser from 'body-parser';
import CBOR from 'cbor';
import base64js from 'base64-js';
import Mongo from './services/Mongo';

// import dotenv from 'dotenv';

// dotenv.config();

function bufferDecode(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

function bufferEncode(value: Buffer) {
  return base64js.fromByteArray(value);
}

const app: Express = express();
const mongo = new Mongo();

const port = 3000;

app.use(cors());
bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.post('/users', async (req: Request, res: Response) => {
  const username: string = req.body.username as string;
  const userId = await mongo.createUser(username);
  if (userId !== '') {
    console.log('userId', userId);
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
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -8, type: 'public-key' },
        { alg: -39, type: 'public-key' },
        { alg: -39, type: 'public-key' },
        { alg: -37, type: 'public-key' },
      ],
      authenticatorSelection: {
        requireResidentKey: false,
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'direct',
    };
    res.json(publicKeyCredentialCreationOptions);
  } else {
    res.send('User already exists');
  }
});

app.put('/users', async (req: Request, res: Response) => {
  const username: string = req.body.username as string;
  const { publicKeyCredential } = req.body;

  console.log('username: ', username);
  console.log('publicKeyCredential: ', publicKeyCredential);

  const utf8Decoder = new TextDecoder('utf-8');
  const clientDataBytes = bufferDecode(publicKeyCredential.response.clientDataJSON);
  const decodedClientData = utf8Decoder.decode(clientDataBytes);
  const clientDataObj = JSON.parse(decodedClientData);

  console.log(clientDataObj);

  const attestationObjectBytes = bufferDecode(publicKeyCredential.response.attestationObject);
  const decodedAttestationObject = CBOR.decode(attestationObjectBytes);

  console.log('decodedAttestationObject', decodedAttestationObject);

  const { authData } = decodedAttestationObject;

  // get the length of the credential ID
  const dataView = new DataView(new ArrayBuffer(2));

  const idLenBytes = authData.slice(53, 55);
  idLenBytes.forEach((value: number, index: number) => dataView.setUint8(index, value));

  const credentialIdLength = dataView.getUint16(0);
  console.log(credentialIdLength);

  // get the credential ID
  const credentialId = authData.slice(55, 55 + credentialIdLength);
  console.log(credentialId);

  // get the public key object
  const publicKeyBytes = authData.slice(
    55 + credentialIdLength,
  );

  // the publicKeyBytes are encoded again as CBOR
  const publicKeyObject = CBOR.decode(
    publicKeyBytes.buffer,
  );
  console.log('publicKeyObject', publicKeyObject);

  await mongo.saveCredentials(username, credentialId, publicKeyBytes);

  res.send('OK');
});

app.get('/users', async (req: Request, res: Response) => {
  const username: string = req.query.username as string;
  const user = await mongo.getUser(username);
  if (user) {
    const challenge = nanoid(22);
    const { credentials } = user;
    const id = bufferEncode(credentials.credentialId.buffer);
    const publicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [{
        id,
        type: 'public-key',
      }],
    };
    res.json(publicKeyCredentialRequestOptions);
  } else {
    res.send('ok');
  }
});

app.post('/login', async (req: Request, res: Response) => {
  const {
    signature, userHandle, clientDataJSON, authenticatorData,
  } = req.body;
  console.log(signature);
  console.log(userHandle);
  console.log(clientDataJSON);
  console.log(authenticatorData);

  const user = await mongo.getUserById(userHandle);
  if (user) {
    const { credentials } = user;
    // const publicKey = bufferEncode(credentials.publicKeyBytes.buffer);
    const publicKeyObject = CBOR.decode(
      credentials.publicKeyBytes.buffer,
    );
    console.log('publicKeyObject', publicKeyObject);
  }
  res.send('OK');
});

app.listen(port, async () => {
  await mongo.connect();
  await mongo.seed();
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
