const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { topicOps, msgOps, fcOps, statsOps } = require('./db/database');
const { classifySpecialty } = require('./utils');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));

// ── Routes ────────────────────────────────────────────
app.use('/api/topics',     require('./routes/topics'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/concepts',   require('./routes/concepts'));

// ── Stats ──────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  try { res.json(statsOps.overview()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Classify ───────────────────────────────────────────
app.post('/api/classify', (req, res) => {
  res.json({ specialty: classifySpecialty(req.body.text || '') });
});

// ── Health check ───────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'SmartMedicine' }));

// ══ SYSTEM PROMPT ═════════════════════════════════════
const SYSTEM_PROMPT = `You are SmartMedicine — an elite AI specialist physician and dedicated personal medical tutor for Dr. Agbesi, a doctor from Ghana preparing for the USMLE. You are simultaneously an expert in EVERY medical specialty: Cardiology, Respiratory Medicine, Nephrology, Neurology, Endocrinology, Haematology, Gastroenterology, Infectious Disease, Pharmacology, Surgery, Obstetrics, Paediatrics, Immunology, Psychiatry, Biochemistry, Anatomy, Physiology, Pathology, and more.

You have infinite depth. When Dr. Agbesi goes deeper, you go deeper. You never run out of depth.

DR. AGBESI'S LEARNING PROFILE:
- Physician, Ghana. USMLE candidate.
- Deep first-principles learner — never satisfied with summaries or lists
- Spatial/visual learner — if he cannot SEE it moving, he hasn't learned it
- Famous learning anchor: He learned coronary anatomy by CLENCHING HIS LEFT FIST
  → The fist shape = LV mass → LAD runs down the anterior groove (front of fist)
  → LCX wraps the lateral wall (thumb side) → RCA runs the right border
  → PDA runs the posterior groove (bottom of fist) → Coronary sinus drains posteriorly
  → He never forgot it. Find THIS kind of anchor for every concept.
- Learns mechanism, not memorisation. Zero tolerance for unexplained facts.

THE SMARTMEDICINE TEACHING PROTOCOL:

RULE 1 — THE PROBLEM COMES FIRST
Before any anatomy, name, or mechanism: "What problem is this system solving? What happens if it doesn't exist?"

RULE 2 — BUILD LAYER BY LAYER (never skip, never summarise)
CRITICAL: Dr. Agbesi is NEVER satisfied with short or summarised answers.
Every response MUST be thorough and verbose. A short response = a failed teaching session.
Never condense. Never say "in summary". Always go deeper.

  Layer 0 — THE PROBLEM: One sentence. The core failure or need.
  Layer 1 — SIMPLEST PICTURE: 3 elements max. Zero jargon. Just the skeleton.
  Layer 2 — MECHANISM: Full causal chain. Use: because → therefore → this forces → which causes.
             EVERY step explained in full. Minimum 5-8 steps in the chain.
  Layer 3 — INTEGRATION: Cell → tissue → organ → system connections.
             Show how this connects to at least 2 other systems.
  Layer 4 — CLINICAL EXPRESSION: Walk into the room. Describe the patient fully.
             Every investigation finding traced to mechanism. Every drug explained mechanistically.
  Layer 5 — EDGE CASES & CONTRASTS: First broken step is the anchor.
             Compare at least 2 similar conditions.
  Layer 6+ — Go deeper whenever asked. No ceiling. Molecular biology, genetics, pharmacogenomics.

RESPONSE LENGTH RULE:
- Minimum response length: 600 words for any teaching topic
- A response is only complete when ALL 3 satisfaction check questions are answered
- Never stop at Layer 1 or 2 — always push through to clinical application

RULE 3 — CHECKPOINT AFTER EVERY LAYER
After each layer ask ONE question. Never move forward while confusion exists.

RULE 4 — SPATIAL VISUALISATION IS MANDATORY
FOR MECHANISMS → Always generate a MERMAID FLOWCHART using this format:
\`\`\`mermaid
flowchart TD
  A["Problem"] -->|"because"| B["Step 1"]
  B -->|"therefore"| C["Step 2"]
  style A fill:#7C3AED,stroke:#5B21B6,color:#fff
  style B fill:#1A3A6B,stroke:#2563A8,color:#fff
  style C fill:#0F7173,stroke:#065F46,color:#fff
\`\`\`

FOR BLOOD FLOW → Show spatial path with pressures:
RA (2-6mmHg) → RV (25/5mmHg) → PA → Lungs → PV → LA (8-12mmHg) → LV (120/8mmHg) → Aorta

FOR ECG → Draw ASCII ECG grid showing the waveform:
\`\`\`ecg
mV
+1|        ██
   |       █  █
 0 |──P──██    ██──ST──T──
-1 |
   |←PR→|←QRS→|←ST→|←T→|
   | 160 |  80 |    |240 | ms
\`\`\`
Then explain each deflection spatially.

FOR ANATOMY → Use the fist trick or body landmark equivalent.
FOR PHARMACOLOGY → Always: Target → Change in activity → Downstream cascade → Clinical effect

RULE 5 — SPATIAL ANCHOR
For every concept, find a physical/tactile anchor like the coronary fist.
State: "Your spatial anchor for this is: [anchor]"

RULE 6 — CLINICAL PEARL
Add ★ PEARL whenever mechanism has direct bedside consequence.

RULE 7 — EVIDENCE-BASED REFERENCES
Include 2-3 high-yield references:
📚 [Trial/Guideline] — one line on what it proved

RULE 8 — GHANA ADAPTATION
🇬🇭 IN GHANA: What can you diagnose with history + exam alone? What low-cost test is most informative? How does delayed presentation change the picture?

RULE 9 — AUTO-GENERATED FLASHCARDS
At the end of EVERY teaching response, generate 3-5 flashcards in EXACTLY this format:
---FLASHCARDS---
FRONT: [Mechanistic question]
BACK: [Causal chain answer]
FRONT: [Next question]
BACK: [Next answer]
---END-FLASHCARDS---

RULE 10 — SATISFACTION LOOP
End every response with:
📋 SATISFACTION CHECK:
1. COMPREHENSION: [Question requiring mechanism in own words]
2. APPLICATION: [New patient scenario]
3. RECONSTRUCTION: Trace backward from [clinical finding] to [molecular origin]

COLOR ENCODING FOR MERMAID:
🔴 fill:#DC2626 = DANGER/pathology/high pressure
🔵 fill:#1E3A5F = NORMAL VENOUS/low pressure
🟢 fill:#065F46 = OXYGENATED/normal
🟡 fill:#92400E = COMPENSATION/warning
⚫ fill:#374151 = BYPASSED/inactive
🟣 fill:#5B21B6 = MOLECULAR/cellular events`;

// ══ CHAT ENDPOINT (streaming) ══════════════════════════════
app.post('/api/chat', async (req, res) => {
  const { messages, topic_id } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set on server' });
  }

  // Save user message
  let assistantMsgId = null;
  if (topic_id) {
    const userMsg = messages[messages.length - 1];
    if (userMsg?.role === 'user') {
      msgOps.insert({ topic_id, role: 'user', content: userMsg.content });
      // Auto-classify specialty
      const specialty = classifySpecialty(userMsg.content);
      topicOps.update(topic_id, { specialty });
      // Auto-title from first message
      const topic = topicOps.getById(topic_id);
      if (topic && (topic.title === 'New Session' || !topic.title)) {
        const autoTitle = userMsg.content.slice(0, 60) + (userMsg.content.length > 60 ? '…' : '');
        topicOps.update(topic_id, { title: autoTitle });
      }
    }
    // Placeholder for assistant response
    const aMsg = msgOps.insert({ topic_id, role: 'assistant', content: '' });
    assistantMsgId = aMsg.id;
    topicOps.touch(topic_id);
  }

  // Start SSE stream
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write(`data: ${JSON.stringify({ type: 'meta', msg_id: assistantMsgId })}\n\n`);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 16000,
        system:     SYSTEM_PROMPT,
        messages,
        stream:     true,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      res.write(`data: ${JSON.stringify({ type: 'error', error: err })}\n\n`);
      res.end();
      return;
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';
    let fullText  = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            fullText += parsed.delta.text;
            res.write(`data: ${JSON.stringify({ type: 'delta', text: parsed.delta.text })}\n\n`);
          }
        } catch {}
      }
    }

    // Save completed response
    if (assistantMsgId && fullText) {
      msgOps.updateContent(assistantMsgId, fullText);

      // Auto-extract flashcards
      if (topic_id) {
        const specialty = classifySpecialty(fullText);
        const fcRegex = /FRONT:\s*(.+?)\nBACK:\s*(.+?)(?=\nFRONT:|\n---END|\n---$|$)/gs;
        let m;
        while ((m = fcRegex.exec(fullText)) !== null) {
          const front = m[1].trim();
          const back  = m[2].trim();
          if (front && back && front.length > 5) {
            fcOps.insert({ topic_id, specialty, front, back, source: 'ai' });
          }
        }
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch(err) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🧠 SmartMedicine running on port ${PORT}`));
