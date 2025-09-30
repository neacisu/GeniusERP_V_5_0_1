/**
 * Direct PandaDoc API Test
 * 
 * This script tests direct integration with PandaDoc API
 * to troubleshoot the 400 Bad Request errors
 */

import axios from 'axios';

const API_KEY = process.env.PANDADOC_API_KEY;
const PANDADOC_API_URL = 'https://api.pandadoc.com/public/v1';

async function testPandaDocAPI() {
  console.log('🧪 Testing direct PandaDoc API integration...');
  
  try {
    // First test: List templates to verify API key works
    console.log('📃 Testing listTemplates API call...');
    const templatesResponse = await axios.get(`${PANDADOC_API_URL}/templates`, {
      headers: {
        'Authorization': `API-Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Successfully retrieved ${templatesResponse.data.results.length} templates`);
    console.log('First template:', templatesResponse.data.results[0]?.name || 'No templates available');
    
    // Second test: Create a document from a template
    console.log('📄 Testing document creation using a template...');
    try {
      // Get the first template ID
      const templateId = templatesResponse.data.results[0]?.id;
      if (!templateId) {
        console.error('❌ No templates available to use');
        return;
      }
      
      console.log(`📝 Using template ID: ${templateId}`);
      
      // Get template details to find roles
      console.log('🔍 Fetching template details to identify roles...');
      const templateDetailsResponse = await axios.get(
        `${PANDADOC_API_URL}/templates/${templateId}/details`,
        {
          headers: {
            'Authorization': `API-Key ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract roles from template
      const roles = templateDetailsResponse.data.roles || [];
      console.log('Available roles:', roles.length ? roles.map(r => r.name).join(', ') : 'None found');
      
      // Use the first role or fallback to 'Client'
      const roleName = roles.length > 0 ? roles[0].name : 'Client';
      console.log(`Using role: ${roleName}`);
      
      const createDocResponse = await axios.post(
        `${PANDADOC_API_URL}/documents`,
        {
          name: 'Test Document - From Template',
          template_uuid: templateId,
          recipients: [
            {
              email: 'test@example.com',
              first_name: 'Test',
              last_name: 'User',
              role: roleName
            }
          ],
          tokens: {
            "name": "Test Company",
            "amount": "$1000"
          }
        },
        {
          headers: {
            'Authorization': `API-Key ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Document created successfully with ID:', createDocResponse.data.id);
    } catch (docError: any) {
      console.error('❌ Document creation failed:', docError.message);
      if (docError.response) {
        console.error('Response status:', docError.response.status);
        console.error('Response data:', JSON.stringify(docError.response.data, null, 2));
      }
    }
    
  } catch (error: any) {
    console.error('❌ PandaDoc API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testPandaDocAPI().catch(console.error);