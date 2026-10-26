const router = require('express').Router();
const { auth, wrap } = require('../middleware/auth');
const { Request, Supplier } = require('../models');

// GET /api/chat/status - Returns whether server has a configured GEMINI_API_KEY
router.get('/status', (req, res) => {
  const hasEnvKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  res.json({
    hasEnvKey,
    provider: 'Google Gemini',
    recommendedModel: 'gemini-1.5-flash',
    features: ['live_mongo_context', 'risk_analysis', 'budget_audit', 'clinical_protocols']
  });
});

// POST /api/chat - Conversational AI grounded on live procurement database
router.post('/', auth, wrap(async (req, res) => {
  const { message, history = [], apiKey } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'Message text is required' });
  }

  const userQuery = message.trim();
  const activeKey = (apiKey && apiKey.trim()) || (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());

  // 1. Gather live procurement context from MongoDB to ground the LLM
  const [allReqs, allSuppliers] = await Promise.all([
    Request.find().populate('order.supplier', 'name').populate('requester', 'name').lean(),
    Supplier.find().lean()
  ]);

  const reqStatusCounts = {
    draft: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    ordered: 0,
    delivered: 0
  };
  let totalCommittedSpend = 0;
  let totalEstimatedSpend = 0;

  allReqs.forEach(r => {
    if (reqStatusCounts[r.status] !== undefined) reqStatusCounts[r.status]++;
    totalEstimatedSpend += (r.totalCost || 0);
    if (['ordered', 'delivered'].includes(r.status)) {
      totalCommittedSpend += (r.order?.value || r.totalCost || 0);
    }
  });

  const highRiskSuppliers = allSuppliers.filter(s =>
    (s.onTimePct !== null && s.onTimePct < 85) ||
    (s.quality !== null && s.quality < 4.0) ||
    (s.delayedDeliveries > 0)
  ).map(s => ({
    name: s.name,
    onTimePct: s.onTimePct,
    quality: s.quality,
    delayedDeliveries: s.delayedDeliveries,
    categories: s.categories
  }));

  const systemPrompt = `You are MediProcure AI, an intelligent clinical hospital procurement and supplier risk advisor for MediProcureIQ (powered by GCP Cloud & MongoDB).
You assist hospital administrators, procurement officers, clinical approvers, and department requesters.

CURRENT LIVE HOSPITAL PROCUREMENT DATA (Ground Truth from MongoDB):
- User asking: "${req.user.name}" (Role: ${req.user.role})
- Requisition Status Breakdown:
  * Draft: ${reqStatusCounts.draft}
  * Submitted (Awaiting Officer Review): ${reqStatusCounts.submitted}
  * Under Review: ${reqStatusCounts.under_review}
  * Approved (Ready for PO creation): ${reqStatusCounts.approved}
  * Ordered (Awaiting Delivery): ${reqStatusCounts.ordered}
  * Delivered: ${reqStatusCounts.delivered}
  * Rejected: ${reqStatusCounts.rejected}
  * Total Requisitions: ${allReqs.length}
- Financial Overview:
  * Total Committed Spend (PO values): ₹${totalCommittedSpend.toLocaleString('en-IN')}
  * Total Estimated Requisition Pipeline: ₹${totalEstimatedSpend.toLocaleString('en-IN')}
- Active Suppliers: ${allSuppliers.length} vendors registered
- High-Risk Suppliers Identified (${highRiskSuppliers.length}):
${highRiskSuppliers.map(s => `  * ${s.name}: On-Time=${s.onTimePct ?? 'N/A'}%, Quality=${s.quality ?? 'N/A'}/5, Delays=${s.delayedDeliveries}`).join('\n') || '  * None currently flagged'}

SYSTEM RULES & GUIDELINES:
1. Always give authoritative, concise, and structured answers using markdown formatting (bullet points, bold text).
2. Directly answer questions referencing the real hospital data provided above when relevant.
3. If discussing supplier risk, advise on mitigation (e.g. secondary vendor allocation, buffer stocks for critical ICU equipment, penalty clauses).
4. Emphasize compliance: Strict segregation of duties (requesters cannot approve their own requests; approvers cannot approve requests they raised).
5. Maintain a professional, crisp, and helpful tone. Keep responses under 250 words unless detailed analysis is explicitly requested.`;

  // 2. If API Key is present, try calling Google Gemini 1.5 Flash API
  if (activeKey) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(activeKey)}`;

      // Format history turns into Gemini contents format
      const formattedContents = [];
      
      // Inject system context into the first user turn or explicit system instruction
      formattedContents.push({
        role: 'user',
        parts: [{ text: `[SYSTEM INSTRUCTIONS & LIVE HOSPITAL DATA]\n${systemPrompt}\n\n[USER INSTRUCTION]\nPlease acknowledge your role as MediProcure AI and prepare to answer.` }]
      });
      formattedContents.push({
        role: 'model',
        parts: [{ text: `Understood. I am MediProcure AI, initialized with live hospital procurement data and risk metrics for MediProcureIQ. How can I assist you today?` }]
      });

      // Add recent conversational history (up to last 6 turns)
      const recentHistory = history.slice(-6);
      for (const turn of recentHistory) {
        if (turn.role && turn.content) {
          formattedContents.push({
            role: turn.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(turn.content) }]
          });
        }
      }

      // Add the latest user message
      formattedContents.push({
        role: 'user',
        parts: [{ text: userQuery }]
      });

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: formattedContents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 800,
            topP: 0.8
          }
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim()) {
          return res.json({
            reply: candidateText.trim(),
            source: 'gemini',
            model: 'gemini-1.5-flash',
            hasCustomKey: !!apiKey
          });
        }
      } else {
        const errBody = await response.text();
        console.warn('Gemini API call returned non-200:', response.status, errBody);
      }
    } catch (apiErr) {
      console.warn('Gemini API request failed or timed out:', apiErr.message);
    }
  }

  // 3. Intelligent Heuristic Domain Engine Fallback (Guaranteed to answer smoothly)
  const fallbackReply = generateDomainProcurementResponse(userQuery, {
    reqStatusCounts,
    totalCommittedSpend,
    totalEstimatedSpend,
    highRiskSuppliers,
    allReqs,
    allSuppliers,
    user: req.user
  });

  return res.json({
    reply: fallbackReply,
    source: 'domain_ai_engine',
    model: 'mediprocure-expert-v1',
    hasKey: !!activeKey,
    apiKeyNeeded: !activeKey,
    tip: !activeKey ? 'Tip: You can connect your Gemini API key in the Chatbot settings (⚙️) for full generative responses.' : null
  });
}));

// Heuristic clinical procurement responses when API key is unavailable or external network is restricted
function generateDomainProcurementResponse(query, ctx) {
  const q = query.toLowerCase();

  if (q.includes('pending') || q.includes('submitted') || q.includes('review') || q.includes('status')) {
    return `### 📋 Current Requisition Status Breakdown

