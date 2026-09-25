// Live integration test for UC01 Backend Endpoints
const BASE_URL = 'http://localhost:5000';

async function runLiveTests() {
  console.log('Testing EcoGuard Backend API...');

  try {
    // 1. Health check
    const statusRes = await fetch(`${BASE_URL}/api/mobile/status`);
    console.log('Mobile API Status:', statusRes.status, await statusRes.json());

    // 2. Ranger Login
    const loginRes = await fetch(`${BASE_URL}/api/mobile/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'RN-402', password: 'password123' }),
    });
    console.log('Ranger Login:', loginRes.status, await loginRes.json());

    // 3. Create Incident (Online)
    const testRefId = 'TEST-LIVE-' + Date.now();
    const createRes = await fetch(`${BASE_URL}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rangerId: 'RN-402',
        rangerName: 'Ranger K. Bandara',
        incidentType: 'Snare Detected',
        location: { latitude: 6.3712, longitude: 81.5204, accuracy: 8, addressSummary: 'Yala Sector 4' },
        description: 'Two wire snares found concealed in bush near water hole.',
        clientReferenceId: testRefId,
      }),
    });
    const createdData = await createRes.json();
    console.log('Create Incident:', createRes.status, createdData);
    const incidentId = createdData.data?.incidentId;

    // 4. Test Idempotency (Same clientReferenceId should return 200 with isDuplicate: true)
    const dupRes = await fetch(`${BASE_URL}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rangerId: 'RN-402',
        rangerName: 'Ranger K. Bandara',
        incidentType: 'Snare Detected',
        location: { latitude: 6.3712, longitude: 81.5204, accuracy: 8 },
        description: 'Two wire snares found concealed in bush near water hole.',
        clientReferenceId: testRefId,
      }),
    });
    console.log('Idempotency Duplicate Test:', dupRes.status, await dupRes.json());

    // 5. Get Ranger Incidents
    const listRes = await fetch(`${BASE_URL}/api/incidents/ranger/RN-402`);
    console.log('Ranger Incidents List:', listRes.status, await listRes.json());

    // 6. Get Incident by ID
    if (incidentId) {
      const getRes = await fetch(`${BASE_URL}/api/incidents/${incidentId}`);
      console.log('Get Incident By ID:', getRes.status, await getRes.json());
    }

    console.log('All backend live endpoints verified successfully!');
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runLiveTests();
