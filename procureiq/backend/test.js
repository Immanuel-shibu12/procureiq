// Comprehensive Backend Verification & Workflow Tests
const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('./server');
const doSeed = require('./seed');

let server;
let baseUrl;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };
    const req = http.request(url, reqOptions, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting ProcureIQ Test Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ ${message}`);
      failed++;
    }
  }

  // 1. Setup in-memory MongoDB & start test server
  let mem;
  try {
    if (mongoose.connection.readyState !== 1) {
      mem = await MongoMemoryServer.create();
      await mongoose.connect(mem.getUri());
    }
    await doSeed();
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`Test server running on ${baseUrl}`);
  } catch (err) {
    console.error('Failed to initialize test environment:', err);
    process.exit(1);
  }

  try {
    // Test 1: Health check
    console.log('\n[1] Health Check');
    const health = await request('/api/health');
    assert(health.status === 200, `Health status is 200 (got ${health.status})`);
    assert(health.data.db === 'connected', `DB state is connected (got ${health.data.db})`);

    // Test 2: Authentication
    console.log('\n[2] Authentication & Role Logins');
    const tokens = {};
    const users = [
      { role: 'admin', email: 'admin@procureiq.com' },
      { role: 'requester', email: 'requester@procureiq.com' },
      { role: 'officer', email: 'officer@procureiq.com' },
      { role: 'approver', email: 'approver@procureiq.com' }
    ];

    for (const u of users) {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: { email: u.email, password: 'Password@123' }
      });
      assert(res.status === 200, `Login successful for ${u.email}`);
      assert(res.data.token && res.data.user.role === u.role, `Token returned with correct role (${u.role})`);
      tokens[u.role] = res.data.token;
    }

    // Invalid login test
    const badLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@procureiq.com', password: 'WrongPassword' }
    });
    assert(badLogin.status === 401, `Invalid password returns 401 (got ${badLogin.status})`);

    // /api/auth/me test
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${tokens.requester}` }
    });
    assert(meRes.status === 200 && meRes.data.email === 'requester@procureiq.com', '/api/auth/me returns current user');

    // Test 3: Dashboard
    console.log('\n[3] Dashboard Statistics');
    const dash = await request('/api/dashboard', {
      headers: { Authorization: `Bearer ${tokens.officer}` }
    });
    assert(dash.status === 200, 'Dashboard returns 200');
    assert(typeof dash.data.totals.requests === 'number', 'Dashboard includes total requests');
    assert(Array.isArray(dash.data.performance), 'Dashboard includes supplier performance');
    assert(Array.isArray(dash.data.risk), 'Dashboard includes risk radar summary');

    // Test 4: Engine & Scoring
    console.log('\n[4] Fit & Risk Scoring Engine');
    const meta = await request('/api/engine/meta', {
      headers: { Authorization: `Bearer ${tokens.officer}` }
    });
    assert(meta.status === 200 && Array.isArray(meta.data.categories), 'Engine metadata returns categories');

    const scoreRes = await request('/api/engine/score', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.officer}` },
      body: { category: 'IT Equipment' }
    });
    assert(scoreRes.status === 200, 'Score calculated successfully for IT Equipment');
    assert(scoreRes.data.rows.length > 0, `Suppliers ranked: found ${scoreRes.data.rows.length} suppliers`);
    assert(scoreRes.data.rows[0].rank === 1, 'Top supplier has rank 1');

    // Invalid weights validation
    const badWeights = await request('/api/engine/score', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.officer}` },
      body: { category: 'IT Equipment', weights: { price: 50, delivery: 50, quality: 10, compliance: 0 } }
    });
    assert(badWeights.status === 400, 'Reject weights not summing to 100%');

    // Test 5: Full Procurement Workflow (A -> B -> C -> D)
    console.log('\n[5] Procurement Lifecycle Workflow (A -> B -> C -> D)');
    // 5A: Requester creates draft
    const createRes = await request('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.requester}` },
      body: {
        itemName: 'High Performance Laptops',
        category: 'IT Equipment',
        quantity: 5,
        unitPrice: 50000,
        requiredDate: new Date(Date.now() + 86400000 * 7),
        justification: 'Hardware upgrade for the engineering development team.'
      }
    });
    assert(createRes.status === 201, 'Requester created new purchase request');
    const reqId = createRes.data._id;
    assert(createRes.data.status === 'draft', 'Initial request status is draft');
    assert(createRes.data.totalCost === 250000, `Calculated totalCost is 250000 (got ${createRes.data.totalCost})`);

    // 5B: Requester submits draft
    const submitRes = await request(`/api/requests/${reqId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.requester}` }
    });
    assert(submitRes.status === 200 && submitRes.data.status === 'submitted', 'Request transitioned to submitted');

    // 5C: Authorization check: Requester cannot review
    const unauthReview = await request(`/api/requests/${reqId}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.requester}` }
    });
    assert(unauthReview.status === 403, 'Requester cannot review requests (HTTP 403)');

    // 5D: Officer starts review
    const reviewRes = await request(`/api/requests/${reqId}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.officer}` },
      body: { note: 'Review started by officer' }
    });
    assert(reviewRes.status === 200 && reviewRes.data.status === 'under_review', 'Officer started review -> under_review');

    // 5E: Approver approves request
    const approveRes = await request(`/api/requests/${reqId}/decision`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.approver}` },
      body: { decision: 'approved', reason: 'Budget verified and approved.' }
    });
    assert(approveRes.status === 200 && approveRes.data.status === 'approved', 'Approver approved request -> approved');

    // 5F: Officer selects supplier & creates PO
    // Find active supplier
    const supList = await request('/api/suppliers', {
      headers: { Authorization: `Bearer ${tokens.officer}` }
    });
    const activeSup = supList.data.find(s => s.status === 'active' && s.categories.includes('IT Equipment'));
    assert(!!activeSup, `Found active supplier: ${activeSup?.name}`);

    const orderRes = await request(`/api/requests/${reqId}/order`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.officer}` },
      body: { supplierId: activeSup._id }
    });
    assert(orderRes.status === 200 && orderRes.data.status === 'ordered', 'Officer created purchase order -> ordered');
    assert(orderRes.data.order && orderRes.data.order.poNumber, `PO created: ${orderRes.data.order?.poNumber}`);

    // 5G: Officer marks delivered
    const deliverRes = await request(`/api/requests/${reqId}/deliver`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.officer}` }
    });
    assert(deliverRes.status === 200 && deliverRes.data.status === 'delivered', 'Officer marked delivered -> delivered');

    // Test 6: Rejection with reason workflow
    console.log('\n[6] Rejection Workflow & Rejection Reason');
    const req2 = await request('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.requester}` },
      body: {
        itemName: 'Luxury Coffee Machine',
        category: 'Office Supplies',
        quantity: 1,
        unitPrice: 85000,
        requiredDate: new Date(Date.now() + 86400000 * 5),
        justification: 'Requested for pantry refreshment.'
      }
    });
    const req2Id = req2.data._id;
    await request(`/api/requests/${req2Id}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.requester}` }
    });
    await request(`/api/requests/${req2Id}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.officer}` }
    });
    // Approver rejects without reason -> should fail
    const rejectNoReason = await request(`/api/requests/${req2Id}/decision`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.approver}` },
      body: { decision: 'rejected', reason: '' }
    });
    assert(rejectNoReason.status === 400, 'Rejection without reason is rejected (HTTP 400)');

    const rejectRes = await request(`/api/requests/${req2Id}/decision`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.approver}` },
      body: { decision: 'rejected', reason: 'Budget cap exceeded for non-essential office supplies.' }
    });
    assert(rejectRes.status === 200 && rejectRes.data.status === 'rejected', 'Request rejected with reason');
    assert(rejectRes.data.rejectionReason === 'Budget cap exceeded for non-essential office supplies.', 'Rejection reason persisted');

    // Test 7: Strict No-Self-Approval Enforcement
    console.log('\n[7] Strict No-Self-Approval & Segregation of Duties');
    // Case 1: Requester directly invokes /decision API
    const requesterBypass = await request(`/api/requests/${reqId}/decision`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.requester}` },
      body: { decision: 'approved', reason: 'Attempting self-approval' }
    });
    assert(requesterBypass.status === 403, 'Requester directly calling decision endpoint is blocked (HTTP 403)');

    // Case 2: Approver raises a requisition and attempts to approve it
    const approverReq = await request('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.approver}` },
      body: {
        itemName: 'Manager Office Tablet',
        category: 'IT Equipment',
        quantity: 1,
        unitPrice: 42000,
        requiredDate: new Date(Date.now() + 86400000 * 3),
        justification: 'Mobile workstation for managerial review workflow.'
      }
    });
    assert(approverReq.status === 201, 'Approver successfully raised department requisition');
    const appReqId = approverReq.data._id;
    await request(`/api/requests/${appReqId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.approver}` }
    });
    await request(`/api/requests/${appReqId}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.officer}` }
    });

    const selfApproveRes = await request(`/api/requests/${appReqId}/decision`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.approver}` },
      body: { decision: 'approved', reason: 'Approving my own request' }
    });
    assert(selfApproveRes.status === 403, 'Approver attempting to approve own request is strictly blocked (HTTP 403)');
    assert(selfApproveRes.data.message === 'You cannot approve or reject your own request', 'Self-approval error message verified');

    // Test 8: Partial Delivery Tracking
    console.log('\n[8] Partial Delivery Tracking & Goods Receipt');
    // Create an ordered request to test partial delivery
    const partReq = await request('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.requester}` },
      body: {
        itemName: 'Bulk Network Switches',
        category: 'IT Equipment',
        quantity: 10,
        unitPrice: 15000,
        requiredDate: new Date(Date.now() + 86400000 * 10),
        justification: 'Data center core network upgrade switches.'
      }
    });
    const pId = partReq.data._id;
    await request(`/api/requests/${pId}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${tokens.requester}` } });
    await request(`/api/requests/${pId}/review`, { method: 'POST', headers: { Authorization: `Bearer ${tokens.officer}` } });
    await request(`/api/requests/${pId}/decision`, { method: 'POST', headers: { Authorization: `Bearer ${tokens.approver}` }, body: { decision: 'approved' } });
    await request(`/api/requests/${pId}/order`, { method: 'POST', headers: { Authorization: `Bearer ${tokens.officer}` }, body: { supplierId: activeSup._id } });

    const partialDeliver = await request(`/api/requests/${pId}/deliver`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.officer}` },
      body: { partial: true, note: 'Received first batch (4 of 10 switches)' }
    });
    assert(partialDeliver.status === 200, 'Partial delivery recorded successfully');
    assert(partialDeliver.data.status === 'ordered', 'Request remains in ordered status for remaining units');
    assert(partialDeliver.data.history.some(h => h.status === 'partial_delivery'), 'Partial delivery recorded in audit log');

    // Test 9: Spend Intelligence & Analytics
    console.log('\n[9] Spend Intelligence & Analytics Verification');
    const intelDash = await request('/api/dashboard', { headers: { Authorization: `Bearer ${tokens.officer}` } });
    assert(intelDash.status === 200, 'Dashboard spend intelligence endpoint returns 200');
    assert(Array.isArray(intelDash.data.spendByCategory), 'Spend by category grouped and returned');
    assert(Array.isArray(intelDash.data.spendBySupplier), 'Spend by supplier grouped and returned');
    assert(Array.isArray(intelDash.data.budgetIndicators), 'Department budget utilization indicators returned');
    assert(typeof intelDash.data.totals.savings === 'number', 'Realized savings computed and returned');
    assert(Array.isArray(intelDash.data.duplicates), 'Duplicate requisition detection operational');

    // Test 10: Fit & Risk Engine Weight Sensitivity & Ranking Impact
    console.log('\n[10] Fit & Risk Engine Weight Sensitivity & Dynamic Re-ranking');
    // Scenario 1: Quality-dominant weighting
    const qualityWeights = { price: 10, delivery: 10, quality: 70, compliance: 10 };
    const qRankRes = await request('/api/engine/score', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.officer}` },
      body: { category: 'IT Equipment', weights: qualityWeights }
    });
    assert(qRankRes.status === 200, 'Score calculated with quality-heavy weighting');
    const topSupplierQuality = qRankRes.data.rows[0];

    // Scenario 2: Price-dominant weighting
    const priceWeights = { price: 70, delivery: 10, quality: 10, compliance: 10 };
    const pRankRes = await request('/api/engine/score', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.officer}` },
      body: { category: 'IT Equipment', weights: priceWeights }
    });
    assert(pRankRes.status === 200, 'Score calculated with price-heavy weighting');
    const topSupplierPrice = pRankRes.data.rows[0];

    assert(
      topSupplierQuality.total !== topSupplierPrice.total,
      `Weight adjustments dynamically modify supplier scores (${topSupplierQuality.total} vs ${topSupplierPrice.total})`
    );

    // Test 11: Cloud ML & BigQuery Analytics Verification (Cloud Rubric)
    console.log('\n[11] Cloud ML & BigQuery Analytics Verification');
    const cloudMlRes = await request('/api/dashboard/cloud-ml', {
      headers: { Authorization: `Bearer ${tokens.officer}` }
    });
    assert(cloudMlRes.status === 200, 'Cloud ML endpoint returns HTTP 200');
    assert(cloudMlRes.data.platform.includes('Google Cloud Platform'), 'GCP Cloud platform identified');
    assert(cloudMlRes.data.dataset.totalRecords === 1200, 'Health procurement clean dataset records verified (1200)');
    assert(cloudMlRes.data.models['Logistic Regression (BigQuery ML Baseline)'] != null, 'BigQuery ML Logistic Regression metrics loaded');
    assert(cloudMlRes.data.models['Gradient Boosted Trees (BigQuery ML Boosted Tree)'] != null, 'BigQuery ML Boosted Tree metrics loaded');
    assert(cloudMlRes.data.lookerStudio.connector === 'Google BigQuery', 'Looker Studio connector configured to BigQuery');

    // Test 12: MediProcure AI Chatbot Verification
    console.log('\n[12] MediProcure AI Chatbot & Gemini API Verification');
    const chatStatus = await request('/api/chat/status');
    assert(chatStatus.status === 200, 'Chat status endpoint returns HTTP 200');
    assert(chatStatus.data.provider === 'Google Gemini', 'Chat provider is Google Gemini');

    const unauthChat = await request('/api/chat', {
      method: 'POST',
      body: { message: 'Show pending requisitions' }
    });
    assert(unauthChat.status === 401, 'Unauthenticated chat request is blocked (HTTP 401)');

    const authChat = await request('/api/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.officer}` },
      body: { message: 'Show pending requisition status' }
    });
    assert(authChat.status === 200, 'Authenticated chat request succeeds (HTTP 200)');
    assert(typeof authChat.data.reply === 'string' && authChat.data.reply.length > 20, 'Chat response contains comprehensive reply text');
    assert(authChat.data.reply.includes('Requisition Status Breakdown'), 'Chat reply is grounded on live requisition data');

    const riskChat = await request('/api/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.officer}` },
      body: { message: 'Which suppliers have high delivery risk?' }
    });
    assert(riskChat.status === 200, 'Supplier risk chat query succeeds (HTTP 200)');
    assert(riskChat.data.reply.includes('Supplier') || riskChat.data.reply.includes('Risk'), 'Chat reply addresses supplier risk and reliability');

  } finally {
    if (server) {
      server.close();
    }
    if (mem) {
      await mongoose.disconnect();
      await mem.stop();
    }
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
