// Simple local testing script
const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:5001/reelsmanager-50367/us-central1/webhook';
const YOUR_CHAT_ID = 7796115316; // Your Telegram user ID

// Test /start command
async function testStart() {
  console.log('Testing /start command...');
  
  const payload = {
    message: {
      message_id: 1,
      chat: { id: YOUR_CHAT_ID, type: 'private' },
      from: { id: YOUR_CHAT_ID, first_name: 'Hamza', last_name: 'Diaz' },
      text: '/start',
      date: Math.floor(Date.now() / 1000)
    }
  };

  try {
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ /start test:', response.status);
  } catch (error) {
    console.error('❌ /start test failed:', error.message);
  }
}

// Test caption generation
async function testCaption() {
  console.log('Testing caption generation...');
  
  const payload = {
    message: {
      message_id: 2,
      chat: { id: YOUR_CHAT_ID, type: 'private' },
      from: { id: YOUR_CHAT_ID, first_name: 'Hamza', last_name: 'Diaz' },
      text: '/caption Amazing sunset at the beach today',
      date: Math.floor(Date.now() / 1000)
    }
  };

  try {
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Caption test:', response.status);
  } catch (error) {
    console.error('❌ Caption test failed:', error.message);
  }
}

// Test reels download
async function testReelsDownload() {
  console.log('Testing reels download...');
  
  const payload = {
    message: {
      message_id: 3,
      chat: { id: YOUR_CHAT_ID, type: 'private' },
      from: { id: YOUR_CHAT_ID, first_name: 'Hamza', last_name: 'Diaz' },
      text: 'https://www.instagram.com/reel/C1234567890/',
      date: Math.floor(Date.now() / 1000)
    }
  };

  try {
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Reels download test:', response.status);
  } catch (error) {
    console.error('❌ Reels download test failed:', error.message);
  }
}

// Test health endpoint
async function testHealth() {
  console.log('Testing health endpoint...');
  
  try {
    const response = await axios.get('http://localhost:5001/reelsmanager-50367/us-central1/health');
    console.log('✅ Health check:', response.data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting local tests...\n');
  
  await testHealth();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testStart();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testCaption();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testReelsDownload();
  
  console.log('\n✅ All tests completed!');
}

runTests().catch(console.error);
