// Quick Script to Update Hiking Trails in Browser Console
// Copy and paste this entire script into your browser console

(function() {
  console.log('🏔️ Starting Hiking Trails Update...\n');

  // Get current hikes from localStorage
  let hikes = JSON.parse(localStorage.getItem('hikes') || '[]');
  console.log('📊 Current trails count:', hikes.length);
  console.log('Current trails:', hikes.map(h => `ID: ${h.id}, Name: ${h.name}`));
  
  // Step 1: Delete trail with ID 111
  const beforeDelete = hikes.length;
  hikes = hikes.filter(h => h.id !== 111);
  const deletedCount = beforeDelete - hikes.length;
  
  if (deletedCount > 0) {
    console.log('✅ Deleted trail with ID 111');
  } else {
    console.log('ℹ️  Trail with ID 111 not found (may not exist)');
  }

  // Step 2: Add new trails
  const newTrails = [
    {
      id: 4,
      name: "Yarra Bend River Walk",
      location: "Fairfield",
      difficulty: "Intermediate",
      distance_km: 6.8,
      elevation_m: 120,
      date: "2025-10-18",
      time: "09:00",
      capacity: 18,
      registered: 7
    },
    {
      id: 5,
      name: "Great Ocean Walk Trail",
      location: "Apollo Bay",
      difficulty: "Advanced",
      distance_km: 12.5,
      elevation_m: 450,
      date: "2025-10-25",
      time: "07:30",
      capacity: 30,
      registered: 22
    }
  ];

  let addedCount = 0;
  newTrails.forEach(trail => {
    if (!hikes.find(h => h.id === trail.id)) {
      hikes.push(trail);
      addedCount++;
      console.log(`✅ Added: ${trail.name} (ID: ${trail.id})`);
    } else {
      console.log(`ℹ️  Trail ${trail.name} already exists`);
    }
  });

  // Step 3: Save to localStorage
  localStorage.setItem('hikes', JSON.stringify(hikes));
  
  console.log('\n📈 Update Summary:');
  console.log('  - Trails deleted:', deletedCount);
  console.log('  - Trails added:', addedCount);
  console.log('  - Total trails now:', hikes.length);
  console.log('\n🎉 Update complete!');
  console.log('🔄 Reloading page in 2 seconds...\n');

  // Show final data
  console.log('📋 Final trails list:');
  hikes.forEach(h => {
    console.log(`  ${h.id}. ${h.name} (${h.location}) - ${h.difficulty}`);
  });

  // Reload page after 2 seconds
  setTimeout(() => {
    location.reload();
  }, 2000);
})();
