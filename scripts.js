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
const professions = {
    "anthropologist": {
        title: "Anthropologist or Historian",
        description: `You study humanity. You're concerned with the patterns that emerge over time, across land masses, cultures, and language groups. You might be a number-cruncher, a field worker trudging through the jungle, a consultant in a war zone, or a think-tank analyst sifting myth from history in studies of the Tcho-Tcho peoples.

RECOMMENDED STATS: INT

PROFESSIONAL SKILLS:
» Anthropology 50% or Archeology 50%
» Bureaucracy 40%
» Foreign Language (choose one) 50%
» Foreign Language (choose another) 40%
» History 60%
» Occult 40%
» Persuade 40%

Choose any two of these that you don't already have:
» Anthropology 40%
» Archeology 40%
» HUMINT 50%
» Navigate 50%
» Ride 50%
» Search 60%
» Survival 50%

BONDS: 4`
    },
    "computer_scientist": {
        title: "Computer Scientist or Engineer",
        description: `Computers and machinery are the backbone of modern industry. You are a craftsman with data or machinery, possibly for the government and most definitely for profit. However you use your skills, the overlap between information technology and awareness of the unnatural could make this the most dangerous job on the planet.

RECOMMENDED STATS: INT

PROFESSIONAL SKILLS:
» Computer Science 60%
» Craft (Electrician) 30%
» Craft (Mechanic) 30%
» Craft (Microelectronics) 40%
» Science (Mathematics) 40%
» SIGINT 40%

Choose any four of these that you don't already have:
» Accounting 50%
» Bureaucracy 50%
» Craft (choose one) 40%
» Foreign Language (choose one) 40%
» Heavy Machinery 50%
» Law 40%
» Science (choose one) 40%

BONDS: 3`
    },
    "federal_agent": {
        title: "Federal Agent",
        description: `Many Delta Green Agents are federal law enforcement officers, mostly from the FBI. Delta Green decided long ago that federal agents have the optimum balance of skills and mental stability needed to confront the unnatural. For other versions of this profession see FEDERAL AGENCIES on page 104.

RECOMMENDED STATS: CON, POW, CHA

PROFESSIONAL SKILLS:
» Alertness 50%
» Bureaucracy 40%
» Criminology 50%
» Drive 50%
» Firearms 50%
» Forensics 30%
» HUMINT 60%
» Law 30%
» Persuade 50%
» Search 50%
» Unarmed Combat 60%

Choose one of these:
» Accounting 60%
» Computer Science 50%
» Foreign Language (choose one) 50%
» Heavy Weapons 50%
» Pharmacy 50%

BONDS: 3`
    },
    "physician": {
        title: "Physician",
        description: `Doctors are often the first to uncover signs of an unnatural incursion, and the most valuable investigators of its disastrous effects on humanity.

RECOMMENDED STATS: INT, POW, DEX

PROFESSIONAL SKILLS:
» Bureaucracy 50%
» First Aid 60%
» Medicine 60%
» Persuade 40%
» Pharmacy 50%
» Science (Biology) 60%
» Search 40%

Choose any two of these that you don't already have:
» Forensics 50%
» Psychotherapy 60%
» Science (choose one) 50%
» Surgery 50%

BONDS: 3`
    },
    "scientist": {
        title: "Scientist",
        description: `You expand human knowledge in a field such as biology, physics, or chemistry. When certain forms of knowledge cause insanity and death, it's easy to conclude that some hypotheses should not be tested.

RECOMMENDED STATS: INT

PROFESSIONAL SKILLS:
» Bureaucracy 40%
» Computer Science 40%
» Science (choose one) 60%
» Science (choose another) 50%
» Science (choose another) 50%

Choose any three of these:
» Accounting 50%
» Craft (choose one) 40%
» Foreign Language (choose one) 40%
» Forensics 40%
» Law 40%
» Pharmacy 40%

BONDS: 4`
    },
    "special_operator": {
        title: "Special Operator",
        description: `As part of a force like the U.S. Army Rangers, you volunteered for a more difficult path than other soldiers. You've spent years in the most grueling training on the planet, and now serve on the most dangerous missions around. For other versions of this profession (U.S. Army Special Forces, SEALs, USMC Raiders, FBI Hostage Rescue Team, CIA Special Operations Group, and so on), see FEDERAL AGENCIES on page 104.

RECOMMENDED STATS: STR, CON, POW

PROFESSIONAL SKILLS:
» Alertness 60%
» Athletics 60%
» Demolitions 40%
» Firearms 60%
» Heavy Weapons 50%
» Melee Weapons 50%
» Military Science (Land) 60%
» Navigate 50%
» Stealth 50%
» Survival 50%
» Swim 50%
» Unarmed Combat 60%

BONDS: 2`
    },
    "criminal": {
        title: "Criminal",
        description: `So much is illegal that there are broad economies of crime. This profile fits a hardened militant or a traditional "black collar" criminal: pimp, burglar, extortionist, or thug. If you want a white-collar criminal, choose Computer Scientist or Business Executive and make very risky decisions.

RECOMMENDED STATS: STR, DEX

PROFESSIONAL SKILLS:
» Alertness 50%
» Athletics 50%
» Criminology 60%
» Dodge 40%
» Drive 50%
» Firearms 40%
» Law 20%
» Melee Weapons 40%
» Persuade 50%
» Stealth 50%
» Unarmed Combat 50%

Choose two from:
» Craft (Locksmithing) 40%
» Demolitions 40%
» Disguise 50%
» Foreign Language (choose one) 40%
» Forensics 40%
» HUMINT 50%
» Navigate 50%
» Occult 50%
» Pharmacy 40%

BONDS: 4`
    },
    "firefighter": {
        title: "Firefighter",
        description: `Your job oscillates between the tedium of maintaining your gear, exhilaration when the alarm finally comes, and the work of investigating a scene after the smoke has cleared. If you're involved with Delta Green, you clearly stumbled into something worse than a house fire.

RECOMMENDED STATS: STR, DEX, CON

PROFESSIONAL SKILLS:
» Alertness 50%
» Athletics 60%
» Craft (Electrician) 40%
» Craft (Mechanic) 40%
» Demolitions 50%
» Drive 50%
» First Aid 50%
» Forensics 40%
» Heavy Machinery 50%
» Navigate 50%
» Search 40%

BONDS: 3`
    },
    "foreign_service": {
        title: "Foreign Service Officer",
        description: `You travel to strange lands, meet interesting people, and try to get along with them. Odds are you work for the State Department, though USAID, the Commercial Service and the Foreign Agriculture Service also have FSOs. Either way, you've had every opportunity to learn exotic and deadly things; the kinds of things that qualify you for Delta Green clearance.

RECOMMENDED STATS: INT, CHA

PROFESSIONAL SKILLS:
» Accounting 40%
» Anthropology 40%
» Bureaucracy 60%
» Foreign Language (choose one) 50%
» Foreign Language (choose one) 50%
» Foreign Language (choose one) 40%
» History 40%
» HUMINT 50%
» Law 40%
» Persuade 50%

BONDS: 3`
    },
    "intelligence_analyst": {
        title: "Intelligence Analyst",
        description: `In the FBI, NSA and CIA, there are those who gather information and those who decide what it means. You take information from disparate sources—newspapers, websites, informants, ELINT, and the assets developed by Case Officers—and figure out what it means. In short, your job is the piecing together of unrelated knowledge, a dangerous endeavor in the world of Delta Green.

RECOMMENDED STATS: INT

PROFESSIONAL SKILLS:
» Anthropology 40%
» Bureaucracy 50%
» Computer Science 40%
» Criminology 40%
» Foreign Language (choose one) 50%
» Foreign Language (choose one) 50%
» Foreign Language (choose one) 40%
» History 40%
» HUMINT 50%
» SIGINT 40%

BONDS: 3`
    },
    "intelligence_case_officer": {
        title: "Intelligence Case Officer",
        description: `You recruit people to spy on their own countries for your agency, probably the CIA. Your job is to develop foreign intelligence sources ("assets"), communicate with them, and keep them under control, productive, and alive. It's a hard business because you must view everyone as a potential threat, liar, or tool to further your agenda. If your name came to the attention of Delta Green, congratulations; you are now someone else's asset.

RECOMMENDED STATS: INT, POW, CHA

PROFESSIONAL SKILLS:
» Alertness 50%
» Bureaucracy 40%
» Criminology 50%
» Disguise 50%
» Drive 40%
» Firearms 40%
» Foreign Language (choose one) 50%
» Foreign Language (choose another) 40%
» HUMINT 60%
» Persuade 60%
» SIGINT 40%
» Stealth 50%
» Unarmed Combat 50%

BONDS: 2`
    },
    "lawyer_executive": {
        title: "Lawyer or Business Executive",
        description: `Your tools are a computer and smartphone. You might be moving millions of dollars, or bits of data, or both. Or you might be a prosecutor, a defense attorney, or judge.

RECOMMENDED STATS: INT, CHA

PROFESSIONAL SKILLS:
» Accounting 50%
» Bureaucracy 50%
» HUMINT 40%
» Persuade 60%

Choose four from:
» Computer Science 50%
» Criminology 60%
» Foreign Language (choose one) 50%
» Law 50%
» Pharmacy 50%

BONDS: 4`
    },
    "media_specialist": {
        title: "Media Specialist",
        description: `You might be an author, an editor, a researcher for a company or any branch of the government, a blogger, a TV reporter, or a scholar of rare texts. With the unnatural, you've uncovered the story of a lifetime.

RECOMMENDED STATS: INT, CHA

PROFESSIONAL SKILLS:
» Art (choose one: Creative Writing, Journalism, Poetry, Scriptwriting, etc.) 60%
» History 40%
» HUMINT 40%
» Persuade 50%

Choose five from:
» Anthropology 40%
» Archeology 40%
» Art (choose one) 40%
» Bureaucracy 50%
» Computer Science 40%
» Criminology 50%
» Foreign Language (choose one) 40%
» Law 40%
» Military Science (choose one) 40%
» Occult 50%
» Science (choose one) 40%

BONDS: 4`
    },
    "nurse_paramedic": {
        title: "Nurse or Paramedic",
        description: `Medical professionals are on the front line when awful things happen. Is that what brought you to the group's attention?

RECOMMENDED STATS: INT, POW, CHA

PROFESSIONAL SKILLS:
» Alertness 40%
» Bureaucracy 40%
» First Aid 60%
» HUMINT 40%
» Medicine 40%
» Persuade 40%
» Pharmacy 40%
» Science (Biology) 40%

Choose two from:
» Drive 60%
» Forensics 40%
» Navigate 50%
» Psychotherapy 50%
» Search 60%

BONDS: 4`
    },
    "pilot_sailor": {
        title: "Pilot or Sailor",
        description: `Air or sea, commercial or military, your duty is to keep your passengers alive and craft intact. This can lead to hard choices when your passengers put the vehicle in danger. Or are you a drone operator, flying a Predator from a thousand miles away? Either way, what op brought you to the attention of Delta Green?

RECOMMENDED STATS: DEX, INT

PROFESSIONAL SKILLS:
» Alertness 60%
» Bureaucracy 30%
» Craft (Electrician) 40%
» Craft (Mechanic) 40%
» Navigate 50%
» Pilot (choose one) 60%
» Science (Meteorology) 40%
» Swim 40%

Choose two from:
» Foreign Language (choose one) 50%
» Pilot (choose one) 50%
» Heavy Weapons 50%
» Military Science (choose one) 50%

BONDS: 3`
    },
    "police_officer": {
        title: "Police Officer",
        description: `You serve and protect. Police officers walk the beat in uniform. Deputy sheriffs answer to an elected law enforcer and have jurisdiction over an entire county. Detectives come in after the fact and put the pieces together.

RECOMMENDED STATS: STR, CON, POW

PROFESSIONAL SKILLS:
» Alertness 60%
» Bureaucracy 40%
» Criminology 40%
» Drive 50%
» Firearms 40%
» First Aid 30%
» HUMINT 50%
» Law 30%
» Melee Weapons 50%
» Navigate 40%
» Persuade 40%
» Search 40%
» Unarmed Combat 60%

Choose one from:
» Forensics 50%
» Heavy Machinery 60%
» Heavy Weapons 50%
» Ride 60%

BONDS: 3`
    },
    "program_manager": {
        title: "Program Manager",
        description: `You run an organization. Someone has to secure funding, move resources, and make connections, and that's you. You control a budget and are responsible for how your program is maintained and where the money goes. Organizations discover the most startling things in their pursuit of profit or the public good.

RECOMMENDED STATS: INT, CHA

PROFESSIONAL SKILLS:
» Accounting 60%
» Bureaucracy 60%
» Computer Science 50%
» Criminology 30%
» Foreign Language (choose one) 50%
» History 40%
» Law 40%
» Persuade 50%

Choose one from:
» Anthropology 30%
» Art (choose one) 30%
» Craft (choose one) 30%
» Science (choose one) 30%

BONDS: 4`
    },
    "soldier_marine": {
        title: "Soldier or Marine",
        description: `Governments will always need boots on the ground and steady hands holding rifles. When war begins, civilization gets out of the way. With the social contract void, unnatural things creep in at the edges. There's a reason Delta Green began in the military.

RECOMMENDED STATS: STR, CON

PROFESSIONAL SKILLS:
» Alertness 50%
» Athletics 50%
» Bureaucracy 30%
» Drive 40%
» Firearms 40%
» First Aid 40%
» Military Science (Land) 40%
» Navigate 40%
» Persuade 30%
» Unarmed Combat 50%

Choose three from:
» Artillery 40%
» Computer Science 40%
» Craft (choose one) 40%
» Demolitions 40%
» Foreign Language (choose one) 40%
» Heavy Machinery 50%
» Heavy Weapons 40%
» Search 60%
» SIGINT 40%
» Swim 60%

BONDS: 4`
    },
    "new_profession": {
        title: "New Profession",
        description: `If none of the professions suit your Agent, use these guidelines to build a new one.

PROFESSIONAL SKILLS: Pick ten professional skills for the new profession. Divide 400 skill points between them. Add those points to each skill's starting level. As a rule of thumb, professional skills should be 30% to 50%. No professional skill may be higher than 60%.

BONDS: 3

CUSTOMIZE: For each additional bond (to a maximum of 4), reduce professional skill points by 50. For each bond removed (to a minimum of 1), add 50 professional skill points.`
    }
};

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
 * Displays the information for the selected profession
 * @param {string} professionKey - The key of the selected profession
 */
function displayProfessionInfo(professionKey) {
    const infoDiv = document.getElementById('cs-profession-info');
    if (!professionKey || !professions[professionKey]) {
        infoDiv.textContent = '';
        return;
    }
    infoDiv.textContent = professions[professionKey].description;
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
    document.getElementById('cs-json').innerText = pretty;
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

window.onload = function() {
    generateStatContainers();
    populateProfessionDropdown();
};
