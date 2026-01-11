// ============================================================================
// DELTA GREEN STATS - APPLICATION LOGIC
// ============================================================================
// This file handles all character sheet functionality including:
// - Stat management (adjust, randomize)
// - Attribute calculations (HP, WP, SAN, BP)
// - Skill management with specialties
// - Bond generation and management
// - Foundry VTT JSON export
// ============================================================================

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================
const CONFIG = {
    STATS: ['STR', 'CON', 'DEX', 'INT', 'POW', 'CHA'],
    ATTRIBUTES: ['Hit Points (HP)', 'Willpower Points (WP)', 'Sanity Points (SAN)', 'Breaking Point (BP)'],
    POINT_BUY_TOTAL: 72,
    STAT_MIN: 3,
    STAT_MAX: 18,
    BONUS_SKILL_COUNT: 8,
    BONUS_SKILL_POINTS: 20,
    MAX_SKILL_VALUE: 80,
    DICE_COUNT: 4,
    DICE_SIDES: 6,
    DICE_KEEP: 3,
    BOND_DELIMITER: ' ^ ^ ',

    // Default skills with base values [key, label, defaultValue, hasSpecialty?]
    SKILLS: [
        ["accounting", "Accounting", 10],
        ["alertness", "Alertness", 20],
        ["anthropology", "Anthropology", 0],
        ["archeology", "Archeology", 0],
        ["art", "Art", 0, true],
        ["artillery", "Artillery", 0],
        ["athletics", "Athletics", 30],
        ["bureaucracy", "Bureaucracy", 10],
        ["computer_science", "Computer Science", 0],
        ["craft", "Craft", 0, true],
        ["criminology", "Criminology", 10],
        ["demolitions", "Demolitions", 0],
        ["disguise", "Disguise", 10],
        ["dodge", "Dodge", 30],
        ["drive", "Drive", 20],
        ["firearms", "Firearms", 20],
        ["first_aid", "First Aid", 10],
        ["forensics", "Forensics", 0],
        ["heavy_machinery", "Heavy Machinery", 10],
        ["heavy_weapons", "Heavy Weapons", 0],
        ["history", "History", 10],
        ["humint", "HUMINT", 10],
        ["law", "Law", 0],
        ["medicine", "Medicine", 0],
        ["melee_weapons", "Melee Weapons", 30],
        ["military_science", "Military Science", 0, true],
        ["navigate", "Navigate", 10],
        ["occult", "Occult", 10],
        ["persuade", "Persuade", 20],
        ["pharmacy", "Pharmacy", 0],
        ["pilot", "Pilot", 0, true],
        ["psychotherapy", "Psychotherapy", 10],
        ["ride", "Ride", 10],
        ["science", "Science", 0, true],
        ["search", "Search", 20],
        ["sigint", "SIGINT", 0],
        ["stealth", "Stealth", 10],
        ["surgery", "Surgery", 0],
        ["survival", "Survival", 10],
        ["swim", "Swim", 20],
        ["unarmed_combat", "Unarmed Combat", 40],
        ["unnatural", "Unnatural", 0]
    ],

    // Get all skill keys in order
    SKILL_KEYS: function () {
        return this.SKILLS.map(s => s[0]);
    }
};

// Application state
const appState = {
    currentBond: null,
    agentStats: {},
};

const stats = CONFIG.STATS;
const attributesText = CONFIG.ATTRIBUTES;

// Profession data
// Professions data is now in professions.js

/**
 * Populates the profession dropdown menu
 */
function populateProfessionDropdown() {
    const select = document.getElementById('cs-profession-select');
    Object.keys(professions).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = professions[key].title;
        select.appendChild(option);
    });
}

/**
 * Calculates derived attributes based on ability scores
 * @returns {array} [hp, wp, san, bp] - Array of derived attribute values
 */
function calculateAttributes() {
    const strValue = parseInt(document.getElementById('STR-value').innerText);
    const conValue = parseInt(document.getElementById('CON-value').innerText);
    const powValue = parseInt(document.getElementById('POW-value').innerText);

    // Delta Green RPG formulas for derived attributes
    const hp = Math.ceil((strValue + conValue) / 2);
    const wp = powValue;
    const san = powValue * 5;
    const bp = san - powValue;

    return [hp, wp, san, bp];
}

/**
 * Updates the display of derived attribute values on the character sheet
 */
function updateAttributesValues() {
    // Derived attributes are now only displayed in the character sheet form
    // Main stats section no longer shows them, so this function is kept for compatibility
    // but does nothing. The character sheet form (populateCharacterSheetForm) handles
    // calculating and displaying HP, WP, SAN, BP.
}

/**
 * Returns a descriptive phrase for an ability score
 * @param {string} stat - The ability code (STR, CON, etc.)
 * @param {number} value - The ability score (3-18)
 * @returns {string} Descriptor text for the ability score
 */
function getDescriptor(stat, value) {
    const descriptors = {
        STR: [[3, "Feeble"], [5, "Weak"], [9, "Average"], [13, "Muscular"], [17, "Huge"]],
        DEX: [[3, "Barely Mobile"], [5, "Clumsy"], [9, "Average"], [13, "Nimble"], [17, "Acrobatic"]],
        CON: [[3, "Bedridden"], [5, "Sickly"], [9, "Average"], [13, "Perfect health"], [17, "Indefatigable"]],
        INT: [[3, "Imbecilic"], [5, "Slow"], [9, "Average"], [13, "Perceptive"], [17, "Brilliant"]],
        POW: [[3, "Spineless"], [5, "Nervous"], [9, "Average"], [13, "Strong willed"], [17, "Indomitable"]],
        CHA: [[3, "Unbearable"], [5, "Awkward"], [9, "Average"], [13, "Charming"], [17, "Magnetic"]]
    };
    let descriptor = "Unknown";
    descriptors[stat].forEach(([minValue, desc]) => {
        if (value >= minValue) descriptor = desc;
    });
    return descriptor;
}

/**
 * Generates HTML containers for each ability score with controls
 * Creates stat boxes with +/- buttons, x5 values, and descriptors
 */
function generateStatContainers() {
    const container = document.getElementById('stats');
    container.innerHTML = '';
    stats.forEach((stat, index) => {
        const plusSymbol = document.body.classList.contains('theme-son-of-sam') ? '⛤' : '+';
        container.innerHTML += `
                    <div class="stat-container">
                        <span class="stat-label">${stat}</span>
                        <button onclick="adjustStat('${stat}', -1)" class="adjust-button">-</button>
                        <span class="stat-value" id="${stat}-value">3</span>
                        <button onclick="adjustStat('${stat}', 1)" class="adjust-button">${plusSymbol}</button>
                        <span class="x5-label">x5=</span>
                        <span class="x5-value" id="${stat}-x5-value">15</span>
                        <span class="descriptor" id="${stat}-descriptor">${getDescriptor(stat, 3)}</span>
                    </div>
                `;
    });
    updateAttributesValues();
    updateTotalPoints();
}

/**
 * Adjusts a single ability score by a specified amount
 * Enforces bounds (3-18) and updates derived values
 * @param {string} stat - The ability code (STR, CON, etc.)
 * @param {number} adjustment - Amount to adjust (+1 or -1)
 */
function adjustStat(stat, adjustment) {
    const valueElement = document.getElementById(`${stat}-value`);
    let currentValue = parseInt(valueElement.innerText) + adjustment;
    currentValue = Math.max(3, Math.min(currentValue, 18));
    valueElement.innerText = currentValue;
    document.getElementById(`${stat}-x5-value`).innerText = currentValue * 5;
    document.getElementById(`${stat}-descriptor`).innerText = getDescriptor(stat, currentValue);
    updateAttributesValues();
    updateTotalPoints();
}

/**
 * Updates and displays remaining points available for stat allocation
 * Used with point buy system (CONFIG.POINT_BUY_TOTAL total points)
 */
function updateTotalPoints() {
    const totalPointsUsed = stats.reduce((total, stat) => total + parseInt(document.getElementById(`${stat}-value`).innerText), 0);
    const remainingPoints = CONFIG.POINT_BUY_TOTAL - totalPointsUsed;
    document.getElementById('totalPoints').innerText = remainingPoints;
}

/**
 * Distributes CONFIG.POINT_BUY_TOTAL points randomly among all ability scores
 * Ensures no stat exceeds CONFIG.STAT_MAX or goes below CONFIG.STAT_MIN
 */
