module.exports = async () => {
  const mongod = globalThis.__MONGOINSTANCE__;
  if (mongod) {
    await mongod.stop();
  }
};
