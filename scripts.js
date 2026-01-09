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

const stats = ['STR', 'CON', 'DEX', 'INT', 'POW', 'CHA'];
const attributesText = ['Hit Points (HP)', 'Willpower Points (WP)', 'Sanity Points (SAN)', 'Breaking Point (BP)'];

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
    const attributes = calculateAttributes();
    stats.forEach((stat, index) => {
        if (index < 4) {
            document.getElementById(`${stat}-attribute-value`).innerText = attributes[index];
        }
    });
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
        const attributeInfo = index < 4 ? `<span class="attributes">${attributesText[index]}</span><span class="attribute-values" id="${stat}-attribute-value"></span>` : '';
        container.innerHTML += `
                    <div class="stat-container">
                        <span class="stat-label">${stat}</span>
                        <button onclick="adjustStat('${stat}', -1)" class="adjust-button">-</button>
                        <span class="stat-value" id="${stat}-value">3</span>
                        <button onclick="adjustStat('${stat}', 1)" class="adjust-button">+</button>
                        <span class="x5-label">x5=</span>
                        <span class="x5-value" id="${stat}-x5-value">15</span>
                        <span class="descriptor" id="${stat}-descriptor">${getDescriptor(stat, 3)}</span>
                        ${attributeInfo}
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
 * Used with point buy system (72 total points)
 */
function updateTotalPoints() {
    const totalPointsUsed = stats.reduce((total, stat) => total + parseInt(document.getElementById(`${stat}-value`).innerText), 0);
    const remainingPoints = 72 - totalPointsUsed;
    document.getElementById('totalPoints').innerText = remainingPoints;
}

/**
 * Distributes 72 points randomly among all ability scores
 * Ensures no stat exceeds 18 or goes below 3
 */
function randomStats() {
    stats.forEach(stat => {
        document.getElementById(`${stat}-value`).innerText = '3';
    });

    let remainingPoints = 72 - (stats.length * 3);

    while (remainingPoints > 0) {
        for (let stat of stats) {
            if (remainingPoints <= 0) break;

            let currentValue = parseInt(document.getElementById(`${stat}-value`).innerText);
            if (currentValue < 18) {
                const pointsToAdd = Math.min(remainingPoints, 18 - currentValue);
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
        const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
            .sort((a, b) => b - a)
            .slice(0, 3);
        const finalValue = Math.max(3, Math.min(rolls.reduce((a, b) => a + b), 18));
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

    // populate skills
    const skillsContainer = document.getElementById('cs-skills');
    const skillsList = [
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
    ];
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
        if (el) return parseInt(el.value) || 3;
        const disp = document.getElementById(`${id}-value`);
        return disp ? parseInt(disp.innerText) : 3;
    };
    const STRv = s('STR');
    const CONv = s('CON');
    const POWv = s('POW');
    const hp = Math.ceil((STRv + CONv) / 2);
    const wp = POWv;
    const san = POWv * 5;
    const bp = san - POWv;
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

    skillRow.appendChild(nameInput);
    skillRow.appendChild(valueInput);
    skillRow.appendChild(removeBtn);
    customSkillsDiv.appendChild(skillRow);
}

/**
 * Get all custom skills from the form
 * @returns {array} Array of custom skill objects with name and value
 */
function getCustomSkills() {
    const customSkillsDiv = document.getElementById('cs-custom-skills');
    const customSkills = [];
    const rows = customSkillsDiv.querySelectorAll('.custom-skill-row');

    rows.forEach(row => {
        const nameInput = row.querySelector('.custom-skill-name');
        const valueInput = row.querySelector('.custom-skill-value');
        if (nameInput && nameInput.value.trim().length > 0) {
            customSkills.push({
                name: nameInput.value.trim(),
                value: parseInt(valueInput.value) || 0
            });
        }
    });

    return customSkills;
}

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
    infoDiv.textContent = profession.description;

    // Display optional skills with checkboxes
    if (profession.optionalSkills && profession.optionalSkills.length > 0) {
        let html = '<div style="margin-top:12px; padding:8px; background:rgba(0,0,0,0.2); border-radius:4px;"><strong>Optional Skills (Choose up to listed limit):</strong><div style="margin-top:8px;">';
        profession.optionalSkills.forEach((skill, idx) => {
            const checkboxId = `profession-optional-skill-${idx}`;
            html += `<div style="margin:6px 0;">
                <input type="checkbox" id="${checkboxId}" class="profession-optional-skill" data-skill-name="${skill.name}" data-skill-value="${skill.value}" data-limit="${skill.limit}">
                <label for="${checkboxId}" style="cursor:pointer;">${skill.name} ${skill.value}%${skill.notes ? ' (' + skill.notes + ')' : ''}</label>
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
 * Apply the selected profession's required and optional skills to the character sheet
 */