function randomStats() {
    stats.forEach(stat => {
        document.getElementById(`${stat}-value`).innerText = CONFIG.STAT_MIN.toString();
    });

    let remainingPoints = CONFIG.POINT_BUY_TOTAL - (stats.length * CONFIG.STAT_MIN);

    while (remainingPoints > 0) {
        for (let stat of stats) {
            if (remainingPoints <= 0) break;

            let currentValue = parseInt(document.getElementById(`${stat}-value`).innerText);
            if (currentValue < CONFIG.STAT_MAX) {
                const pointsToAdd = Math.min(remainingPoints, CONFIG.STAT_MAX - currentValue);
                const add = Math.floor(Math.random() * pointsToAdd) + 1;
                currentValue += add;
                remainingPoints -= add;

                document.getElementById(`${stat}-value`).innerText = currentValue.toString();
                document.getElementById(`${stat}-x5-value`).innerText = (currentValue * 5).toString();
                document.getElementById(`${stat}-descriptor`).innerText = getDescriptor(stat, currentValue);
            }
        }
    }

    updateAttributesValues();
    updateTotalPoints();
}

function randomDiceRoll() {
    stats.forEach(stat => {
        const rolls = Array.from({ length: CONFIG.DICE_COUNT }, () => Math.floor(Math.random() * CONFIG.DICE_SIDES) + 1)
            .sort((a, b) => b - a)
            .slice(0, CONFIG.DICE_KEEP);
        const finalValue = Math.max(CONFIG.STAT_MIN, Math.min(rolls.reduce((a, b) => a + b), CONFIG.STAT_MAX));
        document.getElementById(`${stat}-value`).innerText = finalValue;
        document.getElementById(`${stat}-x5-value`).innerText = finalValue * 5;
        document.getElementById(`${stat}-descriptor`).innerText = getDescriptor(stat, finalValue);
    });
    updateAttributesValues();
    updateTotalPoints();
}

function resetStats() {
    stats.forEach(stat => {
        document.getElementById(`${stat}-value`).innerText = '3';
        document.getElementById(`${stat}-x5-value`).innerText = '15';
        document.getElementById(`${stat}-descriptor`).innerText = getDescriptor(stat, 3);
    });
    updateAttributesValues();
    updateTotalPoints();
}


function generateCharacterSheet() {
    var wb = XLSX.utils.book_new(),
        wsData = [["Stat", "Value", "Multiplier (x5)", "Descriptor"]];

    stats.forEach(stat => {
        let value = document.getElementById(`${stat}-value`).innerText;
        let x5 = document.getElementById(`${stat}-x5-value`).innerText;
        let descriptor = document.getElementById(`${stat}-descriptor`).innerText;
        wsData.push([stat, value, x5, descriptor]);
    });

    // Attributes part can be added similarly
    // wsData.push(["Attribute Name", "Value"]);

    var ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Character Stats");

    XLSX.writeFile(wb, "DeltaGreenCharacterSheet.xlsx");
}

/* Character sheet export helpers */
function populateCharacterSheetForm() {
    const csStatsDiv = document.getElementById('cs-stats');
    csStatsDiv.innerHTML = '';
    stats.forEach(stat => {
        const statEl = document.getElementById(`${stat}-value`);
        const value = statEl ? statEl.innerText : '3';
        csStatsDiv.innerHTML += `<div class="stat-container"><span class="stat-label">${stat}</span><input type="number" id="cs-${stat}" value="${value}" min="3" max="18" class="stat-input"></div>`;
    });

    // Generate derived attributes (HP, WP, SAN, BP) dynamically for consistent formatting
    const csDerivedDiv = document.getElementById('cs-derived-attributes');
    if (csDerivedDiv) {
        csDerivedDiv.innerHTML = '';
        const derivedList = [
            ['HP', 'cs-hp', 0],
            ['WP', 'cs-wp', 0],
            ['SAN', 'cs-sanity-value', 50],
            ['BP', 'cs-breaking-point', 40]
        ];
        derivedList.forEach(([label, id, defaultVal]) => {
            const existingEl = document.getElementById(id);
            const currentVal = existingEl ? existingEl.value : defaultVal;
            csDerivedDiv.innerHTML += `<div class="stat-container"><span class="stat-label">${label}</span><input type="number" id="${id}" value="${currentVal}" min="0" class="stat-input"></div>`;
        });
    }

    // populate skills
    const skillsContainer = document.getElementById('cs-skills');
    const skillsList = CONFIG.SKILLS;
    skillsContainer.innerHTML = '';
    // We'll render skills into a 6-column grid (label + input for each of 3 columns)
    skillsList.forEach(([key, label, def], idx) => {
        const colPair = idx % 3; // which of the three columns (0..2)
        const row = Math.floor(idx / 3) + 1; // grid row (1-based)

        const nameSpan = document.createElement('span');
        nameSpan.className = 'cs-skill-name';
        nameSpan.style.gridColumn = (colPair * 2) + 1;
        nameSpan.style.gridRow = row;
        // if specialty flag is true (4th element), render a specialty select with canonical options
        if (Array.isArray(skillsList[idx]) && skillsList[idx][3]) {
            const specId = `cs-skill-${key}-spec`;
            // specialty option sets
            const specialtyOptions = {
                art: ["Creative Writing", "Journalism", "Painting", "Photography", "Sculpture", "Music", "Acting", "Film / Scriptwriting", "Illustration"],
                craft: ["Electrician", "Mechanic", "Locksmithing", "Carpentry", "Plumbing", "Welding", "Microelectronics", "Machinist", "Blacksmith", "Explosives (non-military fabrication)"],
                science: ["Biology", "Chemistry", "Physics", "Mathematics", "Geology", "Astronomy", "Meteorology", "Genetics", "Engineering", "Environmental Science"],
                pilot: ["Fixed-Wing Aircraft", "Helicopter", "Jet Aircraft", "Drone / UAV", "Spacecraft (Handler approval)"],
                military_science: ["Military Science (Land)", "Military Science (Air)", "Military Science (Naval)", "Military Science (Special Operations)"]
            };
            const opts = specialtyOptions[key] || [];
            let optsHtml = '<option value="">Pick</option>' + opts.map(o => `<option value="${o}">${o}</option>`).join('');
            nameSpan.innerHTML = `${label}: <select id="${specId}" class="cs-skill-specialty" style="margin-left:8px;padding:2px 6px;min-width:8ch;">${optsHtml}</select>`;
        } else {
            nameSpan.textContent = label + ':';
        }
        const inputEl = document.createElement('input');
        inputEl.type = 'number';
        inputEl.id = `cs-skill-${key}`;
        inputEl.value = def;
        inputEl.min = 0;
        inputEl.max = 100;
        inputEl.className = 'cs-skill-input';
        inputEl.style.gridColumn = (colPair * 2) + 2;
        inputEl.style.gridRow = row;
        skillsContainer.appendChild(nameSpan);
        skillsContainer.appendChild(inputEl);
        // If a specialty select was created, wire tooltip/title and keep the title updated
        if (Array.isArray(skillsList[idx]) && skillsList[idx][3]) {
            const specId = `cs-skill-${key}-spec`;
            const specEl = document.getElementById(specId);
            if (specEl) {
                const updateTitle = () => { specEl.title = (specEl.options[specEl.selectedIndex] && specEl.options[specEl.selectedIndex].text) ? specEl.options[specEl.selectedIndex].text : 'Pick'; };
                specEl.addEventListener('change', updateTitle);
                specEl.addEventListener('mouseover', updateTitle);
                updateTitle();
            }
        }
    });

    // populate other simple fields
    // compute derived attributes from stats (HP, WP, SAN, BP)
    const s = (id) => {
        const el = document.getElementById(`cs-${id}`);
        if (el && el.value) return parseInt(el.value) || 3;
        const disp = document.getElementById(`${id}-value`);
        if (disp && disp.innerText) return parseInt(disp.innerText) || 3;
        return 3;
    };
    const STRv = s('STR');
    const CONv = s('CON');
    const POWv = s('POW');
    const hp = Math.ceil((STRv + CONv) / 2);
    const wp = POWv;
    const san = POWv * 5;
    const bp = san - POWv;
    console.log(`[populateCharacterSheetForm] Calculated: STR=${STRv}, CON=${CONv}, POW=${POWv} → HP=${hp}, WP=${wp}, SAN=${san}, BP=${bp}`);
    const csSanEl = document.getElementById('cs-sanity-value');
    const csBpEl = document.getElementById('cs-breaking-point');
    const csHpEl = document.getElementById('cs-hp');
    const csWpEl = document.getElementById('cs-wp');
    // fill derived fields (refresh from stats overwrites values)
    if (csHpEl) csHpEl.value = hp;
    if (csWpEl) csWpEl.value = wp;
    if (csSanEl) csSanEl.value = san;
    if (csBpEl) csBpEl.value = bp;
    // add listeners on cs-stat inputs to auto-update derived when user edits stats in sheet
    stats.forEach(stat => {
        const inEl = document.getElementById(`cs-${stat}`);
        if (inEl && !inEl._ds_listened) {
            inEl.addEventListener('input', () => {
                const STRn = parseInt(document.getElementById('cs-STR').value) || 3;
                const CONn = parseInt(document.getElementById('cs-CON').value) || 3;
                const POWn = parseInt(document.getElementById('cs-POW').value) || 3;
                const hpn = Math.ceil((STRn + CONn) / 2);
                const wpn = POWn;
                const sann = POWn * 5;
                const bpn = sann - POWn;
                if (csHpEl) csHpEl.value = hpn;
                if (csWpEl) csWpEl.value = wpn;
                if (csSanEl) csSanEl.value = sann;
                if (csBpEl) csBpEl.value = bpn;
            });
            inEl._ds_listened = true;
        }
    });

    // populate biography fields
    const setIfEmpty = (id, def = '') => { const el = document.getElementById(id); if (!el) return; if (!el.value) el.value = def; };
    setIfEmpty('cs-bio-profession', '');
    setIfEmpty('cs-bio-employer', '');
    setIfEmpty('cs-bio-nationality', '');
    setIfEmpty('cs-bio-sex', '');
    setIfEmpty('cs-bio-age', '');
    setIfEmpty('cs-bio-education', '');
    setIfEmpty('cs-physical-desc', '');
}

