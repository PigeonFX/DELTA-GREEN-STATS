/**
 * DELTA GREEN STATS — Animated Multi-Die Roller
 *
 * Dice: d4, d6, d8, d10, d12, d20, d% (percentile)
 * Percentile mode shows two d10 faces + DG result tiers.
 * All other dice show a single animated face.
 * Draggable, collapsible, theme-aware.
 */
(function () {
    'use strict';

    /* ── Dice config ──────────────────────────────────────────────── */
    const DICE = [
        { id: 'd4', sides: 4, label: 'D4' },
        { id: 'd6', sides: 6, label: 'D6' },
        { id: 'd8', sides: 8, label: 'D8' },
        { id: 'd10', sides: 10, label: 'D10' },
        { id: 'd12', sides: 12, label: 'D12' },
        { id: 'd20', sides: 20, label: 'D20' },
        { id: 'dpct', sides: 100, label: 'D%' },
    ];

    // O(1) die config lookup — avoids Array.find() on every roll/selection
    const DICE_MAP = new Map(DICE.map(d => [d.id, d]));

    // Hoisted constant — avoids per-selectDie array allocation
    const SHAPE_CLASSES = ['dr-shape-d4', 'dr-shape-d6', 'dr-shape-d8', 'dr-shape-d10', 'dr-shape-d12', 'dr-shape-d20'];

    /* ── Die wireframe SVGs (stroke='currentColor' picks up theme colour) ── */
    const DIE_SVGS = {
        d4: `<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'><polygon points='50,5 95,90 5,90' stroke='currentColor' stroke-width='5' stroke-linejoin='round'/><line x1='50' y1='5' x2='50' y2='90' stroke='currentColor' stroke-width='1.5' stroke-opacity='0.45'/></svg>`,
        d6: `<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'><polygon points='50,5 91,28 91,72 50,95 9,72 9,28' stroke='currentColor' stroke-width='5' stroke-linejoin='round'/><line x1='50' y1='5' x2='50' y2='50' stroke='currentColor' stroke-width='1.5' stroke-opacity='0.5'/><line x1='91' y1='28' x2='50' y2='50' stroke='currentColor' stroke-width='1.5' stroke-opacity='0.5'/><line x1='9' y1='28' x2='50' y2='50' stroke='currentColor' stroke-width='1.5' stroke-opacity='0.5'/></svg>`,
        d8: `<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'><polygon points='50,4 96,50 50,96 4,50' stroke='currentColor' stroke-width='5' stroke-linejoin='round'/><line x1='4' y1='50' x2='96' y2='50' stroke='currentColor' stroke-width='1.5' stroke-opacity='0.5'/></svg>`,
        d10: `<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'><polygon points='50,4 93,38 74,96 26,96 7,38' stroke='currentColor' stroke-width='5' stroke-linejoin='round'/><line x1='7' y1='38' x2='93' y2='38' stroke='currentColor' stroke-width='1.5' stroke-opacity='0.5'/><line x1='50' y1='4' x2='50' y2='38' stroke='currentColor' stroke-width='1.5' stroke-opacity='0.4'/></svg>`,
        d12: `<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'><polygon points='50,4 96,36 78,93 22,93 4,36' stroke='currentColor' stroke-width='5' stroke-linejoin='round'/><polygon points='50,28 74,46 66,73 34,73 26,46' stroke='currentColor' stroke-width='1.5' stroke-opacity='0.55' stroke-linejoin='round'/></svg>`,
        d20: `<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'><polygon points='50,4 91,27 91,73 50,96 9,73 9,27' stroke='currentColor' stroke-width='5' stroke-linejoin='round'/><polygon points='50,4 91,73 9,73' stroke='currentColor' stroke-width='1.5' stroke-opacity='0.6' stroke-linejoin='round'/></svg>`,
    };

    let _activeDie = 'dpct';   // default to percentile
    let _rolling = false;
    let _e = null;     // cached DOM nodes, populated after buildPanel

    /* ── Percentile result tiers (Delta Green Agent's Handbook pp.44-45) ── */
    // Critical Success: 01 always, OR matching dice (11,22,33,44) on a success
    // Fumble:           00/100 always, OR matching dice (55,66,77,88,99) on a failure
    function evaluate(roll, target) {
        if (!target || target <= 0) return null;
        if (roll === 1) return { tier: 'critical', label: 'CRITICAL SUCCESS', color: '#ffd700' };
        if (roll === 100) return { tier: 'fumble', label: 'FUMBLE', color: '#ff1744' };
        const tens = Math.floor(roll / 10);
        const units = roll % 10;
        if (tens === units) {
            if (roll <= target) return { tier: 'critical', label: 'CRITICAL SUCCESS', color: '#ffd700' };
            return { tier: 'fumble', label: 'FUMBLE', color: '#ff1744' };
        }
        if (roll <= target) return { tier: 'success', label: 'SUCCESS', color: '#69f0ae' };
        return { tier: 'failure', label: 'FAILURE', color: '#ff6d00' };
    }

    /* ── Animation helpers ────────────────────────────────────────── */
    const FRAMES = 16, FAST = 38, SLOW = 75;

    // Accepts a cached element reference directly — no querySelector inside tick loop
    function animateSingle(el, sides, finalVal, onDone) {
        if (!el) { onDone?.(); return; }
        const numEl = el.querySelector('.dr-face-num') || el;
        let f = 0;
        function step() {
            if (f < FRAMES) {
                numEl.textContent = Math.floor(Math.random() * sides) + 1;
                el.classList.add('dr-spin');
                setTimeout(() => el.classList.remove('dr-spin'), FAST - 8);
                f++;
                setTimeout(step, f > FRAMES - 4 ? SLOW : FAST);
            } else {
                numEl.textContent = finalVal;
                el.classList.add('dr-land');
                setTimeout(() => el.classList.remove('dr-land'), 420);
                onDone?.();
            }
        }
        step();
    }

    function animatePercent(finalRoll, onDone) {
        const { tens, units, tensNum, unitsNum } = _e;
        if (!tens || !units) { onDone?.(); return; }
        let f = 0;
        const fTens = finalRoll === 100 ? '00' : String(Math.floor(finalRoll / 10) * 10).padStart(2, '0');
        const fUnits = finalRoll === 100 ? '0' : String(finalRoll % 10);
        function step() {
            if (f < FRAMES) {
                const r = Math.floor(Math.random() * 100) + 1;
                tensNum.textContent = r === 100 ? '00' : String(Math.floor(r / 10) * 10).padStart(2, '0');
                unitsNum.textContent = r === 100 ? '0' : String(r % 10);
                tens.classList.add('dr-spin');
                units.classList.add('dr-spin');
                // One combined timeout instead of two (halves timer callbacks per frame)
                setTimeout(() => { tens.classList.remove('dr-spin'); units.classList.remove('dr-spin'); }, FAST - 8);
                f++;
                setTimeout(step, f > FRAMES - 4 ? SLOW : FAST);
            } else {
                tensNum.textContent = fTens;
                unitsNum.textContent = fUnits;
                tens.classList.add('dr-land');
                units.classList.add('dr-land');
                setTimeout(() => { tens.classList.remove('dr-land'); units.classList.remove('dr-land'); }, 420);
                onDone?.();
            }
        }
        step();
    }

    /* ── Switch active die ────────────────────────────────────────── */
    function selectDie(id) {
        _activeDie = id;
        _e.dieBtns.forEach(b => b.classList.toggle('dr-die-btn-active', b.dataset.die === id));
        const isPct = id === 'dpct';
        _e.faceSingle.style.display = isPct ? 'none' : 'flex';
        _e.facePct.style.display = isPct ? 'flex' : 'none';
        const cfg = DICE_MAP.get(id);
        if (_e.faceLabel) _e.faceLabel.textContent = cfg ? cfg.label : '';
        resetResult();
        const shapeId = isPct ? 'd10' : id;
        _e.faceDivs.forEach(el => {
            el.classList.remove(...SHAPE_CLASSES);
            el.classList.add(`dr-shape-${shapeId}`);
            const svgWrap = el.querySelector('.dr-die-svg-wrap');
            if (svgWrap) svgWrap.innerHTML = DIE_SVGS[shapeId] || DIE_SVGS.d10;
        });
        if (_e.nameEl) _e.nameEl.textContent = '';
        if (_e.manualEl && id !== 'dpct') _e.manualEl.value = '';
    }

    function resetResult() {
        const { resultLabel, resultBox, targetDisp, singleNum, tensNum, unitsNum, breakdownEl } = _e;
        if (resultLabel) { resultLabel.textContent = ''; resultLabel.style.color = ''; }
        if (resultBox) resultBox.className = 'dr-result-box';
        if (targetDisp) targetDisp.textContent = '';
        if (singleNum) singleNum.textContent = '--';
        if (tensNum) tensNum.textContent = '--';
        if (unitsNum) unitsNum.textContent = '--';
        if (breakdownEl) breakdownEl.textContent = '';
    }

    /* ── Core roll ────────────────────────────────────────────────── */
    function rollDie(targetOverride, skillName) {
        if (_rolling) return;
        _rolling = true;

        const cfg = DICE_MAP.get(_activeDie);
        const sides = cfg?.sides ?? 100;
        const rawVal = Math.floor(Math.random() * sides) + 1;
        const isPct = _activeDie === 'dpct';

        const { resultLabel, resultBox, targetDisp, nameEl, manualEl, panel, singleFace } = _e;

        if (nameEl) nameEl.textContent = skillName || '';
        if (_e.breakdownEl) _e.breakdownEl.textContent = '';
        if (resultLabel) { resultLabel.textContent = ''; resultLabel.style.color = ''; }
        if (resultBox) resultBox.className = 'dr-result-box dr-rolling';

        const target = typeof targetOverride === 'number' && targetOverride > 0
            ? targetOverride
            : (isPct ? parseInt(manualEl?.value) || 0 : 0);
        if (manualEl && target > 0 && isPct) manualEl.value = target;
        if (targetDisp) targetDisp.textContent = (isPct && target > 0) ? `TARGET: ${target}` : '';

        function onDone() {
            if (isPct) {
                const result = evaluate(rawVal, target);
                if (result && resultLabel) {
                    resultLabel.textContent = result.label;
                    resultLabel.style.color = result.color;
                    if (resultBox) resultBox.className = `dr-result-box dr-result-${result.tier}`;
                } else {
                    if (resultLabel) resultLabel.textContent = `ROLLED ${rawVal}`;
                    if (resultBox) resultBox.className = 'dr-result-box';
                }
            } else {
                if (resultLabel) { resultLabel.textContent = String(rawVal); resultLabel.style.color = ''; }
                if (resultBox) resultBox.className = 'dr-result-box';
            }
            _rolling = false;
        }

        if (isPct) {
            animatePercent(rawVal, onDone);
        } else {
            animateSingle(singleFace, sides, rawVal, onDone);
        }

        if (panel?.classList.contains('dr-collapsed')) togglePanel();
    }

    /* ── Skill-click entry point (always uses d%) ─────────────────── */
    function rollPercent(target, skillName) {
        if (_activeDie !== 'dpct') selectDie('dpct');
        rollDie(target, skillName);
    }

    /* ── Dice expression parser ─────────────────────────────────────── */
    // Accepts: d6, 2d6, 3d8+2, d4-1, 4d6, d20, etc. (1–20 dice, d2–d100)
    function parseExpr(str) {
        if (!str) return null;
        const m = str.trim().replace(/\s+/g, '').match(/^(\d*)d(\d+)([+-]\d+)?$/i);
        if (!m) return null;
        const count = m[1] === '' ? 1 : parseInt(m[1], 10);
        const sides = parseInt(m[2], 10);
        const modifier = m[3] ? parseInt(m[3], 10) : 0;
        if (!count || count < 1 || count > 20 || sides < 2 || sides > 100) return null;
        return { count, sides, modifier };
    }

    /* ── Expression roll ─────────────────────────────────────────────── */
    function rollExpr(expr) {
        if (_rolling) return;
        _rolling = true;

        const rolls = Array.from({ length: expr.count }, () => Math.floor(Math.random() * expr.sides) + 1);
        const total = rolls.reduce((a, b) => a + b, 0) + expr.modifier;

        const { resultLabel, resultBox, targetDisp, nameEl,
            faceSingle, facePct, faceLabel, breakdownEl } = _e;

        if (facePct) facePct.style.display = 'none';
        if (faceSingle) faceSingle.style.display = 'flex';

        if (nameEl) nameEl.textContent = '';
        if (targetDisp) targetDisp.textContent = '';
        if (resultLabel) { resultLabel.textContent = ''; resultLabel.style.color = ''; }
        if (resultBox) resultBox.className = 'dr-result-box dr-rolling';
        if (breakdownEl) breakdownEl.textContent = '';

        // Update die shape to match the expression die sides
        const shapeId = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20']
            .find(key => DICE_MAP.get(key)?.sides === expr.sides) || 'd10';
        _e.faceDivs.forEach(el => {
            el.classList.remove(...SHAPE_CLASSES);
            el.classList.add(`dr-shape-${shapeId}`);
            const svgWrap = el.querySelector('.dr-die-svg-wrap');
            if (svgWrap) svgWrap.innerHTML = DIE_SVGS[shapeId] || DIE_SVGS.d10;
        });
        if (faceLabel) {
            const mod = expr.modifier > 0 ? `+${expr.modifier}` : expr.modifier < 0 ? `${expr.modifier}` : '';
            faceLabel.textContent = `${expr.count > 1 ? expr.count : ''}D${expr.sides}${mod}`;
        }

        animateSingle(_e.singleFace, expr.count * expr.sides, total, () => {
            if (resultLabel) { resultLabel.textContent = String(total); resultLabel.style.color = ''; }
            if (resultBox) resultBox.className = 'dr-result-box';
            if (breakdownEl && (expr.count > 1 || expr.modifier !== 0)) {
                const rollStr = expr.count > 1 ? `[${rolls.join(', ')}]` : `${rolls[0]}`;
                const modStr = expr.modifier > 0 ? ` + ${expr.modifier}`
                    : expr.modifier < 0 ? ` \u2212 ${Math.abs(expr.modifier)}` : '';
                breakdownEl.textContent = `${rollStr}${modStr}`;
            }
            _rolling = false;
        });

        if (_e.panel?.classList.contains('dr-collapsed')) togglePanel();
    }

    /* ── Manual roll button ───────────────────────────────────────── */
    function rollManual() {
        const val = _e.manualEl?.value?.trim() || '';
        const expr = parseExpr(val);
        if (expr) { rollExpr(expr); return; }
        rollDie(parseInt(val) || 0);
    }

    /* ── Panel toggle ─────────────────────────────────────────────── */
    function togglePanel() {
        const { panel, body, arrow } = _e;
        if (!panel) return;
        const collapsed = panel.classList.toggle('dr-collapsed');
        if (body) body.style.display = collapsed ? 'none' : '';
        if (arrow) arrow.textContent = collapsed ? '▲' : '▼';
    }

    /* ── Drag ─────────────────────────────────────────────────────── */
    function initDrag(handle, panel) {
        let ox = 0, oy = 0, sx = 0, sy = 0;
        handle.addEventListener('mousedown', e => {
            if (e.target.closest('button, input')) return;
            e.preventDefault();
            ox = panel.offsetLeft; oy = panel.offsetTop;
            sx = e.clientX; sy = e.clientY;
            function onMove(e) {
                panel.style.left = `${Math.max(0, Math.min(ox + e.clientX - sx, window.innerWidth - panel.offsetWidth))}px`;
                panel.style.top = `${Math.max(0, Math.min(oy + e.clientY - sy, window.innerHeight - panel.offsetHeight))}px`;
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
            }
            function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
        handle.addEventListener('touchstart', e => {
            if (e.target.closest('button, input')) return;
            const t = e.touches[0]; ox = panel.offsetLeft; oy = panel.offsetTop; sx = t.clientX; sy = t.clientY;
        }, { passive: true });
        handle.addEventListener('touchmove', e => {
            const t = e.touches[0];
            panel.style.left = `${Math.max(0, Math.min(ox + t.clientX - sx, window.innerWidth - panel.offsetWidth))}px`;
            panel.style.top = `${Math.max(0, Math.min(oy + t.clientY - sy, window.innerHeight - panel.offsetHeight))}px`;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        }, { passive: true });
    }

    /* ── Build DOM ────────────────────────────────────────────────── */
    function buildPanel() {
        const panel = document.createElement('div');
        panel.id = 'dr-panel';

        // No inline onclick — all events wired via addEventListener below
        const diePills = DICE.map(d =>
            `<button type="button" class="dr-die-btn${d.id === 'dpct' ? ' dr-die-btn-active' : ''}" data-die="${d.id}" title="Roll a ${d.label}"><span class="dr-die-icon" aria-hidden="true"></span><span class="dr-die-lbl">${d.label}</span></button>`
        ).join('');

        panel.innerHTML = `
<div id="dr-handle" title="Drag to move">
  <span id="dr-title">&#9861;&nbsp;DICE ROLLER</span>
  <div class="dr-handle-controls">
    <button type="button" id="dr-arrow" title="Collapse / expand">▼</button>
  </div>
</div>
<div id="dr-body">
  <div id="dr-die-pills">${diePills}</div>
  <div id="dr-face-area">
    <div id="dr-face-single" style="display:none;" class="dr-face-wrap">
      <div class="dr-die-face dr-shape-d10" id="dr-single-face"><span class="dr-face-num">--</span></div>
      <div class="dr-face-type" id="dr-face-label">D6</div>
    </div>
    <div id="dr-face-percent" class="dr-face-wrap">
      <div class="dr-pct-pair">
        <div class="dr-pct-die">
          <div class="dr-die-face dr-shape-d10" id="dr-tens"><span class="dr-face-num">--</span></div>
          <div class="dr-pct-lbl">TENS</div>
        </div>
        <div class="dr-pct-sep">&times;</div>
        <div class="dr-pct-die">
          <div class="dr-die-face dr-shape-d10" id="dr-units"><span class="dr-face-num">--</span></div>
          <div class="dr-pct-lbl">UNITS</div>
        </div>
      </div>
    </div>
  </div>
  <div id="dr-result-box" class="dr-result-box">
    <div id="dr-target-display"></div>
    <div id="dr-result-label"></div>
  </div>
  <div id="dr-breakdown"></div>
  <div id="dr-skill-name"></div>
  <div id="dr-manual-row">
    <input type="text" id="dr-manual-target" placeholder="target %, 2d6+3" title="Enter a target % to roll D% against, or a dice expression like 2d6+3 or d4-1">
    <button type="button" id="dr-roll-btn" title="Roll the selected die">ROLL</button>
  </div>
  <div id="dr-hint">Click a skill value to roll D% · type 2d6+3 for custom rolls</div>
</div>`;

        document.body.appendChild(panel);

        // Cache all DOM node references once — avoids repeated getElementById on every roll
        const $ = id => document.getElementById(id);
        _e = {
            panel,
            body: $('dr-body'),
            arrow: $('dr-arrow'),
            resultLabel: $('dr-result-label'),
            resultBox: $('dr-result-box'),
            targetDisp: $('dr-target-display'),
            nameEl: $('dr-skill-name'),
            breakdownEl: $('dr-breakdown'),
            manualEl: $('dr-manual-target'),
            faceSingle: $('dr-face-single'),
            facePct: $('dr-face-percent'),
            faceLabel: $('dr-face-label'),
            singleFace: $('dr-single-face'),
            singleNum: $('dr-single-face')?.querySelector('.dr-face-num'),
            tens: $('dr-tens'),
            tensNum: $('dr-tens')?.querySelector('.dr-face-num'),
            units: $('dr-units'),
            unitsNum: $('dr-units')?.querySelector('.dr-face-num'),
            dieBtns: panel.querySelectorAll('.dr-die-btn'),
            faceDivs: panel.querySelectorAll('.dr-die-face'),
        };

        // Wire events via addEventListener — no global dgDice dependency in markup
        _e.arrow.addEventListener('click', togglePanel);
        _e.dieBtns.forEach(b => b.addEventListener('click', () => selectDie(b.dataset.die)));
        $('dr-roll-btn').addEventListener('click', rollManual);
        _e.manualEl.addEventListener('keydown', e => { if (e.key === 'Enter') rollManual(); });

        // Start collapsed by default
        panel.classList.add('dr-collapsed');
        _e.body.style.display = 'none';
        _e.arrow.textContent = '▲';
        initDrag($('dr-handle'), panel);
    }

    /* ── Wire skill inputs ────────────────────────────────────────── */
    function wireSkillInputs() {
        document.addEventListener('click', e => {
            const el = e.target;
            if (el.matches?.('#cs-skills input.cs-skill-input')) {
                const key = el.id.replace('cs-skill-', '');
                // el.previousElementSibling is the nameSpan directly preceding each input in the grid
                const label = el.previousElementSibling?.textContent?.replace(':', '').trim()
                    || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                rollPercent(parseInt(el.value) || 0, label);
                return;
            }
            if (el.matches?.('#cs-custom-skills .custom-skill-value')) {
                const row = el.closest('.custom-skill-row');
                const ni = row?.querySelector('.custom-skill-name');
                const lbl = row?.querySelector('label');
                const spec = row?.querySelector('select');
                let name = lbl ? lbl.textContent.replace(':', '').trim() : (ni ? ni.value : 'Skill');
                if (spec?.value) name += ` (${spec.value})`;
                rollPercent(parseInt(el.value) || 0, name);
                return;
            }
            if (el.matches?.('#lp-sheet .lp-skill-val')) {
                const row = el.closest('tr');
                const nameTd = row?.querySelector('td:nth-child(2)');
                const name = nameTd?.textContent?.trim() || 'Skill';
                const pct = parseInt(el.value) || 0;
                rollPercent(pct, name);
                return;
            }
            if (el.matches?.('#lp-weapons-tbody .lp-weapon-pct')) {
                const pct = parseInt(el.dataset.pct) || 0;
                const name = el.dataset.name || 'Weapon';
                rollPercent(pct, name);
                return;
            }
            if (el.matches?.('#lp-weapons-tbody .lp-weapon-skill-inp')) {
                const pct = parseInt(el.value) || 0;
                const row = el.closest('tr');
                const name = row?.querySelector('.lp-weapon-name-inp')?.value || 'Weapon';
                rollPercent(pct, name);
                return;
            }
            if (el.matches?.('#cs-stats input.stat-input')) {
                const stat = el.id.replace('cs-', '');
                rollPercent((parseInt(el.value) || 0) * 5, `${stat} \u00d7 5`);
                return;
            }
            if (el.matches?.('#stats .x5-value')) {
                const stat = (el.id || '').replace('-x5-value', '');
                const val = parseInt(el.textContent) || 0;
                rollPercent(val, `${stat} \u00d75`);
                return;
            }
            // LP sheet stat x5 spans (id pattern: lp-stat-STR-x5)
            if (el.matches?.('#lp-sheet span[id^="lp-stat-"][id$="-x5"]')) {
                const stat = (el.id || '').replace('lp-stat-', '').replace('-x5', '');
                const val = parseInt(el.textContent) || 0;
                if (val > 0) rollPercent(val, `${stat} \u00d75`);
                return;
            }
        });
    }

    /* ── Public API ───────────────────────────────────────────────── */
    window.dgDice = { roll: rollPercent, rollManual, _toggle: togglePanel, _select: selectDie };

    /* ── Init ─────────────────────────────────────────────────────── */
    window.addEventListener('load', () => { buildPanel(); wireSkillInputs(); });
})();
