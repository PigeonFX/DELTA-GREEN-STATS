/**
 * Printable Character Sheet Generator for Delta Green
 * Handles generation and export of printable HTML character sheets.
 * Supports two sources:
 *   exportPrintable()         — reads the live character sheet form (DOM)
 *   exportPrintableFromJSON() — parses a pasted Foundry VTT actor JSON
 */

// ─── Internal helpers ────────────────────────────────────────────────────────

function _dlHTML(html, agentName) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DeltaGreen_' + agentName.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** Strip HTML tags and decode basic entities (used on Foundry description fields). */
function _stripTags(html) {
    return (html || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .trim();
}

// ─── Data sources ────────────────────────────────────────────────────────────

/**
 * Collect character data from the live DOM.
 * Returns a normalised data object consumed by _buildPrintableHTML().
 */
function _dataFromDOM() {
    const name = document.getElementById('cs-name')?.value || 'Agent';
    const profKey = document.getElementById('cs-profession-select')?.value || '';
    const professionTitle = profKey && professions[profKey] ? professions[profKey].title : 'No Profession Selected';

    // Stats — each entry: { label, raw, x5 }
    const statsArr = [];
    stats.forEach(stat => {
        const raw = parseInt(document.getElementById(`${stat}-value`)?.innerText) || 0;
        const x5 = parseInt(document.getElementById(`${stat}-x5-value`)?.innerText) || raw * 5;
        statsArr.push({ label: stat, raw, x5 });
    });

    // Derived attributes
    const attrs = calculateAttributes();
    const attributes = { HP: attrs[0], WP: attrs[1], SAN: attrs[2], BP: attrs[3] };

    // Biography
    const bio = {
        nationality: document.getElementById('cs-bio-nationality')?.value || '',
        sex: document.getElementById('cs-bio-sex')?.value || '',
        age: document.getElementById('cs-bio-age')?.value || '',
        description: document.getElementById('cs-physical-desc')?.value || '',
        employer: document.getElementById('cs-bio-employer')?.value || '',
        education: document.getElementById('cs-bio-education')?.value || ''
    };

    // Skills — predefined slots
    const skillsList = [];
    document.querySelectorAll('#cs-skills input[id^="cs-skill-"]').forEach(elem => {
        const key = elem.id.replace('cs-skill-', '');
        const value = parseInt(elem.value) || 0;
        const specialty = document.getElementById(`cs-skill-${key}-spec`)?.value || '';
        skillsList.push({
            name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value,
            specialty
        });
    });

    // Skills — custom skill rows
    document.querySelectorAll('.custom-skill-row').forEach(row => {
        const specSelect = row.querySelector('select');
        const nameInput = row.querySelector('.custom-skill-name');
        const valueInput = row.querySelector('.custom-skill-value');
        let skillName = '', specialty = '';
        if (specSelect) {
            const lbl = row.querySelector('label');
            if (lbl) skillName = lbl.textContent.replace(':', '').trim();
            specialty = specSelect.value || '';
        } else if (nameInput) {
            skillName = nameInput.value;
        }
        if (skillName && valueInput) {
            skillsList.push({ name: skillName, value: parseInt(valueInput.value) || 0, specialty });
        }
    });

    // Sanity adaptations
    const adaptations = {
        violence: [
            document.getElementById('cs-violence-incident1')?.checked || false,
            document.getElementById('cs-violence-incident2')?.checked || false,
            document.getElementById('cs-violence-incident3')?.checked || false
        ],
        helplessness: [
            document.getElementById('cs-helplessness-incident1')?.checked || false,
            document.getElementById('cs-helplessness-incident2')?.checked || false,
            document.getElementById('cs-helplessness-incident3')?.checked || false
        ]
    };

    // Bonds
    const bonds = (window.bondsOnSheet || []).map(b => ({
        name: b.name || 'Unknown',
        description: b.description || '',
        relationship: b.relationship || '',
        score: b.score || 0
    }));

    return { name, professionTitle, statsArr, attributes, bio, skillsList, adaptations, weapons: [], gear: [], bonds };
}

/**
 * Map a Foundry VTT actor JSON object to the same normalised data shape.
 * Extracts weapons, gear, armour, and bonds from the items array.
 */
function _dataFromFoundryJSON(obj) {
    const name = obj.name || 'Agent';
    const sys = obj.system || {};

    // Biography
    const biography = sys.biography || {};
    const bio = {
        nationality: biography.nationality || '',
        sex: biography.sex || '',
        age: biography.age !== undefined ? String(biography.age) : '',
        description: sys.physical?.description || '',
        employer: biography.employer || '',
        education: biography.education || ''
    };
    const professionTitle = biography.profession || '';

    // Stats — canonical order: STR DEX CON INT POW CHA
    const STAT_KEYS = ['str', 'dex', 'con', 'int', 'pow', 'cha'];
    const statsArr = STAT_KEYS.map(key => {
        const raw = sys.statistics?.[key]?.value || 0;
        return { label: key.toUpperCase(), raw, x5: raw * 5 };
    });

    const attributes = {
        HP: sys.health?.max ?? sys.health?.value ?? 0,
        WP: sys.wp?.max ?? sys.wp?.value ?? 0,
        SAN: sys.sanity?.value ?? 0,
        BP: sys.sanity?.currentBreakingPoint ?? 0
    };

    // ---  Skills  ---
    // system.skills holds predefined slots (label may embed specialty, e.g. "Craft (Electrician)")
    // system.typedSkills holds additional typed entries — skip the first-occurrence entry that is
    // already represented in system.skills to avoid duplicates.
    const skillsList = [];
    const SPECIALTY_GROUP_TO_KEY = {
        Art: 'art', Craft: 'craft', Science: 'science',
        Pilot: 'pilot', 'Military Science': 'military_science'
    };
    const SPECIALTY_GROUPS = new Set(Object.keys(SPECIALTY_GROUP_TO_KEY));
    const SPECIALTY_KEY_SET = new Set(Object.values(SPECIALTY_GROUP_TO_KEY));

    const coveredTyped = new Set(); // typed specialties already shown via predefined slot

    if (sys.skills) {
        Object.entries(sys.skills).forEach(([key, sk]) => {
            if (!sk) return;
            const label = sk.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            skillsList.push({ name: label, value: sk.proficiency ?? 0, specialty: '' });
            if (SPECIALTY_KEY_SET.has(key) && label.includes('(')) {
                const m = label.match(/\(([^)]+)\)/);
                if (m) coveredTyped.add(key + ':' + m[1]);
            }
        });
    }

    if (sys.typedSkills) {
        Object.values(sys.typedSkills).forEach(ts => {
            if (!ts) return;
            const group = ts.group || '';
            const label = ts.label || '';
            if (SPECIALTY_GROUPS.has(group)) {
                const baseKey = SPECIALTY_GROUP_TO_KEY[group];
                if (coveredTyped.has(baseKey + ':' + label)) return; // already in skills list
            }
            const displayName = (group && group !== 'Custom') ? `${group} (${label})` : label;
            skillsList.push({ name: displayName, value: ts.proficiency ?? 0, specialty: '' });
        });
    }

    // Sanity adaptations
    const sa = sys.sanity?.adaptations || {};
    const adaptations = {
        violence: [sa.violence?.incident1 || false, sa.violence?.incident2 || false, sa.violence?.incident3 || false],
        helplessness: [sa.helplessness?.incident1 || false, sa.helplessness?.incident2 || false, sa.helplessness?.incident3 || false]
    };

    // Items → weapons / gear / bonds
    const weapons = [], gear = [], bonds = [];
    (obj.items || []).forEach(item => {
        if (!item) return;
        const s = item.system || {};
        switch (item.type) {
            case 'weapon': {
                let skillPct = '';
                if (s.skill && sys.skills?.[s.skill]) {
                    const prof = sys.skills[s.skill].proficiency;
                    if (prof !== undefined && prof !== null) skillPct = prof + '%';
                }
                weapons.push({
                    name: item.name || '',
                    skillPct,
                    range: s.base_range || s.range || '',
                    damage: s.damage || '',
                    armorPiercing: s.armor_piercing || false,
                    lethality: s.lethality ? s.lethality + '%' : '',
                    killRadius: s.kill_radius || s.killRadius || '',
                    ammo: s.ammo !== undefined ? String(s.ammo) : ''
                });
                break;
            }
            case 'gear': {
                gear.push({ name: item.name || '', description: _stripTags(s.description || '') });
                break;
            }
            case 'armor': {
                const desc = _stripTags(s.description || '');
                const combined = s.armorRating !== undefined
                    ? `Armor Rating: ${s.armorRating}${desc ? '. ' + desc : ''}`
                    : desc;
                gear.push({ name: item.name || '', description: combined });
                break;
            }
            case 'bond': {
                bonds.push({
                    name: item.name || s.name || 'Unknown',
                    description: _stripTags(s.description || ''),
                    relationship: s.relationship || '',
                    score: s.score || 0
                });
                break;
            }
        }
    });

    return { name, professionTitle, statsArr, attributes, bio, skillsList, adaptations, weapons, gear, bonds };
}