/**
 * Add a new custom skill row
 */
function addCustomSkill() {
    const customSkillsDiv = document.getElementById('cs-custom-skills');
    const skillId = 'cs-custom-skill-' + Date.now();

    const skillRow = document.createElement('div');
    skillRow.className = 'custom-skill-row';
    skillRow.style.display = 'flex';
    skillRow.style.gap = '8px';
    skillRow.style.marginTop = '8px';
    skillRow.style.alignItems = 'center';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Skill Name';
    nameInput.className = 'custom-skill-name';
    nameInput.style.flex = '1';
    nameInput.style.padding = '4px 8px';
    nameInput.style.borderRadius = '4px';
    nameInput.style.border = '1px solid rgba(255,255,255,0.2)';
    nameInput.style.backgroundColor = 'transparent';
    nameInput.style.color = 'inherit';

    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.placeholder = '0';
    valueInput.className = 'custom-skill-value';
    valueInput.min = '0';
    valueInput.value = '0';
    valueInput.style.width = '7ch';
    valueInput.style.padding = '4px 8px';
    valueInput.style.borderRadius = '4px';
    valueInput.style.border = '1px solid rgba(255,255,255,0.2)';
    valueInput.style.textAlign = 'center';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.style.padding = '4px 8px';
    removeBtn.style.width = 'auto';
    removeBtn.onclick = () => skillRow.remove();

    // Add event listeners to highlight empty skill names
    const updateEmptyState = () => {
        console.log('[updateEmptyState] called, value:', nameInput.value);
        if (nameInput.value.trim() === '') {
            console.log('[updateEmptyState] Empty - adding highlight');
            nameInput.classList.add('empty-reminder');
            // Also apply inline styles to ensure visibility
            nameInput.style.borderColor = '#ff6b6b';
            nameInput.style.borderWidth = '3px';
            nameInput.style.backgroundColor = 'rgba(255, 107, 107, 0.15)';
            nameInput.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.5)';
        } else {
            console.log('[updateEmptyState] Not empty - removing highlight');
            nameInput.classList.remove('empty-reminder');
            // Reset inline styles
            nameInput.style.borderColor = '';
            nameInput.style.borderWidth = '';
            nameInput.style.backgroundColor = '';
            nameInput.style.boxShadow = '';
        }
    };

    nameInput.addEventListener('input', updateEmptyState);
    nameInput.addEventListener('blur', updateEmptyState);
    nameInput.addEventListener('focus', updateEmptyState);

    // Initial check
    updateEmptyState();

    skillRow.appendChild(nameInput);
    skillRow.appendChild(valueInput);
    skillRow.appendChild(removeBtn);
    customSkillsDiv.appendChild(skillRow);
}

/**
 * Get all custom skills from the form
 * @returns {array} Array of custom skill objects with name and value
 */

/**
 * Select a profession and display its information and optional skills
 * @param {string} professionKey - The key of the selected profession
 */
function selectProfession(professionKey) {
    const infoDiv = document.getElementById('cs-profession-info');
    const optionalDiv = document.getElementById('cs-profession-optional-skills');
    const applyBtn = document.getElementById('apply-profession-button');

    if (!professionKey || !professions[professionKey]) {
        infoDiv.textContent = '';
        optionalDiv.innerHTML = '';
        applyBtn.style.display = 'none';
        return;
    }

    const profession = professions[professionKey];

    // Extract BONDS info
    const bondsMatch = profession.description.match(/BONDS:\s*(\d+)/);
    const bondCount = bondsMatch ? bondsMatch[1] : '?';

    // Update bonds legend
    const bondsLegend = document.querySelector('#cs-bonds-fieldset legend');
    if (bondsLegend) {
        bondsLegend.textContent = `Bonds (${bondCount} available)`;
    }

    // Find the "Choose" line (optional skills header) - can be "Choose any X" or "Choose one"
    const lines = profession.description.split('\n');
    let chooseLineIdx = -1;
    let chooseText = '';
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().toLowerCase().startsWith('choose')) {
            chooseLineIdx = i;
            chooseText = lines[i];
            break;
        }
    }

    // Build display text: everything up to (but not including) the "Choose any" line, without BONDS
    let displayText;
    if (chooseLineIdx >= 0) {
        displayText = lines.slice(0, chooseLineIdx)
            .filter(line => !line.includes('BONDS:'))
            .join('\n')
            .trim();
    } else {
        // No optional skills section, just remove BONDS
        displayText = profession.description
            .replace(/BONDS:\s*\d+/g, '')
            .trim();
    }

    // Add BONDS at the top
    displayText = `BONDS: ${bondCount}\n\n${displayText}`;

    infoDiv.textContent = displayText;

    // Display optional skills with checkboxes
    if (profession.optionalSkills && profession.optionalSkills.length > 0 && chooseText) {
        let html = `<div style="margin-top:12px; padding:8px; background:rgba(0,0,0,0.2); border-radius:4px;">
            <div style="margin-bottom:8px; font-weight:normal; white-space:pre-wrap;">${chooseText}</div>
            <div style="margin-top:8px;">`;

        profession.optionalSkills.forEach((skill, idx) => {
            const checkboxId = `profession-optional-skill-${idx}`;
            html += `<div style="margin:6px 0; display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="${checkboxId}" class="profession-optional-skill" data-skill-name="${skill.name}" data-skill-value="${skill.value}" data-limit="${skill.limit}" style="flex-shrink:0; cursor:pointer;">
                <label for="${checkboxId}" style="cursor:pointer; flex:1; margin:0;">» ${skill.name} ${skill.value}%</label>
            </div>`;
        });
        html += '</div></div>';
        optionalDiv.innerHTML = html;
    } else {
        optionalDiv.innerHTML = '';
    }

    applyBtn.style.display = profession.requiredSkills.length > 0 ? 'inline-block' : 'none';
}

/**
 * Clears all profession-applied skills from the character sheet
 * Removes all custom skill rows and resets predefined skill values to 0
 */
function clearProfessionSkills() {
    // Reset all predefined skills to their default values from CONFIG.SKILLS
    const skillsMap = {};
    CONFIG.SKILLS.forEach(([key, label, defaultValue]) => {
        skillsMap[key] = defaultValue;
    });

    CONFIG.SKILL_KEYS().forEach(skillKey => {
        const input = document.getElementById(`cs-skill-${skillKey}`);
        if (input) {
            // Reset to default value from CONFIG.SKILLS
            input.value = skillsMap[skillKey] || '0';
        }

        // Reset specialty selections
        const specSelect = document.getElementById(`cs-skill-${skillKey}-spec`);
        if (specSelect) {
            specSelect.value = '';
            specSelect.style.borderColor = '';
            specSelect.style.borderWidth = '';
            specSelect.style.backgroundColor = '';
            specSelect.style.color = '';
            specSelect.style.fontWeight = '';
        }
    });

    // Remove all custom skill rows
    const customSkillsDiv = document.getElementById('cs-custom-skills');
    if (customSkillsDiv) {
        const customSkillRows = customSkillsDiv.querySelectorAll('.custom-skill-row');
        customSkillRows.forEach(row => row.remove());
    }
}

/**
 * Apply the selected profession's required and optional skills to the character sheet
 * Clears existing profession skills before applying new ones to prevent stacking
 */
