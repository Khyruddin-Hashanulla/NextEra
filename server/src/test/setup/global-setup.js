const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  globalThis.__MONGOINSTANCE__ = mongod;
  process.env.MONGODB_URI = mongod.getUri('nextera_test');
};
