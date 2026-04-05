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

/** Escape HTML special characters for safe interpolation into generated markup. */
function _esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  const attributes = {
    HP: { max: attrs[0], current: parseInt(document.getElementById('cs-hp')?.value) || attrs[0] },
    WP: { max: attrs[1], current: parseInt(document.getElementById('cs-wp')?.value) || attrs[1] },
    SAN: { max: attrs[2], current: parseInt(document.getElementById('cs-sanity-value')?.value) || attrs[2] },
    BP: { max: attrs[3], current: parseInt(document.getElementById('cs-breaking-point')?.value) || attrs[3] }
  };

  // Biography
  const bio = {
    nationality: document.getElementById('cs-bio-nationality')?.value || '',
    sex: document.getElementById('cs-bio-sex')?.value || '',
    age: document.getElementById('cs-bio-age')?.value || '',
    description: document.getElementById('cs-physical-desc')?.value || '',
    motivations: document.getElementById('cs-motivations')?.value || '',
    personalDetails: document.getElementById('cs-personal-details')?.value || '',
    employer: document.getElementById('cs-bio-employer')?.value || '',
    education: document.getElementById('cs-bio-education')?.value || ''
  };

  // Skills — use getCompletedSkills() as the single authoritative source.
  // This covers base skills, specialty instances, and any custom rows (Foreign Language etc.).
  const skillsList = [];
  if (typeof getCompletedSkills === 'function') {
    getCompletedSkills().forEach(skill => {
      skillsList.push({ name: skill.displayName, value: skill.value, specialty: skill.specialty || '' });
    });
  }
  // Custom rows (Foreign Language etc. that live outside getCompletedSkills base/specialty lists)
  document.querySelectorAll('.custom-skill-row').forEach(row => {
    const nameInput = row.querySelector('.custom-skill-name');
    const valueInput = row.querySelector('.custom-skill-value');
    let skillName = '';
    if (nameInput) skillName = nameInput.value;
    const parentLabel = row.querySelector('label');
    if (parentLabel && nameInput) {
      const base = parentLabel.textContent.replace(':', '').trim();
      const lang = nameInput.value.trim();
      skillName = lang ? `${base} (${lang})` : base;
    }
    if (skillName && valueInput) {
      skillsList.push({ name: skillName, value: parseInt(valueInput.value) || 0, specialty: '' });
    }
  });

  // LP-added custom skill rows (added via + ADD SKILL in the Live Play theme)
  document.querySelectorAll('#lp-sheet .lp-skill-name-inp').forEach(nameInput => {
    const row = nameInput.closest('tr');
    if (!row) return;
    const valInput = row.querySelector('.lp-skill-cust-val');
    const skillName = nameInput.value.trim();
    if (skillName && valInput) {
      skillsList.push({ name: skillName, value: parseInt(valInput.value) || 0, specialty: '' });
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

  // Equipment — read from the live equipment picker loadout
  const weapons = [], gear = [];
  if (typeof window.dgEquipment?.getLoadout === 'function') {
    window.dgEquipment.getLoadout().forEach(item => {
      if (!item) return;
      const s = item.system || {};
      if (item.type === 'weapon') {
        const skillInput = document.getElementById(`cs-skill-${s.skill}`);
        const skillPct = skillInput ? (parseInt(skillInput.value) || 0) + '%' : '';
        weapons.push({
          name: item.name || '',
          skillPct,
          range: s.range || '',
          damage: s.isLethal ? '' : (s.damage || ''),
          armorPiercing: s.armorPiercing > 0,
          lethality: s.lethality ? s.lethality + '%' : '',
          killRadius: s.killRadius || s.kill_radius || '',
          ammo: s.ammo !== undefined ? String(s.ammo) : ''
        });
      } else if (item.type === 'armor') {
        const desc = _stripTags(s.description || '');
        const combined = s.protection !== undefined
          ? `Protection: ${s.protection}${desc ? '. ' + desc : ''}`
          : desc;
        gear.push({ name: item.name || '', description: combined });
      } else {
        gear.push({ name: item.name || '', description: _stripTags(s.description || '') });
      }
    });
  }

  // LP free-text fields (only populated when field-doc theme is active)
  const lpWounds = document.getElementById('lp-wounds')?.value?.trim() || '';
  const lpRemarks = document.getElementById('lp-remarks')?.value?.trim() || '';

  return { name, professionTitle, statsArr, attributes, bio, skillsList, adaptations, weapons, gear, bonds, lpWounds, lpRemarks };
}

// ─── Foundry JSON constants (hoisted — built once) ──────────────────────────
const _SPECIALTY_GROUP_TO_KEY = {
  Art: 'art', Craft: 'craft', Science: 'science',
  Pilot: 'pilot', 'Military Science': 'military_science'
};
const _SPECIALTY_GROUPS = new Set(Object.keys(_SPECIALTY_GROUP_TO_KEY));
const _SPECIALTY_KEY_SET = new Set(Object.values(_SPECIALTY_GROUP_TO_KEY));

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
    motivations: biography.motivations || '',
    personalDetails: biography.notes || '',
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
    HP: { max: sys.health?.max ?? 0, current: sys.health?.value ?? sys.health?.max ?? 0 },
    WP: { max: sys.wp?.max ?? 0, current: sys.wp?.value ?? sys.wp?.max ?? 0 },
    SAN: { max: (sys.statistics?.pow?.value ?? 0) * 5, current: sys.sanity?.value ?? 0 },
    BP: { max: sys.sanity?.currentBreakingPoint ?? 0, current: sys.sanity?.currentBreakingPoint ?? 0 }
  };

  // ---  Skills  ---
  // system.skills holds predefined slots (label may embed specialty, e.g. "Craft (Electrician)")
  // system.typedSkills holds additional typed entries — skip the first-occurrence entry that is
  // already represented in system.skills to avoid duplicates.
  const skillsList = [];

  const coveredTyped = new Set(); // typed specialties already shown via predefined slot

  if (sys.skills) {
    Object.entries(sys.skills).forEach(([key, sk]) => {
      if (!sk) return;
      const label = sk.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      skillsList.push({ name: label, value: sk.proficiency ?? 0, specialty: '' });
      if (_SPECIALTY_KEY_SET.has(key) && label.includes('(')) {
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
      if (_SPECIALTY_GROUPS.has(group)) {
        const baseKey = _SPECIALTY_GROUP_TO_KEY[group];
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

/** Build the complete printable HTML document from a normalised data object.
 *  Layout matches the official DD Form 315 Delta Green Agent Documentation Sheet.
 * @param {object} data - normalised character data
 * @param {string|null} [stateJSON] - optional serialised collectState() blob to embed for re-import
 */
function _buildPrintableHTML(data, stateJSON = null) {
  const { name, professionTitle, statsArr, attributes, bio, skillsList, adaptations, weapons, gear, bonds, lpWounds, lpRemarks } = data;
  const now = new Date();

  // ── helpers ──────────────────────────────────────────────────────────────
  const cell = (content = '', style = '') =>
    `<td style="border:1px solid #000;padding:2px 4px;${style}">${content}</td>`;
  const th = (content = '', style = '') =>
    `<th style="border:1px solid #000;padding:2px 4px;font-weight:bold;font-size:7.5pt;${style}">${content}</th>`;
  const cb = (checked = false) =>
    `<input type="checkbox" style="width:9px;height:9px;accent-color:#000;vertical-align:middle;"${checked ? ' checked' : ''}>`;
  const secHd = (num, label, extra = '') =>
    `<div style="background:#000;color:#fff;font-weight:bold;font-size:8pt;padding:1px 4px;letter-spacing:.5px;">${num}.&nbsp;&nbsp;${label}${extra ? '&nbsp;&nbsp;<span style="font-weight:normal;font-size:7pt;">' + extra + '</span>' : ''}</div>`;
  const fieldRow = (label, value, style = '') =>
    `<div style="display:flex;align-items:stretch;border:1px solid #000;border-top:none;font-size:8pt;${style}"><span style="font-size:7pt;padding:1px 3px;min-width:110px;border-right:1px solid #000;">${label}</span><span style="padding:1px 4px;flex:1;">${_esc(value)}</span></div>`;

  // ── Statistics (section 8) ────────────────────────────────────────────────
  const STAT_LABELS = { STR: 'Strength (STR)', DEX: 'Dexterity (DEX)', CON: 'Constitution (CON)', INT: 'Intelligence (INT)', POW: 'Power (POW)', CHA: 'Charisma (CHA)' };
  const STAT_ROW_HT = '21px';
  const statsRowsHtml = statsArr.map(({ label, raw, x5 }, idx) => `
        <tr>
            <td style="border:1px solid #000;border-top:none;border-left:none;padding:1px 4px;font-size:8pt;height:${STAT_ROW_HT};">${STAT_LABELS[label] || label}</td>
            <td style="border:1px solid #000;border-top:none;padding:1px 4px;font-size:9pt;text-align:center;font-weight:bold;height:${STAT_ROW_HT};">${raw || ''}</td>
            <td style="border:1px solid #000;border-top:none;padding:1px 4px;font-size:9pt;text-align:center;height:${STAT_ROW_HT};">${x5 || ''}</td>
            ${idx === 0 ? `<td rowspan="${statsArr.length}" style="border:1px solid #000;border-top:none;border-right:none;padding:0;font-size:8pt;vertical-align:top;min-width:90px;">
                ${statsArr.map(() => `<div style="height:${STAT_ROW_HT};border-bottom:1px solid #000;box-sizing:border-box;"></div>`).join('')}
            </td>` : ''}
        </tr>`).join('');

  // ── Derived Attributes (section 9) ────────────────────────────────────────
  const ATTR_LABELS = { HP: 'Hit Points (HP)', WP: 'Willpower Points (WP)', SAN: 'Sanity Points (SAN)', BP: 'Breaking Point (BP)' };
  const attrRowsHtml = ['HP', 'WP', 'SAN', 'BP'].map(key => `
        <tr>
            <td style="border:1px solid #000;border-top:none;border-left:none;padding:1px 4px;font-size:8pt;height:21px;">${ATTR_LABELS[key]}</td>
            <td style="border:1px solid #000;border-top:none;padding:1px 4px;font-size:9pt;text-align:center;font-weight:bold;height:21px;">${attributes[key].max || ''}</td>
            <td style="border:1px solid #000;border-top:none;border-right:none;padding:1px 4px;font-size:9pt;text-align:center;height:21px;">${attributes[key].current || ''}</td>
        </tr>`).join('');

  // ── Bonds (section 11) ───────────────────────────────────────────────────
  const BOND_ROWS = 8;
  const bondRowsHtml = (() => {
    const rows = [];
    for (let i = 0; i < BOND_ROWS; i++) {
      const b = bonds[i];
      const nameStr = b ? _esc(b.name + (b.relationship ? ' — ' + b.relationship : '')) : '';
      const scoreStr = b ? _esc(String(b.score || '')) : '';
      rows.push(`<tr>
                <td style="border:1px solid #000;border-top:none;border-left:none;padding:1px 4px;font-size:8pt;height:21px;">${nameStr}</td>
                <td style="border:1px solid #000;border-top:none;border-right:none;padding:1px 4px;font-size:9pt;text-align:center;width:38px;font-weight:bold;">${scoreStr}</td>
            </tr>`);
    }
    return rows.join('');
  })();

  // ── Skills (section — Applicable Skill Sets) ─────────────────────────────
  // Balanced 3-col split; shorter columns padded with blank rows for uniform height
  const psN = skillsList.length;
  const psBase = Math.floor(psN / 3);
  const psR = psN % 3;
  const psC1End = psBase + (psR > 0 ? 1 : 0);
  const psC2End = psC1End + psBase + (psR > 1 ? 1 : 0);
  const psMaxCol = Math.max(psC1End, psC2End - psC1End, psN - psC2End);
  const renderSkillRow = sk => {
    const nm = _esc(sk.name);
    const val = sk.value !== undefined && sk.value !== '' ? sk.value + '%' : '';
    return `<tr>
            <td style="border:1px solid #000;border-top:none;padding:4px 3px;width:13px;height:20px;">${cb()}</td>
            <td style="border:1px solid #000;border-top:none;padding:4px 4px;font-size:8pt;height:20px;">${nm}</td>
            <td style="border:1px solid #000;border-top:none;padding:4px 4px;font-size:8pt;text-align:center;width:34px;height:20px;">${val}</td>
        </tr>`;
  };
  const psBlankRow = `<tr>
            <td style="border:1px solid #000;border-top:none;padding:4px 3px;width:13px;height:20px;"></td>
            <td style="border:1px solid #000;border-top:none;padding:4px 4px;font-size:8pt;height:20px;"></td>
            <td style="border:1px solid #000;border-top:none;padding:4px 4px;font-size:8pt;text-align:center;width:34px;height:20px;"></td>
        </tr>`;
  const skillColHtml = (start, end) => {
    const padding = Array(Math.max(0, psMaxCol - (end - start))).fill(psBlankRow).join('');
    return `
        <table style="width:100%;border-collapse:collapse;">
            <thead><tr>
                <th style="border:1px solid #000;padding:3px 3px;width:13px;font-size:7pt;"></th>
                <th style="border:1px solid #000;padding:3px 4px;font-size:7.5pt;text-align:left;">SKILL</th>
                <th style="border:1px solid #000;padding:3px 4px;font-size:7.5pt;text-align:center;width:34px;">%</th>
            </tr></thead>
            <tbody>${skillsList.slice(start, end).map(renderSkillRow).join('')}${padding}</tbody>
        </table>`;
  };
  const skillsHtml = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;align-items:start;gap:4px;">
            ${skillColHtml(0, psC1End)}
            ${skillColHtml(psC1End, psC2End)}
            ${skillColHtml(psC2End, psN)}
        </div>`;

  // ── Weapons (section 16) — character weapons + 2 blank slots for in-game pickups ─
  const WEAPON_ROWS = Math.max(weapons.length + 2, 7);
  const weaponRowsHtml = Array(WEAPON_ROWS).fill(null).map((_, i) => {
    const w = weapons[i];
    return `<tr>
            ${cell(w ? _esc(w.name) : '', 'font-size:8pt;height:20px;border-left:none;')}
            ${cell(w ? _esc(w.skillPct) : '', 'font-size:8pt;text-align:center;width:42px;')}
            ${cell(w ? _esc(w.range) : '', 'font-size:8pt;text-align:center;width:55px;')}
            ${cell(w ? _esc(w.damage) : '', 'font-size:8pt;text-align:center;width:45px;')}
            ${cell(w ? (w.armorPiercing ? '✓' : '') : '', 'font-size:8pt;text-align:center;width:55px;')}
            ${cell(w ? _esc(w.lethality) : '', 'font-size:8pt;text-align:center;width:48px;')}
            ${cell(w ? _esc(w.killRadius) : '', 'font-size:8pt;text-align:center;width:48px;')}
            ${cell(w ? _esc(w.ammo) : '', 'font-size:8pt;text-align:center;width:34px;border-right:none;')}
        </tr>`;
  }).join('');

  // ── Gear text ─────────────────────────────────────────────────────────────
  const gearColumns = gear.length >= 6 ? 'column-count:2;column-gap:8px;' : '';
  const gearText = gear.length > 0
    ? `<div style="${gearColumns}">${gear.map(g => `<div style="font-size:8pt;margin-bottom:3px;break-inside:avoid;"><strong>${_esc(g.name)}</strong>${g.description ? ': ' + _esc(g.description) : ''}</div>`).join('')}</div>`
    : '';

  // ── SAN adaptations ───────────────────────────────────────────────────────
  const v = adaptations.violence || [false, false, false];
  const h = adaptations.helplessness || [false, false, false];

  // ── Training rows ─────────────────────────────────────────────────────────
  const trainingRows = Array(7).fill(0).map(() =>
    `<tr><td style="border:1px solid #000;border-top:none;border-left:none;padding:2px 4px;font-size:8pt;height:17px;"></td><td style="border:1px solid #000;border-top:none;border-right:none;padding:2px 4px;font-size:8pt;"></td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Delta Green — ${_esc(name)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { height:100%; }
  body { font-family: Arial, Helvetica, sans-serif; background:#fff; color:#000; font-size:8pt; line-height:1.3; }
  .page { width:210mm; min-height:297mm; margin:0 auto; padding:5mm 6mm 4mm 6mm; background:#fff;
          display:flex; flex-direction:column; page-break-after:always; }
  .page:last-child { page-break-after:auto; }
  .dg-title { background:#000; color:#fff; text-align:center; font-size:22pt; font-weight:900;
               letter-spacing:6px; text-transform:uppercase; padding:4px 0 6px; margin-bottom:0; font-family:'Arial Black',Arial,sans-serif; }
  table { border-collapse:collapse; }
  .rot-label { writing-mode:vertical-rl; transform:rotate(180deg); font-size:7pt; font-weight:bold;
                text-transform:uppercase; letter-spacing:1px; background:#000; color:#fff;
                padding:6px 2px; text-align:center; width:14px; min-width:14px; max-width:14px; }
  .sec-hd { background:#000; color:#fff; font-weight:bold; font-size:8pt; padding:1px 4px; letter-spacing:.5px; }
  .grow-section { flex:1; display:flex; flex-direction:column; }
  .grow-section > .grow-inner { flex:1; }
  .stats-psych-row { flex:1; min-height:0; }
  .skills-row { flex:3; min-height:0; }
  .wounds-row { flex:1; min-height:50mm; }
  .gear-row { flex:2; min-height:60mm; }
  .remarks-row { flex:3; min-height:80mm; }
  @media screen {
    body { background:#ccc; }
    .page { margin:10px auto; box-shadow:0 0 8px rgba(0,0,0,.4); }
  }
  @media print {
    body { background:#fff; }
    .page { margin:0; width:100%; padding:4mm 5mm 3mm 5mm; height:297mm; min-height:0; overflow:hidden; page-break-after:always; }
    .page:last-child { page-break-after:auto; }
    .stats-psych-row { flex: 0 0 95mm; overflow:hidden; }
    .skills-row { flex: 1 1 0; overflow:hidden; }
    .wounds-row { flex: 0 0 42mm; overflow:hidden; }
    .gear-row { flex: 0 0 145mm; overflow:hidden; }
    .remarks-row { flex: 1 1 0; overflow:hidden; }
    @page { size: A4; margin: 0; }
  }
</style>
</head>
<body>

<!-- ═══════════════════════════════ PAGE 1 ═══════════════════════════════ -->
<div class="page">

  <!-- TITLE BAR -->
  <div class="dg-title">Delta Green</div>

  <!-- PERSONAL DATA band -->
  <div style="display:flex;border:1px solid #000;border-top:none;">
    <div class="rot-label" style="border-right:1px solid #000;">Personal&nbsp;Data</div>
    <div style="flex:1;min-width:0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:50%;border-right:1px solid #000;border-bottom:1px solid #000;padding:0;">
            <div style="font-size:7pt;padding:1px 3px;">1.&nbsp;LAST NAME, FIRST NAME, MIDDLE INITIAL</div>
            <div style="font-size:9.5pt;padding:2px 4px 3px;font-weight:bold;">${_esc(name)}</div>
          </td>
          <td style="border-bottom:1px solid #000;padding:0;">
            <div style="font-size:7pt;padding:1px 3px;">2.&nbsp;PROFESSION (RANK IF APPLICABLE)</div>
            <div style="font-size:9.5pt;padding:2px 4px 3px;font-weight:bold;">${_esc(professionTitle)}</div>
          </td>
        </tr>
        <tr>
          <td style="border-right:1px solid #000;border-bottom:1px solid #000;padding:0;">
            <div style="font-size:7pt;padding:1px 3px;">3.&nbsp;EMPLOYER</div>
            <div style="font-size:9.5pt;padding:2px 4px 3px;">${_esc(bio.employer)}</div>
          </td>
          <td style="border-bottom:1px solid #000;padding:0;">
            <div style="font-size:7pt;padding:1px 3px;">4.&nbsp;NATIONALITY</div>
            <div style="font-size:9.5pt;padding:2px 4px 3px;">${_esc(bio.nationality)}</div>
          </td>
        </tr>
        <tr>
          <td style="border-right:1px solid #000;padding:0;">
            <div style="display:flex;">
              <div style="border-right:1px solid #000;padding:1px 6px 3px;">
                <div style="font-size:7pt;">5.&nbsp;SEX</div>
                <div style="font-size:8pt;padding-top:2px;">
                  ${cb(bio.sex === 'F' || bio.sex === 'f')} F &nbsp; ${cb(bio.sex === 'M' || bio.sex === 'm')} M
                  &nbsp; <span style="font-size:8pt;">${_esc(bio.sex && bio.sex !== 'F' && bio.sex !== 'M' && bio.sex !== 'f' && bio.sex !== 'm' ? bio.sex : '')}</span>
                </div>
              </div>
              <div style="border-right:1px solid #000;padding:1px 6px 3px;">
                <div style="font-size:7pt;">6.&nbsp;AGE AND D.O.B.</div>
                <div style="font-size:9.5pt;padding-top:2px;">${_esc(bio.age)}</div>
              </div>
            </div>
          </td>
          <td style="padding:0;">
            <div style="font-size:7pt;padding:1px 3px;">7.&nbsp;EDUCATION AND OCCUPATIONAL HISTORY</div>
            <div style="font-size:9pt;padding:2px 4px 3px;">${_esc(bio.education)}</div>
          </td>
        </tr>
      </table>
    </div>
  </div>

  <!-- STATISTICAL DATA + PSYCHOLOGICAL DATA side by side -->
  <div class="stats-psych-row" style="display:flex;border:1px solid #000;border-top:none;">
    <div class="rot-label" style="border-right:1px solid #000;">Statistical&nbsp;Data</div>
    <div style="flex:0 0 42%;min-width:0;border-right:1px solid #000;display:flex;flex-direction:column;">

      <!-- Section 8: Statistics -->
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="border:1px solid #000;border-left:none;border-top:none;padding:1px 4px;font-size:7.5pt;text-align:left;font-weight:bold;min-width:130px;">8.&nbsp;STATISTICS</th>
          <th style="border:1px solid #000;border-top:none;padding:1px 4px;font-size:7.5pt;text-align:center;width:38px;">SCORE</th>
          <th style="border:1px solid #000;border-top:none;padding:1px 4px;font-size:7.5pt;text-align:center;width:28px;">×5</th>
          <th style="border:1px solid #000;border-top:none;padding:1px 4px;font-size:7.5pt;text-align:left;border-right:none;">DISTINGUISHING FEATURES</th>
        </tr></thead>
        <tbody>${statsRowsHtml}</tbody>
      </table>

      <!-- Section 9: Derived Attributes -->
      <table style="width:100%;border-collapse:collapse;margin-top:-1px;">
        <thead><tr>
          <th style="border:1px solid #000;border-left:none;border-top:none;padding:1px 4px;font-size:7.5pt;text-align:left;font-weight:bold;">9.&nbsp;DERIVED ATTRIBUTES</th>
          <th style="border:1px solid #000;border-top:none;padding:1px 4px;font-size:7.5pt;text-align:center;width:38px;">MAXIMUM</th>
          <th style="border:1px solid #000;border-top:none;padding:1px 4px;font-size:7.5pt;text-align:center;width:38px;">CURRENT</th>
        </tr></thead>
        <tbody>${attrRowsHtml}</tbody>
      </table>

      <!-- Section 10: Physical Description -->
      <div style="border-top:1px solid #000;flex:1;display:flex;flex-direction:column;">
        <div class="sec-hd">10.&nbsp;&nbsp;PHYSICAL DESCRIPTION</div>
        <div style="flex:1;padding:3px 4px;font-size:8pt;">${_esc(bio.description || '').replace(/\n/g, '<br>')}</div>
      </div>

    </div>

    <!-- Psychological Data label -->
    <div class="rot-label" style="border-left:1px solid #000;border-right:1px solid #000;">Psychological&nbsp;Data</div>

    <!-- Right side: Bonds + Motivations + SAN -->
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;">

      <!-- Section 11: Bonds -->
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="border:1px solid #000;border-left:none;border-top:none;padding:1px 4px;font-size:7.5pt;text-align:left;font-weight:bold;">11.&nbsp;&nbsp;BONDS</th>
          <th style="border:1px solid #000;border-top:none;padding:1px 4px;font-size:7.5pt;text-align:center;width:38px;border-right:none;">SCORE</th>
        </tr></thead>
        <tbody>${bondRowsHtml}</tbody>
      </table>

      <!-- Section 12: Motivations and Mental Disorders -->
      <div style="border-top:1px solid #000;flex:1;display:flex;flex-direction:column;">
        <div class="sec-hd">12.&nbsp;&nbsp;MOTIVATIONS AND MENTAL DISORDERS</div>
        <div style="flex:1;padding:3px 4px;font-size:8pt;">${_esc(bio.motivations || '').replace(/\n/g, '<br>')}</div>
      </div>

      <!-- Section 14: SAN incidents -->
      <div style="border-top:1px solid #000;">
        <div class="sec-hd" style="font-size:7.5pt;">14.&nbsp;INCIDENTS OF SAN LOSS WITHOUT GOING INSANE</div>
        <div style="padding:3px 6px;font-size:8pt;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
          <span>Violence&nbsp;${cb(v[0])}${cb(v[1])}${cb(v[2])}&nbsp;<em>adapted</em></span>
          <span>Helplessness&nbsp;${cb(h[0])}${cb(h[1])}${cb(h[2])}&nbsp;<em>adapted</em></span>
        </div>
      </div>

    </div>
  </div>

  <!-- APPLICABLE SKILL SETS — flex:3 to fill remaining vertical space -->
  <div class="skills-row" style="display:flex;border:1px solid #000;border-top:none;">
    <div class="rot-label" style="border-right:1px solid #000;">Applicable&nbsp;Skill&nbsp;Sets</div>
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;">
      ${skillsHtml}
      <div style="border-top:1px solid #000;padding:2px 6px;font-size:7pt;font-style:italic;margin-top:auto;">
        Check a box when you attempt to use a skill and fail. After the session, add 1D4 to each checked skill and erase all checks.
      </div>
    </div>
  </div>

</div><!-- /page 1 -->

<!-- ═══════════════════════════════ PAGE 2 ═══════════════════════════════ -->
<div class="page">

  <!-- Section 14: Wounds and Ailments -->
  <div class="wounds-row" style="display:flex;border:1px solid #000;">
    <div class="rot-label" style="border-right:1px solid #000;">Injuries</div>
    <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
      <div class="sec-hd">14.&nbsp;&nbsp;WOUNDS AND AILMENTS</div>
      <div style="flex:1;padding:4px;font-size:8pt;white-space:pre-wrap;">${_esc(lpWounds || '')}</div>
      <div style="border-top:1px solid #000;padding:2px 6px;font-size:7pt;font-style:italic;">
        Has First Aid been attempted since the last injury?&nbsp;${cb()}&nbsp;yes: only Medicine, Surgery, or long-term rest can help further
      </div>
    </div>
  </div>

  <!-- Section 15: Armor and Gear -->
  <div class="gear-row" style="display:flex;border:1px solid #000;border-top:none;">
    <div class="rot-label" style="border-right:1px solid #000;">Equipment</div>
    <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
      <div class="sec-hd">15.&nbsp;&nbsp;ARMOR AND GEAR</div>
      <div style="flex:1;padding:4px;font-size:8pt;">${gearText}</div>
      <div style="border-top:1px solid #000;padding:2px 6px;font-size:7pt;font-style:italic;">
        Body armor reduces the damage of all attacks except Called Shots and successful Lethality rolls.
      </div>

      <!-- Section 16: Weapons -->
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #000;">
        <thead><tr>
          ${th('16. &nbsp;WEAPONS', 'text-align:left;border-left:none;border-top:none;')}
          ${th('SKILL %', 'text-align:center;width:42px;border-top:none;')}
          ${th('BASE RANGE', 'text-align:center;width:55px;border-top:none;')}
          ${th('DAMAGE', 'text-align:center;width:45px;border-top:none;')}
          ${th('ARMOR PIERCING', 'text-align:center;width:55px;border-top:none;')}
          ${th('LETHALITY %', 'text-align:center;width:48px;border-top:none;')}
          ${th('KILL RADIUS', 'text-align:center;width:48px;border-top:none;')}
          ${th('AMMO', 'text-align:center;width:34px;border-top:none;border-right:none;')}
        </tr></thead>
        <tbody>${weaponRowsHtml}</tbody>
      </table>
    </div>
  </div>

  <!-- Sections 17–19: Remarks -->
  <div class="remarks-row" style="display:flex;border:1px solid #000;border-top:none;">
    <div class="rot-label" style="border-right:1px solid #000;">Remarks</div>
    <div style="flex:1;display:flex;flex-direction:column;min-width:0;">

      <!-- 17 + 18 side by side -->
      <div style="display:flex;flex:1;min-height:0;">
        <!-- 17: Personal Details -->
        <div style="flex:1;display:flex;flex-direction:column;border-right:1px solid #000;">
          <div class="sec-hd">17.&nbsp;&nbsp;PERSONAL DETAILS AND NOTES</div>
          <div style="flex:1;padding:4px;font-size:8pt;white-space:pre-wrap;">${_esc(bio.personalDetails || lpRemarks || '')}</div>
        </div>
        <!-- 18 + 19 stacked -->
        <div style="flex:1;display:flex;flex-direction:column;">
          <div class="sec-hd">18.&nbsp;&nbsp;DEVELOPMENTS WHICH AFFECT HOME AND FAMILY</div>
          <div style="flex:1;padding:4px;font-size:8pt;border-bottom:1px solid #000;"></div>
          <!-- Section 19: Special Training -->
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr>
              ${th('19.&nbsp;&nbsp;SPECIAL TRAINING', 'text-align:left;border-left:none;border-top:none;')}
              ${th('SKILL OR STAT USED', 'text-align:left;border-top:none;border-right:none;')}
            </tr></thead>
            <tbody>${trainingRows}</tbody>
          </table>
        </div>
      </div>

      <!-- Recruitment note -->
      <div style="border-top:1px solid #000;padding:2px 6px;font-size:7pt;font-style:italic;">
        Please indicate why this agent was recruited and why the agent agreed to be recruited.
      </div>

      <!-- 20 + 21 -->
      <div style="display:flex;border-top:1px solid #000;">
        <div style="flex:1;padding:2px 4px;border-right:1px solid #000;">
          <div style="font-size:7pt;font-weight:bold;">20.&nbsp;&nbsp;AUTHORIZING OFFICER</div>
          <div style="min-height:22px;"></div>
        </div>
        <div style="flex:1;padding:2px 4px;">
          <div style="font-size:7pt;font-weight:bold;">21.&nbsp;&nbsp;AGENT SIGNATURE</div>
          <div style="min-height:22px;"></div>
        </div>
      </div>

    </div>
  </div>

  <!-- DD Form footer -->
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:4px;">
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="font-weight:bold;font-size:14pt;line-height:1;">DD</span>
      <div style="font-size:6pt;line-height:1.4;text-align:center;">UNITED STATES<br>FORM</div>
      <span style="font-weight:900;font-size:20pt;line-height:1;font-family:'Arial Black',Arial,sans-serif;">315</span>
    </div>
    <div style="text-align:center;font-size:6.5pt;line-height:1.5;">
      TOP SECRET//ORCON//SPECIAL ACCESS REQUIRED·DELTA GREEN<br>
      AGENT DOCUMENTATION SHEET
    </div>
    <div style="font-weight:900;font-size:20pt;font-family:'Arial Black',Arial,sans-serif;line-height:1;">112382</div>
  </div>

</div><!-- /page 2 -->

<script>window.addEventListener('load', function() { window.print(); });</script>
${stateJSON ? `<!-- dg-state-embed --><script id="dg-state-blob" type="application/json">${stateJSON.replace(/<\/script>/gi, '<\\/script>')}</script>` : ''}
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Export the current character sheet as a printable HTML file (existing behaviour).
 * The full character state is embedded in the HTML so it can be re-imported later.
 */
function exportPrintable() {
  try {
    const data = _dataFromDOM();
    let stateJSON = null;
    try {
      if (typeof window.dgSaveLoad?.collectState === 'function') {
        stateJSON = JSON.stringify(window.dgSaveLoad.collectState());
      }
    } catch (_) { /* non-fatal — sheet still exports without the blob */ }
    _dlHTML(_buildPrintableHTML(data, stateJSON), data.name);
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