function applyProfessionSkills() {
    const professionSelect = document.getElementById('cs-profession-select');
    const professionKey = professionSelect.value;

    if (!professionKey || !professions[professionKey]) return;

    // Clear all existing profession-applied skills before applying new ones
    clearProfessionSkills();

    const profession = professions[professionKey];
    let appliedCount = 0;

    // Predefined skills - these are the base skill keys
    const predefinedSkills = CONFIG.SKILL_KEYS();

    // Function to extract base skill and specialty from a skill name
    // E.g., "Craft (Electrician)" -> { base: "craft", specialty: "Electrician" }
    // E.g., "Science (choose one)" -> { base: "science", specialty: null, isChoice: true }
    function parseSkillName(skillName) {
        const match = skillName.match(/^([^(]+)(?:\s*\(([^)]+)\))?$/);
        if (!match) return { base: skillName.toLowerCase().replace(/\s+/g, '_'), specialty: null, isChoice: false };

        const basePart = match[1].trim().toLowerCase().replace(/\s+/g, '_');
        const specialty = match[2] ? match[2].trim() : null;
        const isChoice = specialty && (specialty.includes("choose") || specialty === "choose one" || specialty === "choose another");

        return {
            base: basePart,
            specialty: isChoice ? null : specialty,
            isChoice: isChoice
        };
    }

    // Track which base skills have been applied (for handling multiple "choose" skills)
    const appliedBaseSkills = {};

    // Helper function to highlight select elements that need a specialty picked
    function highlightSelectForProfessionSkill(selectElement) {
        if (selectElement) {
            selectElement.classList.add('highlight-empty-input');
            selectElement.style.color = '#fe640b';
            selectElement.style.fontWeight = 'bold';
        }
    }

    // Function to apply a skill
    function applySkill(skillName, skillValue) {
        const parsed = parseSkillName(skillName);
        const inputId = `cs-skill-${parsed.base}`;
        const input = document.getElementById(inputId);

        if (input) {
            // For both choice and non-choice skills, track occurrences to handle multiples

            if (!appliedBaseSkills[parsed.base]) {
                // First occurrence: set the predefined skill
                appliedBaseSkills[parsed.base] = 1;
                input.value = skillValue;

                // Check if this skill has a specialty dropdown (skills with specialties: art, craft, science, pilot, military_science)
                const skillsWithSpecialties = ['art', 'craft', 'science', 'pilot', 'military_science'];
                if (skillsWithSpecialties.includes(parsed.base)) {
                    const specId = `cs-skill-${parsed.base}-spec`;
                    const specSelect = document.getElementById(specId);
                    if (specSelect) {
                        // Highlight the select element to remind user to select a specialty
                        highlightSelectForProfessionSkill(specSelect);

                        // If a specific specialty was provided, select it
                        if (parsed.specialty) {
                            let found = false;
                            // For military_science, options include "Military Science (X)" format
                            // For other skills, options are just the specialty name like "Electrician"
                            let specialtyToMatch = parsed.specialty;
                            if (parsed.base === 'military_science') {
                                specialtyToMatch = `Military Science (${parsed.specialty})`;
                            }

                            for (let option of specSelect.options) {
                                if (option.text === specialtyToMatch) {
                                    specSelect.value = option.value;
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                for (let option of specSelect.options) {
                                    if (option.text.toLowerCase() === specialtyToMatch.toLowerCase()) {
                                        specSelect.value = option.value;
                                        break;
                                    }
                                }
                            }
                        }
                        const event = new Event('change', { bubbles: true });
                        specSelect.dispatchEvent(event);
                    }
                }
                appliedCount++;
            } else {
                // Skill already has a value or this is a subsequent occurrence: create custom skill entry
                appliedBaseSkills[parsed.base] = (appliedBaseSkills[parsed.base] || 1) + 1;

                // Format the skill name for custom entry
                let customName;
                if (parsed.isChoice) {
                    // Remove "(choose one)" or "(choose another)" text for choice skills
                    customName = skillName.replace(/\s*\([^)]*choose[^)]*\)/i, '').trim();
                    customName = `${customName} (Choice ${appliedBaseSkills[parsed.base]})`;
                } else {
                    // For non-choice skills with specialty, use the full skill name
                    customName = skillName;
                }

                if (addCustomSkillFromProfession(customName, skillValue)) {
                    appliedCount++;
                }
            }
        } else if (!predefinedSkills.includes(parsed.base)) {
            // Add as custom skill if not predefined
            if (addCustomSkillFromProfession(skillName, skillValue)) {
                appliedCount++;
            }
        }
    }

    // Apply required skills
    profession.requiredSkills.forEach(skill => {
        applySkill(skill.name, skill.value);
    });

    // Apply selected optional skills
    const optionalCheckboxes = document.querySelectorAll('.profession-optional-skill:checked');
    optionalCheckboxes.forEach(checkbox => {
        const skillName = checkbox.getAttribute('data-skill-name');
        const skillValue = parseInt(checkbox.getAttribute('data-skill-value'));
        applySkill(skillName, skillValue);
    });

    if (appliedCount > 0) {
        alert(`Applied ${appliedCount} professional skill(s)! Check the Skills section to see the changes.`);
        // Remove reminder after button is pressed
        const reminder = document.getElementById('reminder-apply-profession');
        if (reminder) reminder.style.display = 'none';
    } else {
        alert('No skills were applied. Make sure the skills exist in the character sheet.');
    }
}

/**
 * Prepare bonus skills feature - shows the bonus section and populates dropdowns
 */
function getCustomSkills() {
    const customSkillsDiv = document.getElementById('cs-custom-skills');
    const customSkills = [];
    const rows = customSkillsDiv.querySelectorAll('.custom-skill-row');

    rows.forEach((row) => {
        const nameInput = row.querySelector('.custom-skill-name');
        const valueInput = row.querySelector('.custom-skill-value');
        const specSelect = row.querySelector('.cs-skill-specialty');

        // Handle specialty skills (Science, Craft, etc.)
        if (specSelect) {
            // Get the base skill name from the label or parse it
            const label = row.querySelector('label');
            let baseSkillText = '';
            if (label && label.textContent) {
                baseSkillText = label.textContent.replace(':', '').trim();
            }

            // If specialty select has a value, create the full skill name
            if (specSelect.value && specSelect.value !== 'Pick') {
                const specialty = specSelect.value;
                // Handle Military Science special format
                if (specialty.includes('Military Science')) {
                    // It's already in format "Military Science (X)", use as is
                    const skillName = specialty;
                    customSkills.push({
                        name: skillName,
                        value: parseInt(valueInput.value) || 0
                    });
                } else {
                    // Regular format: "Science (Biology)"
                    const skillName = `${baseSkillText} (${specialty})`;
                    customSkills.push({
                        name: skillName,
                        value: parseInt(valueInput.value) || 0
                    });
                }
            }
        }
        // Handle Foreign Language specially (uses text input for language name)
        else if (nameInput && nameInput.value.trim().length > 0 && nameInput.className === 'custom-skill-name') {
            // Check if it looks like "Foreign Language: ..." or just a language name
            const skillName = nameInput.value.trim();
            customSkills.push({
                name: skillName,
                value: parseInt(valueInput.value) || 0
            });
        }
    });

    return customSkills;
}

function prepareBonusSkills() {
    // Get all specialty select elements from the skills section
    const specialtySelects = document.querySelectorAll('.cs-skill-specialty');
    const selectedSpecialties = [];

    specialtySelects.forEach(select => {
        if (select.value && select.value !== 'Pick') {
            const skillName = select.getAttribute('id');

            // Try to extract base skill from ID
            if (!skillName) {
                return; // Skip this one
            }

            const baseSkillMatch = skillName.match(/cs-skill-(\w+)-spec/);
            if (baseSkillMatch) {
                const baseSkill = baseSkillMatch[1];
                const specialty = select.value;
                // Format as "Science (Chemistry)"
                const skillLabel = baseSkill.charAt(0).toUpperCase() +
                    baseSkill.slice(1).replace(/_/g, ' ') +
                    ' (' + specialty + ')';
                selectedSpecialties.push(skillLabel);
            }
        }
    });

    // Show the bonus fieldset
    const bonusSection = document.getElementById('bonus-skills-section');
    if (bonusSection) {
        bonusSection.style.display = 'block';
    }

    // Populate the bonus skills dropdowns
    populateBonusSkillDropdowns();

    if (selectedSpecialties.length > 0) {
        alert(`Found ${selectedSpecialties.length} specialty skill(s). Bonus skills ready!`);
    } else {
        alert('Bonus skills updated! You can boost base skills or custom skills you added.');
    }

    // Remove reminder after button is pressed
    const reminder = document.getElementById('reminder-prepare-bonus');
    if (reminder) reminder.style.display = 'none';
}

/**
 * Populate the 8 bonus skill dropdown selectors with all available skills
 */