Here is the real-time requisition pipeline from MongoDB:

* **Submitted (Awaiting Officer Review):** ${ctx.reqStatusCounts.submitted} request(s)
* **Under Review:** ${ctx.reqStatusCounts.under_review} request(s)
* **Approved (Ready for Purchase Order):** ${ctx.reqStatusCounts.approved} request(s)
* **Ordered (In Delivery):** ${ctx.reqStatusCounts.ordered} request(s)
* **Delivered:** ${ctx.reqStatusCounts.delivered} request(s)
* **Rejected:** ${ctx.reqStatusCounts.rejected} request(s)

**Total Requisitions Managed:** ${ctx.allReqs.length}
**Total Active Committed Spend:** ₹${ctx.totalCommittedSpend.toLocaleString('en-IN')}

${ctx.reqStatusCounts.submitted > 0 ? `⚠️ **Action Recommended:** ${ctx.reqStatusCounts.submitted} requisition(s) require review from a Procurement Officer.` : '✅ All incoming requests are currently up to date.'}`;
  }

  if (q.includes('risk') || q.includes('supplier') || q.includes('vendor') || q.includes('delay')) {
    if (ctx.highRiskSuppliers.length === 0) {
      return `### 🛡️ Supplier Risk Evaluation
All **${ctx.allSuppliers.length} active suppliers** currently meet hospital compliance criteria (on-time delivery > 85%, quality rating > 4.0/5.0, zero unresolved delays).

