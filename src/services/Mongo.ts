import {Document, MongoClient, ObjectId, WithId} from 'mongodb';
import * as Buffer from 'buffer';

const dbName = 'passwordless';
const usersCollection = 'users';

export default class Mongo {
  private client: MongoClient;

  constructor() {
    const uri = 'mongodb://root:example@localhost:27017/?authMechanism=DEFAULT';
    this.client = new MongoClient(uri);
  }

  async connect() {
    try {
      await this.client.connect();
      await this.client.db('admin').command({ ping: 1 });
      console.log('Connected successfully to server');
    } catch (error) {
      console.error(error);
      await this.client.close();
    }
  }

  async seed() {
    const database = await this.client.db(dbName);
    try {
      const collection = await database.createCollection(usersCollection);
      await collection.createIndex({ name: 1 }, { unique: true });
    } catch (error) {
      console.error(error);
    } finally {
      console.log('db created');
    }
  }

  async createUser(username: string): Promise<string> {
    const collection = await this.client.db(dbName).collection(usersCollection);
    try {
      const result = await collection.insertOne({
        displayName: username,
        name: username,
      });
      return result.insertedId.toString();
    } catch (error) {
      console.error(error);
    }
    return '';
  }

  async saveCredentials(username: string, credentialId: Buffer, publicKeyBytes: Buffer) {
    console.log(username);
    const collection = await this.client.db(dbName).collection(usersCollection);
    try {
      const result = await collection.findOneAndUpdate(
        { displayName: username },
        {
          $set: {
            credentials: {
              credentialId,
              publicKeyBytes,
            },
          },
        },
      );
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }

  async getUser(username: string): Promise<WithId<Document> | null> {
    const collection = await this.client.db(dbName).collection(usersCollection);
    try {
      const result = await collection.findOne({ displayName: username });
      // eslint-disable-next-line no-underscore-dangle
      return result;
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  async getUserById(id: string): Promise<WithId<Document> | null> {
    const collection = await this.client.db(dbName).collection(usersCollection);
    try {
      const result = await collection.findOne({ _id: new ObjectId(id) });
      return result;
    } catch (error) {
      console.error(error);
    }
    return null;
  }
}