function populateBonusSkillDropdowns() {
    const bonusSkillsDiv = document.getElementById('bonus-dropdowns');
    bonusSkillsDiv.innerHTML = '';

    // Get all available skills: base skills + custom/typed skills
    const baseSkillsList = [
        ["accounting", "Accounting"],
        ["alertness", "Alertness"],
        ["anthropology", "Anthropology"],
        ["archeology", "Archeology"],
        ["art", "Art"],
        ["artillery", "Artillery"],
        ["athletics", "Athletics"],
        ["bureaucracy", "Bureaucracy"],
        ["computer_science", "Computer Science"],
        ["craft", "Craft"],
        ["criminology", "Criminology"],
        ["demolitions", "Demolitions"],
        ["disguise", "Disguise"],
        ["dodge", "Dodge"],
        ["drive", "Drive"],
        ["firearms", "Firearms"],
        ["first_aid", "First Aid"],
        ["forensics", "Forensics"],
        ["heavy_machinery", "Heavy Machinery"],
        ["heavy_weapons", "Heavy Weapons"],
        ["history", "History"],
        ["humint", "HUMINT"],
        ["law", "Law"],
        ["medicine", "Medicine"],
        ["melee_weapons", "Melee Weapons"],
        ["military_science", "Military Science"],
        ["navigate", "Navigate"],
        ["occult", "Occult"],
        ["persuade", "Persuade"],
        ["pharmacy", "Pharmacy"],
        ["pilot", "Pilot"],
        ["psychotherapy", "Psychotherapy"],
        ["ride", "Ride"],
        ["science", "Science"],
        ["search", "Search"],
        ["sigint", "SIGINT"],
        ["stealth", "Stealth"],
        ["surgery", "Surgery"],
        ["survival", "Survival"],
        ["swim", "Swim"],
        ["unarmed_combat", "Unarmed Combat"],
        ["unnatural", "Unnatural"]
    ];

    // Get custom/typed skills
    const customSkills = getCustomSkills();

    // Get selected specialties from Skills section
    const specialtySelects = document.querySelectorAll('.cs-skill-specialty');
    const selectedSpecialties = [];
    specialtySelects.forEach(select => {
        const skillName = select.getAttribute('id');
        // Skip if no ID or if value is "Pick" (placeholder)
        if (!skillName || !select.value || select.value === 'Pick') return;

        const baseSkillMatch = skillName.match(/cs-skill-(\w+)-spec/);
        if (baseSkillMatch) {
            const baseSkill = baseSkillMatch[1];
            const specialty = select.value;
            // Format: "Science (Chemistry)"
            const skillLabel = baseSkill.charAt(0).toUpperCase() +
                baseSkill.slice(1).replace(/_/g, ' ') +
                ' (' + specialty + ')';
            selectedSpecialties.push([skillLabel, skillLabel]);
        }
    });

    // Check which base skills have specialty variants in custom skills or selected specialties
    const skillsWithSpecialties = new Set();
    customSkills.forEach(skill => {
        const match = skill.name.match(/^(.+?)\s*\((.+?)\)$/);
        if (match) {
            const baseSkill = match[1].trim().toLowerCase().replace(/\s+/g, '_');
            skillsWithSpecialties.add(baseSkill);
        }
    });
    selectedSpecialties.forEach(([, label]) => {
        const match = label.match(/^(.+?)\s*\((.+?)\)$/);
        if (match) {
            const baseSkill = match[1].trim().toLowerCase().replace(/\s+/g, '_');
            skillsWithSpecialties.add(baseSkill);
        }
    });

    // Build options: base skills (excluding those with specialties), plus selected specialties, plus all other custom skills
    const allSkillOptions = [];

    baseSkillsList.forEach(([key, label]) => {
        if (!skillsWithSpecialties.has(key)) {
            allSkillOptions.push([key, label]);
        }
    });

    // Add selected specialties first
    selectedSpecialties.forEach(option => allSkillOptions.push(option));

    // Add remaining custom skills
    customSkills.forEach(skill => {
        allSkillOptions.push([skill.name, skill.name]);
    });

    // Create 8 dropdown selectors
    for (let i = 0; i < 8; i++) {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.flexDirection = 'column';
        label.style.gap = '4px';
        label.style.color = 'inherit';
        label.textContent = `Boost ${i + 1}:`;

        const select = document.createElement('select');
        select.id = `cs-bonus-skill-${i}`;
        select.className = 'cs-bonus-skill-select';

        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Select Skill --';
        select.appendChild(emptyOption);

        allSkillOptions.forEach(([key, label]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = label;
            select.appendChild(option);
        });

        label.appendChild(select);
        bonusSkillsDiv.appendChild(label);
    }
}

/**
 * Apply bonus skill points: +CONFIG.BONUS_SKILL_POINTS to each selected skill (max CONFIG.BONUS_SKILL_COUNT)
 */
function applyBonusSkills() {
    const selectedSkills = [];
    for (let i = 0; i < CONFIG.BONUS_SKILL_COUNT; i++) {
        const select = document.getElementById(`cs-bonus-skill-${i}`);
        if (select && select.value) {
            selectedSkills.push(select.value);
        }
    }

    if (selectedSkills.length === 0) {
        alert('Please select at least one skill to boost.');
        return;
    }

    let appliedCount = 0;

    selectedSkills.forEach(skillKey => {
        // Check if it's a specialty skill like "Science (Biology)" or "Science (Chemistry)"
        const specialtyMatch = skillKey.match(/^(.+?)\s*\((.+?)\)$/);

        if (specialtyMatch) {
            // It's a specialty format - extract base skill and specialty
            const baseSkillLabel = specialtyMatch[1].trim();
            const specialty = specialtyMatch[2].trim();
            const baseSkillKey = baseSkillLabel.toLowerCase().replace(/\s+/g, '_');

            // First try to find it in custom skills with matching specialty
            const customSkillRows = document.querySelectorAll('.custom-skill-row');
            let found = false;

            customSkillRows.forEach((row, idx) => {
                const nameInput = row.querySelector('.custom-skill-name');
                const valueInput = row.querySelector('.custom-skill-value');
                const specSelect = row.querySelector('select');
                const label = row.querySelector('label');

                // Get skill name from label or nameInput
                let rowSkillName = '';
                if (specSelect) {
                    // Skill with specialty - name is in label
                    if (label) {
                        rowSkillName = label.textContent.replace(':', '').trim();
                    }
                } else if (nameInput) {
                    rowSkillName = nameInput.value;
                }

                // Match both name and specialty if it's a specialty skill
                if (specSelect && specSelect.value) {
                    const rowSpecialty = specSelect.value;
                    if (rowSkillName.toLowerCase() === baseSkillLabel.toLowerCase() &&
                        rowSpecialty.toLowerCase() === specialty.toLowerCase()) {
                        const currentValue = parseInt(valueInput.value) || 0;
                        const newValue = Math.min(currentValue + CONFIG.BONUS_SKILL_POINTS, CONFIG.MAX_SKILL_VALUE);
                        valueInput.value = newValue;
                        found = true;
                    }
                }
            });

            if (!found) {
                // If not found in custom skills, try profession skill input
                const skillInput = document.getElementById(`cs-skill-${baseSkillKey}`);

                if (skillInput) {
                    const currentValue = parseInt(skillInput.value) || 0;
                    const newValue = Math.min(currentValue + CONFIG.BONUS_SKILL_POINTS, CONFIG.MAX_SKILL_VALUE);
                    skillInput.value = newValue;
                    found = true;
                }
            }

            if (found) appliedCount++;
        } else {
            // Check if it's a base skill
            const skillInput = document.getElementById(`cs-skill-${skillKey}`);

            if (skillInput) {
                const currentValue = parseInt(skillInput.value) || 0;
                const newValue = Math.min(currentValue + CONFIG.BONUS_SKILL_POINTS, CONFIG.MAX_SKILL_VALUE);
                skillInput.value = newValue;
                appliedCount++;
            } else {
                // Check if it's a custom skill - we need to find it by name
                const customSkillRows = document.querySelectorAll('.custom-skill-row');
                let found = false;
                customSkillRows.forEach((row, idx) => {
                    const nameInput = row.querySelector('.custom-skill-name');
                    const valueInput = row.querySelector('.custom-skill-value');

                    if (nameInput && nameInput.value === skillKey) {
                        const currentValue = parseInt(valueInput.value) || 0;
                        const newValue = Math.min(currentValue + CONFIG.BONUS_SKILL_POINTS, CONFIG.MAX_SKILL_VALUE);
                        valueInput.value = newValue;
                        found = true;
                    }
                });
                if (found) appliedCount++;
            }
        }
    });
    if (appliedCount > 0) {
        alert(`Applied +${CONFIG.BONUS_SKILL_POINTS} bonus to ${appliedCount} skill(s)!`);
        // Remove reminder after button is pressed
        const reminder = document.getElementById('reminder-apply-bonus');
        if (reminder) reminder.style.display = 'none';
    } else {
        alert('Could not find selected skills to boost.');
    }
}

