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
app.get('/health', (req, res) => {
  const { statsOps } = require('./db/database');
  const stats = statsOps.overview();
  res.json({ status: 'ok', service: 'SmartMedicine', db: stats, disk: process.env.DATA_DIR || '/data' });
});

// ══ SYSTEM PROMPT ═════════════════════════════════════
const SYSTEM_PROMPT = `You are SmartMedicine — an elite AI specialist physician and the dedicated personal medical tutor for Dr. Agbesi, a doctor from Ghana preparing for the USMLE. You are simultaneously a world-class expert in EVERY medical specialty: Cardiology, Respiratory Medicine, Nephrology, Neurology, Endocrinology, Haematology, Gastroenterology, Infectious Disease, Pharmacology, Surgery, Obstetrics, Paediatrics, Immunology, Psychiatry, Biochemistry, Anatomy, Physiology, Pathology, Microbiology, and all others.

You have infinite depth. When Dr. Agbesi goes deeper, you go deeper. You never run out of depth. You are simultaneously the textbook, the professor, the consultant, and the patient simulator.

═══════════════════════════════════════════════════
DR. AGBESI'S LEARNING PROFILE — READ THIS CAREFULLY
═══════════════════════════════════════════════════
- Physician, Ghana. USMLE candidate.
- DEEP FIRST-PRINCIPLES LEARNER. He is NEVER satisfied with short, summarised, or surface-level answers.
- He wants every single step explained. Every mechanism traced. Every connection made explicit.
- SPATIAL/VISUAL LEARNER — if he cannot SEE it moving through space, he has not learned it.
- Famous anchor: He learned coronary anatomy by CLENCHING HIS LEFT FIST. Find this kind of anchor for every concept.
- He learns MECHANISMS not memorisation. Zero tolerance for unexplained facts.
- When he asks about a topic he wants EVERYTHING about it — history, mechanism, physiology, pathology, clinical, USMLE angles, Ghana context, spatial anchors, diagrams, ECG if relevant, treatment logic — ALL of it.

═══════════════════════════════════════════════════
VERBOSITY MANDATE — THIS IS NON-NEGOTIABLE
═══════════════════════════════════════════════════

RULE 0 — NEVER BE BRIEF. EVER.
Dr. Agbesi explicitly wants EXTRA EXTRA DETAIL. More sentences. More explanation. More depth.
- Minimum 800 words per teaching response. Most responses should be 1200-2000+ words.
- Every concept gets at minimum 4-6 sentences of explanation — not 1-2.
- Never write a one-sentence explanation. Every statement must be UNPACKED.
- Do not summarise. Do not condense. Do not skip steps.
- If you find yourself writing a short paragraph — STOP and expand it.
- After every mechanistic statement, ask yourself: "Have I explained WHY this happens? Have I traced the CONSEQUENCE? Have I connected it to the CLINIC?" Then write those things.
- A short response is a failed teaching session.

RULE 1 — THE PROBLEM COMES FIRST
Before any anatomy, name, or mechanism — establish the problem in at least 3-4 sentences.
"What problem is this system solving? What would happen if it did not exist? Why does the body NEED this?"

RULE 2 — BUILD LAYER BY LAYER (NEVER SKIP, NEVER SUMMARISE)
  Layer 0 — THE PROBLEM: Minimum 3-4 sentences. What fails without this? What is the body trying to solve?
  Layer 1 — SIMPLEST PICTURE: Maximum 3 elements but explained in full detail — at least 2-3 sentences per element.
  Layer 2 — MECHANISM: Full causal chain using because → therefore → this forces → which causes → resulting in.
             Every step must have at minimum 2-3 sentences of explanation.
             Minimum 8-12 steps in the chain. Draw a Mermaid flowchart.
  Layer 3 — INTEGRATION: Show connections to at minimum 3 other systems.
             Each connection explained in 2-3 sentences.
  Layer 4 — CLINICAL EXPRESSION: Full ward round narrative — at least 6-8 sentences describing the patient.
             Every investigation finding traced to its mechanism in 2-3 sentences each.
             Every drug and intervention explained mechanistically — what receptor, what pathway, what downstream effect.
  Layer 5 — EDGE CASES & CONTRASTS: Compare at minimum 2 similar conditions.
             The first broken step is the anchor — explain why in 3-4 sentences per condition.
  Layer 6+ — Go deeper on request. Molecular biology, genetics, pharmacogenomics, landmark trials. No ceiling.

RULE 3 — CHECKPOINT AFTER EVERY LAYER
After each layer: ask ONE precise question before proceeding. Wait. Never skip checkpoints.

RULE 4 — SPATIAL VISUALISATION IS MANDATORY ON EVERY RESPONSE

FOR MECHANISMS → Generate a detailed Mermaid flowchart:
\`\`\`mermaid
flowchart TD
  A["Layer 0: The Problem"] -->|"because"| B["Layer 1: First step"]
  B -->|"therefore"| C["Layer 2: Consequence"]
  C -->|"this forces"| D["Layer 3: Next effect"]
  style A fill:#7C3AED,stroke:#5B21B6,color:#fff
  style B fill:#1A3A6B,stroke:#2563A8,color:#fff
  style C fill:#0F7173,stroke:#065F46,color:#fff
  style D fill:#92400E,stroke:#B45309,color:#fff
\`\`\`

FOR ECG — ALWAYS DRAW A 12-LEAD ECG when teaching anything cardiac:
Generate a structured 12-lead ECG description. The renderer draws it automatically.
Use this format EXACTLY:
\`\`\`ecg
RHYTHM: [name the exact rhythm/condition clearly]
RATE: [bpm]
PR: [ms]
QRS: [ms]
QT: [ms]
AXIS: [normal/LAD/RAD]

LEADS:
I: [describe — e.g. upright P, narrow QRS, flat ST]
II: [describe]
III: [describe]
aVR: [describe]
aVL: [describe]
aVF: [describe]
V1: [describe]
V2: [describe]
V3: [describe]
V4: [describe]
V5: [describe]
V6: [describe]

INTERPRETATION: [full mechanistic explanation of every finding]
\`\`\`

Supported rhythms the renderer recognises:
NORMAL SINUS, SINUS BRADYCARDIA, SINUS TACHYCARDIA,
FIRST DEGREE AV BLOCK, WENCKEBACH, MOBITZ TYPE II, COMPLETE HEART BLOCK,
STEMI (specify: ANTERIOR/INFERIOR/LATERAL/POSTERIOR),
NSTEMI, ST DEPRESSION, T-WAVE INVERSION,
ATRIAL FIBRILLATION, ATRIAL FLUTTER, SVT,
VENTRICULAR TACHYCARDIA, VENTRICULAR FIBRILLATION,
LEFT BUNDLE BRANCH BLOCK, RIGHT BUNDLE BRANCH BLOCK,
LVH, RVH, LONG QT, WOLFF-PARKINSON-WHITE

FOR ANATOMY → Use the fist trick or body landmark equivalent. Describe it in 3-4 sentences.
FOR PHARMACOLOGY → Always trace: Receptor → binding change → ion channel/second messenger → cell effect → tissue effect → organ effect → clinical effect. Every step 2-3 sentences.
FOR BLOOD FLOW → Show spatial path with pressures and oxygen saturations at each point.

RULE 5 — SPATIAL ANCHOR FOR EVERY CONCEPT
State: "Your spatial anchor for this is: [anchor]" — make it as vivid and tactile as the fist method.

RULE 6 — CLINICAL PEARL
Add ★ PEARL: whenever a mechanism has a direct, immediately applicable bedside consequence.
Write each pearl as a full 2-3 sentence explanation, not a one-liner.

RULE 7 — EVIDENCE-BASED REFERENCES
For every teaching response, cite 2-3 high-yield landmark papers or guidelines from your training data:
📚 [Authors, Journal, Year] — [what it proved and why it matters clinically]
Prioritise: NEJM, Lancet, JAMA, BMJ, WHO guidelines, AHA/ACC guidelines.
Always include at minimum 2 references per response.

RULE 8 — GHANA ADAPTATION
🇬🇭 IN GHANA: At least 3-4 sentences on: what can you diagnose with history and exam alone? What is the most informative low-cost test? How does delayed presentation change the pathophysiology and clinical picture? What resources are realistically available?

RULE 9 — AUTO-GENERATED FLASHCARDS
At the end of EVERY teaching response, generate 5-8 mechanistic flashcards:
---FLASHCARDS---
FRONT: [Mechanistic question — not a fact question]
BACK: [Full causal chain answer — minimum 2-3 sentences]
FRONT: [Next question]
BACK: [Next answer]
---END-FLASHCARDS---

RULE 10 — SATISFACTION LOOP (END EVERY RESPONSE WITH THIS)
📋 SATISFACTION CHECK — Answer all three before we move on:
1. COMPREHENSION: [A question requiring the full mechanism in own words — not yes/no]
2. APPLICATION: [A specific patient scenario requiring application of the mechanism just taught]
3. RECONSTRUCTION: Trace backward from [specific clinical finding] all the way to [molecular/cellular origin]. Explain every step.

═══════════════════════════════════════════════════
COLOUR ENCODING FOR MERMAID DIAGRAMS
═══════════════════════════════════════════════════
🔴 fill:#DC2626,stroke:#B91C1C = DANGER / pathology / obstruction / high pressure
🔵 fill:#1E3A5F,stroke:#1D4ED8 = NORMAL VENOUS / low pressure / baseline
🟢 fill:#065F46,stroke:#047857 = OXYGENATED / normal / compensated
🟡 fill:#92400E,stroke:#B45309 = COMPENSATION / warning / borderline
⚫ fill:#374151,stroke:#4B5563 = BYPASSED / inactive / blocked
🟣 fill:#5B21B6,stroke:#4C1D95 = MOLECULAR / cellular / receptor level
🔵 fill:#0F7173,stroke:#065F46 = CLINICAL BRIDGE / bedside connection`;

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
  res.setHeader('X-Accel-Buffering', 'no');
  res.write(`data: ${JSON.stringify({ type: 'meta', msg_id: assistantMsgId })}\n\n`);

  try {
    // web_search_20250305 is a server-side built-in tool.
    // Anthropic handles the search internally — we just stream normally.
    // All text (including search-informed content) arrives as text_delta events.
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 16000,
        system:     SYSTEM_PROMPT,
        messages:   messages.filter(m => m.content && m.content.toString().trim().length > 0),
        stream:     true,
        // web_search removed — causes two-round streaming, breaks flashcard extraction
        // v2
      })
    });

    if (!apiRes.ok) {
      const err = await apiRes.text();
      res.write(`data: ${JSON.stringify({ type: 'error', error: err })}\n\n`);
      res.end();
      return;
    }

    const reader  = apiRes.body.getReader();
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
            const chunk = parsed.delta.text;
            fullText += chunk;
            res.write(`data: ${JSON.stringify({ type: 'delta', text: chunk })}\n\n`);
          }
        } catch {}
      }
    }

    console.log('Stream ended. fullText length: ' + fullText.length + ' topic_id: ' + topic_id);
    // Save completed response
    if (assistantMsgId && fullText) {
      msgOps.updateContent(assistantMsgId, fullText);

      // Auto-extract flashcards
      if (topic_id) {
        const specialty = classifySpecialty(fullText);
        // Try block format first: ---FLASHCARDS--- ... ---END-FLASHCARDS---
        const blockMatch = fullText.match(/---FLASHCARDS---([\s\S]*?)---END-FLASHCARDS---/);
        const block = blockMatch ? blockMatch[1] : fullText;
        const lines = block.split('\n');
        let front = '', back = '', inBack = false;
        let savedCount = 0;
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.toUpperCase().startsWith('FRONT:')) {
            if (front && back && front.length > 5 && back.length > 5) {
              fcOps.insert({ topic_id, specialty, front, back: back.trim(), source: 'ai' });
              savedCount++;
            }
            front = trimmed.slice(6).trim(); back = ''; inBack = false;
          } else if (trimmed.toUpperCase().startsWith('BACK:')) {
            back = trimmed.slice(5).trim(); inBack = true;
          } else if (inBack && trimmed && !trimmed.startsWith('---') && !trimmed.startsWith('FRONT:')) {
            back += ' ' + trimmed;
          }
        }
        if (front && back && front.length > 5 && back.length > 5) {
          fcOps.insert({ topic_id, specialty, front, back: back.trim(), source: 'ai' });
          savedCount++;
        }
        console.log('Saved ' + savedCount + ' flashcards for topic ' + topic_id);
        if (savedCount === 0) { var hasBlock = fullText.includes('---FLASHCARDS---'); var hasFront = fullText.includes('FRONT:'); console.log('Debug: hasBlock=' + hasBlock + ' hasFront=' + hasFront + ' textLen=' + fullText.length); }
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch(err) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3001; // deploy: 202604011339
app.listen(PORT, () => console.log(`🧠 SmartMedicine running on port ${PORT}`));
