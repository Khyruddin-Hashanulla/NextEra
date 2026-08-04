process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

afterAll(async () => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