/**
 * Add a custom skill from profession selection
 * @param {string} skillName - The name of the skill
 * @param {number} skillValue - The proficiency value
 */
function addCustomSkillFromProfession(skillName, skillValue) {
    const customSkillsDiv = document.getElementById('cs-custom-skills');
    const skillRow = document.createElement('div');
    skillRow.className = 'custom-skill-row';
    skillRow.style.display = 'flex';
    skillRow.style.gap = '8px';
    skillRow.style.marginTop = '8px';
    skillRow.style.alignItems = 'center';

    // Parse skill name to extract base skill and specialty
    const skillMatch = skillName.match(/^([^(]+)(?:\s*\(([^)]+)\))?/);
    const skillBase = skillMatch ? skillMatch[1].trim().toLowerCase().replace(/\s+/g, '_') : '';
    const specialty = skillMatch && skillMatch[2] ? skillMatch[2].trim() : null;

    // Define specialty options for skills that have them (excluding Foreign Language which is user-editable)
    const specialtyOptions = {
        art: ["Creative Writing", "Journalism", "Painting", "Photography", "Sculpture", "Music", "Acting", "Film / Scriptwriting", "Illustration"],
        craft: ["Electrician", "Mechanic", "Locksmithing", "Carpentry", "Plumbing", "Welding", "Microelectronics", "Machinist", "Blacksmith", "Explosives (non-military fabrication)"],
        science: ["Biology", "Chemistry", "Physics", "Mathematics", "Geology", "Astronomy", "Meteorology", "Genetics", "Engineering", "Environmental Science"],
        pilot: ["Fixed-Wing Aircraft", "Helicopter", "Jet Aircraft", "Drone / UAV", "Spacecraft (Handler approval)"],
        military_science: ["Military Science (Land)", "Military Science (Air)", "Military Science (Naval)", "Military Science (Special Operations)"]
    };

    // Create name input or label based on specialty
    if (skillBase === 'foreign_language') {
        // Foreign Language is user-editable
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Foreign Language:';
        nameLabel.style.flex = '0 0 auto';
        nameLabel.style.minWidth = '120px';
        skillRow.appendChild(nameLabel);

        // Create editable text input for language name
        const langInput = document.createElement('input');
        langInput.type = 'text';
        langInput.placeholder = 'e.g., French, Spanish, Mandarin';
        langInput.className = 'custom-skill-name';
        langInput.style.flex = '1';
        langInput.style.maxWidth = '200px';
        langInput.style.padding = '4px 8px';
        langInput.style.borderRadius = '4px';
        langInput.style.border = '1px solid rgba(255,255,255,0.2)';
        langInput.style.backgroundColor = 'transparent';
        langInput.style.color = 'inherit';

        // Add highlighting for empty foreign language input (match dropdown "pick" style)
        const updateLangInputHighlight = () => {
            if (langInput.value.trim() === '') {
                langInput.classList.add('highlight-empty-input');
            } else {
                langInput.classList.remove('highlight-empty-input');
            }
        };

        langInput.addEventListener('input', updateLangInputHighlight);
        langInput.addEventListener('blur', updateLangInputHighlight);
        langInput.addEventListener('focus', updateLangInputHighlight);
        updateLangInputHighlight(); // Initial check

        skillRow.appendChild(langInput);
    } else if (specialtyOptions[skillBase]) {
        // Skill has specialty dropdown
        const nameLabel = document.createElement('label');
        nameLabel.textContent = skillBase.charAt(0).toUpperCase() + skillBase.slice(1) + ':';
        nameLabel.style.flex = '0 0 auto';
        nameLabel.style.minWidth = '100px';
        skillRow.appendChild(nameLabel);

        // Create specialty dropdown
        const specSelect = document.createElement('select');
        specSelect.className = 'cs-skill-specialty';
        specSelect.style.padding = '4px 6px';
        specSelect.style.borderRadius = '4px';
        specSelect.style.flex = '1';
        specSelect.style.maxWidth = '200px';
        specSelect.classList.add('highlight-empty-input');
        specSelect.style.color = '#fe640b';
        specSelect.style.fontWeight = 'bold';

        const pickOption = document.createElement('option');
        pickOption.value = '';
        pickOption.textContent = 'Pick';
        specSelect.appendChild(pickOption);

        specialtyOptions[skillBase].forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            specSelect.appendChild(opt);
        });

        // Pre-select the specialty if provided
        if (specialty) {
            let found = false;
            // For military_science, options include "Military Science (X)" format
            // For other skills, options are just the specialty name like "Electrician"
            let specialtyToMatch = specialty;
            if (skillBase === 'military_science') {
                specialtyToMatch = `Military Science (${specialty})`;
            }

            for (let option of specSelect.options) {
                if (option.text === specialtyToMatch) {
                    specSelect.value = option.value;
                    found = true;
                    break;
                }
            }
            if (!found) {
                for (let option of specSelect.options) {
                    if (option.text.toLowerCase() === specialtyToMatch.toLowerCase()) {
                        specSelect.value = option.value;
                        break;
                    }
                }
            }
        }

        skillRow.appendChild(specSelect);
    } else {
        // Regular skill without specialty
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = skillName;
        nameInput.className = 'custom-skill-name';
        nameInput.style.flex = '1';
        nameInput.style.padding = '4px 8px';
        nameInput.style.borderRadius = '4px';
        nameInput.style.border = '1px solid rgba(255,255,255,0.2)';
        nameInput.readOnly = true;
        skillRow.appendChild(nameInput);
    }

    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.value = skillValue;
    valueInput.className = 'custom-skill-value';
    valueInput.min = '0';
    valueInput.style.width = '7ch';
    valueInput.style.padding = '4px 8px';
    valueInput.style.borderRadius = '4px';
    valueInput.style.border = '1px solid rgba(255,255,255,0.2)';
    valueInput.style.textAlign = 'center';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.style.padding = '4px 8px';
    removeBtn.style.width = 'auto';
    removeBtn.onclick = () => skillRow.remove();

    skillRow.appendChild(valueInput);
    skillRow.appendChild(removeBtn);
    customSkillsDiv.appendChild(skillRow);
    return true;
}

/**
 * Builds a complete Foundry VTT Delta Green character JSON
 * Gathers all character data from the form and converts it to the proper Foundry actor format
 * @returns {object} Complete actor object ready for Foundry VTT import
 * @throws {Error} If critical character data is missing or invalid
 */
