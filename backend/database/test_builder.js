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
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function log(label, res) {
  const icon = res.status >= 200 && res.status < 300 ? "✅" : (res.status === 401 || res.status === 403 || res.status === 400) ? "⚠️" : "❌";
  console.log(`\n${icon} ${label}`);
  console.log(`   Status: ${res.status}`);
  console.log(`   Response: ${JSON.stringify(res.data, null, 2).split("\n").join("\n   ")}`);
}

async function runTests() {
  console.log("================================================");
  console.log("   OWNLY BUILDER API - FULL TEST SUITE");
  console.log("================================================");

  const ts = Date.now();

  // ========== 1. SIGNUP BUILDER ==========
  const builderEmail = `builder_${ts}@ownly.com`;
  const builderSignup = await makeRequest("POST", "/auth/signup", {
    fname: "Rahul", lname: "Sharma",
    email: builderEmail, password: "builder123", role: "BUILDER",
  });
  log("1. SIGNUP Builder", builderSignup);

  // ========== 2. SIGNUP ADMIN ==========
  const adminEmail = `admin_${ts}@ownly.com`;
  const adminSignup = await makeRequest("POST", "/auth/signup", {
    fname: "Admin", lname: "User",
    email: adminEmail, password: "admin123", role: "ADMIN",
  });
  log("2. SIGNUP Admin", adminSignup);

  // ========== 3. LOGIN BUILDER ==========
  const builderLogin = await makeRequest("POST", "/auth/login", {
    email: builderEmail, password: "builder123",
  });
  log("3. LOGIN Builder", builderLogin);
  const builderToken = builderLogin.data.token;
  const builderId = builderLogin.data.user?.id;

  // ========== 4. LOGIN ADMIN ==========
  const adminLogin = await makeRequest("POST", "/auth/login", {
    email: adminEmail, password: "admin123",
  });
  log("4. LOGIN Admin", adminLogin);
  const adminToken = adminLogin.data.token;

  if (!builderToken || !adminToken) {
    console.log("\n❌ Cannot proceed - login failed. Check DB tables.");
    return;
  }

  // ========== 5. BUILDER SUBMITS VERIFICATION ==========
  const verifyRes = await makeRequest("POST", "/builder/verify", {
    company_name: "Sharma Constructions Pvt Ltd",
    rera_number: "RERA-MH-2026-001",
    gst_number: "27AABCS1234F1Z5",
    website: "https://sharmaconstruction.com",
    portfolio_url: "https://sharmaconstruction.com/portfolio",
  }, builderToken);
  log("5. SUBMIT VERIFICATION (Builder)", verifyRes);

  // ========== 6. ADMIN GETS PENDING BUILDERS ==========
  const pendingBuilders = await makeRequest("GET", "/builder/pending/builders", null, adminToken);
  log("6. GET PENDING BUILDERS (Admin)", pendingBuilders);

  // ========== 7. ADMIN APPROVES BUILDER ==========
  const reviewRes = await makeRequest("PATCH", `/builder/review/builder/${builderId}`, {
    status: "VERIFIED",
  }, adminToken);
  log("7. APPROVE BUILDER (Admin)", reviewRes);

  // ========== 8. BUILDER SUBMITS PROJECT ==========
  const projectRes = await makeRequest("POST", "/builder/project/submit", {
    title: "Skyline Towers - Phase 1",
    property_type: "Residential",
    location: "Bandra West, Mumbai",
    description: "Premium 3BHK apartments with sea view",
    total_funding_goal: 50000000,
    total_tokens: 5000,
    token_price: 10000,
    construction_start: "2026-06-01",
    expected_completion: "2028-12-31",
    funding_deadline: "2026-09-30",
  }, builderToken);
  log("8. SUBMIT PROJECT (Verified Builder)", projectRes);
  const projectId = projectRes.data.project?.id;

  // ========== 9. UNVERIFIED BUILDER TRIES PROJECT ==========
  const unvEmail = `unverified_${ts}@ownly.com`;
  await makeRequest("POST", "/auth/signup", {
    fname: "Unverified", lname: "Builder",
    email: unvEmail, password: "test123", role: "BUILDER",
  });
  const unvLogin = await makeRequest("POST", "/auth/login", {
    email: unvEmail, password: "test123",
  });
  const unvProject = await makeRequest("POST", "/builder/project/submit", {
    title: "Should Fail", property_type: "Commercial", location: "Delhi",
    total_funding_goal: 10000000, total_tokens: 1000, token_price: 10000,
  }, unvLogin.data.token);
  log("9. SUBMIT PROJECT (Unverified - should FAIL)", unvProject);

  // ========== 10-13. DOCUMENTS & MILESTONES ==========
  if (projectId) {
    const docRes = await makeRequest("POST", `/builder/project/${projectId}/documents`, {
      document_type: "RERA Certificate",
      document_url: "https://storage.ownly.com/docs/rera-cert.pdf",
    }, builderToken);
    log("10. UPLOAD DOCUMENT", docRes);

    const m1 = await makeRequest("POST", `/builder/project/${projectId}/milestone`, {
      milestone_name: "Foundation Complete",
      description: "Foundation and basement work done",
      funding_percentage: 25, due_date: "2026-12-31",
    }, builderToken);
    log("11. ADD MILESTONE 1 (25%)", m1);

    const m2 = await makeRequest("POST", `/builder/project/${projectId}/milestone`, {
      milestone_name: "Structure Complete",
      description: "RCC structure completed",
      funding_percentage: 35, due_date: "2027-06-30",
    }, builderToken);
    log("12. ADD MILESTONE 2 (35%)", m2);

    const mBad = await makeRequest("POST", `/builder/project/${projectId}/milestone`, {
      milestone_name: "Excessive",
      description: "Should fail - exceeds 100%",
      funding_percentage: 50, due_date: "2028-01-01",
    }, builderToken);
    log("13. ADD MILESTONE EXCEEDING 100% (should FAIL)", mBad);
  }

  // ========== 14. MY PROJECTS ==========
  const myProjects = await makeRequest("GET", "/builder/project/my", null, builderToken);
  log("14. GET MY PROJECTS (Builder)", myProjects);

  // ========== 15. ADMIN PENDING PROJECTS ==========
  const pendingProjects = await makeRequest("GET", "/builder/pending/projects", null, adminToken);
  log("15. GET PENDING PROJECTS (Admin)", pendingProjects);

  // ========== 16. ADMIN APPROVES PROJECT ==========
  if (projectId) {
    const approveRes = await makeRequest("PATCH", `/builder/review/project/${projectId}`, {
      status: "APPROVED",
    }, adminToken);
    log("16. APPROVE PROJECT (Admin)", approveRes);
  }

  // ========== 17. NO TOKEN TEST ==========
  const noAuth = await makeRequest("POST", "/builder/verify", { company_name: "Test" });
  log("17. WITHOUT TOKEN (should get 401)", noAuth);

  // ========== SUMMARY ==========
  console.log("\n================================================");
  console.log("   ALL 17 BUILDER TESTS COMPLETED!");
  console.log("================================================\n");
}

runTests().catch((err) => console.error("Test crashed:", err.message));