**Recommendation:** Maintain standard multi-sourcing contracts and conduct quarterly compliance audits for critical medical items.`;
    }

    const list = ctx.highRiskSuppliers.map(s => 
      `* **${s.name}** — On-Time: **${s.onTimePct ?? 'N/A'}%**, Quality: **${s.quality ?? 'N/A'}/5**, Historical Delays: **${s.delayedDeliveries}**`
    ).join('\n');

    return `### ⚠️ High-Risk Supplier Intelligence Alert
Found **${ctx.highRiskSuppliers.length} supplier(s)** requiring risk mitigation:

${list}

**Clinical Risk Mitigation Protocols:**
1. **Secondary Sourcing:** Shift 30-40% volume of critical supplies to pre-qualified backup vendors.
2. **Buffer Inventory:** Increase safety stock of critical hospital categories by 14 days.
3. **Fit & Risk Engine:** Run the What-If simulation with higher *Delivery* and *Compliance* weightings before awarding new POs.`;
  }

  if (q.includes('budget') || q.includes('spend') || q.includes('saving') || q.includes('cost')) {
    return `### 💰 Spend & Budget Intelligence
* **Committed PO Value:** ₹${ctx.totalCommittedSpend.toLocaleString('en-IN')}
* **Total Estimated Pipeline:** ₹${ctx.totalEstimatedSpend.toLocaleString('en-IN')}
* **Registered Suppliers:** ${ctx.allSuppliers.length}

**Savings & Compliance Tips:**
* Review category-level budget indicators on the **Dashboard** to prevent over-allocation.
* The system enforces automated duplicate requisition detection to prevent redundant hospital orders.`;
  }

  if (q.includes('emergency') || q.includes('icu') || q.includes('urgent') || q.includes('oxygen') || q.includes('critical')) {
    return `### 🚨 Hospital Emergency Procurement Protocol
For urgent clinical requisitions (ICU consumables, emergency surgical items, oxygen regulators):

1. **Expedited Requisition:** Submit request with justification starting with **"EMERGENCY:"** and set the required date to within 24 hours.
2. **Fast-Track Review:** Department approvers and procurement officers receive priority alerts.
3. **Safety Stock Fallback:** Utilize pre-approved emergency vendor agreements under the *Fit & Risk Engine* with immediate spot-order PO generation.
4. **Segregation of Duties:** Even for emergencies, the strict audit log requires officer creation and approver sign-off to ensure NABH/JCI hospital compliance.`;
  }

  if (q.includes('ml') || q.includes('bigquery') || q.includes('cloud') || q.includes('predict')) {
    return `### ☁️ GCP Cloud ML & BigQuery Intelligence
MediProcureIQ integrates with Google Cloud Platform for predictive analytics:

* **Cloud Storage (GCS):** Ingests raw multi-source hospital supply records.
* **BigQuery ML:** Evaluates supplier delivery delay probabilities and defect risk using **Logistic Regression** and **Boosted Trees**.
* **Metrics:** Evaluates Accuracy, Precision, Recall, F1-Score, and ROC-AUC.
* **Looker Studio:** Interactive embedded dashboard for real-time executive reporting.

Visit the **Cloud ML & Analytics** tab in the navigation bar to inspect live model comparison curves and dataset metrics!`;
  }

  // Default helpful response
  return `### 🩺 MediProcure AI Assistant
Hello **${ctx.user.name}**! I am your hospital procurement and supplier intelligence assistant.

Here is what I can assist you with right now:
* 📋 **Requisitions:** Inquire about pending approvals, order fulfillment, or audit trails.
* ⚠️ **Risk Radar:** Check supplier reliability scores, delivery delays, and quality metrics.
* 💰 **Financials:** Review category spend, budget utilization, and realized savings.
* 🚨 **Clinical Protocols:** Standard operating procedures for emergency ICU stock and regulatory compliance.
* ☁️ **GCP Cloud ML:** Supplier delay probability models and BigQuery analytics.

*Try asking: "Which suppliers have high risk?" or "Show pending requisition summary"*`;
}

module.exports = router;
