const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'your_google_maps_api_key_here';
const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';
async function testGoogleAPI() {
  console.log('🧪 Testing Google Directions API Connection...');
  const origin = '25.7617,-80.1918'; // Downtown Miami
  const destination = '25.8010,-80.1993'; // Wynwood
  try {
    const params = new URLSearchParams({
      origin,
      destination,
      mode: 'walking',
      alternatives: 'true',
      key: GOOGLE_MAPS_API_KEY
    });
    const response = await fetch(`${DIRECTIONS_URL}?${params}`);
    const data = await response.json();
    console.log('📊 API Response Status:', data.status);
    if (data.status === 'OK') {
      console.log('✅ Google API Working!');
      console.log(`📍 Routes found: ${data.routes.length}`);
      data.routes.forEach((route, index) => {
        const leg = route.legs[0];
        console.log(`   Route ${index + 1}: ${leg.distance.text}, ${leg.duration.text}`);
      });
      return true;
    } else {
      console.log('❌ API Error:', data.error_message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    return false;
  }
}
async function testRouteStrategies() {
  console.log('\n🎯 Testing Route Generation Strategies...');
  const origin = '25.7617,-80.1918';
  const destination = '25.8010,-80.1993';
  const strategies = [
    { name: 'Direct + Alternatives', params: { alternatives: 'true' } },
    { name: 'Morning Time', params: { departure_time: Math.floor(Date.now() / 1000) + 3600 } },
    { name: 'Evening Time', params: { departure_time: Math.floor(Date.now() / 1000) + 8 * 3600 } },
  ];
  for (const strategy of strategies) {
    try {
      console.log(`\n📋 Testing: ${strategy.name}`);
      const params = new URLSearchParams({
        origin,
        destination,
        mode: 'walking',
        key: GOOGLE_MAPS_API_KEY,
        ...strategy.params
      });
      const response = await fetch(`${DIRECTIONS_URL}?${params}`);
      const data = await response.json();
      if (data.status === 'OK') {
        console.log(`   ✅ Success: ${data.routes.length} routes`);
        if (data.routes.length > 0) {
          const leg = data.routes[0].legs[0];
          console.log(`   📏 Distance: ${leg.distance.text}`);
          console.log(`   ⏱️ Duration: ${leg.duration.text}`);
        }
      } else {
        console.log(`   ❌ Failed: ${data.status}`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}
async function runAllTests() {
  console.log('🚀 Starting Route Generation Tests...\n');
  const apiWorks = await testGoogleAPI();
  if (apiWorks) {
    await testRouteStrategies();
    console.log('\n🎉 All tests completed! Ready to implement in React Native.');
  } else {
    console.log('\n❌ Google API not working. Check API key and billing.');
  }
}
runAllTests();