function applyProfessionSkills() {
    const professionSelect = document.getElementById('cs-profession-select');
    const professionKey = professionSelect.value;

    if (!professionKey || !professions[professionKey]) return;

    const profession = professions[professionKey];
    let appliedCount = 0;

    // Predefined skills - these are the base skill keys
    const predefinedSkills = ["accounting", "alertness", "anthropology", "archeology", "art", "artillery", "athletics", "bureaucracy", "computer_science", "craft", "criminology", "demolitions", "disguise", "dodge", "drive", "firearms", "first_aid", "forensics", "heavy_machinery", "heavy_weapons", "history", "humint", "law", "medicine", "melee_weapons", "military_science", "navigate", "occult", "persuade", "pharmacy", "pilot", "psychotherapy", "ride", "science", "search", "sigint", "stealth", "surgery", "survival", "swim", "unarmed_combat", "unnatural"];

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
            // Add orange border and background to draw attention
            selectElement.style.borderColor = '#fe640b';
            selectElement.style.borderWidth = '2px';
            selectElement.style.backgroundColor = '#fff3e0';
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
    } else {
        alert('No skills were applied. Make sure the skills exist in the character sheet.');
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
        specSelect.style.border = '2px solid #fe640b';
        specSelect.style.backgroundColor = '#fff3e0';
        specSelect.style.color = '#fe640b';
        specSelect.style.fontWeight = 'bold';
        specSelect.style.flex = '1';
        specSelect.style.maxWidth = '200px';

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
 */
function buildFoundryJSON() {
    // Gather basic fields
    const name = document.getElementById('cs-name').value || 'Agent';
    const img = document.getElementById('cs-img').value || 'icons/svg/mystery-man.svg';
    const type = document.getElementById('cs-type').value || 'agent';

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
    const bioProfession = document.getElementById('cs-bio-profession') ? document.getElementById('cs-bio-profession').value : '';
    const bioEmployer = document.getElementById('cs-bio-employer') ? document.getElementById('cs-bio-employer').value : '';
    const bioNationality = document.getElementById('cs-bio-nationality') ? document.getElementById('cs-bio-nationality').value : '';
    const bioSex = document.getElementById('cs-bio-sex') ? document.getElementById('cs-bio-sex').value : '';
    const bioAge = document.getElementById('cs-bio-age') ? document.getElementById('cs-bio-age').value : '';
    const bioEducation = document.getElementById('cs-bio-education') ? document.getElementById('cs-bio-education').value : '';
    const corruptionValue = 0;

    // Skills
    const skillsKeys = ["accounting", "alertness", "anthropology", "archeology", "art", "artillery", "athletics", "bureaucracy", "computer_science", "craft", "criminology", "demolitions", "disguise", "dodge", "drive", "firearms", "first_aid", "forensics", "heavy_machinery", "heavy_weapons", "history", "humint", "law", "medicine", "melee_weapons", "military_science", "navigate", "occult", "persuade", "pharmacy", "pilot", "psychotherapy", "ride", "science", "search", "sigint", "stealth", "surgery", "survival", "swim", "unarmed_combat", "unnatural"];
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

    // Add custom skills
    const customSkills = getCustomSkills();
    customSkills.forEach(customSkill => {
        const customSkillId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        skillsObj[customSkillId] = { label: customSkill.name, proficiency: customSkill.value, failure: false };
        // Also add to typedSkills for consistency
        typedSkillsObj[customSkillId] = { label: customSkill.name, group: 'Custom', proficiency: customSkill.value, failure: false };
    });

    // Prototype token and items JSON (allow raw editing)
    let items = [];
    try { items = JSON.parse(document.getElementById('cs-items-json').value); } catch (e) { items = []; }

    // Add bonds as items
    const bondsToAdd = (window.bondsOnSheet || []).map((bond, idx) => {
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
    try { prototypeToken = JSON.parse(document.getElementById('cs-prototype-json').value); } catch (e) { prototypeToken = {}; }
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
}

/**
 * Populates the character sheet form and updates the JSON preview
 */
function populateCharacterJSON() {
    populateCharacterSheetForm();
    const obj = buildFoundryJSON();
    const pretty = JSON.stringify(obj, null, 2);
    const jsonPreviewEl = document.getElementById('cs-json');
    jsonPreviewEl.innerText = pretty;
    jsonPreviewEl.style.display = 'block';
}

/**
 * Exports the character as a downloadable JSON file
 * Triggers browser download dialog with actor data
 */
function exportCharacterJSON() {
    const obj = buildFoundryJSON();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', (obj.name || 'Agent') + '.json');
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

// Keep the character sheet form in sync when stats change
const observer = new MutationObserver(() => { try { populateCharacterSheetForm(); } catch (e) { } });
window.addEventListener('load', () => { populateCharacterSheetForm(); observer.observe(document.getElementById('stats'), { childList: true, subtree: true, characterData: true }); });

/**
 * Theme Management: Switch between X-Files (default green retro) and Modern (Catppuccin palette)
 * Persists theme selection to localStorage for consistency across sessions
 * @param {string} theme - Either 'xfiles' or 'modern'
 */
function setTheme(theme) {
    try {
        const body = document.body;
        if (theme === 'modern') {
            body.classList.add('theme-modern');
        } else {
            body.classList.remove('theme-modern');
        }
        localStorage.setItem('dg_theme', theme);
        const sel = document.getElementById('cs-theme-select');
        if (sel) sel.value = theme;
    } catch (e) { }
}

// initialize theme from storage and wire selector
window.addEventListener('load', () => {
    try {
        const stored = localStorage.getItem('dg_theme') || 'xfiles';
        setTheme(stored);
        const sel = document.getElementById('cs-theme-select');
        if (sel) {
            sel.value = stored;
            sel.addEventListener('change', (e) => setTheme(e.target.value));
        }
    } catch (e) { }
});

/**
 * Generates a random bond from selected categories with typing effect
 * Stores the result in window.currentBond for later addition to sheet
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
    } else {
        // X-Files theme (default)
        bondTextElement.style.fontFamily = "'Courier New', monospace";
        bondTextElement.style.color = '#00b521';
        bondTextElement.style.borderColor = '#00b521';
    }

    if (availableBonds.length > 0) {
        let randomBond = availableBonds[Math.floor(Math.random() * availableBonds.length)];
        // Store the current bond without <br> replacements for later use
        window.currentBond = randomBond.replace(/\^/g, ' ');

        // Correctly replace ^ with <br> before typing effect starts
        randomBond = randomBond.replace(/\^/g, '<br>');

        let i = 0;
        function typeChar() {
            if (randomBond.substring(i, i + 4) === '<br>') {
                bondTextElement.innerHTML += '<br>';
                i += 4; // Skip past the <br> tag
            } else if (i < randomBond.length) {
                bondTextElement.innerHTML += randomBond[i];
                i++;
            }
            if (i < randomBond.length) {
                setTimeout(typeChar, 25); // Adjust typing speed as needed
            } else {
                bondButton.disabled = false; // Re-enable the button after typing
            }
        }
        typeChar(); // Start typing effect
    } else {
        bondTextElement.innerHTML = "No bond available.";
        bondButton.disabled = false;
        window.currentBond = null;
    }
}

// Track bonds added to sheet as array of objects
if (!window.bondsOnSheet) {
    window.bondsOnSheet = [];
}

/**
 * Adds the currently generated bond to the character's bond sheet
 * Parses bond text using " ^ ^ " delimiter into name, relationship, and description
 * Generates unique ID and renders the bond on the sheet
 */
function addBondToSheet() {
    if (!window.currentBond) {
        alert('Generate a bond first!');
        return;
    }

    // Parse bond text: format is "Name ^ ^ Relationship ^ ^ Description"
    const parts = window.currentBond.split(' ^ ^ ');
    let bondName = '';
    let bondRelationship = '';
    let bondDescription = '';

    if (parts.length === 3) {
        bondName = parts[0].trim();
        bondRelationship = parts[1].trim();
        bondDescription = parts[2].trim();
    } else {
        // Fallback if format doesn't match
        bondName = window.currentBond.substring(0, 30) + (window.currentBond.length > 30 ? '...' : '');
        bondDescription = window.currentBond;
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
            <div class="bond-entry" style="border:1px solid #00b521;padding:8px;margin-bottom:8px;border-radius:4px;">
                <div style="display:flex;gap:8px;margin-bottom:6px;">
                    <input type="text" placeholder="Bond Name" value="${bond.name}" onchange="updateBondName('${bond.id}', this.value)" style="flex:1;padding:4px;">
                    <button type="button" onclick="removeBondFromSheet('${bond.id}')" style="padding:4px 8px;cursor:pointer;">Remove</button>
                </div>
                <div style="margin-bottom:6px;">
                    <textarea placeholder="Bond Description/Text" readonly style="width:100%;padding:4px;border-radius:4px;font-size:0.9em;height:50px;">${bond.description}</textarea>
                </div>
                <div style="display:flex;gap:8px;">
                    <div style="flex:1;">
                        <label style="font-size:0.85em;opacity:0.8;">Relationship:</label>
                        <input type="text" placeholder="Edit relationship..." value="${bond.relationship}" onchange="updateBondRelationship('${bond.id}', this.value)" style="width:100%;padding:4px;">
                    </div>
                    <div style="flex:0 0 100px;">
                        <label style="font-size:0.85em;opacity:0.8;">Score:</label>
                        <input type="number" value="${bond.score}" min="0" max="20" onchange="updateBondScore('${bond.id}', this.value)" style="width:100%;padding:4px;">
                    </div>
                </div>
                <details style="margin-top:6px;font-size:0.85em;">
                    <summary style="cursor:pointer;opacity:0.8;">JSON Code</summary>
                    <pre style="background:#f5f5f5;padding:8px;border-radius:4px;overflow-x:auto;margin-top:4px;"><code>${JSON.stringify({
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
 * Can be saved, printed to PDF, or viewed in browser
 */
function exportPrintable() {
    // Gather all character data
    const name = document.getElementById('cs-name').value || 'Agent';
    const profession = document.getElementById('cs-profession-select').value || '';
    const professionTitle = profession ? professions[profession].title : 'No Profession Selected';
    
    // Get stats
    const statsData = {};
    stats.forEach(stat => {
        statsData[stat] = document.getElementById(`${stat}-value`).innerText;
    });
    
    // Get derived attributes
    const attrs = calculateAttributes();
    const attributeLabels = ['HP', 'WP', 'SAN', 'BP'];
    const attributeData = {};
    attributeLabels.forEach((label, idx) => {
        attributeData[label] = attrs[idx];
    });
    
    // Get biography data
    const bioData = {
        nationality: document.getElementById('cs-nationality')?.value || '',
        sex: document.getElementById('cs-sex')?.value || '',
        age: document.getElementById('cs-age')?.value || '',
        description: document.getElementById('cs-description')?.value || ''
    };
    
    // Get skills
    const skillElements = document.querySelectorAll('#cs-skills [id$="-skill"]');
    const skills = [];
    skillElements.forEach(elem => {
        const skillName = elem.id.replace('-skill', '');
        const value = elem.value;
        const specialty = document.getElementById(`${skillName}-specialty`)?.value || '';
        if (value && value > 0) {
            skills.push({
                name: skillName.replace(/_/g, ' '),
                value: value,
                specialty: specialty
            });
        }
    });
    
    // Get bonds
    const bondsData = window.bondsOnSheet || [];
    
    // Create printable HTML
    const printableHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delta Green Character Sheet - ${name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            background: #fff;
            color: #000;
            padding: 20px;
            line-height: 1.4;
        }
        
        .character-sheet {
            max-width: 8.5in;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border: 2px solid #000;
        }
        
        .header {
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .header-title {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 8px;
        }
        
        .header-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            font-size: 12px;
        }
        
        .header-info-item {
            display: flex;
            justify-content: space-between;
        }
        
        .header-info-label {
            font-weight: bold;
            min-width: 80px;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .stat-box {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-size: 11px;
        }
        
        .stat-box-label {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 3px;
        }
        
        .stat-box-value {
            font-size: 18px;
            font-weight: bold;
        }
        
        .attributes-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .attribute-box {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-size: 10px;
        }
        
        .attribute-box-label {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 2px;
        }
        
        .attribute-box-value {
            font-size: 16px;
            font-weight: bold;
        }
        
        .skills-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .skill-list {
            font-size: 10px;
        }
        
        .skill-item {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            border-bottom: 0.5px dotted #ccc;
        }
        
        .skill-name {
            flex: 1;
        }
        
        .skill-value {
            min-width: 30px;
            text-align: right;
            font-weight: bold;
        }
        
        .skill-specialty {
            font-size: 8px;
            font-style: italic;
            opacity: 0.8;
        }
        
        .bonds-list {
            font-size: 10px;
        }
        
        .bond-item {
            margin-bottom: 10px;
            padding: 8px;
            border-left: 2px solid #000;
            page-break-inside: avoid;
        }
        
        .bond-name {
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .bond-description {
            font-size: 9px;
            margin-bottom: 2px;
        }
        
        .bond-relationship {
            font-size: 9px;
            opacity: 0.8;
        }
        
        .bio-text {
            font-size: 10px;
            line-height: 1.5;
            max-height: 60px;
            overflow: hidden;
        }
        
        .footer {
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-top: 20px;
            font-size: 8px;
            text-align: right;
            opacity: 0.7;
        }
        
        @media print {
            body {
                padding: 0;
            }
            .character-sheet {
                border: none;
                padding: 0;
                max-width: 100%;
            }
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="character-sheet">
        <div class="header">
            <div class="header-title">DELTA GREEN AGENT DOSSIER</div>
            <div class="header-info">
                <div class="header-info-item">
                    <span class="header-info-label">Agent Name:</span>
                    <span>${name}</span>
                </div>
                <div class="header-info-item">
                    <span class="header-info-label">Profession:</span>
                    <span>${professionTitle}</span>
                </div>
                <div class="header-info-item">
                    <span class="header-info-label">Nationality:</span>
                    <span>${bioData.nationality}</span>
                </div>
                <div class="header-info-item">
                    <span class="header-info-label">Age:</span>
                    <span>${bioData.age}</span>
                </div>
                <div class="header-info-item">
                    <span class="header-info-label">Sex:</span>
                    <span>${bioData.sex}</span>
                </div>
                <div class="header-info-item">
                    <span class="header-info-label">Created:</span>
                    <span>${new Date().toLocaleDateString()}</span>
                </div>
            </div>
        </div>
        
        <!-- Statistics Section -->
        <div class="section">
            <div class="section-title">Statistics</div>
            <div class="stats-grid">
                ${stats.map(stat => `
                    <div class="stat-box">
                        <div class="stat-box-label">${stat}</div>
                        <div class="stat-box-value">${statsData[stat]}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Attributes Section -->
        <div class="section">
            <div class="section-title">Attributes</div>
            <div class="attributes-grid">
                ${attributeLabels.map(label => `
                    <div class="attribute-box">
                        <div class="attribute-box-label">${label}</div>
                        <div class="attribute-box-value">${attributeData[label]}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Skills Section -->
        <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-section">
                <div class="skill-list">
                    ${skills.slice(0, Math.ceil(skills.length / 2)).map(skill => `
                        <div class="skill-item">
                            <span class="skill-name">${skill.name}${skill.specialty ? ' (' + skill.specialty + ')' : ''}</span>
                            <span class="skill-value">${skill.value}%</span>
                        </div>
                    `).join('')}
                </div>
                <div class="skill-list">
                    ${skills.slice(Math.ceil(skills.length / 2)).map(skill => `
                        <div class="skill-item">
                            <span class="skill-name">${skill.name}${skill.specialty ? ' (' + skill.specialty + ')' : ''}</span>
                            <span class="skill-value">${skill.value}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Biography Section -->
        ${bioData.description ? `
        <div class="section">
            <div class="section-title">Background</div>
            <div class="bio-text">${bioData.description.replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        
        <!-- Bonds Section -->
        ${bondsData.length > 0 ? `
        <div class="section">
            <div class="section-title">Bonds</div>
            <div class="bonds-list">
                ${bondsData.map(bond => `
                    <div class="bond-item">
                        <div class="bond-name">${bond.name || 'Unknown Bond'}</div>
                        <div class="bond-description">${bond.description}</div>
                        <div class="bond-relationship">Relationship: ${bond.relationship || 'N/A'} | Score: ${bond.score || 0}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="footer">
            Delta Green Character Sheet | Generated on ${new Date().toLocaleString()}
        </div>
    </div>
    <script>
        window.addEventListener('load', function() {
            window.print();
        });
    </script>
</body>
</html>`;
    
    // Create blob and download
    const blob = new Blob([printableHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = 'DeltaGreen_' + name.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.html';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

window.onload = function () {
    generateStatContainers();
    populateProfessionDropdown();
};
