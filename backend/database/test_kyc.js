const http = require("http");

function makeRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (token) options.headers["Authorization"] = `Bearer ${token}`;
    if (data) options.headers["Content-Length"] = Buffer.byteLength(data);

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("=== KYC TESTING ===\n");

  // 1. Login to get token
  console.log("1. Logging in as test@ownly.com...");
  const loginRes = await makeRequest("POST", "/login", {
    email: "test@ownly.com",
    password: "password123",
  });
  console.log(`   Status: ${loginRes.status}`);
  console.log(`   Message: ${loginRes.data.message}`);
  const token = loginRes.data.token;
  console.log(`   Token: ${token.substring(0, 30)}...\n`);

  // 2. Test KYC submit WITHOUT token (should fail)
  console.log("2. Submit KYC WITHOUT token (should fail)...");
  const noTokenRes = await makeRequest("POST", "/kyc/submit", {
    id_proof_type: "AADHAAR",
    id_proof_number: "1234-5678-9012",
  });
  console.log(`   Status: ${noTokenRes.status}`);
  console.log(`   Response: ${JSON.stringify(noTokenRes.data)}\n`);

  // 3. Test KYC submit WITH token (should succeed)
  console.log("3. Submit KYC WITH valid token...");
  const submitRes = await makeRequest(
    "POST",
    "/kyc/submit",
    { id_proof_type: "AADHAAR", id_proof_number: "1234-5678-9012" },
    token
  );
  console.log(`   Status: ${submitRes.status}`);
  console.log(`   Response: ${JSON.stringify(submitRes.data, null, 2)}\n`);

  // 4. Test Admin verify KYC
  const userId = loginRes.data.user.id;
  console.log(`4. Admin verify KYC for user ${userId}...`);
  const verifyRes = await makeRequest(
    "PATCH",
    `/kyc/verify/${userId}`,
    { status: "VERIFIED" },
    token
  );
  console.log(`   Status: ${verifyRes.status}`);
  console.log(`   Response: ${JSON.stringify(verifyRes.data, null, 2)}\n`);

  // 5. Test invalid status
  console.log("5. Verify with invalid status (should fail)...");
  const badStatusRes = await makeRequest(
    "PATCH",
    `/kyc/verify/${userId}`,
    { status: "INVALID" },
    token
  );
  console.log(`   Status: ${badStatusRes.status}`);
  console.log(`   Response: ${JSON.stringify(badStatusRes.data)}\n`);

  console.log("=== ALL TESTS DONE ===");
}

runTests().catch(console.error);
