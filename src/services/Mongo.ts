import { MongoClient } from 'mongodb';

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
}