// ─── HTML generation ─────────────────────────────────────────────────────────

/** Build the complete printable HTML document from a normalised data object. */
function _buildPrintableHTML(data) {
    const { name, professionTitle, statsArr, attributes, bio, skillsList, adaptations, weapons, gear, bonds } = data;

    // --- Statistics ---
    const statsHtml = statsArr.map(({ label, raw, x5 }) => `
                <div class="stat-box">
                    <div class="stat-box-label">${label}</div>
                    <div class="stat-box-value">${x5}</div>
                    <div style="font-size: 9px; margin-top: 3px; opacity: 0.8;">${raw} × 5 =</div>
                </div>`).join('');

    // --- Derived attributes ---
    const attributesHtml = ['HP', 'WP', 'SAN', 'BP'].map(key => `
                <div style="border: 1px solid #000; padding: 6px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; height: 100px;">
                    <div style="font-weight: bold; font-size: 11px;">${key}</div>
                    <div>
                        <div style="font-size: 9px; margin-bottom: 2px;">MAX</div>
                        <div style="font-size: 18px; font-weight: bold; line-height: 1;">${attributes[key]}</div>
                    </div>
                    <div style="border-top: 1px solid #000; padding-top: 4px;">
                        <div style="font-size: 9px; margin-bottom: 2px;">CURRENT</div>
                        <div style="height: 20px; border: 1px solid #ccc;"></div>
                    </div>
                </div>`).join('');

    // --- Skills ---
    const half = Math.ceil(skillsList.length / 2);
    const renderSkill = sk => `
                <div class="skill-item">
                    <span class="skill-name">${sk.name}${sk.specialty ? ' (' + sk.specialty + ')' : ''}</span>
                    <span class="skill-value" style="display: flex; align-items: center; gap: 3px; justify-content: flex-end;">
                        <span>${sk.value !== undefined && sk.value !== '' ? sk.value : ''}%</span>
                        <input type="checkbox" style="width: 11px; height: 11px; cursor: pointer;">
                    </span>
                </div>`;
    const skillsLeftHtml = skillsList.slice(0, half).map(renderSkill).join('');
    const skillsRightHtml = skillsList.slice(half).map(renderSkill).join('');

    // --- Sanity adaptations ---
    const v = adaptations.violence || [false, false, false];
    const h = adaptations.helplessness || [false, false, false];
    const cb = checked => `<input type="checkbox" style="width: 14px; height: 14px; accent-color: #000; cursor: pointer;"${checked ? ' checked' : ''}>`;

    // --- Weapons ---
    const emptyWRow = `<tr>${Array(8).fill('<td style="border: 1px solid #000; padding: 4px; height: 20px;"></td>').join('')}</tr>`;
    let weaponsHtml;
    if (weapons.length > 0) {
        const dataRows = weapons.map(w => `
                <tr>
                    <td style="border: 1px solid #000; padding: 4px;">${w.name}</td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">${w.skillPct}</td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">${w.range}</td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">${w.damage}</td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">${w.armorPiercing ? '✓' : ''}</td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">${w.lethality}</td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">${w.killRadius}</td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">${w.ammo}</td>
                </tr>`).join('');
        const padCount = Math.max(0, 4 - weapons.length);
        weaponsHtml = dataRows + Array(padCount).fill(emptyWRow).join('');
    } else {
        weaponsHtml = Array(7).fill(emptyWRow).join('');
    }

    // --- Gear / Armour ---
    const gearHtml = gear.length > 0
        ? gear.map(g => `<div style="padding: 3px 0; border-bottom: 0.5px dotted #ccc; font-size: 10px;"><strong>${g.name}</strong>${g.description ? ': <span style="opacity: 0.85;">' + g.description + '</span>' : ''}</div>`).join('')
        : '<div style="min-height: 40px;"></div>';

    // --- Bonds ---
    const bondsHtml = bonds.length > 0
        ? bonds.map(b => `
                <div class="bond-item">
                    <div class="bond-name">${b.name}</div>
                    <div class="bond-description">${b.description}</div>
                    <div class="bond-relationship">Relationship: ${b.relationship || 'N/A'} | Score: ${b.score}</div>
                </div>`).join('')
        : '<p style="font-size: 10px; opacity: 0.6;">(Add bonds here)</p>';

    const bondsSpaceHtml = bonds.length < 4 ? `
            <div style="margin-top: 8px; padding: 8px; border: 1px dashed #ccc; min-height: 40px; font-size: 9px;">
                <span style="opacity: 0.5;">Additional Bond Space:</span>
            </div>` : '';

    const backgroundHtml = bio.description ? `
        <div class="section">
            <div class="section-title">Physical Description</div>
            <div class="bio-text">${bio.description.replace(/\n/g, '<br>')}</div>
        </div>` : '';

    // --- Ruled blank areas ---
    const hLines = (n, ht) => Array(n).fill(`<div style="border-bottom: 1px dashed #ccc; height: ${ht}px; margin-bottom: 2px;"></div>`).join('');
    const trainingRows = Array(7).fill('<tr><td style="border: 1px solid #000; padding: 3px; height: 16px;"></td><td style="border: 1px solid #000; padding: 3px; height: 16px;"></td></tr>').join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delta Green Character Sheet - ${name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; background: #fff; color: #000; padding: 20px; line-height: 1.4; }
        .character-sheet { max-width: 8.5in; margin: 0 auto; background: white; padding: 40px; border: 2px solid #000; }
        .header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
        .header-title { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
        .header-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; }
        .header-info-item { display: flex; justify-content: space-between; }
        .header-info-label { font-weight: bold; min-width: 90px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 15px; }
        .stat-box { border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px; }
        .stat-box-label { font-weight: bold; font-size: 10px; margin-bottom: 3px; }
        .stat-box-value { font-size: 18px; font-weight: bold; }
        .attributes-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 15px; }
        .skills-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .skill-list { font-size: 10px; }
        .skill-item { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 0.5px dotted #ccc; }
        .skill-name { flex: 1; }
        .skill-value { min-width: 30px; text-align: right; font-weight: bold; }
        .bond-item { margin-bottom: 10px; padding: 8px; border-left: 2px solid #000; page-break-inside: avoid; }
        .bond-name { font-weight: bold; margin-bottom: 2px; }
        .bond-description { font-size: 9px; margin-bottom: 2px; }
        .bond-relationship { font-size: 9px; opacity: 0.8; }
        .bio-text { font-size: 10px; line-height: 1.5; max-height: 60px; overflow: hidden; }
        .footer { border-top: 1px solid #000; padding-top: 10px; margin-top: 20px; font-size: 8px; text-align: right; opacity: 0.7; }
        @media print {
            body { padding: 0; }
            .character-sheet { border: none; padding: 0; max-width: 100%; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="character-sheet">

        <div class="header">
            <div class="header-title">DELTA GREEN AGENT DOSSIER</div>
            <div class="header-info">
                <div class="header-info-item"><span class="header-info-label">Agent Name:</span><span>${name}</span></div>
                <div class="header-info-item"><span class="header-info-label">Profession:</span><span>${professionTitle}</span></div>
                <div class="header-info-item"><span class="header-info-label">Nationality:</span><span>${bio.nationality}</span></div>
                <div class="header-info-item"><span class="header-info-label">Age:</span><span>${bio.age}</span></div>
                <div class="header-info-item"><span class="header-info-label">Sex:</span><span>${bio.sex}</span></div>
                <div class="header-info-item"><span class="header-info-label">Employer:</span><span>${bio.employer}</span></div>
                <div class="header-info-item"><span class="header-info-label">Education:</span><span>${bio.education}</span></div>
                <div class="header-info-item"><span class="header-info-label">Created:</span><span>${new Date().toLocaleDateString()}</span></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Statistics</div>
            <div class="stats-grid">${statsHtml}</div>
        </div>

        <div class="section">
            <div class="section-title">Derived Attributes</div>
            <div class="attributes-grid">${attributesHtml}</div>
        </div>

        <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-section">
                <div class="skill-list">${skillsLeftHtml}</div>
                <div class="skill-list">${skillsRightHtml}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Sanity &amp; Trauma</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                <div style="border: 1px solid #000; padding: 8px; text-align: center;">
                    <div style="font-size: 9px; font-weight: bold; margin-bottom: 4px;">Current SAN</div>
                    <div style="font-size: 18px; min-height: 20px;">${attributes.SAN}</div>
                </div>
                <div style="border: 1px solid #000; padding: 8px; text-align: center;">
                    <div style="font-size: 9px; font-weight: bold; margin-bottom: 4px;">Breaking Point</div>
                    <div style="font-size: 18px; min-height: 20px;">${attributes.BP}</div>
                </div>
            </div>
            <div style="min-height: 120px; border: 1px solid #000; padding: 8px; font-size: 9px; display: flex; flex-direction: column;">
                <div style="font-weight: bold; margin-bottom: 8px; font-size: 10px;">MOTIVATIONS AND MENTAL DISORDERS:</div>
                <div style="flex-grow: 1; border-bottom: 1px dashed #ccc; margin-bottom: 8px; padding-bottom: 4px;"></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 8px;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span>Violence</span>${cb(v[0])}${cb(v[1])}${cb(v[2])}${v.some(Boolean) ? '<span> Adapted</span>' : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span>Helplessness</span>${cb(h[0])}${cb(h[1])}${cb(h[2])}${h.some(Boolean) ? '<span> Adapted</span>' : ''}
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Wounds &amp; Ailments</div>
            <div style="min-height: 60px; border: 1px solid #000; padding: 8px; font-size: 9px;"></div>
        </div>

        <div class="section">
            <div class="section-title">Armor &amp; Gear</div>
            <div style="border: 1px solid #000; padding: 8px; font-size: 9px; min-height: 60px;">${gearHtml}</div>
            <div style="font-size: 8px; margin-top: 4px; opacity: 0.8;">Body armor reduces the damage of all attacks except Called Shots and successful Lethality rolls.</div>
        </div>

        <div class="section">
            <div class="section-title">Weapons</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                <thead>
                    <tr style="border-bottom: 2px solid #000;">
                        <th style="border: 1px solid #000; padding: 4px; text-align: left;">WEAPONS</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">SKILL %</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">BASE RANGE</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">DAMAGE</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">ARMOR PIERCING</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">LETHALITY %</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">KILL RADIUS</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">AMMO</th>
                    </tr>
                </thead>
                <tbody>${weaponsHtml}</tbody>
            </table>
        </div>

        ${backgroundHtml}

        <div class="section">
            <div class="section-title">Bonds</div>
            <div class="bonds-list">${bondsHtml}</div>
            ${bondsSpaceHtml}
        </div>

        <div class="section">
            <div class="section-title">Notes &amp; Campaign Notes</div>
            <div style="min-height: 80px; border: 1px solid #000; padding: 8px; font-size: 9px; line-height: 1.4;">
                ${hLines(6, 12)}
            </div>
        </div>

        <div class="section">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-height: 200px;">
                <div style="display: flex; flex-direction: column;">
                    <div style="font-weight: bold; font-size: 10px; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 3px;">PERSONAL DETAILS AND NOTES:</div>
                    <div style="flex-grow: 1; border: 1px solid #000; padding: 6px; font-size: 9px;">${hLines(12, 10)}</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div>
                        <div style="font-weight: bold; font-size: 10px; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 3px;">DEVELOPMENTS WHICH AFFECT HOME AND FAMILY:</div>
                        <div style="border: 1px solid #000; padding: 6px; font-size: 9px; min-height: 60px;">${hLines(4, 10)}</div>
                    </div>
                    <div style="flex-grow: 1; display: flex; flex-direction: column;">
                        <div style="font-weight: bold; font-size: 10px; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 3px;">SPECIAL TRAINING:</div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 8px; flex-grow: 1;">
                            <thead>
                                <tr style="border-bottom: 1px solid #000;">
                                    <th style="border: 1px solid #000; padding: 3px; text-align: left; width: 50%;">SKILL</th>
                                    <th style="border: 1px solid #000; padding: 3px; text-align: left; width: 50%;">STAT USED</th>
                                </tr>
                            </thead>
                            <tbody>${trainingRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">Delta Green Character Sheet | Generated on ${new Date().toLocaleString()}</div>
    </div>
    <script>window.addEventListener('load', function() { window.print(); });</script>
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Export the current character sheet as a printable HTML file (existing behaviour).
 */
function exportPrintable() {
    try {
        const data = _dataFromDOM();
        _dlHTML(_buildPrintableHTML(data), data.name);
        console.log('Printable sheet exported successfully');
    } catch (err) {
        console.error('Error generating printable sheet:', err);
        alert('Error generating printable sheet. Check browser console for details.');
    }
}

/**
 * Parse a pasted Foundry VTT actor JSON and export a full printable HTML sheet.
 * Populates weapons, gear/armour, and bonds from the items array.
 */
function exportPrintableFromJSON() {
    const textarea = document.getElementById('json-import-area');
    if (!textarea) return;
    const raw = textarea.value.trim();
    if (!raw) {
        alert('Please paste a Foundry VTT character JSON first.');
        return;
    }
    let obj;
    try {
        obj = JSON.parse(raw);
    } catch (e) {
        alert('Invalid JSON: ' + e.message);
        return;
    }
    try {
        const data = _dataFromFoundryJSON(obj);
        _dlHTML(_buildPrintableHTML(data), data.name);
    } catch (err) {
        console.error('Error generating printable sheet from JSON:', err);
        alert('Error generating printable sheet from JSON. Check browser console for details.');
    }
}

