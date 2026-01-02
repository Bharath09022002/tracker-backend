const axios = require('axios');

async function testWhatsapp() {
    try {
        console.log("Sending test message...");
        const res = await axios.post('http://localhost:5001/api/whatsapp/send', {
            message: 'Hello from Notion OS! Integration Successful 🚀'
        });
        console.log('Response:', res.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testWhatsapp();
