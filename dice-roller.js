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
        { id: 'd4', sides: 4, label: 'D4', shape: 'tri' },
        { id: 'd6', sides: 6, label: 'D6', shape: 'sq' },
        { id: 'd8', sides: 8, label: 'D8', shape: 'sq' },
        { id: 'd10', sides: 10, label: 'D10', shape: 'sq' },
        { id: 'd12', sides: 12, label: 'D12', shape: 'sq' },
        { id: 'd20', sides: 20, label: 'D20', shape: 'sq' },
        { id: 'dpct', sides: 100, label: 'D%', shape: 'pct' },
    ];

    let _activeDie = 'dpct';   // default to percentile
    let _rolling = false;

    /* ── Percentile result tiers ──────────────────────────────────── */
    function evaluate(roll, target) {
        if (!target || target <= 0) return null;
        const r = roll === 100 ? 100 : roll;
        if (r === 1) return { tier: 'critical', label: 'CRITICAL SUCCESS', color: '#ffd700' };
        if (r <= Math.floor(target / 5)) return { tier: 'extreme', label: 'EXTREME SUCCESS', color: '#00e5ff' };
        if (r <= Math.floor(target / 2)) return { tier: 'hard', label: 'HARD SUCCESS', color: '#00e676' };
        if (r <= target) return { tier: 'success', label: 'SUCCESS', color: '#69f0ae' };
        if (r >= 99) return { tier: 'fumble', label: 'FUMBLE', color: '#ff1744' };
        return { tier: 'failure', label: 'FAILURE', color: '#ff6d00' };
    }

    /* ── Animation helpers ────────────────────────────────────────── */
    const FRAMES = 16, FAST = 38, SLOW = 75;

    function animateSingle(elId, sides, finalVal, onDone) {
        const el = document.getElementById(elId);
        if (!el) { onDone?.(); return; }
        let f = 0;
        function step() {
            if (f < FRAMES) {
                el.textContent = Math.floor(Math.random() * sides) + 1;
                el.classList.add('dr-spin');
                setTimeout(() => el.classList.remove('dr-spin'), FAST - 8);
                f++;
                setTimeout(step, f > FRAMES - 4 ? SLOW : FAST);
            } else {
                el.textContent = finalVal;
                el.classList.add('dr-land');
                setTimeout(() => el.classList.remove('dr-land'), 420);
                onDone?.();
            }
        }
        step();
    }

    function animatePercent(finalRoll, onDone) {
        const tensEl = document.getElementById('dr-tens');
        const unitsEl = document.getElementById('dr-units');
        if (!tensEl || !unitsEl) { onDone?.(); return; }
        let f = 0;
        const fTens = finalRoll === 100 ? '00' : String(Math.floor((finalRoll - 1) / 10) * 10).padStart(2, '0');
        const fUnits = finalRoll === 100 ? '0' : String((finalRoll - 1) % 10 + 1);
        function step() {
            if (f < FRAMES) {
                const r = Math.floor(Math.random() * 100) + 1;
                const t = r === 100 ? '00' : String(Math.floor((r - 1) / 10) * 10).padStart(2, '0');
                const u = r === 100 ? '0' : String((r - 1) % 10 + 1);
                tensEl.textContent = t;
                unitsEl.textContent = u;
                [tensEl, unitsEl].forEach(e => {
                    e.classList.add('dr-spin');
                    setTimeout(() => e.classList.remove('dr-spin'), FAST - 8);
                });
                f++;
                setTimeout(step, f > FRAMES - 4 ? SLOW : FAST);
            } else {
                tensEl.textContent = fTens;
                unitsEl.textContent = fUnits;
                [tensEl, unitsEl].forEach(e => {
                    e.classList.add('dr-land');
                    setTimeout(() => e.classList.remove('dr-land'), 420);
                });
                onDone?.();
            }
        }
        step();
    }

    /* ── Switch active die ────────────────────────────────────────── */
    function selectDie(id) {
        _activeDie = id;
        // Update pill buttons
        document.querySelectorAll('.dr-die-btn').forEach(b => {
            b.classList.toggle('dr-die-btn-active', b.dataset.die === id);
        });
        // Show correct face area
        const isPct = id === 'dpct';
        document.getElementById('dr-face-single').style.display = isPct ? 'none' : 'flex';
        document.getElementById('dr-face-percent').style.display = isPct ? 'flex' : 'none';
        // Update die-type label in face
        const cfg = DICE.find(d => d.id === id);
        const lbl = document.getElementById('dr-face-label');
        if (lbl) lbl.textContent = cfg ? cfg.label : '';
        // Clear result
        resetResult();
        // Apply die shape to all face elements
        const shapeId = id === 'dpct' ? 'd10' : id;
        const shapeClasses = ['dr-shape-d4', 'dr-shape-d6', 'dr-shape-d8', 'dr-shape-d10', 'dr-shape-d12', 'dr-shape-d20'];
        document.querySelectorAll('.dr-die-face').forEach(el => {
            el.classList.remove(...shapeClasses);
            el.classList.add(`dr-shape-${shapeId}`);
        });
        // Clear skill context
        const nameEl = document.getElementById('dr-skill-name');
        if (nameEl) nameEl.textContent = '';
        const targetEl = document.getElementById('dr-manual-target');
        if (targetEl && id !== 'dpct') targetEl.value = '';
    }

    function resetResult() {
        const resultEl = document.getElementById('dr-result-label');
        const resultBox = document.getElementById('dr-result-box');
        const targetEl = document.getElementById('dr-target-display');
        if (resultEl) { resultEl.textContent = ''; resultEl.style.color = ''; }
        if (resultBox) resultBox.className = 'dr-result-box';
        if (targetEl) targetEl.textContent = '';
        // reset faces
        const single = document.getElementById('dr-single-face');
        if (single) single.textContent = '--';
        const tens = document.getElementById('dr-tens');
        const units = document.getElementById('dr-units');
        if (tens) tens.textContent = '--';
        if (units) units.textContent = '--';
    }

    /* ── Core roll ────────────────────────────────────────────────── */
    function rollDie(targetOverride, skillName) {
        if (_rolling) return;
        _rolling = true;

        const cfg = DICE.find(d => d.id === _activeDie);
        const sides = cfg?.sides ?? 100;
        const rawVal = Math.floor(Math.random() * sides) + 1;
        const isPct = _activeDie === 'dpct';

        // Update context label
        const nameEl = document.getElementById('dr-skill-name');
        if (nameEl) nameEl.textContent = skillName || '';

        // Clear result during roll
        const resultEl = document.getElementById('dr-result-label');
        const resultBox = document.getElementById('dr-result-box');
        const targetDispEl = document.getElementById('dr-target-display');
        if (resultEl) { resultEl.textContent = ''; resultEl.style.color = ''; }
        if (resultBox) resultBox.className = 'dr-result-box dr-rolling';

        // Sync target input
        const manualEl = document.getElementById('dr-manual-target');
        const target = typeof targetOverride === 'number' && targetOverride > 0
            ? targetOverride
            : (isPct ? parseInt(manualEl?.value) || 0 : 0);
        if (manualEl && target > 0 && isPct) manualEl.value = target;
        if (targetDispEl) targetDispEl.textContent = (isPct && target > 0) ? `TARGET: ${target}` : '';

        function onDone() {
            if (isPct) {
                const result = evaluate(rawVal, target);
                if (result && resultEl) {
                    resultEl.textContent = result.label;
                    resultEl.style.color = result.color;
                    if (resultBox) resultBox.className = `dr-result-box dr-result-${result.tier}`;
                } else {
                    if (resultEl) resultEl.textContent = `ROLLED ${rawVal}`;
                    if (resultBox) resultBox.className = 'dr-result-box';
                }
            } else {
                if (resultEl) { resultEl.textContent = String(rawVal); resultEl.style.color = ''; }
                if (resultBox) resultBox.className = 'dr-result-box';
            }
            _rolling = false;
        }

        if (isPct) {
            animatePercent(rawVal, onDone);
        } else {
            animateSingle('dr-single-face', sides, rawVal, onDone);
        }

        // Pop open if collapsed
        const panel = document.getElementById('dr-panel');
        if (panel?.classList.contains('dr-collapsed')) togglePanel();
    }

    /* ── Skill-click entry point (always uses d%) ─────────────────── */
    function rollPercent(target, skillName) {
        if (_activeDie !== 'dpct') selectDie('dpct');
        rollDie(target, skillName);
    }

    /* ── Manual roll button ───────────────────────────────────────── */
    function rollManual() {
        const el = document.getElementById('dr-manual-target');
        const t = parseInt(el?.value) || 0;
        rollDie(t);
    }

    /* ── Panel toggle ─────────────────────────────────────────────── */
    function togglePanel() {
        const panel = document.getElementById('dr-panel');
        const body = document.getElementById('dr-body');
        const arrow = document.getElementById('dr-arrow');
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
            panel.style.left = `${Math.max(0, ox + t.clientX - sx)}px`;
            panel.style.top = `${Math.max(0, oy + t.clientY - sy)}px`;
            panel.style.right = 'auto'; panel.style.bottom = 'auto';
        }, { passive: true });
    }

    /* ── Build DOM ────────────────────────────────────────────────── */
    function buildPanel() {
        const panel = document.createElement('div');
        panel.id = 'dr-panel';

        const diePills = DICE.map(d =>
            `<button type="button" class="dr-die-btn${d.id === 'dpct' ? ' dr-die-btn-active' : ''}" data-die="${d.id}" onclick="dgDice._select('${d.id}')" title="Roll a ${d.label}">${d.label}</button>`
        ).join('');

        panel.innerHTML = `
<div id="dr-handle" title="Drag to move">
  <span id="dr-title">&#9861;&nbsp;DICE ROLLER</span>
  <div class="dr-handle-controls">
    <button type="button" id="dr-arrow" onclick="dgDice._toggle()" title="Collapse / expand">▼</button>
  </div>
</div>
<div id="dr-body">
  <div id="dr-die-pills">${diePills}</div>
  <div id="dr-face-area">
    <div id="dr-face-single" style="display:none;" class="dr-face-wrap">
      <div class="dr-die-face dr-shape-d10" id="dr-single-face">--</div>
      <div class="dr-face-type" id="dr-face-label">D6</div>
    </div>
    <div id="dr-face-percent" class="dr-face-wrap">
      <div class="dr-pct-pair">
        <div class="dr-pct-die">
          <div class="dr-die-face dr-shape-d10" id="dr-tens">--</div>
          <div class="dr-pct-lbl">TENS</div>
        </div>
        <div class="dr-pct-sep">&times;</div>
        <div class="dr-pct-die">
          <div class="dr-die-face dr-shape-d10" id="dr-units">--</div>
          <div class="dr-pct-lbl">UNITS</div>
        </div>
      </div>
    </div>
  </div>
  <div id="dr-result-box" class="dr-result-box">
    <div id="dr-target-display"></div>
    <div id="dr-result-label"></div>
  </div>
  <div id="dr-skill-name"></div>
  <div id="dr-manual-row">
    <input type="number" id="dr-manual-target" min="1" max="99" placeholder="Target % for D%" title="Enter a target number to roll your D% against">
    <button type="button" onclick="dgDice.rollManual()" title="Roll the selected die">ROLL</button>
  </div>
  <div id="dr-hint">Click any skill value on the sheet to roll D%</div>
</div>`;

        document.body.appendChild(panel);
        initDrag(document.getElementById('dr-handle'), panel);
    }

    /* ── Wire skill inputs ────────────────────────────────────────── */
    function wireSkillInputs() {
        document.addEventListener('click', e => {
            const el = e.target;
            if (el.matches?.('#cs-skills input.cs-skill-input')) {
                const key = el.id.replace('cs-skill-', '');
                const label = el.closest('*')?.previousElementSibling?.textContent?.replace(':', '').trim()
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
            if (el.matches?.('#cs-stats input.stat-input')) {
                const stat = el.id.replace('cs-', '');
                rollPercent((parseInt(el.value) || 0) * 5, `${stat} \u00d7 5`);
                return;
            }
        });
    }

    /* ── Public API ───────────────────────────────────────────────── */
    window.dgDice = { roll: rollPercent, rollManual, _toggle: togglePanel, _select: selectDie };

    /* ── Init ─────────────────────────────────────────────────────── */
    window.addEventListener('load', () => { buildPanel(); wireSkillInputs(); });
})();
