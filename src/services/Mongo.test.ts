import {
  Document, MongoClient as MockMongoClient, ObjectId, WithId,
} from 'mongodb';
import Mongo, { uri, dbName, usersCollection } from './Mongo';

jest.mock('mongodb');

describe('Mongo', () => {
  test('constructor', () => {
    // Arrange
    const expectedUri = uri;

    // Act
    const actualMongo = new Mongo();

    // Assert
    expect(MockMongoClient).toBeCalledWith(expectedUri);
    expect(actualMongo.client).toBeInstanceOf(MockMongoClient);
  });
  describe('connect', () => {
    test('succesful connection', async () => {
      // Arrange
      const mongo = new Mongo();
      const expectedDbName: string = 'admin';
      const expectedCommand = { ping: 1 };
      const mockCommand = jest.fn();
      mongo.client.db = jest
        .fn()
        .mockReturnValue({ command: mockCommand });

      // Act
      await mongo.connect();

      // Assert
      expect(mongo.client.connect).toBeCalled();
      expect(mongo.client.db).toBeCalledWith(expectedDbName);
      expect(mockCommand).toBeCalledWith(expectedCommand);
    });
    test('connect throws exception', async () => {
      // Arrange
      const mongo = new Mongo();
      mongo.client.connect = jest.fn(() => {
        throw new Error();
      });

      // Act
      await mongo.connect();

      // Assert
      expect(mongo.client.connect).toBeCalled();
      expect(mongo.client.close).toBeCalled();
    });
  });
  describe('seed', () => {
    test('succesfull seed', async () => {
      // Arrange
      const mongo = new Mongo();
      const expectedDbName = dbName;
      const expectedCollectionName = usersCollection;
      const expectedIndexSpec = { name: 1 };
      const expectedIndexSpecOption = { unique: true };
      const mockCreateIndex = jest.fn();
      const mockCreateCollection = jest
        .fn()
        .mockReturnValue({ createIndex: mockCreateIndex });
      mongo.client.db = jest
        .fn()
        .mockReturnValue({ createCollection: mockCreateCollection });

      // Act
      await mongo.seed();

      // Assert
      expect(mongo.client.db).toBeCalledWith(expectedDbName);
      expect(mockCreateCollection).toBeCalledWith(expectedCollectionName);
      expect(mockCreateIndex).toBeCalledWith(expectedIndexSpec, expectedIndexSpecOption);
    });
  });
  describe('createUser', () => {
    test('happy path', async () => {
      // Arrange
      const mongo = new Mongo();
      const expectedDbName = dbName;
      const expectedCollectionName = usersCollection;
      const expectedUserName = 'username';
      const expectedUserId = '1';
      const expectedDocument = {
        displayName: expectedUserName,
        name: expectedUserName,
      };
      const mockToString = jest
        .fn()
        .mockReturnValue(expectedUserId);
      const mockInsertOne = jest.fn(async () => ({
        insertedId: {
          toString: mockToString,
        },
      }));
      const mockCollection = jest
        .fn()
        .mockReturnValue({ insertOne: mockInsertOne });
      mongo.client.db = jest
        .fn()
        .mockReturnValue({ collection: mockCollection });

      // Act
      const actualUserId = await mongo.createUser(expectedUserName);

      // Assert
      expect(mongo.client.db).toBeCalledWith(expectedDbName);
      expect(mockCollection).toBeCalledWith(expectedCollectionName);
      expect(mockInsertOne).toBeCalledWith(expectedDocument);
      expect(actualUserId).toEqual(expectedUserId);
    });
    test('insertOne throws exception', async () => {
      // Arrange
      const mongo = new Mongo();
      const expectedDbName = dbName;
      const expectedCollectionName = usersCollection;
      const expectedUserName = 'username';
      const expectedDocument = {
        displayName: expectedUserName,
        name: expectedUserName,
      };
      const expectedUserId = '';
      const mockInsertOne = jest.fn(async () => {
        throw new Error('InsertOne exception');
      });
      const mockCollection = jest
        .fn()
        .mockReturnValue({ insertOne: mockInsertOne });
      mongo.client.db = jest
        .fn()
        .mockReturnValue({ collection: mockCollection });

      // Act
      const actualUserId = await mongo.createUser(expectedUserName);

      // Assert
      expect(mongo.client.db).toBeCalledWith(expectedDbName);
      expect(mockCollection).toBeCalledWith(expectedCollectionName);
      expect(mockInsertOne).toBeCalledWith(expectedDocument);
      expect(actualUserId).toEqual(expectedUserId);
    });
  });
  describe('getUser', () => {
    test('happy path', async () => {
      // Assert
      const mongo = new Mongo();
      const expectedDbName = dbName;
      const expectedCollectionName = usersCollection;
      const expectedUserName = 'username';
      const expectedUser: WithId<Document> = {
        _id: new ObjectId('1'),
        displayName: expectedUserName,
        name: expectedUserName,
      };
      const expectedFilter = { displayName: expectedUserName };
      const mockFindOne = jest.fn(async () => expectedUser);
      const mockCollection = jest
        .fn()
        .mockReturnValue({ findOne: mockFindOne });
      mongo.client.db = jest
        .fn()
        .mockReturnValue({ collection: mockCollection });

      // Act
      const actualUser: WithId<Document> | null = await mongo.getUser(expectedUserName);

      // Arrange
      expect(mongo.client.db).toBeCalledWith(expectedDbName);
      expect(mockCollection).toBeCalledWith(expectedCollectionName);
      expect(mockFindOne).toBeCalledWith(expectedFilter);
      expect(actualUser).toEqual(expectedUser);
    });
    test('findOne throws exception', async () => {
      // Assert
      const mongo = new Mongo();
      const expectedDbName = dbName;
      const expectedCollectionName = usersCollection;
      const expectedUserName = 'username';
      const expectedUser = null;
      const expectedFilter = { displayName: expectedUserName };
      const mockFindOne = jest.fn(async () => expectedUser);
      const mockCollection = jest
        .fn()
        .mockReturnValue({ findOne: mockFindOne });
      mongo.client.db = jest
        .fn()
        .mockReturnValue({ collection: mockCollection });

      // Act
      const actualUser: WithId<Document> | null = await mongo.getUser(expectedUserName);

      // Arrange
      expect(mongo.client.db).toBeCalledWith(expectedDbName);
      expect(mockCollection).toBeCalledWith(expectedCollectionName);
      expect(mockFindOne).toBeCalledWith(expectedFilter);
      expect(actualUser).toEqual(expectedUser);
    });
  });
  describe('getUserById', () => {
    test('happy path', async () => {
      // Assert
      const mongo = new Mongo();
      const expectedDbName = dbName;
      const expectedCollectionName = usersCollection;
      const expectedUserName = 'username';
      const expectedUserId = '1';
      const expectedUser: WithId<Document> = {
        _id: new ObjectId(expectedUserId),
        displayName: expectedUserName,
        name: expectedUserName,
      };
      // const expectedFilter = { _id: new ObjectId(expectedUserId) };
      const mockFindOne = jest.fn(async () => expectedUser);
      const mockCollection = jest
        .fn()
        .mockReturnValue({ findOne: mockFindOne });
      mongo.client.db = jest
        .fn()
        .mockReturnValue({ collection: mockCollection });

      // Act
      const actualUser: WithId<Document> | null = await mongo.getUserById(expectedUserId);

      // Arrange
      expect(mongo.client.db).toBeCalledWith(expectedDbName);
      expect(mockCollection).toBeCalledWith(expectedCollectionName);
      // expect(mockFindOne).toBeCalledWith(expectedFilter);
      expect(actualUser).toEqual(expectedUser);
    });
    test('findOne throws exception', async () => {
      // Assert
      const mongo = new Mongo();
      const expectedDbName = dbName;
      const expectedCollectionName = usersCollection;
      const expectedUserId = '1';
      const expectedUser = null;
      // const expectedFilter = { _id: new ObjectId(expectedUserId) };
      const mockFindOne = jest.fn(async () => expectedUser);
      const mockCollection = jest
        .fn()
        .mockReturnValue({ findOne: mockFindOne });
      mongo.client.db = jest
        .fn()
        .mockReturnValue({ collection: mockCollection });

      // Act
      const actualUser: WithId<Document> | null = await mongo.getUserById(expectedUserId);

      // Arrange
      expect(mongo.client.db).toBeCalledWith(expectedDbName);
      expect(mockCollection).toBeCalledWith(expectedCollectionName);
      // expect(mockFindOne).toBeCalledWith(expectedFilter);
      expect(actualUser).toEqual(expectedUser);
    });
  });
});
