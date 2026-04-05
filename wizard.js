/* ============================================================================
   WIZARD THEME — Step-by-step guided character creation
   Activated when theme === 'wizard'. Hooked from applyTheme() in scripts.js.
   Exposes window.dgWizard = { activate, deactivate, goTo }
   ============================================================================ */
(function () {
    'use strict';

    /* ── Step definitions ─────────────────────────────────────────────────── */
    const STEPS = [
        {
            label: 'Statistics',
            selectors: ['#stats-buy-section', '#stats-buy-section + .button-container'],
            tipsHTML:
                '<p>Your Agent\'s six core abilities. You have three ways to set them:</p>'
                + '<p><span style="display:inline-block;background:transparent;color:var(--primary-color);border:2px solid var(--primary-color);border-radius:var(--radius-sm,3px);padding:2px 10px;font-size:0.85em;vertical-align:middle;font-weight:700;white-space:nowrap;">RANDOM POINT BUY</span> — Spreads 72 points across all six stats randomly within the point-buy rules.'
                + '<br><span style="display:inline-block;background:transparent;color:var(--primary-color);border:2px solid var(--primary-color);border-radius:var(--radius-sm,3px);padding:2px 10px;font-size:0.85em;vertical-align:middle;font-weight:700;white-space:nowrap;">RANDOM DICE ROLL</span> — Old-school: rolls 4d6 drop-lowest for each stat. Numbers may run high or low.'
                + '<br><span style="display:inline-flex;align-items:center;gap:4px;vertical-align:middle;font-size:0.85em;"><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:2px solid var(--primary-color);border-radius:50%;color:var(--primary-color);font-weight:700;line-height:1;">+</span> / <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:2px solid var(--primary-color);border-radius:50%;color:var(--primary-color);font-weight:700;line-height:1;">\u2212</span></span> — Manual point-buy: use the circular <strong>+</strong> and <strong>\u2212</strong> buttons on each stat card to spend your 72 points exactly as you want.</p>'
                + '<details><summary>STR <span style="font-weight:400;opacity:0.65;">(Strength)</span></summary><p>Physical power and size. Break down doors, drag a witness to safety.</p></details>'
                + '<details><summary>DEX <span style="font-weight:400;opacity:0.65;">(Dexterity)</span></summary><p>Agility and coordination. React quickly, keep balance.</p></details>'
                + '<details><summary>CON <span style="font-weight:400;opacity:0.65;">(Constitution)</span></summary><p>Health and resilience. Resist illness, exhaustion, and pain.</p></details>'
                + '<details><summary>INT <span style="font-weight:400;opacity:0.65;">(Intelligence)</span></summary><p>How well your Agent notices, remembers, and connects things.</p></details>'
                + '<details><summary>POW <span style="font-weight:400;opacity:0.65;">(Power)</span></summary><p>Force of personality and psychic resilience. Keep your head in a crisis.</p></details>'
                + '<details><summary>CHA <span style="font-weight:400;opacity:0.65;">(Charisma)</span></summary><p>Charm and personal appeal. Make impressions, talk your way in.</p></details>'
        },
        {
            label: 'Profession',
            selectors: ['#bio-profession-row'],
            tips: 'Profession\n\nThis is your biggest decision. Profession determines your Agent\'s skills, role in an operation, and sometimes the resources your Agent can bring to bear by requisitioning equipment.\n\nA handful of core professions are most frequently seen among Agents: Anthropologist or Historian, Computer Scientist or Engineer, Federal Agent, Physician, Scientist, and Special Operator. Many other professions are described in the Agent\'s Handbook.'
        },
        {
            label: 'Biography',
            selectors: ['#cs-biography-fieldset'],
            tipsHTML:
                '<p>Fill in your Agent\'s personal details. Hit the <span style="display:inline-block;background:var(--primary-color);color:var(--bg-color);border:1px solid var(--primary-color);border-radius:var(--radius-md);padding:2px 8px;font-size:0.85em;vertical-align:middle;font-weight:600;white-space:nowrap;">RANDOM BIO?</span> button to auto-generate a name, employer, education, and description matched to the profession you chose.</p>'
                + '<p>Tip: hover over any field label for a tooltip with guidance on what to enter and how it fits into the Delta Green setting.</p>'
        },
        {
            label: 'Skills',
            selectors: ['.panel-skills'],
            tips: 'Skills\n\nA skill is a body of specialized knowledge that takes months or years to learn and decades to master. Each skill has a percentile rating, from zero to 99.',
            tipsHTML:
                '<p>Most Agents won\'t need to change much here. Your main task is to check for any highlighted specialty skills — such as Foreign Language, Craft, and Science — that require you to select a specialty from the dropdown or type one in the text field. They look like this: <span style="display:inline-block;border:2px solid #fe640b;background:#fff3e0;color:#333;font-size:0.85em;padding:1px 8px;border-radius:3px;vertical-align:middle;">Foreign Language ▾</span></p>'
                + '<p>Each skill is your Agent\'s percent chance of succeeding at a task in a crisis. Profession sets your starting values — adjust them here to fine-tune.</p>'
                + '<details><summary>Skill Ratings</summary>'
                + '<p>A skill is a body of specialized knowledge that takes months or years to learn and decades to master.</p>'
                + '<dl>'
                + '<dt>1&ndash;19%</dt><dd>Dabbler</dd>'
                + '<dt>20&ndash;29%</dt><dd>Hobbyist</dd>'
                + '<dt>30&ndash;39%</dt><dd>Basic training or a college minor</dd>'
                + '<dt>40&ndash;59%</dt><dd>Years of experience or a college major</dd>'
                + '<dt>60&ndash;79%</dt><dd>Decades of experience or a grad degree</dd>'
                + '<dt>80&ndash;99%</dt><dd>A lifetime\'s mastery</dd>'
                + '</dl></details>'
                + '<details><summary>Notable Skills</summary>'
                + '<dl>'
                + '<dt>Craft</dt><dd>Mastery of a difficult trade such as electronics, carpentry, or plumbing.</dd>'
                + '<dt>HUMINT</dt><dd>Human intelligence: the study and deciphering of behavior and motivations.</dd>'
                + '<dt>SIGINT</dt><dd>Encryption, decryption, and signals intelligence.</dd>'
                + '<dt>Unnatural</dt><dd>Knowledge of Things Man Was Not Meant to Know. This skill cannot be raised during character creation &mdash; it only grows through terrible experience.</dd>'
                + '</dl></details>'
                + '<details><summary>Add Specialty Skill</summary>'
                + '<p><strong>Most new players won\'t need this.</strong> Unless you are building a fully custom profession from scratch, your profession already assigns the correct specialty skills for you automatically.</p>'
                + '<p>Specialty skills (Craft, Foreign Language, Military Science, etc.) let you define a specific focus within a broad skill. Use the <em>Add Specialty Skill</em> button only if your Handler has asked you to define something not covered by your profession, or if you are building a custom Agent from the ground up.</p>'
                + '</details>'
                + '<details><summary>Sanity Adaptations</summary>'
                + '<p>Adaptation to <strong>Violence</strong> or <strong>Helplessness</strong> means your Agent automatically succeeds at Sanity rolls for that type of trauma &mdash; they\'ve survived it so many times it no longer shocks them.</p>'
                + '<p>Adaptation happens after your Agent loses SAN from that trauma type <em>three times in a row</em> without going temporarily insane or hitting their Breaking Point. The character sheet has boxes to track progress. If your Agent goes insane from that trauma before all three boxes are filled, the counter resets to zero.</p>'
                + '<dl>'
                + '<dt>Adapted to Violence</dt><dd>Your Agent\'s empathy is permanently damaged. They lose 1D6 CHA permanently, and each Bond loses the same amount.</dd>'
                + '<dt>Adapted to Helplessness</dt><dd>Your Agent\'s personal drive is permanently diminished. They lose 1D6 POW permanently.</dd>'
                + '<dt>The Unnatural</dt><dd>There is no adapting to the Unnatural. Every encounter is a fresh shock. The only way to &ldquo;adapt&rdquo; is to reach 0 SAN &mdash; at which point the horrors make perfect sense.</dd>'
                + '</dl>'
                + '<p><strong>Discuss this with your Handler before selecting any adaptations at character creation.</strong> It means your Agent has a history of surviving that specific horror repeatedly &mdash; that background carries narrative weight. <em>If you\'re unsure, leave it blank.</em> Adaptations are normally earned through play.</p>'
                + '</details>'
        },
        {
            label: 'Bonus Skills',
            selectors: ['.panel-bonus-skills'],
            tips: 'Bonus Skill Points\n\nWhat did your Agent do before his or her current profession?\n\nThese 8 bonus skill picks represent that history — hobbies, side training, a past life. Use them to round out your Agent as a person: a Federal Agent who rock-climbs on weekends, a Physician who speaks three languages, a Soldier who paints. These details make a character feel real.\n\nIf your Agent truly lives for the work, you can push a professional skill higher instead — just note the hard cap: no skill can exceed 80% during character creation.',
            tipsHTML:
                '<p><em>What did your Agent do before his or her current profession?</em> These 8 bonus skill picks represent that history — hobbies, side training, a past life.</p>'
                + '<p>Use them to round out your Agent as a person: a Federal Agent who rock-climbs on weekends, a Physician who speaks three languages, a Soldier who paints. If your Agent truly lives for the work, you can push a professional skill higher instead.</p>'
                + '<p style="margin-bottom:0.6em">No skill can go above <strong>80%</strong> during character creation.</p>'
                + '<p style="margin-bottom:0.4em">Some packages include slots that need a specialty — like a specific Art, Craft, or Foreign Language. After clicking <span style="display:inline-block;padding:1px 7px;border:2px solid currentColor;border-radius:3px;font-size:0.85em;font-weight:bold;opacity:0.85;vertical-align:middle">Fill Dropdowns</span>, those slots are left open and highlighted in orange so you know exactly which ones still need your choice:</p>'
                + '<div style="display:inline-flex;flex-direction:column;align-items:center;gap:3px;font-size:0.8em;opacity:0.9;margin-bottom:0.8em">'
                + '<span style="font-size:0.78em;opacity:0.65">Boost 3</span>'
                + '<select disabled style="border:2px solid #fe640b;background:#fff3e0;color:#333;padding:2px 6px;border-radius:3px;font-size:1em;pointer-events:none"><option>↓ Choose a Foreign Language</option></select>'
                + '</div>'
                + '<p style="margin-bottom:0.6em;font-size:0.88em;opacity:0.8">Once you pick a value from a highlighted dropdown the orange border clears automatically.</p>'
                + '<details><summary>&#127959; Background Packages</summary>'
                + '<p style="margin-bottom:0.8em">Not sure where to start? The rulebook includes ready-made packages — pick a background that fits your Agent\'s history and it fills the dropdowns for you. Slots marked <em>choose</em> are left blank for you to pick.</p>'
                + '<div style="display:flex;flex-direction:column;gap:6px">'
                + '<p style="margin:0 0 4px;font-size:0.8em;opacity:0.65;font-style:italic">Pick any package below to preview its included skills before committing.</p>'
                + '<select id="wiz-pkg-select" style="width:100%" onchange="_wizShowBonusPkg(this.value)">'
                + '<option value="">— Choose a background —</option>'
                + (typeof BONUS_PACKAGES !== 'undefined' ? BONUS_PACKAGES.map((p, i) => `<option value="${i}">${p.label}</option>`).join('') : '')
                + '</select>'
                + '<div id="wiz-pkg-detail" style="display:none;font-size:0.83em;padding:6px 8px;background:rgba(128,128,128,0.1);border-radius:4px;line-height:1.6"></div>'
                + '</div></details>'
        },
        {
            label: 'Bonds',
            selectors: ['#cs-bonds-fieldset'],
            tips: 'Bonds\n\nProfession determines how many Bonds your Agent gets. Each Bond should have a name and specify the relationship — "Ex-husband, Taylor" or "Special Agent Waite, frequent FBI partner." Each Bond starts with a score equal to your Agent\'s CHA.\n\nThe number of Bonds available to your Agent is shown at the top of the Bonds panel.\n\nBond Examples\n» Spouse or ex-spouse\n» Son or daughter\n» Favored parent or grandparent\n» Best friend\n» Long-time coworker or partner\n» Psychologist or therapist\n» Fellow survivors of a shared trauma'
        },
        {
            label: 'Equipment',
            selectors: ['#eq-picker-fieldset'],
            tips: 'Pick gear and weapons appropriate to your mission.',
            tipsHTML:
                '<p>Browse and add items by category. Click <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:1px solid rgba(128,128,128,0.45);border-radius:3px;font-size:16px;line-height:1;vertical-align:middle;">+</span> to include gear, or remove it with the <span style="opacity:0.7;font-size:1em;vertical-align:middle;">&times;</span> on each item card. Your sheet updates automatically.</p>'
                + '<p style="margin-bottom:0.8em">Already know your loadout or need to talk to your Handler? Skip ahead — you can always come back.</p>'
                + '<details><summary>Operational Gear</summary>'
                + '<p>Agents usually start an operation with duffel bags and footlockers of equipment. No need to list everything in advance — assume the basics are covered. If a specific item comes up mid-mission, players can argue for having it; the Handler decides.</p>'
                + '</details>'
                + '<details><summary>Expense Categories</summary>'
                + '<dl>'
                + '<dt><span style="color:#6abf6a">&#9650;</span> Incidental (up to $150)</dt><dd>No tracking needed. Meals, ammo, burner phones, shovels — the Agent has it.</dd>'
                + '<dt><span style="color:#4a9eda">&#9650;</span> Standard ($200–$800)</dt><dd>A pistol, same-day plane ticket, or a week at a modest hotel.</dd>'
                + '<dt><span style="color:#c8a000">&#9650;</span> Unusual ($1,000–$5,000)</dt><dd>A scoped rifle, forged passport, powerful computer, or out-of-the-way travel.</dd>'
                + '<dt><span style="color:#d47800">&#9650;</span> Major ($6,000–$30,000)</dt><dd>Heavy weapons, professional forgery, a new vehicle, or exclusive event access.</dd>'
                + '<dt><span style="color:#c0392b">&#9650;</span> Extreme ($36,000+)</dt><dd>Black-budget territory. Handler\'s call entirely.</dd>'
                + '</dl></details>'
                + '<details><summary>Tools of the Trade Examples</summary>'
                + '<details><summary>Federal Agent</summary>'
                + '<p>Agency badge and identification card, medium pistol in a belt holster, two spare magazines in a belt pouch, tactical light, handcuffs in a belt pouch, Kevlar vest, windbreaker jacket printed with the name of the agency, encrypted smartphone, police-band radio with earpiece and throat microphone, small evidence-collection kit. Maybe a light pistol in an ankle or small-of-the-back holster for backup. Additional equipment usually carried in the agency car includes a light carbine with holographic sight and two spare magazines, or a pump-action shotgun with 40 spare rounds in boxes (half of them slugs), tactical body armor, Kevlar helmet, encrypted laptop with access to agency networks, first aid kit, and a portable fire extinguisher.</p>'
                + '</details>'
                + '<details><summary>SWAT Team</summary>'
                + '<p>Agency badge and identification card, assault rifle or carbine with laser sight and underslung flashlight, six spare magazines in a chest rig, semi-automatic shotgun with six spare shells in a receiver mount, medium pistol, two spare magazines in a chest rig, tactical knife, flash-bang and tear-gas grenades, CED pistol, pepper spray cannister, battering ram, Halligan forcible-entry tool, ballistic shield, tactical radio, earpiece, throat microphone, flexible cuffs, tactical body armor, vest with agency identification, knee and elbow pads, gloves, helmet, fire-retardant balaclava, tinted goggles, assault webbing for magazines and grenades, hydration system (such as a camelback), binoculars, high-power flashlight, and rappelling harnesses and equipment.</p>'
                + '</details>'
                + '<details><summary>Special Operator</summary>'
                + '<p>Dog tags, assault carbine with holographic sight, targeting laser and sound suppressor, six spare magazines in a chest rig, medium pistol in a holster, two spare magazines in a chest rig, two fragmentation hand grenades, two smoke grenades, two &ldquo;flash-bang&rdquo; stun grenades, combat knife, flexible cuffs, tactical body armor, Kevlar helmet, tactical light, goggles or sunglasses, night vision goggles, military-band radio with earpiece and throat microphone, multi-tool, compass, field dressing, and GPS.</p>'
                + '</details>'
                + '<details><summary>Police Officer</summary>'
                + '<p>Badge and identification card, reinforced Kevlar vest, duty belt, medium pistol with two spare magazines in a belt pouch, pepper spray and/or CED pistol, collapsible baton, folding knife, handcuffs with cuff key, flashlight, handheld radio, pen, and pocket notebook. Some departments require officers to wear body cameras and audio recorders. Many officers carry a light backup pistol in an ankle or under-shirt holster, extra pistol magazines, leather gloves, multi-tool, hemostatic gel, and emergency bandages or self-applying tourniquet. A patrol car usually carries a police radio, a rack with a carbine with holographic sight or a shotgun, boxes of spare ammunition, riot helmet and riot baton, spike strips, flares, reflective vest to wear in traffic, evidence bags, traffic cones, blood-borne pathogen kit, fire extinguisher, mounted laptop computer, driver&rsquo;s-license scanner, a stuffed animal or blanket to comfort a child, towels, crowbar, various tools and bad-weather gear, clipboard, forms and paperwork, map books and reference books (drug identification, HAZMAT codes, terrorism response), bottled water, energy bars, and antibacterial gel.</p>'
                + '</details>'
                + '<details><summary>Cop\'s Go-Bag</summary>'
                + '<p>First aid kit, self-applying tourniquet, hemostatic gel, clothes, boxes of ammunition, extra pistol and/or carbine magazines, flashlight, folding knife, basic tools, doorstops, chalk, bottled water, energy bars, batteries, and sunscreen.</p>'
                + '</details>'
                + '</details>'
        },
        {
            label: 'Save & Export',
            selectors: ['#save-share-bar'],
            tips: 'Your agent is ready. Review the options below, then hit Finish \u2713 to close the wizard and return to the full sheet where you can review and tweak everything.',
            tipsHTML:
                '<p>Your Agent is built. Look over the export options below, then hit <span style="display:inline-block;background:var(--primary-color);color:var(--bg-color);border:1px solid var(--primary-color);border-radius:var(--radius-md);padding:2px 10px;font-size:0.85em;vertical-align:middle;font-weight:600;white-space:nowrap;">Finish \u2713</span> to close the wizard and return to the full sheet \u2014 nothing is locked, you can keep tweaking.</p>'
                + '<details><summary>&#128279; Copy Share Link</summary>'
                + '<p>Think of this like a save file that lives inside a link. Every choice you\'ve made \u2014 stats, skills, bonds, gear, all of it \u2014 gets packed into a single URL you can copy and paste anywhere. Send it to your Handler before a session, drop it in a group chat, or save it in your notes so you can pick up exactly where you left off from any device, without needing an account or installing anything. Click <strong>Copy Share Link</strong> in the bar above to generate it.</p>'
                + '</details>'
                + '<details><summary>&#9113; Export Printable Sheet</summary>'
                + '<p>Generates a print-ready HTML sheet in a new tab, formatted to fit on paper. Use your browser\u2019s <em>Print</em> or <em>Save as PDF</em> to get a hard copy or PDF file.</p>'
                + '</details>'
                + '<details><summary>&#11015; Export PDF Character Sheet</summary>'
                + '<p>Downloads a pre-formatted Delta Green PDF with your Agent\u2019s stats filled in \u2014 ready to hand to your Handler or drop into a folder.</p>'
                + '</details>'
                + '<details><summary>&#8862; Export Google Sheet / XLSX</summary>'
                + '<p>Downloads an Excel-compatible spreadsheet (.xlsx) of your Agent. Open it in Google Sheets or Excel for a tabular view, useful for record-keeping or sharing with groups.</p>'
                + '</details>'
                + '<details><summary>&#11015; Export to Foundry VTT</summary>'
                + '<p>Downloads a <code>.json</code> file you can drag-and-drop directly into Foundry VTT using the Delta Green system. Your Handler can import it as a ready-to-play Actor.</p>'
                + '</details>'
        }
    ];

    /* ── State ────────────────────────────────────────────────────────────── */
    let currentStep = null;           // null = inactive
    let resolvedSteps = null;         // Array<{ ...step, elements: Element[] }>

    // Per-element: original DOM position and original inline display
    const originalPos = new Map();    // el => { parent, nextSibling }
    const originalDisplay = new Map();// el => string

    /* ── Helpers ──────────────────────────────────────────────────────────── */

    function resolveSteps() {
        return STEPS.map(step => ({
            label: step.label,
            tips: step.tips,
            elements: step.selectors.flatMap(sel =>
                Array.from(document.querySelectorAll(sel))
            )
        }));
    }

    function getAllElements() {
        if (!resolvedSteps) return [];
        const seen = new Set();
        const all = [];
        resolvedSteps.forEach(step => {
            step.elements.forEach(el => {
                if (!seen.has(el)) { seen.add(el); all.push(el); }
            });
        });
        return all;
    }

    /* ── Wizard pyramid animation (step 8 hero canvas) ───────────────────── */

    function initWizPyramid() {
        const canvas = document.getElementById('wiz-pyr-canvas');
        const container = document.getElementById('wiz-pyramid-area');
        if (!canvas || !container) return;

        const verts = [
            [0, -1.2, 0],
            [-1, 0.6, -1],
            [1, 0.6, -1],
            [1, 0.6, 1],
            [-1, 0.6, 1],
        ];
        const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3], [3, 4], [4, 1]];

        let ay = 0;
        const ax = 0.38;
        const ctx = canvas.getContext('2d');
        const FRAME_MS = 1000 / 24;
        let lastFrameTime = 0;
        let stopped = false;

        function rotY(v, a) { return [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)]; }
        function rotX(v, a) { return [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)]; }
        function project(v, cx, cy, scale) { const fov = 4.5; const s = (fov / (v[2] + fov)) * scale; return [cx + v[0] * s, cy + v[1] * s]; }

        function draw(now) {
            if (stopped) return;
            if (!window._wizPyramidVisible || document.hidden) { requestAnimationFrame(draw); return; }
            if (now - lastFrameTime < FRAME_MS) { requestAnimationFrame(draw); return; }
            const elapsed = now - lastFrameTime;
            lastFrameTime = now;

            const W = container.offsetWidth || 300;
            const H = container.offsetHeight || 200;
            if (canvas.width !== W) canvas.width = W;
            if (canvas.height !== H) canvas.height = H;

            ctx.clearRect(0, 0, W, H);
            const scale = Math.min(W, H) * 0.24;
            const pts = verts.map(v => project(rotX(rotY(v, ay), ax), W / 2, H / 2, scale));

            // Red on Son of Sam, green on everything else
            const lineColor = document.body.classList.contains('theme-son-of-sam') ? '#cc0000' : 'rgb(0,130,25)';

            ctx.strokeStyle = lineColor;
            ctx.globalAlpha = 0.12;
            ctx.lineWidth = 8;
            ctx.beginPath();
            edges.forEach(([a, b]) => { ctx.moveTo(pts[a][0], pts[a][1]); ctx.lineTo(pts[b][0], pts[b][1]); });
            ctx.stroke();

            ctx.strokeStyle = lineColor;
            ctx.globalAlpha = 0.75;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            edges.forEach(([a, b]) => { ctx.moveTo(pts[a][0], pts[a][1]); ctx.lineTo(pts[b][0], pts[b][1]); });
            ctx.stroke();
            ctx.globalAlpha = 1;

            ay += 0.00036 * elapsed;
            requestAnimationFrame(draw);
        }

        window._wizPyramidVisible = false;
        canvas._stop = () => { stopped = true; };
        requestAnimationFrame(draw);
    }

    /* ── Save-button relocation helpers (step-last 2×2 nav grid) ─────────── */

    function _moveSaveBtnsToNav() {
        const nav = document.getElementById('wiz-nav');
        const backBtn = document.getElementById('wiz-back');
        const copyBtn = document.getElementById('copy-link-btn');
        const clearSaveBtn = document.getElementById('clear-save-btn');
        if (!nav || !copyBtn || !clearSaveBtn) return;
        // Order: [Copy Share Link] [Clear Save]
        //        [← Back         ] [Finish ✓  ]
        nav.insertBefore(clearSaveBtn, backBtn);
        nav.insertBefore(copyBtn, clearSaveBtn);
    }

    function _restoreSaveBtnsFromNav() {
        const secBtns = document.getElementById('save-share-buttons');
        if (!secBtns) return;
        const copyBtn = document.getElementById('copy-link-btn');
        const clearSaveBtn = document.getElementById('clear-save-btn');
        // Re-insert in original order as first two children
        if (clearSaveBtn && clearSaveBtn.parentNode !== secBtns) secBtns.insertBefore(clearSaveBtn, secBtns.firstChild);
        if (copyBtn && copyBtn.parentNode !== secBtns) secBtns.insertBefore(copyBtn, secBtns.firstChild);
    }

    /* ── Activate ─────────────────────────────────────────────────────────── */

    function activate() {
        if (document.getElementById('wiz-outer')) return; // already running

        // Resolve elements now, while the DOM is intact
        resolvedSteps = resolveSteps();

        // Store original positions + display, then hide every wizard panel
        getAllElements().forEach(el => {
            originalPos.set(el, { parent: el.parentNode, nextSibling: el.nextSibling });
            originalDisplay.set(el, el.style.display);
            el.style.display = 'none';
        });

        // Build the outer flex wrapper (tips sidebar + shell) before #stats-buy-section
        const anchor = document.getElementById('stats-buy-section');
        if (!anchor || !anchor.parentNode) return;

        const outer = document.createElement('div');
        outer.id = 'wiz-outer';

        // Tips sidebar — lives inside outer, to the left of the shell
        const tips = document.createElement('div');
        tips.id = 'wiz-tips';
        outer.appendChild(tips);

        // Shell
        const shell = document.createElement('div');
        shell.id = 'wiz-shell';
        shell.innerHTML =
            '<div id="wiz-header">' +
            '<div id="wiz-step-label">Step 1 of ' + STEPS.length + ' \u2014 ' + STEPS[0].label + '</div>' +
            '<div id="wiz-progress-track"><div id="wiz-progress-fill"></div></div>' +
            '</div>' +
            '<div id="wiz-pyramid-area" style="display:none"><canvas id="wiz-pyr-canvas"></canvas></div>' +
            '<div id="wiz-content"></div>' +
            '<div id="wiz-nav">' +
            '<button type="button" id="wiz-back">&#8592; Back</button>' +
            '<button type="button" id="wiz-next">Next &#8594;</button>' +
            '</div>' +
            '<div id="wiz-footer"></div>';
        outer.appendChild(shell);

        anchor.parentNode.insertBefore(outer, anchor);

        // Start the step-8 pyramid animation
        initWizPyramid();

        // Wire navigation
        document.getElementById('wiz-back').addEventListener('click', () => goTo(currentStep - 1));
        document.getElementById('wiz-next').addEventListener('click', () => {
            if (currentStep === STEPS.length - 1) { finish(); } else { goTo(currentStep + 1); }
        });

        // Hide floating dice roller while wizard is active
        const dicePanel = document.getElementById('dr-panel');
        if (dicePanel) { dicePanel.dataset.wizHidden = dicePanel.style.display || ''; dicePanel.style.display = 'none'; }

        // Hide page title, intro, and footer while wizard is active
        ['.page-title', '.site-intro', '.site-footer'].forEach(sel => {
            const el = document.querySelector(sel);
            if (el) { el.dataset.wizHidden = el.style.display || ''; el.style.display = 'none'; }
        });

        // Update toggle button state
        const toggleBtn = document.getElementById('wiz-toggle-btn');
        if (toggleBtn) { toggleBtn.textContent = '✕ Exit Wizard'; toggleBtn.dataset.active = 'true'; }

        // Move advanced-options into wiz-footer (shown only on last step)
        const _advOpts = document.getElementById('advanced-options-details');
        if (_advOpts) {
            originalPos.set(_advOpts, { parent: _advOpts.parentNode, nextSibling: _advOpts.nextSibling });
            originalDisplay.set(_advOpts, _advOpts.style.display);
            document.getElementById('wiz-footer')?.appendChild(_advOpts);
            _advOpts.style.display = 'none';
        }

        const saved = parseInt(localStorage.getItem('dg-wiz-step'), 10);
        goTo(!isNaN(saved) && saved >= 0 && saved < STEPS.length ? saved : 0);
    }

    /* ── Deactivate ───────────────────────────────────────────────────────── */

    function deactivate() {
        if (currentStep === null) return;

        // Move any elements currently inside wiz-content back to original positions
        const content = document.getElementById('wiz-content');
        if (content) {
            // wiz-content children are the current step's elements
            getAllElements().forEach(el => {
                if (el.parentNode === content) {
                    const pos = originalPos.get(el);
                    if (pos && pos.parent) {
                        pos.parent.insertBefore(el, pos.nextSibling);
                    }
                }
            });
        }

        // Restore advanced-options-details from wiz-footer before removing wiz-outer
        const _advOpts = document.getElementById('advanced-options-details');
        if (_advOpts) {
            const _pos = originalPos.get(_advOpts);
            if (_pos?.parent) _pos.parent.insertBefore(_advOpts, _pos.nextSibling);
            const _disp = originalDisplay.get(_advOpts);
            if (_disp !== undefined) _advOpts.style.display = _disp;
        }

        // Restore inline display for all tracked elements
        originalDisplay.forEach((display, el) => {
            el.style.display = display;
        });

        // Restore save buttons from nav if we're on the last step
        if (currentStep === STEPS.length - 1) _restoreSaveBtnsFromNav();

        // Stop the wizard pyramid animation loop before the canvas is removed
        document.getElementById('wiz-pyr-canvas')?._stop?.();
        window._wizPyramidVisible = false;

        // Clean up DOM nodes and state
        document.getElementById('wiz-outer')?.remove();

        originalPos.clear();
        originalDisplay.clear();
        resolvedSteps = null;
        currentStep = null;

        // Always clear the saved step — whether exited manually or finished.
        localStorage.removeItem('dg-wiz-step');

        // Restore dice roller
        const dicePanel = document.getElementById('dr-panel');
        if (dicePanel && dicePanel.dataset.wizHidden !== undefined) { dicePanel.style.display = dicePanel.dataset.wizHidden; delete dicePanel.dataset.wizHidden; }

        // Restore page title, intro, and footer
        ['.page-title', '.site-intro', '.site-footer'].forEach(sel => {
            const el = document.querySelector(sel);
            if (el && el.dataset.wizHidden !== undefined) { el.style.display = el.dataset.wizHidden; delete el.dataset.wizHidden; }
        });

        // Update toggle button state
        const toggleBtn = document.getElementById('wiz-toggle-btn');
        if (toggleBtn) { toggleBtn.textContent = '\u2726 Character Creation Wizard'; delete toggleBtn.dataset.active; }
    }

    /* ── goTo(n) ──────────────────────────────────────────────────────────── */

    function goTo(n) {
        if (!resolvedSteps) return;
        n = Math.max(0, Math.min(STEPS.length - 1, n));

        const content = document.getElementById('wiz-content');
        if (!content) return;

        // Return current step's elements to their original DOM positions (hidden)
        if (currentStep !== null) {
            // If leaving the last step, restore save buttons before moving #save-share-bar
            if (currentStep === STEPS.length - 1) _restoreSaveBtnsFromNav();
            resolvedSteps[currentStep].elements.forEach(el => {
                if (el.parentNode === content) {
                    const pos = originalPos.get(el);
                    if (pos && pos.parent) {
                        pos.parent.insertBefore(el, pos.nextSibling);
                    }
                }
                el.style.display = 'none';
            });
        }

        currentStep = n;
        localStorage.setItem('dg-wiz-step', String(n));

        // Move new step's elements into wiz-content and reveal them
        resolvedSteps[n].elements.forEach(el => {
            content.appendChild(el);
            el.style.display = originalDisplay.get(el) !== undefined
                ? (originalDisplay.get(el) || '')
                : '';
        });

        // Update step label
        const label = document.getElementById('wiz-step-label');
        if (label) label.textContent = 'Step ' + (n + 1) + ' of ' + STEPS.length + ' \u2014 ' + STEPS[n].label;

        // Update progress bar fill
        const fill = document.getElementById('wiz-progress-fill');
        if (fill) fill.style.width = ((n + 1) / STEPS.length * 100) + '%';

        // Update tips
        const tipsBox = document.getElementById('wiz-tips');
        if (tipsBox) {
            const step = STEPS[n];
            if (step.tipsHTML) {
                tipsBox.innerHTML = step.tipsHTML;
                tipsBox.classList.add('wiz-tips-html');
            } else {
                tipsBox.textContent = step.tips;
                tipsBox.classList.remove('wiz-tips-html');
            }
        }

        // Back button: disabled on first step
        const backBtn = document.getElementById('wiz-back');
        if (backBtn) backBtn.disabled = (n === 0);

        // Next button: "Finish" on last step
        const nextBtn = document.getElementById('wiz-next');
        if (nextBtn) nextBtn.textContent = n === STEPS.length - 1 ? 'Finish \u2713' : 'Next \u2192';

        // Show advanced-options only on last step (lives in wiz-footer)
        const _advOpts = document.getElementById('advanced-options-details');
        if (_advOpts) _advOpts.style.display = (n === STEPS.length - 1) ? '' : 'none';

        // Step-last: pyramid hero + unified 2×2 button grid
        const isLast = (n === STEPS.length - 1);
        const outer = document.getElementById('wiz-outer');
        if (outer) outer.classList.toggle('step-last', isLast);
        const pyrArea = document.getElementById('wiz-pyramid-area');
        if (pyrArea) pyrArea.style.display = isLast ? '' : 'none';
        window._wizPyramidVisible = isLast;
        if (isLast) _moveSaveBtnsToNav();

        // Pin the step header bar flush to top of viewport on every step
        const stepBar = document.getElementById('wiz-header');
        if (stepBar) window.scrollTo({ top: stepBar.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
    }

    /* ── finish() ─────────────────────────────────────────────────────────── */

    function finish() {
        localStorage.removeItem('dg-wiz-step');
        deactivate();
    }

    /* ── Public API ───────────────────────────────────────────────────────── */

    function toggle() {
        if (document.getElementById('wiz-outer')) { deactivate(); } else { activate(); }
    }

    window.dgWizard = { activate, deactivate, goTo, toggle, _currentStep: () => currentStep };

    /* ── Auto-restore on page load ────────────────────────────────────────── */
    // If a saved step exists the user was mid-wizard before the refresh — reopen.
    // IMPORTANT: We must wait until after save-load.js has finished restoring state
    // (theme, skills, etc.) before activating the wizard. save-load uses a 200ms
    // setTimeout inside its 'load' listener, so we wait 400ms to be safe.
    if (localStorage.getItem('dg-wiz-step') !== null) {
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

        window.addEventListener('load', function () {
            setTimeout(function () {
                activate();
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        const stepBar = document.getElementById('wiz-header');
                        if (stepBar) window.scrollTo({ top: stepBar.getBoundingClientRect().top + window.scrollY, behavior: 'auto' });
                    });
                });
            }, 400);
        });
    }
})();
