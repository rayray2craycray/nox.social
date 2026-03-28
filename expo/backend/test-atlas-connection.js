/**
 * MongoDB Atlas Connection Test
 * Run this to verify your Atlas connection works
 *
 * Usage: node test-atlas-connection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('\n🔍 Testing MongoDB Atlas Connection...\n');
console.log('Connection String:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

async function testConnection() {
  try {
    console.log('\n⏳ Connecting to MongoDB Atlas...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);

    console.log('✅ Successfully connected to MongoDB Atlas!\n');

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}`);

    // Get connection info
    const { host, port, name } = mongoose.connection;
    console.log(`🌐 Host: ${host}`);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📁 Collections (${collections.length}):`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    // Test write operation
    console.log('\n✍️  Testing write operation...');
    const TestModel = mongoose.model('connectiontest', new mongoose.Schema({
      timestamp: Date,
      test: String
    }));

    await TestModel.create({
      timestamp: new Date(),
      test: 'Atlas connection test'
    });

    console.log('✅ Write operation successful!');

    // Test read operation
    console.log('\n📖 Testing read operation...');
    const doc = await TestModel.findOne().sort({ timestamp: -1 });
    console.log('✅ Read operation successful!');
    console.log('   Last test:', doc.test, 'at', doc.timestamp);

    // Clean up test collection
    await TestModel.deleteMany({});

    // Get database stats
    console.log('\n📈 Database Stats:');
    const stats = await mongoose.connection.db.stats();
    console.log(`   Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Documents: ${stats.objects}`);
    console.log(`   Indexes: ${stats.indexes}`);

    console.log('\n✅ All tests passed! Your Atlas connection is working perfectly.\n');

  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);

    if (error.message.includes('Authentication failed')) {
      console.log('\n💡 Tips:');
      console.log('   1. Check your username and password in .env');
      console.log('   2. Make sure password is URL-encoded if it has special characters');
      console.log('   3. Verify database user has correct permissions');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Tips:');
      console.log('   1. Check your network/firewall settings');
      console.log('   2. Verify IP address is whitelisted in Atlas (0.0.0.0/0 for dev)');
      console.log('   3. Wait a few minutes if cluster was just created');
    } else {
      console.log('\n💡 Check:');
      console.log('   1. Connection string format');
      console.log('   2. Database name in URI');
      console.log('   3. Atlas cluster status');
    }

    console.log('\n');
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed.\n');
    process.exit(0);
  }
}

// Run test
testConnection();
