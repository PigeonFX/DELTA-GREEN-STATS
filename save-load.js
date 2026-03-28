/**
 * DELTA GREEN STATS — Save / Load / Share
 *
 * Features:
 *  • Auto-save: every input/change event is debounced and written to localStorage.
 *  • Auto-load: on page ready, tries URL hash first, then localStorage.
 *  • Share URL: encodes the full character state as base64 in the URL hash.
 *
 * Public API (window.dgSaveLoad):
 *   .save()       — manual save to localStorage
 *   .share()      — encode state into URL hash and copy to clipboard
 *   .clearSave()  — wipe localStorage save
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'dg-agent-v1';
    const STATS = ['STR', 'DEX', 'CON', 'INT', 'POW', 'CHA'];
    const BOND_CATS = ['PISCES_UK', 'DELTA_GREEN', 'FRIENDS_FAMILY', 'UNDERWORLD', 'LGBTQ'];

    // Suppress auto-save while we are restoring state
    let _restoring = false;

    /* =========================================================================
       COLLECT
    ========================================================================= */
    function collectState() {
        const g = id => document.getElementById(id)?.value ?? '';

        // Top-level stat spans (point-buy display)
        const stats = {};
        STATS.forEach(stat => {
            const el = document.getElementById(`${stat}-value`);
            stats[stat] = el ? (parseInt(el.innerText) || 3) : 3;
        });

        // Character-sheet stat inputs (may differ from above if user edited them)
        const csStats = {};
        STATS.forEach(stat => {
            const el = document.getElementById(`cs-${stat}`);
            csStats[stat] = el ? (parseInt(el.value) || 3) : 3;
        });

        // Derived attributes
        const derived = {
            hp: parseInt(g('cs-hp')) || 0,
            wp: parseInt(g('cs-wp')) || 0,
            san: parseInt(g('cs-sanity-value')) || 0,
            bp: parseInt(g('cs-breaking-point')) || 0,
        };

        // Biography
        const bio = {
            name: g('cs-name'),
            profession: g('cs-profession-select'),
            employer: g('cs-bio-employer'),
            nationality: g('cs-bio-nationality'),
            sex: g('cs-bio-sex'),
            age: g('cs-bio-age'),
            education: g('cs-bio-education'),
            physicalDesc: g('cs-physical-desc'),
        };

        // Predefined skills (values)
        const skills = {};
        document.querySelectorAll('#cs-skills input[id^="cs-skill-"]').forEach(el => {
            skills[el.id.replace('cs-skill-', '')] = parseInt(el.value) || 0;
        });

        // Predefined skill specialties (selects)
        const skillSpecs = {};
        document.querySelectorAll('#cs-skills select[id^="cs-skill-"]').forEach(el => {
            skillSpecs[el.id.replace('cs-skill-', '').replace(/-spec$/, '')] = el.value || '';
        });

        // Custom skill rows
        const customSkills = [];
        document.querySelectorAll('#cs-custom-skills .custom-skill-row').forEach(row => {
            const nameInput = row.querySelector('.custom-skill-name');
            const valueInput = row.querySelector('.custom-skill-value');
            const specSelect = row.querySelector('.cs-skill-specialty');
            const label = row.querySelector('label');
            const value = parseInt(valueInput?.value) || 0;

            if (label) {
                // Specialty-type row (Art, Craft, Science, Pilot, Military Science, Foreign Language)
                const base = label.textContent.replace(':', '').trim();
                const spec = specSelect ? specSelect.value : (nameInput ? nameInput.value : '');
                const fullName = spec ? `${base} (${spec})` : base;
                customSkills.push({ fromProfession: true, name: fullName, value });
            } else if (nameInput) {
                // Either readonly (profession-added named skill) or editable (user custom)
                customSkills.push({ fromProfession: nameInput.readOnly, name: nameInput.value || '', value });
            }
        });

        // Bonds
        const bonds = (window.bondsOnSheet || []).map(b => ({ ...b }));

        // Sanity adaptations
        const sanity = {
            violence: [1, 2, 3].map(n => document.getElementById(`cs-violence-incident${n}`)?.checked || false),
            helplessness: [1, 2, 3].map(n => document.getElementById(`cs-helplessness-incident${n}`)?.checked || false),
        };

        // Misc
        const theme = document.getElementById('cs-theme-select')?.value || 'xfiles';
        const protoJson = g('cs-prototype-json');
        const itemsJson = g('cs-items-json');
        const bondCats = {};
        BOND_CATS.forEach(cat => { bondCats[cat] = document.getElementById(cat)?.checked || false; });

        return { v: 1, stats, csStats, derived, bio, skills, skillSpecs, customSkills, bonds, sanity, theme, protoJson, itemsJson, bondCats };
    }

    /* =========================================================================
       APPLY
    ========================================================================= */
    function applyState(state) {
        if (!state || state.v !== 1) return;
        _restoring = true;

        // ── Phase 1 (synchronous): things that don't depend on form re-render ──

        // Theme
        if (state.theme) {
            const sel = document.getElementById('cs-theme-select');
            if (sel) { sel.value = state.theme; sel.dispatchEvent(new Event('change')); }
        }

        // Bio fields
        if (state.bio) {
            const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
            set('cs-name', state.bio.name);
            set('cs-bio-employer', state.bio.employer);
            set('cs-bio-nationality', state.bio.nationality);
            set('cs-bio-sex', state.bio.sex);
            set('cs-bio-age', state.bio.age);
            set('cs-bio-education', state.bio.education);
            set('cs-physical-desc', state.bio.physicalDesc);
        }

        // Misc JSON
        if (state.protoJson !== undefined) { const el = document.getElementById('cs-prototype-json'); if (el) el.value = state.protoJson; }
        if (state.itemsJson !== undefined) { const el = document.getElementById('cs-items-json'); if (el) el.value = state.itemsJson; }

        // Bond categories
        if (state.bondCats) {
            BOND_CATS.forEach(cat => {
                const el = document.getElementById(cat);
                if (el) el.checked = state.bondCats[cat] || false;
            });
        }

        // Bonds array
        if (state.bonds) {
            window.bondsOnSheet = state.bonds.map(b => ({ ...b }));
            if (typeof renderBondsOnSheet === 'function') renderBondsOnSheet();
        }

        // Top-level stat spans — this triggers the MutationObserver which calls
        // populateCharacterSheetForm() and overwrites form values.  That is fine
        // because Phase 2 (100 ms later) restores them after the observer fires.
        if (state.stats) {
            STATS.forEach(stat => {
                const el = document.getElementById(`${stat}-value`);
                if (!el) return;
                el.innerText = state.stats[stat];
                const x5 = document.getElementById(`${stat}-x5-value`);
                if (x5) x5.innerText = state.stats[stat] * 5;
                const desc = document.getElementById(`${stat}-descriptor`);
                if (desc && typeof getDescriptor === 'function') desc.innerText = getDescriptor(stat, state.stats[stat]);
            });
            if (typeof updateTotalPoints === 'function') updateTotalPoints();
        }

        // ── Phase 2 (100 ms): override everything the observer may have reset ──
        setTimeout(() => {
            // CS stat inputs
            if (state.csStats) {
                STATS.forEach(stat => {
                    const el = document.getElementById(`cs-${stat}`);
                    if (el) el.value = state.csStats[stat] ?? state.stats?.[stat] ?? 3;
                });
            }

            // Derived
            if (state.derived) {
                const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
                set('cs-hp', state.derived.hp);
                set('cs-wp', state.derived.wp);
                set('cs-sanity-value', state.derived.san);
                set('cs-breaking-point', state.derived.bp);
            }

            // Profession (show info panel; do NOT re-apply skills — we restore them directly)
            if (state.bio?.profession) {
                const sel = document.getElementById('cs-profession-select');
                if (sel) {
                    sel.value = state.bio.profession;
                    if (typeof selectProfession === 'function') selectProfession(state.bio.profession);
                }
            }

            // Predefined skill values
            if (state.skills) {
                Object.entries(state.skills).forEach(([key, val]) => {
                    const el = document.getElementById(`cs-skill-${key}`);
                    if (el) el.value = val;
                });
            }

            // Skill specialties
            if (state.skillSpecs) {
                Object.entries(state.skillSpecs).forEach(([key, val]) => {
                    if (!val) return;
                    const el = document.getElementById(`cs-skill-${key}-spec`);
                    if (el) {
                        el.value = val;
                        el.classList.remove('highlight-empty-input');
                        el.style.color = '';
                        el.style.fontWeight = '';
                    }
                });
            }

            // Custom skills: clear and recreate
            const customDiv = document.getElementById('cs-custom-skills');
            if (customDiv) customDiv.innerHTML = '';
            if (state.customSkills?.length) {
                state.customSkills.forEach(cs => {
                    if (cs.fromProfession) {
                        if (typeof addCustomSkillFromProfession === 'function') {
                            addCustomSkillFromProfession(cs.name, cs.value);
                        }
                    } else {
                        if (typeof addCustomSkill === 'function') {
                            addCustomSkill();
                            const rows = document.getElementById('cs-custom-skills')?.querySelectorAll('.custom-skill-row');
                            if (rows?.length) {
                                const row = rows[rows.length - 1];
                                const ni = row.querySelector('.custom-skill-name');
                                const vi = row.querySelector('.custom-skill-value');
                                if (ni) ni.value = cs.name;
                                if (vi) vi.value = cs.value;
                            }
                        }
                    }
                });
            }

            // Sanity adaptations
            if (state.sanity) {
                ['violence', 'helplessness'].forEach(type => {
                    [1, 2, 3].forEach((n, i) => {
                        const el = document.getElementById(`cs-${type}-incident${n}`);
                        if (el) el.checked = state.sanity[type]?.[i] || false;
                    });
                });
                if (typeof updateSanityAdaptations === 'function') updateSanityAdaptations();
            }

            _restoring = false;
        }, 100);
    }

    /* =========================================================================
       PERSISTENCE
    ========================================================================= */
    function save() {
        if (_restoring) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(collectState()));
            _flashSaved();
        } catch (e) {
            console.warn('[DG Save]', e);
        }
    }

    function loadLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            applyState(JSON.parse(raw));
            return true;
        } catch (e) {
            console.warn('[DG Load]', e);
            return false;
        }
    }

    function clearSave() {
        if (!confirm('Clear all saved character data? This cannot be undone.')) return;
        localStorage.removeItem(STORAGE_KEY);
        showToast('Saved data cleared.');
    }

    /* =========================================================================
       SHARE URL
    ========================================================================= */
    function share() {
        try {
            const json = JSON.stringify(collectState());
            const bytes = new TextEncoder().encode(json);
            // Build base64 without spread (avoids call-stack limit on large arrays)
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            const b64 = btoa(binary);
            const url = `${location.origin}${location.pathname}#dg=${b64}`;

            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(url)
                    .then(() => showToast('Share link copied to clipboard!'))
                    .catch(() => _fallbackCopy(url));
            } else {
                _fallbackCopy(url);
            }
        } catch (e) {
            console.warn('[DG Share]', e);
        }
    }

    function _fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showToast('Share link copied to clipboard!'); }
        catch (_) { showToast('Could not copy — check the URL bar.'); history.replaceState(null, '', `${location.pathname}#dg=${btoa('')}`); }
        ta.remove();
    }

    function loadFromURL() {
        try {
            const hash = location.hash;
            if (!hash.startsWith('#dg=')) return false;
            const b64 = hash.slice(4);
            const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            const json = new TextDecoder().decode(bytes);
            const state = JSON.parse(json);
            applyState(state);
            history.replaceState(null, '', location.pathname + location.search);
            showToast('Character loaded from share link!');
            return true;
        } catch (e) {
            console.warn('[DG URL Load]', e);
            return false;
        }
    }

    /* =========================================================================
       UI FEEDBACK
    ========================================================================= */
    let _savedTimer;
    function _flashSaved() {
        const el = document.getElementById('dg-save-status');
        if (!el) return;
        el.classList.add('dg-saved-visible');
        clearTimeout(_savedTimer);
        _savedTimer = setTimeout(() => el.classList.remove('dg-saved-visible'), 2000);
    }

    function showToast(msg) {
        let toast = document.getElementById('dg-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'dg-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('dg-toast-visible');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove('dg-toast-visible'), 3000);
    }

    /* =========================================================================
       AUTO-SAVE
    ========================================================================= */
    let _debounce;
    function _onUserChange() {
        if (_restoring) return;
        clearTimeout(_debounce);
        _debounce = setTimeout(save, 1500);
    }
    document.addEventListener('input', _onUserChange);
    document.addEventListener('change', _onUserChange);

    /* =========================================================================
       PUBLIC API
    ========================================================================= */
    window.dgSaveLoad = { save, loadLocal, share, clearSave };

    /* =========================================================================
       INIT — run after scripts.js window.onload (and its 50 ms inner timer)
    ========================================================================= */
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (!loadFromURL()) loadLocal();
        }, 200);
    });
})();