function buildFoundryJSON() {
    try {
        // Gather basic fields
        const name = document.getElementById('cs-name')?.value || 'Agent';
        const img = document.getElementById('cs-img')?.value || 'icons/svg/mystery-man.svg';
        const type = document.getElementById('cs-type')?.value || 'agent';

        // Statistics
        const statsObj = {};
        stats.forEach(stat => {
            const valInput = document.getElementById(`cs-${stat}`);
            const value = valInput ? parseInt(valInput.value) : parseInt(document.getElementById(`${stat}-value`).innerText);
            const key = stat.toLowerCase();
            statsObj[key] = { value: value, distinguishing_feature: '' };
        });

        // health/wp derived from STR/CON/POW but allow override via sheet fields
        const hpDefault = Math.ceil((statsObj.str.value + statsObj.con.value) / 2);
        const wpDefault = statsObj.pow.value;
        const hpVal = (document.getElementById('cs-hp') && parseInt(document.getElementById('cs-hp').value)) ? parseInt(document.getElementById('cs-hp').value) : hpDefault;
        const wpVal = (document.getElementById('cs-wp') && parseInt(document.getElementById('cs-wp').value)) ? parseInt(document.getElementById('cs-wp').value) : wpDefault;

        // Sanity/physical/biography/corruption
        const sanityValue = (document.getElementById('cs-sanity-value') && parseInt(document.getElementById('cs-sanity-value').value)) ? parseInt(document.getElementById('cs-sanity-value').value) : (statsObj.pow.value * 5);
        const breakingPoint = (document.getElementById('cs-breaking-point') && parseInt(document.getElementById('cs-breaking-point').value)) ? parseInt(document.getElementById('cs-breaking-point').value) : (sanityValue - statsObj.pow.value);
        const physicalDesc = (document.getElementById('cs-physical-desc') && document.getElementById('cs-physical-desc').value) ? document.getElementById('cs-physical-desc').value : '';
        const bioProfession = document.getElementById('cs-bio-profession')?.value || '';
        const bioEmployer = document.getElementById('cs-bio-employer')?.value || '';
        const bioNationality = document.getElementById('cs-bio-nationality')?.value || '';
        const bioSex = document.getElementById('cs-bio-sex')?.value || '';
        const bioAge = document.getElementById('cs-bio-age')?.value || '';
        const bioEducation = document.getElementById('cs-bio-education')?.value || '';
        const corruptionValue = 0;

        // Skills
        const skillsKeys = CONFIG.SKILL_KEYS();
        const skillsObj = {};
        const typedSkillsObj = {};
        const specialtyGroupMap = { art: 'Art', craft: 'Craft', science: 'Science', pilot: 'Pilot', military_science: 'Military Science' };

        skillsKeys.forEach(key => {
            const el = document.getElementById(`cs-skill-${key}`);
            const prof = el ? parseInt(el.value) || 0 : 0;
            // check for specialty input and include it in the label if present
            const specEl = document.getElementById(`cs-skill-${key}-spec`);
            let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (specEl && specEl.value && specEl.value.trim().length > 0 && specEl.value !== 'Pick') {
                const specialty = specEl.value.trim();
                label = `${label} (${specialty})`;
                // Add to typedSkills with a generated ID (timestamp-based)
                const typedSkillId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                const group = specialtyGroupMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                typedSkillsObj[typedSkillId] = { label: specialty, group: group, proficiency: prof, failure: false };
            }
            skillsObj[key] = { label: label, proficiency: prof, failure: false };
        });

        // Add custom skills (only to typedSkills, not to regular skills to avoid duplication)
        const customSkills = getCustomSkills();
        customSkills.forEach(customSkill => {
            const customSkillId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            // Only add to typedSkills with the 'Custom' group flag
            typedSkillsObj[customSkillId] = { label: customSkill.name, group: 'Custom', proficiency: customSkill.value, failure: false };
        });

        // Prototype token and items JSON (allow raw editing)
        let items = [];
        try { items = JSON.parse(document.getElementById('cs-items-json')?.value || '[]'); } catch (e) {
            console.warn('Failed to parse custom items JSON:', e);
            items = [];
        }

        // Add bonds as items
        const bondsToAdd = (window.bondsOnSheet || []).map((bond) => {
            return {
                name: bond.name,
                type: 'bond',
                img: 'icons/svg/mystery-man.svg',
                system: {
                    name: '',
                    description: '<p>' + bond.description.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>',
                    score: bond.score,
                    relationship: bond.relationship || '',
                    hasBeenDamagedSinceLastHomeScene: false
                }
            };
        });

        // Combine items with bonds
        items = bondsToAdd.concat(items);

        // Build default prototypeToken matching Foundry structure
        const defaultProtoToken = {
            actorLink: true,
            name: name,
            displayName: 0,
            appendNumber: false,
            prependAdjective: false,
            width: 1,
            height: 1,
            texture: {
                src: img,
                anchorX: 0.5,
                anchorY: 0.5,
                offsetX: 0,
                offsetY: 0,
                fit: 'contain',
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                tint: '#ffffff',
                alphaThreshold: 0.75
            },
            hexagonalShape: 0,
            lockRotation: false,
            rotation: 0,
            alpha: 1,
            disposition: -1,
            displayBars: 0,
            bar1: { attribute: 'health' },
            bar2: { attribute: 'wp' },
            light: {
                negative: false,
                priority: 0,
                alpha: 0.5,
                angle: 360,
                bright: 0,
                color: null,
                coloration: 1,
                dim: 0,
                attenuation: 0.5,
                luminosity: 0.5,
                saturation: 0,
                contrast: 0,
                shadows: 0,
                animation: { type: null, speed: 5, intensity: 5, reverse: false },
                darkness: { min: 0, max: 1 }
            },
            sight: {
                enabled: false,
                range: 0,
                angle: 360,
                visionMode: 'basic',
                color: null,
                attenuation: 0.1,
                brightness: 0,
                saturation: 0,
                contrast: 0
            },
            detectionModes: [],
            occludable: { radius: 0 },
            ring: {
                enabled: false,
                colors: { ring: null, background: null },
                effects: 1,
                subject: { scale: 1, texture: null }
            },
            flags: {},
            randomImg: false
        };

        // Merge with user prototypeToken if provided
        let prototypeToken = {};
        try { prototypeToken = JSON.parse(document.getElementById('cs-prototype-json')?.value || '{}'); } catch (e) {
            console.warn('Failed to parse custom prototype token JSON:', e);
            prototypeToken = {};
        }
        const finalProtoToken = Object.assign(defaultProtoToken, prototypeToken);

        const foundry = {
            name: name,
            type: type,
            prototypeToken: finalProtoToken,
            img: img,
            system: {
                health: { value: hpVal, min: 0, max: hpVal },
                wp: { value: wpVal, min: 0, max: wpVal },
                statistics: statsObj,
                skills: skillsObj,
                typedSkills: typedSkillsObj,
                specialTraining: [],
                settings: { sorting: { weaponSortAlphabetical: false, armorSortAlphabetical: false, gearSortAlphabetical: false, tomeSortAlphabetical: false, ritualSortAlphabetical: false }, rolling: { defaultPercentileModifier: 20 } },
                schemaVersion: 1,
                sanity: { value: sanityValue, currentBreakingPoint: breakingPoint, adaptations: { violence: { incident1: false, incident2: false, incident3: false }, helplessness: { incident1: false, incident2: false, incident3: false } } },
                physical: { description: physicalDesc, wounds: "", firstAidAttempted: false, exhausted: false, exhaustedPenalty: -20 },
                biography: { profession: bioProfession, employer: bioEmployer, nationality: bioNationality, sex: bioSex, age: bioAge, education: bioEducation },
                corruption: { value: corruptionValue, haveSeenTheYellowSign: false, gift: "", insight: "" }
            },
            items: items,
            effects: [],
            flags: { exportSource: { world: "generated", system: "deltagreen" } }
        };

        return foundry;
    } catch (error) {
        console.error('Error building Foundry JSON:', error);
        alert(`Error building character export: ${error.message}`);
        throw error;
    }
}

/**
 * Populates the character sheet form and updates the JSON preview
 */
function populateCharacterJSON() {
    try {
        populateCharacterSheetForm();
        const obj = buildFoundryJSON();
        const pretty = JSON.stringify(obj, null, 2);
        const jsonPreviewEl = document.getElementById('cs-json');
        if (jsonPreviewEl) {
            jsonPreviewEl.innerText = pretty;
            jsonPreviewEl.style.display = 'block';
        }
    } catch (error) {
        console.error('Error populating JSON:', error);
        alert('Failed to generate JSON preview. Check console for details.');
    }
}

/**
 * Exports the character as a downloadable JSON file
 * Triggers browser download dialog with actor data
 */
function exportCharacterJSON() {
    try {
        const obj = buildFoundryJSON();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', dataStr);
        dlAnchor.setAttribute('download', (obj.name || 'Agent') + '.json');
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
    } catch (error) {
        console.error('Error exporting JSON:', error);
        alert('Failed to export character. Check console for details.');
    }
}

/**
 * Detect if the user is on a mobile or tablet device
 * @returns {boolean} true if on mobile/tablet, false otherwise
 */
function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    // Check for mobile/tablet user agents and screen size
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet|windows phone/i;
    const isMobileUA = mobileRegex.test(userAgent.toLowerCase());
    const isMobileScreen = window.innerWidth <= 768;
    return isMobileUA || isMobileScreen;
}

// Keep the character sheet form in sync when stats change
const observer = new MutationObserver(() => { try { populateCharacterSheetForm(); } catch (e) { } });

window.onload = function () {
    generateStatContainers();
    resetStats();
    populateProfessionDropdown();
    populateCharacterSheetForm();

    // Ensure stats are reset after a short delay to override any DOM mutations
    setTimeout(() => {
        resetStats();
        populateCharacterSheetForm();
    }, 50);

    observer.observe(document.getElementById('stats'), { childList: true, subtree: true, characterData: true });

    // initialize theme from storage and wire selector
    try {
        // Determine default theme: use mobile theme for mobile devices, xfiles for desktop
        const defaultTheme = isMobileDevice() ? 'mobile' : 'xfiles';
        const stored = localStorage.getItem('dg_theme') || defaultTheme;
        setTheme(stored);
        const sel = document.getElementById('cs-theme-select');
        if (sel) {
            sel.value = stored;
            sel.addEventListener('change', (e) => setTheme(e.target.value));
        }
    } catch (e) { }
};

/**
 * Theme Management: Switch between X-Files, Modern, Morris, and Son of Sam themes
 * Persists theme selection to localStorage for consistency across sessions
 * @param {string} theme - 'xfiles', 'modern', 'morris', or 'son-of-sam'
 */
function setTheme(theme) {
    try {
        const body = document.body;
        body.classList.remove('theme-modern', 'theme-morris', 'theme-son-of-sam', 'theme-mobile');

        if (theme === 'modern') {
            body.classList.add('theme-modern');
        } else if (theme === 'morris') {
            body.classList.add('theme-morris');
        } else if (theme === 'son-of-sam') {
            body.classList.add('theme-son-of-sam');
        } else if (theme === 'mobile') {
            body.classList.add('theme-mobile');
        }

        localStorage.setItem('dg_theme', theme);
        const sel = document.getElementById('cs-theme-select');
        if (sel) sel.value = theme;
    } catch (e) { }
}

