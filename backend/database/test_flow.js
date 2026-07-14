const axios = require("axios");

async function runTest() {
  console.log("🚀 Starting backend authentication & approval flow tests...");

  const BASE_URL = "http://localhost:5000";

  try {
    // 1. Try to register a builder
    console.log("\n1️⃣ Registering builder 'testbuilder@ownly.in'...");
    const signupRes = await axios.post(`${BASE_URL}/auth/signup`, {
      fname: "Test",
      lname: "Builder",
      email: "testbuilder@ownly.in",
      password: "BuilderPassword123!",
      role: "BUILDER",
      company_name: "Ownly Builders Ltd",
      license_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    });
    console.log("✅ Builder registered successfully:", signupRes.data.message);

    // 2. Try to login with the pending builder
    console.log("\n2️⃣ Attempting login as pending builder...");
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: "testbuilder@ownly.in",
        password: "BuilderPassword123!"
      });
      console.log("❌ Error: Login succeeded but should have been blocked because status is PENDING.");
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log("✅ Blocked successfully. Server response:", err.response.data.error);
      } else {
        throw err;
      }
    }

    // 3. Login as Admin
    console.log("\n3️⃣ Logging in as admin 'admin@ownly.in'...");
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@ownly.in",
      password: "Admin@1234"
    });
    const adminToken = adminLoginRes.data.token;
    console.log("✅ Admin login successful. Token acquired.");

    // 4. Retrieve pending builders as Admin
    console.log("\n4️⃣ Retrieving pending builders as Admin...");
    const pendingRes = await axios.get(`${BASE_URL}/builder/pending/builders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pendingBuilders = pendingRes.data.pending_builders;
    console.log(`✅ Found ${pendingBuilders.length} pending builders.`);
    const targetBuilder = pendingBuilders.find(b => b.email === "testbuilder@ownly.in");
    
    if (!targetBuilder) {
      throw new Error("Could not find registered builder in pending list.");
    }
    console.log(`✅ Target builder found (ID: ${targetBuilder.id}, Company: ${targetBuilder.company_name}, License: ${targetBuilder.license_url ? "Present" : "Missing"})`);

    // 5. Approve the builder
    console.log(`\n5️⃣ Approving builder ID ${targetBuilder.id}...`);
    const approveRes = await axios.patch(
      `${BASE_URL}/builder/review/builder/${targetBuilder.id}`,
      { status: "VERIFIED" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log("✅ Builder approved successfully:", approveRes.data.message);

    // 6. Login as approved builder
    console.log("\n6️⃣ Logging in as approved builder...");
    const builderLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "testbuilder@ownly.in",
      password: "BuilderPassword123!"
    });
    console.log("✅ Builder login successful! User role:", builderLoginRes.data.user.role, ", status:", builderLoginRes.data.user.builder_status);

    console.log("\n⭐️ ALL BACKEND FLOW TESTS PASSED SUCCESSFULLY! ⭐️");
    process.exit(0);

  } catch (err) {
    console.error("❌ Test failed:", err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runTest();
