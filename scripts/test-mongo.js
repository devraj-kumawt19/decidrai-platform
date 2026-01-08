(async () => {
  try {
    const { MongoClient } = require('mongodb');
    const uri = 'mongodb+srv://rajkumawat3905:861916Dev%40@cluster0.rdxynct.mongodb.net/decidrai?retryWrites=true&w=majority&appName=Cluster0';
    const client = new MongoClient(uri, { connectTimeoutMS: 10000 });
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('Connected. Running ping...');
    const res = await client.db('decidrai').admin().ping();
    console.log('Ping response:', res);
    await client.close();
    console.log('Closed connection.');
  } catch (err) {
    console.error('Connection error:');
    console.error(err);
    process.exitCode = 1;
  }
})();