/**
 * Generates a random bond from selected categories with typing effect
 * Stores the result in appState.currentBond for later addition to sheet
 * Bond format from bonds.js: "Name ^ ^ Relationship ^ ^ Description"
 */
function generateRandomBond() {
    const bondButton = document.getElementById('bonds-button');
    bondButton.disabled = true;

    const selectedCategories = Array.from(document.querySelectorAll('input[name="bond-category"]:checked')).map(checkbox => checkbox.value);
    const availableBonds = selectedCategories.flatMap(category => bonds[category] || []);

    const bondTextElement = document.getElementById('bondText');
    bondTextElement.innerHTML = ''; // Clear previous text

    // Apply theme-appropriate styling
    if (document.body.classList.contains('theme-modern')) {
        bondTextElement.style.fontFamily = 'inherit';
        bondTextElement.style.color = '#cdd6f4';
        bondTextElement.style.borderColor = 'rgba(255, 255, 255, 0.02)';
    } else if (document.body.classList.contains('theme-morris')) {
        bondTextElement.style.fontFamily = 'inherit';
        bondTextElement.style.color = '#8be9fd';
        bondTextElement.style.borderColor = 'rgba(139, 233, 253, 0.15)';
    } else if (document.body.classList.contains('theme-son-of-sam')) {
        bondTextElement.style.fontFamily = "'Courier New', monospace";
        bondTextElement.style.color = '#f5e6d3';
        bondTextElement.style.borderColor = 'rgba(255, 0, 0, 0.2)';
    } else if (document.body.classList.contains('theme-mobile')) {
        bondTextElement.style.fontFamily = 'inherit';
        bondTextElement.style.color = '#1a1a1a';
        bondTextElement.style.borderColor = 'rgba(0, 0, 0, 0.1)';
    } else {
        // X-Files theme (default)
        bondTextElement.style.fontFamily = "'Courier New', monospace";
        bondTextElement.style.color = '#00b521';
        bondTextElement.style.borderColor = '#00b521';
    }

    if (availableBonds.length > 0) {
        const randomBond = availableBonds[Math.floor(Math.random() * availableBonds.length)];
        // Store the original bond in appState for later parsing
        appState.currentBond = randomBond;

        // Replace ^ with <br> for typing effect
        let displayBond = randomBond.replace(/\^/g, '<br>');

        let i = 0;
        function typeChar() {
            if (displayBond.substring(i, i + 4) === '<br>') {
                bondTextElement.innerHTML += '<br>';
                i += 4; // Skip past the <br> tag
            } else if (i < displayBond.length) {
                bondTextElement.innerHTML += displayBond[i];
                i++;
            }
            if (i < displayBond.length) {
                setTimeout(typeChar, 25); // Adjust typing speed as needed
            } else {
                bondButton.disabled = false; // Re-enable the button after typing
            }
        }
        typeChar(); // Start typing effect
    } else {
        bondTextElement.innerHTML = "No bond available.";
        bondButton.disabled = false;
        appState.currentBond = null;
    }
}

// Track bonds added to sheet as array of objects
if (!window.bondsOnSheet) {
    window.bondsOnSheet = [];
}

/**
 * Adds the currently generated bond to the character's bond sheet
 * Parses bond text using CONFIG.BOND_DELIMITER into name, relationship, and description
 * Generates unique ID and renders the bond on the sheet
 */
function addBondToSheet() {
    if (!appState.currentBond) {
        alert('Generate a bond first!');
        return;
    }

    try {
        // Parse bond text: "Name ^ ^ Relationship ^ ^ Description"
        const parts = appState.currentBond.split(CONFIG.BOND_DELIMITER);
        let bondName = '';
        let bondRelationship = '';
        let bondDescription = '';

        if (parts.length === 3) {
            bondName = parts[0].trim();
            bondRelationship = parts[1].trim();
            bondDescription = parts[2].trim();
        } else {
            // Fallback if format doesn't match
            bondName = appState.currentBond.substring(0, 30) + (appState.currentBond.length > 30 ? '...' : '');
            bondDescription = appState.currentBond;
        }

        // Validate bond data
        if (!bondName) {
            throw new Error('Bond name is empty');
        }

        // Create a unique ID for this bond entry
        const bondId = 'bond-' + Date.now() + Math.random().toString(36).substr(2, 9);

        // Create bond object with parsed values
        const bondObj = {
            id: bondId,
            name: bondName,
            relationship: bondRelationship,
            description: bondDescription,
            score: 10
        };

        window.bondsOnSheet.push(bondObj);
        renderBondsOnSheet();
    } catch (error) {
        console.error('Error adding bond to sheet:', error);
        alert(`Failed to add bond: ${error.message}`);
    }
}

/**
 * Removes a bond from the character sheet by ID
 * @param {string} bondId - Unique identifier for the bond to remove
 */
function removeBondFromSheet(bondId) {
    window.bondsOnSheet = window.bondsOnSheet.filter(b => b.id !== bondId);
    renderBondsOnSheet();
}

/**
 * Updates a bond's name field and triggers re-render
 * @param {string} bondId - Bond's unique identifier
 * @param {string} newName - New name for the bond
 */
function updateBondName(bondId, newName) {
    const bond = window.bondsOnSheet.find(b => b.id === bondId);
    if (bond) {
        bond.name = newName;
    }
}

/**
 * Updates a bond's relationship field and triggers re-render
 * @param {string} bondId - Bond's unique identifier
 * @param {string} newRelationship - New relationship description
 */
function updateBondRelationship(bondId, newRelationship) {
    const bond = window.bondsOnSheet.find(b => b.id === bondId);
    if (bond) {
        bond.relationship = newRelationship;
    }
}

/**
 * Updates a bond's score (strength rating) and triggers re-render
 * @param {string} bondId - Bond's unique identifier
 * @param {number} newScore - New score value (typically 0-10)
 */
function updateBondScore(bondId, newScore) {
    const bond = window.bondsOnSheet.find(b => b.id === bondId);
    if (bond) {
        bond.score = parseInt(newScore) || 10;
    }
}

/**
 * Renders all bonds on the character sheet as editable entries
 * Creates individual bond panels with fields for name, relationship, and score
 * Also includes Foundry JSON preview for each bond
 */
function renderBondsOnSheet() {
    const bondsContainer = document.getElementById('cs-bonds');

    if (window.bondsOnSheet.length === 0) {
        bondsContainer.innerHTML = '<p style="opacity:0.8;margin:0;">(No bonds yet — add bonds using the BONDS button above.)</p>';
        return;
    }

    let html = '';
    window.bondsOnSheet.forEach(bond => {
        html += `
            <div class="bond-entry">
                <div style="display:flex;gap:8px;margin-bottom:6px;">
                    <input type="text" class="bond-entry-field" placeholder="Bond Name" value="${bond.name}" onchange="updateBondName('${bond.id}', this.value)" style="flex:1;min-width:0;">
                    <button type="button" class="bond-remove-button" onclick="removeBondFromSheet('${bond.id}')">Remove</button>
                </div>
                <div style="margin-bottom:6px;">
                    <textarea class="bond-entry-field" placeholder="Bond Description/Text" readonly style="height:80px;resize:vertical;">${bond.description}</textarea>
                </div>
                <div style="display:flex;gap:8px;">
                    <div style="flex:1;">
                        <label style="font-size:0.85em;opacity:0.8;">Relationship:</label>
                        <input type="text" class="bond-entry-field" placeholder="Edit relationship..." value="${bond.relationship}" onchange="updateBondRelationship('${bond.id}', this.value)">
                    </div>
                    <div style="flex:0 0 100px;">
                        <label style="font-size:0.85em;opacity:0.8;">Score:</label>
                        <input type="number" class="bond-entry-field" value="${bond.score}" min="0" max="20" onchange="updateBondScore('${bond.id}', this.value)">
                    </div>
                </div>
                <details style="margin-top:6px;font-size:0.85em;">
                    <summary style="cursor:pointer;opacity:0.8;">JSON Code</summary>
                    <pre><code>${JSON.stringify({
            name: bond.name || 'New Bond',
            type: bond.relationship || 'bond',
            system: {
                name: '',
                description: '<p>' + bond.description.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>',
                score: bond.score,
                relationship: '',
                hasBeenDamagedSinceLastHomeScene: false
            }
        }, null, 2)}</code></pre>
                </details>
            </div>
        `;
    });

    bondsContainer.innerHTML = html;
}

/**
 * Generates a printable HTML version of the character sheet
 * Includes filled sections plus blank spaces for user to fill in
 * Can be saved, printed to PDF, or viewed in browser
 */
