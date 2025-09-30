/**
 * Test BPM API Script
 * 
 * This script tests the BPM API endpoints directly using axios to avoid the Vite redirect
 */

import axios from 'axios';
import fs from 'fs';

// Using the recently generated token
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3ZDA5ZWNiLThhMjItNDEzNy05YTkxLWY3N2MzNTY0Y2I4NSIsInVzZXJuYW1lIjoidGVzdGFkbWluIiwiZW1haWwiOiJ0ZXN0YWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJyb2xlcyI6WyJhZG1pbiIsImFpX2FjY2VzcyIsInN1cGVyX2FkbWluIl0sImNvbXBhbnlJZCI6ImNlYzUyZjUyLTc3ZjEtNGM1My1hNTExLWNkZTY2NWE4ODIxZCIsImZyYW5jaGlzZUlkIjpudWxsLCJpYXQiOjE3NDQwNDM5NTQsImV4cCI6MTc0NDA0NzU1NH0.YB2JjEMefw_AydNEt89fHBeqsqwZ11KK2wrufoyl_1M";

async function testBpmApi() {
  console.log('Using token:', token);
  
  try {
    // Test BPM discovery endpoint
    console.log('\nTesting /api/bpm/discovery endpoint:');
    const discoveryResponse = await axios({
      method: 'GET',
      url: 'http://localhost:5000/api/bpm/discovery',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Don't throw on any status code
    });
    
    console.log('Response status:', discoveryResponse.status);
    console.log('Response headers:', discoveryResponse.headers);
    
    const discoveryData = typeof discoveryResponse.data === 'string' 
      ? discoveryResponse.data 
      : JSON.stringify(discoveryResponse.data);
    
    console.log('Response data type:', typeof discoveryResponse.data);
    console.log('Response data length:', discoveryData.length);
    
    // Check if response is HTML or JSON
    if (typeof discoveryResponse.data === 'string' && discoveryResponse.data.includes('<!DOCTYPE html>')) {
      console.log('Received HTML response instead of JSON. This confirms the Vite middleware is intercepting the request.');
    } else {
      console.log('Response data:', discoveryData.substring(0, 500) + (discoveryData.length > 500 ? '...' : ''));
    }
    
    // Test BPM scheduled jobs endpoint
    console.log('\nTesting /api/bpm/scheduled-jobs endpoint:');
    const jobsResponse = await axios({
      method: 'POST',
      url: 'http://localhost:5000/api/bpm/scheduled-jobs',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: {
        name: "Test Job",
        description: "A test job created by the test script",
        schedule: "0 0 * * *",
        action: "123e4567-e89b-12d3-a456-426614174000",
        configuration: { param1: "value1" },
        isActive: true
      },
      validateStatus: () => true // Don't throw on any status code
    });
    
    console.log('Response status:', jobsResponse.status);
    const jobsData = typeof jobsResponse.data === 'string'
      ? jobsResponse.data
      : JSON.stringify(jobsResponse.data);
    
    console.log('Response data type:', typeof jobsResponse.data);
    console.log('Response data length:', jobsData.length);
    
    if (typeof jobsResponse.data === 'string' && jobsResponse.data.includes('<!DOCTYPE html>')) {
      console.log('Received HTML response instead of JSON. This confirms the Vite middleware is intercepting the request.');
    } else {
      console.log('Response data:', jobsData.substring(0, 500) + (jobsData.length > 500 ? '...' : ''));
    }
    
  } catch (error) {
    console.error('Error testing BPM API:', error);
  }
}

testBpmApi();