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
        // Use textContent (not innerText) so values are read correctly even when
        // #stats-buy-section is display:none (field-doc theme hides it).
        const stats = {};
        STATS.forEach(stat => {
            const el = document.getElementById(`${stat}-value`);
            stats[stat] = el ? (parseInt(el.textContent) || 3) : 3;
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
            motivations: g('cs-motivations'),
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

        // Equipment loadout (item names from equipment picker)
        const equipment = (window.dgEquipment?.getLoadout?.() || []).map(i => i.name);

        // LP sheet free-text fields (only present when field-doc theme is active)
        const lpNotes = {
            wounds: document.getElementById('lp-wounds')?.value ?? '',
            gear: document.getElementById('lp-gear-content')?.value ?? '',
            remarks: document.getElementById('lp-remarks')?.value ?? '',
        };

        // LP weapons table rows (field-doc theme) — captures both picker-seeded and manually-added rows
        const lpWeapons = [];
        const _weapTbody = document.getElementById('lp-weapons-tbody');
        if (_weapTbody) {
            _weapTbody.querySelectorAll('tr').forEach(tr => {
                const nameInp = tr.querySelector('.lp-weapon-name-inp');
                if (!nameInp) return; // placeholder row — skip
                lpWeapons.push({
                    name: nameInp.value ?? '',
                    skillPct: tr.querySelector('.lp-weapon-skill-inp')?.value ?? '',
                    range: tr.querySelector('.lp-weapon-range-inp')?.value ?? '',
                    damage: tr.querySelector('.lp-weapon-dmg-inp')?.value ?? '',
                    lethality: tr.querySelector('.lp-weapon-leth-inp')?.value ?? '',
                    ammo: tr.querySelector('.lp-weapon-ammo-inp')?.value ?? '',
                    fromEquip: tr.classList.contains('lp-weapon-equip'),
                });
            });
        }

        // LP stat feature descriptors (user-editable labels next to each stat)
        const lpFeat = {};
        STATS.forEach(st => {
            const el = document.getElementById(`lp-feat-${st}`);
            if (el) lpFeat[st] = el.value || '';
        });

        // Bonus skill selections and whether they've been applied
        const bonusSkills = [];
        for (let i = 0; i < 8; i++) {
            const el = document.getElementById(`cs-bonus-skill-${i}`);
            if (el) bonusSkills.push(el.value || '');
        }
        const bonusApplied = document.getElementById('apply-bonus-button')?.classList.contains('apply-bonus-done') || false;
        const appliedBonuses = (typeof appState !== 'undefined') ? { ...appState.appliedBonuses } : {};
        const specialtyInstances = (typeof appState !== 'undefined') ? appState.specialtyInstances.map(i => ({ ...i })) : [];

        return { v: 1, stats, csStats, derived, bio, skills, skillSpecs, customSkills, bonds, sanity, theme, protoJson, itemsJson, bondCats, equipment, lpNotes, lpWeapons, lpFeat, bonusSkills, bonusApplied, appliedBonuses, specialtyInstances };
    }

    /* =========================================================================
       APPLY
    ========================================================================= */
    function applyState(state) {
        if (!state || state.v !== 1) return;
        _restoring = true;
        // Pause the stats MutationObserver so that writing to stat spans in Phase 1
        // does NOT queue a requestAnimationFrame that later calls
        // populateCharacterSheetForm() and resets all skill inputs to defaults.
        window._dgStatsObserver?.disconnect();

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
            if (state.bio.motivations !== undefined) set('cs-motivations', state.bio.motivations);
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
        // Guard: if the saved state has no bonds but dg-bonds-sheet already populated
        // window.bondsOnSheet (e.g. user refreshed before the auto-save debounce fired),
        // keep the dg-bonds-sheet data rather than overwriting with an empty array.
        if (state.bonds) {
            if (state.bonds.length > 0 || window.bondsOnSheet.length === 0) {
                window.bondsOnSheet = state.bonds.map(b => ({ ...b }));
            }
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

            // Specialty instances — restore directly from state.
            // Backwards compat: if no specialtyInstances in state, convert old customSkills and
            // skillSpecs entries that represent specialty skills into instances instead.
            if (typeof appState !== 'undefined' && typeof renderSpecialtySkills === 'function') {
                if (state.specialtyInstances?.length) {
                    appState.specialtyInstances = state.specialtyInstances.map(i => ({ ...i }));
                } else {
                    // Old save: migrate custom rows that are specialty skills to instances
                    const converted = [];
                    // From skillSpecs (old predefined grid specialty selects)
                    if (state.skillSpecs) {
                        Object.entries(state.skillSpecs).forEach(([key, spec]) => {
                            if (!spec) return;
                            const skillVal = state.skills?.[key] ?? 0;
                            if (skillVal > 0 && typeof SPECIALTY_SKILL_KEYS !== 'undefined' && SPECIALTY_SKILL_KEYS.has(key)) {
                                converted.push({ id: `mig-${key}-${Date.now()}`, key, specialty: spec, value: skillVal, source: 'profession' });
                            }
                        });
                    }
                    // From customSkills (old specialty custom rows)
                    if (state.customSkills) {
                        state.customSkills.forEach(cs => {
                            if (!cs.fromProfession || !cs.name) return;
                            const m = cs.name.match(/^(.+?)\s*\((.+?)\)$/);
                            if (!m) return;
                            const baseKey = m[1].trim().toLowerCase().replace(/\s+/g, '_');
                            if (typeof SPECIALTY_SKILL_KEYS !== 'undefined' && SPECIALTY_SKILL_KEYS.has(baseKey)) {
                                converted.push({ id: `mig-${baseKey}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, key: baseKey, specialty: m[2].trim(), value: cs.value, source: 'profession' });
                            }
                        });
                    }
                    appState.specialtyInstances = converted;
                }
                renderSpecialtySkills();
            }

            // Custom skills: clear and recreate (Foreign Language and truly custom rows only)
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

            // Equipment loadout
            if (state.equipment?.length) {
                if (typeof window.dgEquipment?.clear === 'function') window.dgEquipment.clear();
                state.equipment.forEach(name => {
                    if (typeof window.dgEquipment?.add === 'function') window.dgEquipment.add(name);
                });
            }

            _restoring = false;

            // Re-connect the observer now that all form state is restored.
            // This must happen BEFORE lpSyncBar / syncLpFromForm so any subsequent
            // stat changes by the user are picked up normally.
            const _statsEl = document.getElementById('stats');
            if (_statsEl) window._dgStatsObserver?.observe(_statsEl, { childList: true, subtree: true, characterData: true });

            // If the live-play sheet is active, force a complete rebuild now that
            // stats, skills and equipment are all correct.  Clearing the container
            // removes lp-weapons-tbody so buildLpSheet() treats it as a first build.
            const _lpContainer = document.getElementById('lp-sheet');
            const _isFieldDoc = document.getElementById('cs-theme-select')?.value === 'field-doc';
            if (_isFieldDoc && _lpContainer && typeof buildLpSheet === 'function') {
                _lpContainer.innerHTML = '';
                buildLpSheet(); // reads restored stat spans + skill inputs, calls syncLpFromForm internally
            } else {
                // Non-LP themes: just sync the bar
                if (typeof lpSyncBar === 'function') lpSyncBar();
                if (typeof syncLpFromForm === 'function') syncLpFromForm();
                if (typeof renderLpBonds === 'function' && document.getElementById('lp-bonds-tbody')) renderLpBonds();
                if (typeof _populateLpGear === 'function') _populateLpGear();
            }

            // LP notes — restored AFTER buildLpSheet/_populateLpGear so user text wins
            if (state.lpNotes) {
                const setTa = (id, v) => {
                    const el = document.getElementById(id);
                    if (el && v) {
                        el.value = v;
                        if (typeof lpAutoExpand === 'function') lpAutoExpand(el);
                    }
                };
                setTa('lp-wounds', state.lpNotes.wounds);
                setTa('lp-gear-content', state.lpNotes.gear);
                setTa('lp-remarks', state.lpNotes.remarks);
            }

            // LP weapons — replace auto-seeded rows with the full saved set
            if (state.lpWeapons?.length && typeof addLpWeapon === 'function') {
                const wtb = document.getElementById('lp-weapons-tbody');
                if (wtb) {
                    wtb.querySelectorAll('tr').forEach(r => r.remove());
                    state.lpWeapons.forEach(w => addLpWeapon(w, w.fromEquip));
                }
            }

            // LP stat feature labels
            if (state.lpFeat) {
                STATS.forEach(st => {
                    if (!state.lpFeat[st]) return;
                    const el = document.getElementById(`lp-feat-${st}`);
                    if (el) el.value = state.lpFeat[st];
                });
            }

            // Bonus skill selections
            if (state.bonusSkills?.length) {
                state.bonusSkills.forEach((val, i) => {
                    const el = document.getElementById(`cs-bonus-skill-${i}`);
                    if (el && val) el.value = val;
                });
            }

            // Bonus applied state — mark button green, hide reminder, show reset if bonuses are active
            if (state.bonusApplied) {
                const btn = document.getElementById('apply-bonus-button');
                if (btn) btn.classList.add('apply-bonus-done');
                const reminder = document.getElementById('reminder-apply-bonus');
                if (reminder) reminder.style.display = 'none';
                const resetBtn = document.getElementById('reset-bonus-button');
                if (resetBtn) resetBtn.style.display = 'inline-block';
            }

            // Restore applied bonus tracking map
            if (state.appliedBonuses && typeof appState !== 'undefined') {
                appState.appliedBonuses = state.appliedBonuses;
            }
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
        localStorage.removeItem('dg-equipment-loadout');
        localStorage.removeItem('dg-bonds-sheet');
        location.reload();
    }

    function clearSheet() {
        if (!confirm('Clear the entire sheet? All values will be reset. This cannot be undone.')) return;

        // Wipe localStorage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('dg-equipment-loadout');
        localStorage.removeItem('dg-bonds-sheet');

        // Clear all text inputs, number inputs, textareas, selects
        document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => {
            el.value = '';
        });
        document.querySelectorAll('input[type="checkbox"]').forEach(el => {
            el.checked = false;
        });
        document.querySelectorAll('select').forEach(el => {
            el.selectedIndex = 0;
        });

        // Reset tracker values (HP, WP, SAN, BP) to their defaults
        document.querySelectorAll('.lp-tracker-value').forEach(el => {
            const def = el.dataset.default || '0';
            el.textContent = def;
        });

        // Clear weapon rows
        const weaponTbody = document.getElementById('lp-weapon-tbody');
        if (weaponTbody) weaponTbody.innerHTML = '';

        // Clear equipment picker
        if (typeof window.dgEquipment?.clear === 'function') window.dgEquipment.clear();

        // Clear bonds
        window.bondsOnSheet = [];
        if (typeof renderBondsOnSheet === 'function') renderBondsOnSheet();

        showToast('Sheet cleared.');
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
            showToast('Could not generate share link.');
        }
    }

    function _fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showToast('Share link copied to clipboard!'); }
        catch (_) { showToast('Could not copy — check the URL bar.'); history.replaceState(null, '', location.pathname + text.slice(text.indexOf('#'))); }
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
    let _syncDebounce;
    function _onUserChange(e) {
        if (_restoring) return;
        clearTimeout(_debounce);
        _debounce = setTimeout(save, 1500);
        // Keep LP sheet skill/stat display in sync when editing from any theme
        if (document.getElementById('lp-sheet') && typeof syncLpFromForm === 'function') {
            clearTimeout(_syncDebounce);
            _syncDebounce = setTimeout(syncLpFromForm, 150);
        }
    }
    document.addEventListener('input', _onUserChange);
    document.addEventListener('change', _onUserChange);

    /* =========================================================================
       DOWNLOAD / UPLOAD JSON
    ========================================================================= */
    function downloadSheet() {
        try {
            const state = collectState();
            const json = JSON.stringify(state, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const charName = (state.bio?.name || 'agent').replace(/[^a-z0-9_\-]/gi, '_').slice(0, 40) || 'agent';
            a.href = url;
            a.download = `${charName} - Live Play.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            showToast('Sheet downloaded!');
        } catch (e) {
            console.warn('[DG Download]', e);
            showToast('Could not download sheet.');
        }
    }

    function uploadSheet() {
        let input = document.getElementById('dg-upload-input');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.id = 'dg-upload-input';
            input.accept = '.json,application/json';
            input.style.cssText = 'display:none;position:fixed;top:0;left:0';
            document.body.appendChild(input);
        }
        // Reset so re-selecting the same file still fires 'change'
        input.value = '';
        input.onchange = function (e) {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    const state = JSON.parse(ev.target.result);
                    applyState(state);
                    setTimeout(() => { save(); syncLpFromForm?.(); }, 300);
                    showToast('Sheet loaded from file!');
                } catch (_) {
                    showToast('Invalid file — could not load sheet.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    /* =========================================================================
       PUBLIC API
    ========================================================================= */
    window.dgSaveLoad = { save, loadLocal, share, clearSave, clearSheet, downloadSheet, uploadSheet };

    /* =========================================================================
       INIT — run after scripts.js window.onload (and its 50 ms inner timer)
    ========================================================================= */
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (!loadFromURL()) loadLocal();
        }, 200);
    });
})();
