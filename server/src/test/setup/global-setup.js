const { MongoMemoryReplSet } = require('mongodb-memory-server');

module.exports = async () => {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  globalThis.__MONGOINSTANCE__ = replSet;
  process.env.MONGODB_URI = replSet.getUri('nextera_test');
};
