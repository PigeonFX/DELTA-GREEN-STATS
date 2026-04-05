// ============================================================================
// DELTA GREEN STATS - APPLICATION LOGIC
// ============================================================================
// This file handles all character sheet functionality including:
// - Stat management (adjust, randomize)
// - Attribute calculations (HP, WP, SAN, BP)
// - Skill management with specialties
// - Bond generation and management
// - Foundry VTT JSON export
// - Biography generation
// ============================================================================

// Note: bioData is defined in bio.js and loaded before this script

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Escapes a string for safe insertion into HTML attributes and text content.
 * Prevents XSS when rendering user-supplied data back into the DOM.
 * @param {*} str - Value to escape
 * @returns {string} HTML-safe string
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================
const CONFIG = {
    STATS: ['STR', 'CON', 'DEX', 'INT', 'POW', 'CHA'],
    POINT_BUY_TOTAL: 72,
    STAT_MIN: 3,
    STAT_MAX: 18,
    BONUS_SKILL_COUNT: 8,
    BONUS_SKILL_POINTS: 20,
    MAX_SKILL_VALUE: 80,
    DICE_COUNT: 4,
    DICE_SIDES: 6,
    DICE_KEEP: 3,
    TYPING_SPEED_MS: 10,          // ms per character in the bond text typing effect

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
        ["heavy_machiner", "Heavy Machinery", 10],
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
};

/**
 * Suggested specialty options for each skill group.
 * These populate the convenience dropdowns, but they're just a starting point.
 * If the rules don't cover what your agent does in the field — add it here.
 * Military Science entries are already in "Skill (X)" format; all others are
 * bare specialty names combined with the base skill label at render time.
 */
const SPECIALTY_OPTIONS = {
    // Drawn from official rulebook descriptions. Add entries freely — the Program
    // has no jurisdiction over what ends up in this list.
    art: [
        "Acting", "Creative Writing", "Forgery", "Journalism", "Painting",
        "Photography", "Scriptwriting", "Illustration"
    ],
    craft: [
        "Architect", "Carpenter", "Electrician", "Gunsmith", "Locksmith",
        "Mechanic", "Microelectronics", "Plumber", "Machinist", "Welder", "Blacksmith"
    ],
    // Foreign Language has no fixed list — common examples offered, free text always available.
    foreign_language: [
        "Arabic", "Chinese (Mandarin)", "French", "German", "Greek", "Hebrew",
        "Hindi", "Indonesian", "Italian", "Japanese", "Korean", "Persian/Farsi",
        "Portuguese", "Russian", "Spanish", "Swahili", "Turkish", "Vietnamese"
    ],
    // Military Science specialty is just the domain (Land / Air / Sea). DisplayName is built
    // as "Military Science (Land)" etc. by getCompletedSkills().
    military_science: ["Land", "Air", "Sea", "Special Operations"],
    pilot: [
        "Airplane", "Drone", "Helicopter", "Small Boat", "Ship",
        "Space Shuttle", "Jet Aircraft"
    ],
    science: [
        "Astronomy", "Biology", "Botany", "Chemistry", "Engineering",
        "Genetics", "Geology", "Mathematics", "Meteorology", "Physics",
        "Planetology", "Zoology"
    ]
};

/** Set of CONFIG.SKILLS keys that require a specialty sub-option and are stored as instances. */
const SPECIALTY_SKILL_KEYS = new Set(Object.keys(SPECIALTY_OPTIONS));

/**
 * Module-level cache of [value, displayText] options built by populateBonusSkillDropdowns().
 * Used by fillBonusPackage() to rebuild filtered dropdowns without re-scanning the DOM.
 */
let _bonusAllSkillOptions = [];

/**
 * Human-readable placeholder text for each typed choose-slot sentinel.
 * Shown in the dropdown's empty option when a package fills a slot with a required category.
 */
const PKG_HINTS = {
    '?art': '\u2193 Choose an Art specialty',
    '?craft': '\u2193 Choose a Craft specialty',
    '?foreign_language': '\u2193 Choose a Foreign Language',
    '?military_science': '\u2193 Choose a Military Science specialty',
    '?pilot': '\u2193 Choose a Pilot specialty',
    '?science': '\u2193 Choose a Science specialty',
    '?any': '\u2193 Choose any skill',
    '?anthro_arch': '\u2193 Choose Anthropology or Archeology',
    '?any_from_list': '\u2193 Choose from the list above',
};

/**
 * Filter functions for typed choose-slot sentinels.
 * Matches against the option VALUE (specialty options use display text as value).
 */
const PKG_HINT_FILTER = {
    '?art': ([v]) => v.startsWith('Art ('),
    '?craft': ([v]) => v.startsWith('Craft ('),
    '?foreign_language': ([v]) => v.startsWith('Foreign Language ('),
    '?military_science': ([v]) => v.startsWith('Military Science ('),
    '?pilot': ([v]) => v.startsWith('Pilot ('),
    '?science': ([v]) => v.startsWith('Science ('),
    '?anthro_arch': ([v]) => v === 'anthropology' || v === 'archeology',
    // '?any' and '?any_from_list' intentionally absent — no filter, full list kept
};

/**
 * Optional Bonus Skill Point Packages from the Delta Green rulebook (p.20).
 * '?xxx' sentinels = typed choose-slots; fillBonusPackage() filters the dropdown to that category.
 * Plain strings = CONFIG.SKILLS keys or specialty display text (e.g. 'Craft (Electrician)').
 */
const BONUS_PACKAGES = [
    {
        label: 'Artist, Actor, or Musician',
        skills: ['alertness', '?craft', 'disguise', 'persuade', '?art', '?art', '?art', 'humint'],
        desc: 'Alertness \u00b7 Craft (choose one) \u00b7 Disguise \u00b7 Persuade \u00b7 Art (choose one) \u00b7 Art (choose another) \u00b7 Art (choose another) \u00b7 HUMINT'
    },
    {
        label: 'Athlete',
        skills: ['alertness', 'athletics', 'dodge', 'first_aid', 'humint', 'persuade', 'swim', 'unarmed_combat'],
        desc: 'Alertness \u00b7 Athletics \u00b7 Dodge \u00b7 First Aid \u00b7 HUMINT \u00b7 Persuade \u00b7 Swim \u00b7 Unarmed Combat'
    },
    {
        label: 'Author, Editor, or Journalist',
        skills: ['anthropology', '?art', 'bureaucracy', 'history', 'humint', 'law', 'occult', 'persuade'],
        desc: 'Anthropology \u00b7 Art (choose one: Creative Writing, Journalism, Scriptwriting, etc.) \u00b7 Bureaucracy \u00b7 History \u00b7 HUMINT \u00b7 Law \u00b7 Occult \u00b7 Persuade'
    },
    {
        label: '\u201cBlack Bag\u201d Training',
        skills: ['alertness', 'athletics', 'Craft (Electrician)', 'Craft (Locksmith)', 'criminology', 'disguise', 'search', 'stealth'],
        desc: 'Alertness \u00b7 Athletics \u00b7 Craft (Electrician) \u00b7 Craft (Locksmith) \u00b7 Criminology \u00b7 Disguise \u00b7 Search \u00b7 Stealth'
    },
    {
        label: 'Blue-Collar Worker',
        skills: ['alertness', '?craft', '?craft', 'drive', 'first_aid', 'heavy_machiner', 'navigate', 'search'],
        desc: 'Alertness \u00b7 Craft (choose one) \u00b7 Craft (choose another) \u00b7 Drive \u00b7 First Aid \u00b7 Heavy Machinery \u00b7 Navigate \u00b7 Search'
    },
    {
        label: 'Bureaucrat',
        skills: ['accounting', 'bureaucracy', 'computer_science', 'criminology', 'humint', 'law', 'persuade', '?any'],
        desc: 'Accounting \u00b7 Bureaucracy \u00b7 Computer Science \u00b7 Criminology \u00b7 HUMINT \u00b7 Law \u00b7 Persuade \u00b7 personal specialty (choose one)'
    },
    {
        label: 'Clergy',
        skills: ['?foreign_language', '?foreign_language', '?foreign_language', 'history', 'humint', 'occult', 'persuade', 'psychotherapy'],
        desc: 'Foreign Language (choose one) \u00b7 Foreign Language (choose another) \u00b7 Foreign Language (choose another) \u00b7 History \u00b7 HUMINT \u00b7 Occult \u00b7 Persuade \u00b7 Psychotherapy'
    },
    {
        label: 'Combat Veteran',
        skills: ['alertness', 'dodge', 'firearms', 'first_aid', 'heavy_weapons', 'melee_weapons', 'stealth', 'unarmed_combat'],
        desc: 'Alertness \u00b7 Dodge \u00b7 Firearms \u00b7 First Aid \u00b7 Heavy Weapons \u00b7 Melee Weapons \u00b7 Stealth \u00b7 Unarmed Combat'
    },
    {
        label: 'Computer Enthusiast or Hacker',
        skills: ['computer_science', 'Craft (Microelectronics)', 'Science (Mathematics)', 'sigint', '?any', '?any', '?any', '?any'],
        desc: 'Computer Science \u00b7 Craft (Microelectronics) \u00b7 Science (Mathematics) \u00b7 SIGINT \u00b7 personal specialties \u00d74 (choose freely)'
    },
    {
        label: 'Counselor',
        skills: ['bureaucracy', 'first_aid', '?foreign_language', 'humint', 'law', 'persuade', 'psychotherapy', 'search'],
        desc: 'Bureaucracy \u00b7 First Aid \u00b7 Foreign Language (choose one) \u00b7 HUMINT \u00b7 Law \u00b7 Persuade \u00b7 Psychotherapy \u00b7 Search'
    },
    {
        label: 'Criminalist',
        skills: ['accounting', 'bureaucracy', 'computer_science', 'criminology', 'forensics', 'law', 'pharmacy', 'search'],
        desc: 'Accounting \u00b7 Bureaucracy \u00b7 Computer Science \u00b7 Criminology \u00b7 Forensics \u00b7 Law \u00b7 Pharmacy \u00b7 Search'
    },
    {
        label: 'Firefighter',
        skills: ['alertness', 'demolitions', 'drive', 'first_aid', 'forensics', 'heavy_machiner', 'navigate', 'search'],
        desc: 'Alertness \u00b7 Demolitions \u00b7 Drive \u00b7 First Aid \u00b7 Forensics \u00b7 Heavy Machinery \u00b7 Navigate \u00b7 Search'
    },
    {
        label: 'Gangster or Deep Cover',
        skills: ['alertness', 'criminology', 'dodge', 'drive', 'persuade', 'stealth', '?any_from_list', '?any_from_list'],
        desc: 'Alertness \u00b7 Criminology \u00b7 Dodge \u00b7 Drive \u00b7 Persuade \u00b7 Stealth \u00b7 choose 2 from: Athletics, Foreign Language, Firearms, HUMINT, Melee Weapons, Pharmacy, Unarmed Combat'
    },
    {
        label: 'Interrogator',
        skills: ['criminology', '?foreign_language', '?foreign_language', 'humint', 'law', 'persuade', 'pharmacy', 'search'],
        desc: 'Criminology \u00b7 Foreign Language (choose one) \u00b7 Foreign Language (choose another) \u00b7 HUMINT \u00b7 Law \u00b7 Persuade \u00b7 Pharmacy \u00b7 Search'
    },
    {
        label: 'Liberal Arts Degree',
        skills: ['?anthro_arch', '?art', '?foreign_language', 'history', 'persuade', '?any', '?any', '?any'],
        desc: 'Anthropology or Archeology (choose) \u00b7 Art (choose one) \u00b7 Foreign Language (choose one) \u00b7 History \u00b7 Persuade \u00b7 personal specialties \u00d73 (choose freely)'
    },
    {
        label: 'Military Officer',
        skills: ['bureaucracy', 'firearms', 'history', '?military_science', 'navigate', 'persuade', 'unarmed_combat', '?any_from_list'],
        desc: 'Bureaucracy \u00b7 Firearms \u00b7 History \u00b7 Military Science (choose one) \u00b7 Navigate \u00b7 Persuade \u00b7 Unarmed Combat \u00b7 choose 1 from: Artillery, Heavy Machinery, Heavy Weapons, HUMINT, Pilot, SIGINT'
    },
    {
        label: 'MBA',
        skills: ['accounting', 'bureaucracy', 'humint', 'law', 'persuade', '?any', '?any', '?any'],
        desc: 'Accounting \u00b7 Bureaucracy \u00b7 HUMINT \u00b7 Law \u00b7 Persuade \u00b7 personal specialties \u00d73 (choose freely)'
    },
    {
        label: 'Nurse, Paramedic, or Pre-Med',
        skills: ['alertness', 'first_aid', 'medicine', 'persuade', 'pharmacy', 'psychotherapy', 'Science (Biology)', 'search'],
        desc: 'Alertness \u00b7 First Aid \u00b7 Medicine \u00b7 Persuade \u00b7 Pharmacy \u00b7 Psychotherapy \u00b7 Science (Biology) \u00b7 Search'
    },
    {
        label: 'Occult Investigator or Conspiracy Theorist',
        skills: ['anthropology', 'archeology', 'computer_science', 'criminology', 'history', 'occult', 'persuade', 'search'],
        desc: 'Anthropology \u00b7 Archeology \u00b7 Computer Science \u00b7 Criminology \u00b7 History \u00b7 Occult \u00b7 Persuade \u00b7 Search'
    },
    {
        label: 'Outdoorsman',
        skills: ['alertness', 'athletics', 'firearms', 'navigate', 'ride', 'search', 'stealth', 'survival'],
        desc: 'Alertness \u00b7 Athletics \u00b7 Firearms \u00b7 Navigate \u00b7 Ride \u00b7 Search \u00b7 Stealth \u00b7 Survival'
    },
    {
        label: 'Photographer',
        skills: ['alertness', 'Art (Photography)', 'computer_science', 'persuade', 'search', 'stealth', '?any', '?any'],
        desc: 'Alertness \u00b7 Art (Photography) \u00b7 Computer Science \u00b7 Persuade \u00b7 Search \u00b7 Stealth \u00b7 personal specialties \u00d72 (choose freely)'
    },
];

/**
 * Hover tooltip text shown on the ⓘ icon next to each specialty skill type label.
 * Drawn verbatim from the Delta Green rulebook.
 */
const SKILL_TOOLTIPS = {
    // ── Base skills ──────────────────────────────────────────────────────────
    accounting:
        `Accounting — Base: 10%
The study of finance and business. Use it to sift through financial records for anomalies, such as a hidden bank account or money laundering.`,
    alertness:
        `Alertness — Base: 20%
Detects danger. Use it to hear a safety being switched off, to understand the mumbling on the other side of a wall, to spot the bulge of a pistol hidden under a jacket, or to catch someone who is trying to escape notice using Stealth.`,
    anthropology:
        `Anthropology — Base: 0%
The study of living human cultures. Use it to understand morals, religious beliefs, customs, and mores, and to identify (but not translate) obscure languages.

Where History is about the distant past and Archeology studies physical remains, Anthropology is about the behaviours of living cultures, how they relate to each other and the past, and how to navigate them safely.`,
    archeology:
        `Archeology — Base: 0%
The study of the physical remains of human cultures. Use it to analyse the way of life of a people from ruins, to determine the age of an artifact, to tell a genuine artifact from a fake, and to identify (but not translate) human languages.

Where Anthropology is about living cultures and History is a broad study of the past, Archeology discerns meaning from the physical remains of peoples long dead.`,
    artillery:
        `Artillery — Base: 0%
Safe and accurate use of mortars, missiles, howitzers, tank cannons, and other heavy gunnery. Use it to destroy troops or a hard target in battle.`,
    athletics:
        `Athletics — Base: 30%
Your Agent trains to get the most out of his or her strength and agility. Strength and Dexterity cover raw physical power and manual dexterity; Athletics represents long practice doing things like running, jumping, climbing, and throwing.

Use Athletics to: outrun someone; jump an intimidating gap; climb in a crisis; land safely in a fall of up to three metres; hit a target with a thrown weapon; or catch something without warning.`,
    bureaucracy:
        `Bureaucracy — Base: 10%
Manipulating the rules and personalities that govern an organisation. Use it to locate and borrow supplies, convince an official to provide information or resources, gain credentials for access to a restricted area, or keep the hospital from delving too deeply into the source of your injuries.`,
    computer_science:
        `Computer Science — Base: 0%
Deep knowledge of computers, computer systems, and the programs that run them. Use it to recover erased or encrypted data, protect documents from easy access, implant software to hijack a computer system, clone a phone's SIM card, identify flaws in a security system, impersonate users, or falsify data.

Often complemented by SIGINT and Craft skills like Electrician and Microelectronics.`,
    criminology:
        `Criminology — Base: 10%
Knowledge of criminal and conspiratorial behaviour. Use it to identify and predict criminal behaviour, deduce relationships between members of a conspiracy, analyse criminal activity, examine witness statements, or know whom to talk to in the criminal underground.`,
    demolitions:
        `Demolitions — Base: 0%
Safe handling of explosives in a crisis. Use it to disarm a bomb, set a charge to destroy a target remotely, jury-rig an explosive from hardware-store supplies, or analyse a blast to determine exactly what caused it.

Failure when handling a bomb means your Agent needs more time. In a crisis, a fumble means accidental explosion.`,
    disguise:
        `Disguise — Base: 10%
Alter your Agent's appearance, voice, posture, body language, and mannerisms to avoid recognition without drawing attention.`,
    dodge:
        `Dodge — Base: 30%
Evading danger and attacks through instinct and reflexes. Against firearms and explosives, Dodge can get an Agent to cover before bullets and shrapnel fly.`,
    drive:
        `Drive — Base: 20%
Handling an automobile or a motorcycle safely in a crisis. Every Agent can drive in normal conditions. Use this skill to keep a vehicle safe in a high-speed pursuit or on dangerous terrain.`,
    firearms:
        `Firearms — Base: 20%
Safe and accurate shooting with small arms in combat. Use it to hit a target despite the adrenaline, panic, and shock of violence interfering with hand-eye coordination.`,
    first_aid:
        `First Aid — Base: 10%
The initial treatment and stabilisation of injuries. Use it to help a character recover lost Hit Points.

By comparison, Surgery corrects a severe wound and Medicine ensures long-term recovery.`,
    forensics:
        `Forensics — Base: 0%
Gathering detailed information and evidence using forensic equipment. Use it to record biometric data, determine details about a weapon or accelerant, discern crucial clues an ordinary searcher wouldn't recognise, clean a scene of incriminating evidence, or collect, analyse, and compare fingerprints and DNA samples.`,
    heavy_machiner:
        `Heavy Machinery — Base: 10%
Safe operation of a tractor, crane, bulldozer, tank, heavy truck, or other big machine in a crisis.`,
    heavy_weapons:
        `Heavy Weapons — Base: 0%
Safe and accurate use of man-portable heavy ordnance such as machine guns and rocket launchers. Use it to suppress enemies, or destroy a vehicle in combat.`,
    history:
        `History — Base: 10%
Uncovering facts and theories about the human past. Use it to remember or find a key fact about the distant past, recognise an obscure reference, or comb a database or library for information that needs deep education.

Where Anthropology is about living cultures and Archeology studies ancient relics, History is a broad study of humanity.`,
    humint:
        `HUMINT — Base: 10%
Human intelligence. Obtains information about a subject — especially information the subject would rather conceal — through observation, conversation, or examining patterns of behaviour.

Use it to recognise dishonesty, gauge attitude and intentions, cultivate sources, determine what it would take to get cooperation, or recognise clues of what a subject wants to conceal. HUMINT can notice signs of mental illness, but Psychotherapy would be needed to diagnose and treat a specific malady.`,
    law:
        `Law — Base: 0%
Using laws and courts to your Agent's advantage. Use it to get your way in court, determine correct procedures for handling evidence (and how to undermine them), bullshit your way out of legal trouble, or minimise legal risks.

The Law skill applies to your Agent's native country; using it with another country's laws requires special training.`,
    medicine:
        `Medicine — Base: 0%
The study and treatment of injury and illness. Use it to diagnose the cause of an injury, disease, or poisoning; identify abnormalities such as toxins; identify the cause and approximate time of death; identify the type of weapon used to kill a victim; or prescribe proper long-term care.

By comparison, First Aid keeps a patient alive until surgery is possible and Surgery corrects a severe wound.`,
    melee_weapons:
        `Melee Weapons — Base: 30%
Lethal use of melee weapons in combat. Use it to hurt or kill an opponent with a knife, axe, club, or other weapon.`,
    navigate:
        `Navigate — Base: 10%
Finding your way quickly with maps, charts and tables, orienteering, instruments, or dead reckoning.`,
    occult:
        `Occult — Base: 10%
The study of the supernatural as understood by human traditions, including conspiracy theories, traditional occultism, fringe science, and cryptozoology. Use it to examine and deduce the intent of a ritual or to identify occult traditions, groups, grimoires, tools, symbols, or legends.

Occult can never tell the genuinely unnatural from superstition or mythology — that is the province of the Unnatural skill.`,
    persuade:
        `Persuade — Base: 20%
Changing another's deeply-held decision or desire. Use it when the subject is so stubborn, what your Agent wants is so valuable, or the deception is so flagrant that Charisma isn't enough.

Use it to convince a witness that what she saw was innocuous, talk a detective into helping cover up evidence, or draw useful intelligence out of an unwilling subject. Also allows your Agent to resist persuasion and interrogation in opposed Persuade rolls.`,
    pharmacy:
        `Pharmacy — Base: 0%
Knowledge of drugs: their ingredients, creation, effects, uses, and misuses. Use it to identify and produce medicines and antidotes — as well as poisons.

Identifying a drug requires at least 20% skill. Preparing a powerful drug safely (e.g. psychoactive effects) requires at least 40% skill or a successful roll. Misusing Pharmacy is a quick way to kill a patient.`,
    psychotherapy:
        `Psychotherapy — Base: 10%
The diagnosis and treatment of mental illness. Use it to identify a mental disorder, help a patient recover, talk someone down when a disorder begins to take over, and treat mental illness in the long term.

You cannot use Psychotherapy on yourself. Using it to aid someone exposed to Unnatural forces might cost the therapist SAN.`,
    ride:
        `Ride — Base: 10%
Handling, training, and riding horses, donkeys, camels, and other beasts. Exotic mounts may need special training. Use it to stay on a mount in a crisis and to keep animals calm and healthy.`,
    search:
        `Search — Base: 20%
Finding things that are concealed or obscured from plain sight. Searching a scene may not require the Search skill, only time and effort, or a sufficiently high INT.

Use Search to find an object hidden with the Stealth skill, or otherwise so well hidden it needs an expert. The Handler may roll the Search attempt so you don't know whether your Agent succeeded or failed.`,
    sigint:
        `SIGINT — Base: 0%
Signals intelligence. Encompasses encryption, communications intelligence, electronic intelligence, electronic security systems, and surveillance of radio and digital communications.

Use it to install bugs and wiretaps (or find and disable them), communicate in Morse code, operate surveillance equipment, and make and break codes.`,
    stealth:
        `Stealth — Base: 10%
Concealing your presence or activities. Use it to hide a pistol, camouflage a position, conceal a microphone, leave an envelope at a dead drop unobserved, pick a pocket, move silently, follow without being seen, or blend into a crowd.

An Agent attempting Stealth can be detected only by an opposing Alertness or Search skill.`,
    surgery:
        `Surgery — Base: 0%
The treatment of an injury or abnormality by invasive means.

By comparison, First Aid keeps a patient alive until surgery is possible and Medicine ensures long-term recovery.`,
    survival:
        `Survival — Base: 10%
Knowledge of the natural world. Use it to find tracks and trails, plan an expedition, predict weather, recognise when fauna or flora are unusual, use the environment to gather information, or find food, water, and shelter.`,
    swim:
        `Swim — Base: 20%
Most Agents can swim for leisure. Use the Swim skill in a dangerous crisis: going a long distance in choppy water, keeping a friend from drowning, or getting to a boat before the tentacled thing below grabs you.`,
    unarmed_combat:
        `Unarmed Combat — Base: 40%
Self-defence. A fight between untrained combatants often involves more shoving and shouting than real violence. Use it to hurt or kill an opponent with your Agent's bare hands (or feet, elbows, teeth, or head).`,
    unnatural:
        `Unnatural — Base: 0%
Knowledge of the fundamental, mind-rending secrets of the universe. Use it to remember, recognise, or research facts about the things humans consider unnatural — going far beyond the occult into things that are real.

Your Agent's SAN can never be higher than 99 minus their Unnatural skill rating.`,

    // ── Specialty skills ─────────────────────────────────────────────────────
    art:
        `Art (Type) — Base: 0%
Expertise at creating or performing a work that sways emotions and opinions. It also encompasses knowledge of techniques and trends in your field, and the ability to tell a particular creator's real work from a fake. Anyone can draw a rough sketch; the Art skill reflects knowledge, practice, and talent.

Each type of Art is a separate skill: Acting, Creative Writing, Dance, Flute, Forgery, Guitar, Painting, Photography, Poetry, Scriptwriting, Sculpture, Singing, Violin, etc.`,
    craft:
        `Craft (Type) — Base: 0%
Making and repairing sophisticated tools and structures. A job that most people could figure out does not require the Craft skill, only an INT or DEX test. Use Craft for specialised work that needs training: Craft (Electrician) to rewire a house or tap a data line; Craft (Mechanic) to jury-rig a machine or sabotage one beyond repair; Craft (Locksmith) to open a lock without a key; Craft (Gunsmith) to repair a broken firearm.

Each Craft type is a separate skill: Architect, Carpenter, Electrician, Gunsmith, Locksmith, Mechanic, Microelectronics, Plumber, etc.`,
    foreign_language:
        `Foreign Language (Type) — Base: 0%
Fluency in another language. Each foreign language is a distinct skill. Having 20% allows halting conversations; at 50% your Agent speaks and reads like a native. The greater the skill, the greater the complexity of the information your Agent comprehends and the less time it takes.

You don't need to roll unless the Handler says the situation is exceptionally difficult. At the Handler's discretion, special training may allow use of the same skill with a closely related language.`,
    military_science:
        `Military Science (Type) — Base: 0%
Knowledge of military culture, techniques, and regulations. Use it to identify threats on a battlefield, find accurate ranges, recognise weaknesses in a fortification, deduce the training level of a soldier or unit, reconstruct the events of a battle, or deploy forces advantageously in combat.

Each type of Military Science is its own skill. The usual types are Land, Air, and Sea.`,
    pilot:
        `Pilot (Type) — Base: 0%
Piloting, navigating, and captaining waterborne, airborne, or aerospace vehicles. Use it to keep a vessel safe in a crisis, such as through a storm or in a dangerous pursuit.

Each vessel type is a separate skill: Airplane, Drone, Helicopter, Small Boat, Ship, Space Shuttle, etc. At the Handler's discretion, skill with one craft may allow piloting a related kind of craft.`,
    science:
        `Science (Type) — Base: 0%
The deep study of the processes of the world. This is more than common schooling; anyone can attempt an INT test to remember something from a high-school science class. Science is used to find a key insight about the way the universe works — or at least, the way it's supposed to work.

Each Science is a separate skill: Astronomy, Biology, Botany, Chemistry, Engineering, Genetics, Geology, Mathematics, Meteorology, Physics, Planetology, Zoology, etc.`,

    sanity_adaptations: `Adaptation to violence or helplessness occurs after your Agent has lost SAN from that kind of trauma three times in a row without going temporarily insane or hitting the Breaking Point. Mark a box each time violence or helplessness reduces your Agent's SAN by 1 or more. If your Agent suffers insanity before all three boxes are marked, erase those boxes and start again. Fill in all three to become adapted.

ADAPTING TO VIOLENCE: Your Agent's empathy suffers — permanently lose 1D6 CHA and the same amount from each Bond.

ADAPTING TO HELPLESSNESS: Your Agent's personal drive suffers — permanently lose 1D6 POW.

ADAPTING TO THE UNNATURAL: There is no adapting to the Unnatural. Every encounter is a fresh shock. The only way to reach equilibrium is 0 SAN, whereupon the horrors make perfect sense and no longer inflict mental damage.`,

    // ── Biography fields ─────────────────────────────────────────────────────
    bio_name:
        `Name\n\nWhat's your Agent's name? Delta Green games are most effective when they feel grounded in the real world, so make the name sound real. Avoid clichés and silliness.`,
    bio_employer:
        `Employer\n\nWhich agency or company does your Agent work for? Include your Agent's job title or rank if appropriate.`,
    bio_nationality:
        `Nationality\n\nThe Delta Green organization exists within the U.S. government, so most Agents are American. But if your game is set in another country, your Agents could be local, unofficial "friendlies" who conduct Delta Green operations with the guidance of a Delta Green control officer — someone from the CIA or the military — played by the Handler.`,
    bio_sex_age:
        `Sex and Age\n\nDelta Green mostly recruits Agents in their thirties, old enough to be established in challenging careers. Most Agents stay in the group until retirement age if they live that long. If your Agent is younger, what special skills or circumstances brought him or her into the group? If older, what causes your Agent to stay?`,
    bio_education:
        `Education and Occupational History\n\nMost Agents are in professions that require higher education, a bachelor's degree or a graduate degree. Describe an education that fits your Agent's skills.`,
    bio_motivations:
        `Motivations and Mental Disorders\n\nYour Agent starts with five motivations: personal beliefs, drives, or obsessions. Motivations aren't as powerful as Bonds, so they don't have scores. Bring them up in play to show what motivates and supports your Agent and makes life worth living.\n\nEach time SAN hits the Breaking Point, replace a motivation with your Agent's new mental disorder.`,
    bio_personal_details:
        `Personal Details and Notes\n\nDon't overlook the intangibles that make an Agent memorable. What's something admirable about your Agent? What's something that people often dislike about your Agent? What brought your Agent to Delta Green? Why does Delta Green trust your Agent? Why does your Agent help Delta Green despite the terrible risks?`
};
/** Generates a unique ID for a specialty skill instance. */
function _genInstId() {
    return 'inst-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

/**
 * Adds a specialty skill instance to appState and returns it.
 * @param {string} key       - CONFIG.SKILLS key (e.g. 'craft')
 * @param {string|null} specialty - pre-selected specialty string, or null if user must pick
 * @param {number} value     - proficiency value
 * @param {string} source    - 'profession' | 'bonus' | 'manual'
 */
function _addSpecialtyInstance(key, specialty, value, source) {
    const inst = { id: _genInstId(), key, specialty: specialty || null, value, source };
    appState.specialtyInstances.push(inst);
    return inst;
}

/**
 * Re-renders the #cs-specialty-skills container from appState.specialtyInstances.
 * Called after any change to the instance list.
 */
function renderSpecialtySkills() {
    const container = document.getElementById('cs-specialty-skills');
    if (!container) return;
    container.innerHTML = '';
    if (appState.specialtyInstances.length === 0) return;

    const CUSTOM_SENTINEL = '__custom__';

    appState.specialtyInstances.forEach(inst => {
        // Resolve a human-readable label for this skill type
        const baseLabel = inst.key
            ? (CONFIG.SKILLS.find(([k]) => k === inst.key)?.[1]
                || inst.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
            : null;

        const row = document.createElement('div');
        row.className = 'specialty-skill-row';
        row.dataset.instId = inst.id;

        // -- Name / label --
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'specialty-controls';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'cs-skill-name specialty-skill-name';
        nameSpan.textContent = baseLabel ? baseLabel + ':' : 'New Specialty:';
        if (inst.key && SKILL_TOOLTIPS[inst.key]) {
            nameSpan.dataset.tooltipKey = inst.key;
        }

        const lpCb = document.createElement('input');
        lpCb.type = 'checkbox';
        lpCb.className = 'lp-skill-check lp-only';
        lpCb.id = `lp-ck-spec-${inst.id}`;
        lpCb.title = 'Mark skill attempted this session';
        nameSpan.appendChild(lpCb);
        controlsDiv.appendChild(nameSpan);

        if (!inst.key) {
            // -- Type selector: user must choose which broad skill this is --
            const typeSelect = document.createElement('select');
            typeSelect.className = 'cs-skill-specialty specialty-type-select';
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = '\u2014 pick type \u2014';
            typeSelect.appendChild(defaultOpt);
            // Sort by display label for a consistent alphabetical list
            [...SPECIALTY_SKILL_KEYS].sort().forEach(k => {
                const lbl = CONFIG.SKILLS.find(([sk]) => sk === k)?.[1]
                    || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = lbl;
                typeSelect.appendChild(opt);
            });
            const homebrewOpt = document.createElement('option');
            homebrewOpt.value = 'homebrew';
            homebrewOpt.textContent = '\u2014 homebrew \u2014';
            typeSelect.appendChild(homebrewOpt);
            typeSelect.classList.add('highlight-empty-input');
            typeSelect.style.color = '#fe640b';
            typeSelect.style.fontWeight = 'bold';
            typeSelect.addEventListener('change', () => {
                inst.key = typeSelect.value || null;
                renderSpecialtySkills();
                window.dgSaveLoad?.save?.();
            });
            controlsDiv.appendChild(typeSelect);
        } else if (inst.key === 'homebrew') {
            // -- Homebrew: fully custom skill, just a free-text name --
            const homebrewInput = document.createElement('input');
            homebrewInput.type = 'text';
            homebrewInput.className = 'specialty-custom-text cs-skill-specialty';
            homebrewInput.placeholder = 'skill name\u2026';
            homebrewInput.value = inst.specialty || '';
            if (!inst.specialty) homebrewInput.classList.add('highlight-empty-input');
            homebrewInput.addEventListener('input', () => {
                inst.specialty = homebrewInput.value.trim() || null;
                if (inst.specialty) homebrewInput.classList.remove('highlight-empty-input');
                else homebrewInput.classList.add('highlight-empty-input');
                window.dgSaveLoad?.save?.();
            });
            controlsDiv.appendChild(homebrewInput);
        } else {
            // -- Specialty selector: suggested options + free-text custom entry --
            const suggestions = SPECIALTY_OPTIONS[inst.key] || [];
            // A value is "custom" when it exists but isn't in the suggestions list
            const isCustomValue = inst.specialty !== null && !suggestions.includes(inst.specialty);

            const specSelect = document.createElement('select');
            specSelect.className = 'cs-skill-specialty';
            specSelect.id = `specialty-inst-${inst.id}`;

            const pickOpt = document.createElement('option');
            pickOpt.value = '';
            pickOpt.textContent = '\u2014 pick \u2014';
            specSelect.appendChild(pickOpt);

            suggestions.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                if (sub === inst.specialty) opt.selected = true;
                specSelect.appendChild(opt);
            });

            // "\u2014 custom \u2014" lets the player name their own specialty
            const customOpt = document.createElement('option');
            customOpt.value = CUSTOM_SENTINEL;
            customOpt.textContent = '\u2014 custom \u2014';
            if (isCustomValue) customOpt.selected = true;
            specSelect.appendChild(customOpt);

            if (!inst.specialty) {
                specSelect.classList.add('highlight-empty-input');
                specSelect.style.color = '#fe640b';
                specSelect.style.fontWeight = 'bold';
            }
            controlsDiv.appendChild(specSelect);

            // Free-text input — visible only when "\u2014 custom \u2014" is active
            const customText = document.createElement('input');
            customText.type = 'text';
            customText.className = 'specialty-custom-text';
            customText.placeholder = 'type specialty name\u2026';
            customText.value = isCustomValue ? (inst.specialty || '') : '';
            customText.style.display = isCustomValue ? '' : 'none';
            if (isCustomValue && !customText.value) {
                customText.classList.add('highlight-empty-input');
            }
            customText.addEventListener('input', () => {
                inst.specialty = customText.value.trim() || null;
                if (inst.specialty) customText.classList.remove('highlight-empty-input');
                else customText.classList.add('highlight-empty-input');
                window.dgSaveLoad?.save?.();
            });
            controlsDiv.appendChild(customText);

            specSelect.addEventListener('change', () => {
                if (specSelect.value === CUSTOM_SENTINEL) {
                    customText.style.display = '';
                    customText.focus();
                    inst.specialty = customText.value.trim() || null;
                    if (!inst.specialty) customText.classList.add('highlight-empty-input');
                    specSelect.classList.remove('highlight-empty-input');
                    specSelect.style.color = '';
                    specSelect.style.fontWeight = '';
                } else if (specSelect.value) {
                    customText.style.display = 'none';
                    inst.specialty = specSelect.value;
                    specSelect.classList.remove('highlight-empty-input');
                    specSelect.style.color = '';
                    specSelect.style.fontWeight = '';
                } else {
                    customText.style.display = 'none';
                    inst.specialty = null;
                    specSelect.classList.add('highlight-empty-input');
                    specSelect.style.color = '#fe640b';
                    specSelect.style.fontWeight = 'bold';
                }
                window.dgSaveLoad?.save?.();
            });
        }

        // -- Remove button (inside controls so grid stays 2-column) --
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'specialty-remove-btn';
        removeBtn.textContent = '\u00d7';
        removeBtn.title = 'Remove this specialty skill';
        removeBtn.setAttribute('aria-label', 'Remove specialty skill');
        removeBtn.addEventListener('click', () => {
            appState.specialtyInstances = appState.specialtyInstances.filter(i => i.id !== inst.id);
            renderSpecialtySkills();
            window.dgSaveLoad?.save?.();
        });
        controlsDiv.appendChild(removeBtn);

        row.appendChild(controlsDiv);

        // -- Value input --
        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.className = 'cs-skill-input';
        valueInput.id = `specialty-inst-val-${inst.id}`;
        valueInput.value = inst.value;
        valueInput.min = 0;
        valueInput.max = 100;
        valueInput.addEventListener('input', () => {
            inst.value = parseInt(valueInput.value) || 0;
            window.dgSaveLoad?.save?.();
        });
        const pctSpan = document.createElement('span');
        pctSpan.className = 'cs-skill-pct';
        pctSpan.textContent = '%';
        const valueWrap = document.createElement('span');
        valueWrap.className = 'cs-skill-value-wrap';
        valueWrap.appendChild(valueInput);
        valueWrap.appendChild(pctSpan);
        row.appendChild(valueWrap);

        container.appendChild(row);
    });
}

/**
 * Returns the canonical, fully-resolved skill list for this character.
 * This is the single authoritative source consumed by print, live play, and Foundry export.
 * @returns {Array<{key, label, specialty, displayName, value}>}
 */
function getCompletedSkills() {
    const result = [];
    CONFIG.SKILLS.forEach(([key, label, def]) => {
        if (SPECIALTY_SKILL_KEYS.has(key)) return; // specialty skills come from instances
        const el = document.getElementById(`cs-skill-${key}`);
        result.push({ key, label, specialty: null, displayName: label, value: parseInt(el?.value) || def || 0 });
    });
    appState.specialtyInstances.forEach(inst => {
        const label = inst.key === 'homebrew'
            ? (inst.specialty || 'Homebrew Skill')
            : (CONFIG.SKILLS.find(([k]) => k === inst.key)?.[1]
                || (inst.key || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        const displayName = inst.key === 'homebrew'
            ? label
            : (inst.specialty ? `${label} (${inst.specialty})` : label);
        result.push({ key: inst.key, label, specialty: inst.specialty, displayName, value: inst.value });
    });
    return result;
}

/**
 * Adds a blank specialty skill slot for the user to fill in freely.
 * For when the agent picked something up that the rulebook doesn't quite cover —
 * or that the Program would prefer remained undocumented.
 */
function addManualSpecialtySkill() {
    appState.specialtyInstances.push({ id: _genInstId(), key: null, specialty: null, value: 0, source: 'manual' });
    renderSpecialtySkills();
    window.dgSaveLoad?.save?.();
}

// Application state
const appState = {
    currentBond: null,
    agentStats: {},
    appliedBonuses: {}, // { displayName: totalPointsAdded } — used for reset
    specialtyInstances: [], // { id, key, specialty, value, source }
};

const stats = CONFIG.STATS;

// Profession data
// Professions data is now in professions.js

/**
 * Populates the profession dropdown with all entries defined in professions.js.
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
 * Assembles a cover identity from available parts: name, physical description
 * (shaped by current STR/CON values), age, nationality, employer, and education.
 * Profession-specific employer/education pools are used when a profession is
 * already selected; generic pools fill in otherwise.
 * Results are written directly to the biography form fields.
 */
function generateRandomBio() {
    if (!bioData) {
        alert('Biography data is still loading. Please try again in a moment.');
        return;
    }

    const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // --- Gender / Name ---
    const genderSelect = document.getElementById('bio-gender-select');
    const selectedGender = genderSelect ? genderSelect.value : 'male';

    const firstName = getRandomItem(bioData.firstNames[selectedGender]);
    const lastName = getRandomItem(bioData.lastNames);
    document.getElementById('cs-name').value = `${firstName} ${lastName}`;

    const genderToSex = { 'male': 'Male', 'female': 'Female', 'non-binary': 'Non-binary' };
    document.getElementById('cs-bio-sex').value = genderToSex[selectedGender] || 'Male';

    // --- Read current STR and CON from the stat buy panel to shape the description ---
    const readStat = (id) => {
        const el = document.getElementById(`${id}-value`);
        return el ? parseInt(el.innerText) || 10 : 10;
    };
    const str = readStat('STR');
    const con = readStat('CON');
    const combinedPhysical = str + con;

    // Determine build tier from STR+CON total (typical range 20–40)
    let buildTier, featurePool;
    if (combinedPhysical >= 36) {
        buildTier = 'high';
        featurePool = bioData.notableFeatures.high_str_con;
    } else if (combinedPhysical >= 28) {
        buildTier = 'athletic';
        featurePool = bioData.notableFeatures.neutral;
    } else if (combinedPhysical >= 22) {
        buildTier = 'average';
        featurePool = bioData.notableFeatures.neutral;
    } else {
        buildTier = 'low';
        featurePool = bioData.notableFeatures.low_str_con;
    }

    // Height tendency: higher STR nudges tall, lower nudges short
    let heightTier;
    if (str >= 16) heightTier = 'tall';
    else if (str >= 12) heightTier = 'average';
    else heightTier = 'short';

    const buildStr = getRandomItem(bioData.buildDescriptors[buildTier]);
    const heightStr = getRandomItem(bioData.heightDescriptors[heightTier]);
    const hair = getRandomItem(bioData.hairColors);
    const hairStyle = getRandomItem(bioData.hairStyles);
    const eyes = getRandomItem(bioData.eyeColors);
    const feature = getRandomItem(featurePool);
    const skin = Math.random() < 0.45 ? getRandomItem(bioData.skinTones) : null;

    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const hairDesc = `${hair} ${hairStyle} hair`;

    // Multiple sentence templates for variety — one is picked at random each time
    const descTemplates = [
        () => `${cap(buildStr)}, ${heightStr}. ${cap(hairDesc)}, ${eyes} eyes. ${feature}.`,
        () => `${cap(heightStr)}. ${cap(buildStr)}. ${cap(hairDesc)}, ${eyes} eyes. ${feature}.`,
        () => `${feature}. ${cap(buildStr)}, ${heightStr}, with ${hairDesc} and ${eyes} eyes.`,
        () => `${cap(buildStr)} with ${hairDesc} and ${eyes} eyes. ${cap(heightStr)}. ${feature}.`,
        () => `${cap(heightStr)}, ${buildStr}. ${cap(eyes)} eyes, ${hairDesc}. ${feature}.`,
        () => `${feature}. ${cap(hairDesc)}, ${eyes} eyes — ${buildStr}, ${heightStr}.`,
    ];
    if (skin) {
        descTemplates.push(
            () => `${cap(buildStr)}, ${heightStr}. ${cap(skin)} complexion, ${hairDesc}, ${eyes} eyes. ${feature}.`,
            () => `${feature}. ${cap(buildStr)}, ${heightStr}. ${cap(hair)} hair, ${eyes} eyes, ${skin} complexion.`,
        );
    }

    document.getElementById('cs-physical-desc').value = getRandomItem(descTemplates)();

    // --- Age ---
    const randomAge = Math.floor(Math.random() * (65 - 25 + 1)) + 25;
    document.getElementById('cs-bio-age').value = randomAge;

    // --- Nationality ---
    document.getElementById('cs-bio-nationality').value = getRandomItem(bioData.nationalities);

    // --- Profession-linked Employer + Education ---
    // Try to read the currently selected profession key
    const professionSelect = document.getElementById('cs-profession-select');
    let profKey = professionSelect ? professionSelect.value : '';

    // Map profession select values to professionProfiles keys
    const profKeyMap = {
        'anthropologist': 'anthropologist',
        'federal_agent': 'federal_agent',
        'physician': 'physician',
        'computer_scientist': 'engineer',
        'scientist': 'scientist',
        'special_operator': 'special_operator',
        'criminal': 'criminal',
        'firefighter': 'firefighter',
        'police_officer': 'police_officer',
        'soldier_marine': 'soldier',
        'foreign_service': 'foreign_service_officer',
        'intelligence_analyst': 'intelligence_analyst',
        'intelligence_case_officer': 'intelligence_case_officer',
        'lawyer_executive': 'lawyer',
        'media_specialist': 'media_specialist',
        'nurse_paramedic': 'nurse_paramedic',
        'pilot_sailor': 'pilot',
        'program_manager': 'program_manager'
    };

    const profile = bioData.professionProfiles[profKeyMap[profKey]] || bioData.professionProfiles['default'];
    document.getElementById('cs-bio-employer').value = getRandomItem(profile.employers);
    document.getElementById('cs-bio-education').value = getRandomItem(profile.educations);
}

/**
 * Calculates the four derived attributes using Delta Green formulas:
 *   HP = ⌈(STR + CON) / 2⌉
 *   WP = POW
 *   SAN = POW × 5
 *   BP  = SAN − POW
 * @returns {number[]} [hp, wp, san, bp]
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
 * Renders the stat buy panel — one container per ability score, with +/− buttons,
 * a ×5 display, and a plain-English descriptor (e.g. "Feeble", "Indomitable").
 */
function generateStatContainers() {
    const container = document.getElementById('stats');
    const plusSymbol = '+';
    const statTooltips = {
        STR: 'Strength — Physical power, size, and musculature. Drag a witness to safety. Break down a locked door. Hold a struggling victim down. Contributes to Hit Points: HP = ⌈(STR + CON) / 2⌉',
        DEX: 'Dexterity — Agility, coordination, and nimbleness. Keep balance. React quickly.',
        CON: 'Constitution — Health and physical resilience. Resist illness, exhaustion, or pain. Hold your breath a long time. Keep running longer than everyone else. Contributes to Hit Points: HP = ⌈(STR + CON) / 2⌉',
        INT: 'Intelligence — How well an Agent notices, remembers, and connects things. Along with profession, it indicates education and overall brilliance. Recall a detail. Piece together disparate data.',
        POW: 'Power — Force of personality, motivation, and psychic resilience. Keep your head in a crisis. Stand up to pressure. Sets WP (= POW), SAN (= POW × 5), and BP (= SAN − POW).',
        CHA: 'Charisma — Charm, leadership, and personal appeal. May indicate physical attractiveness. Make a good impression. Talk your way into a private club. Look like you belong.'
    };
    const parts = stats.map(stat => `
                    <div class="stat-container" title="${statTooltips[stat]}">
                        <span class="stat-label">${stat}</span>
                        <span class="stat-value" id="${stat}-value">3</span>
                        <div class="stat-controls">
                            <button onclick="adjustStat('${stat}', -1)" class="adjust-button" title="Reduce ${stat} by 1 (refunds 1 point in Point Buy mode)">−</button>
                            <button onclick="adjustStat('${stat}', 1)" class="adjust-button stat-inc-btn" title="Increase ${stat} by 1 (costs 1 point in Point Buy mode)">${plusSymbol}</button>
                        </div>
                        <span class="x5-value" id="${stat}-x5-value" title="Click to roll ${stat}×5">15</span>
                        <span class="descriptor" id="${stat}-descriptor">${getDescriptor(stat, 3)}</span>
                    </div>
                `);
    container.innerHTML = parts.join('');
    updateTotalPoints();
}

/**
 * Reads a stat's current value from its visible display span.
 * @param {string} stat - e.g. 'STR'
 * @returns {number}
 */
function getStatValue(stat) {
    const el = document.getElementById(`${stat}-value`);
    return el ? (parseInt(el.innerText) || 3) : 3;
}

/**
 * Recomputes HP, WP, SAN, BP from current stat spans and writes them
 * into the derived-attribute display inputs.
 */
function updateDerivedAttributes() {
    const STRv = getStatValue('STR');
    const CONv = getStatValue('CON');
    const POWv = getStatValue('POW');
    const hp = Math.ceil((STRv + CONv) / 2);
    const wp = POWv;
    const san = POWv * 5;
    const bp = san - POWv;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('cs-hp', hp);
    set('cs-wp', wp);
    set('cs-sanity-value', san);
    set('cs-breaking-point', bp);
    if (typeof lpSyncBar === 'function') lpSyncBar();
}

/**
 * Adjusts an ability score by the given amount, clamped to [3, 18].
 * Cascades to x5 display, descriptor, remaining points, and derived attributes.
 * @param {string} stat - Ability code (STR, CON, etc.)
 * @param {number} adjustment - Amount to adjust (+1 or −1)
 */
function adjustStat(stat, adjustment) {
    const valueElement = document.getElementById(`${stat}-value`);
    let currentValue = parseInt(valueElement.innerText) + adjustment;
    currentValue = Math.max(3, Math.min(currentValue, 18));
    valueElement.innerText = currentValue;
    document.getElementById(`${stat}-x5-value`).innerText = currentValue * 5;
    document.getElementById(`${stat}-descriptor`).innerText = getDescriptor(stat, currentValue);
    updateTotalPoints();
    updateDerivedAttributes();
}

/**
 * Recounts used points and updates the remaining-points display.
 * Called after every stat change in point buy mode.
 */
function updateTotalPoints() {
    const totalPointsUsed = stats.reduce((total, stat) => total + parseInt(document.getElementById(`${stat}-value`).innerText), 0);
    const remainingPoints = CONFIG.POINT_BUY_TOTAL - totalPointsUsed;
    const el = document.getElementById('totalPoints');
    el.innerText = remainingPoints;
    el.classList.toggle('points-depleted', remainingPoints <= 0);
}

/**
 * Lets fate distribute CONFIG.POINT_BUY_TOTAL points across all ability scores.
 * The Handler giveth. The dice taketh away.
 * No score goes below CONFIG.STAT_MIN or above CONFIG.STAT_MAX.
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

    updateTotalPoints();
}

/**
 * Rolls CONFIG.DICE_COUNT d6s per stat, keeps the top CONFIG.DICE_KEEP, and assigns
 * the result clamped to [CONFIG.STAT_MIN, CONFIG.STAT_MAX].
 * Roughly equivalent to the classic 4d6-drop-lowest method.
 */
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
    updateTotalPoints();
}

function resetStats() {
    stats.forEach(stat => {
        document.getElementById(`${stat}-value`).innerText = '3';
        document.getElementById(`${stat}-x5-value`).innerText = '15';
        document.getElementById(`${stat}-descriptor`).innerText = getDescriptor(stat, 3);
    });
    updateTotalPoints();
}

/**
 * Rebuilds the character sheet form from current stat spans and appState.
 * Called on initial load, after theme switches, and before JSON export.
 * Preserves any profession- or bonus-applied skill values already in the DOM
 * so re-renders don't silently reset them back to defaults.
 */
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
        const derivedTooltips = {
            HP: 'Hit Points = ⌈(STR + CON) / 2⌉. At 2 HP or fewer the agent falls unconscious. At 0 HP the agent is dying.',
            WP: 'Willpower Points = POW. Spent to boost skill rolls or resist supernatural effects. Recovers with rest.',
            SAN: 'Sanity = POW × 5. Lost when encountering the unnatural. Reaching 0 means permanent madness.',
            BP: 'Breaking Point = SAN − POW. If SAN drops below this in a single session the agent suffers temporary insanity.'
        };
        const derivedList = [
            ['HP', 'cs-hp', 0],
            ['WP', 'cs-wp', 0],
            ['SAN', 'cs-sanity-value', 50],
            ['BP', 'cs-breaking-point', 40]
        ];
        derivedList.forEach(([label, id, defaultVal]) => {
            const existingEl = document.getElementById(id);
            const currentVal = existingEl ? existingEl.value : defaultVal;
            csDerivedDiv.innerHTML += `<div class="stat-container" title="${derivedTooltips[label]}"><span class="stat-label">${label}</span><input type="number" id="${id}" value="${currentVal}" min="0" class="stat-input derived-readonly" readonly></div>`;
        });
    }

    // populate skills
    const skillsContainer = document.getElementById('cs-skills');
    const skillsList = CONFIG.SKILLS;
    // Capture existing values so a grid rebuild (e.g. triggered by the stats MutationObserver)
    // does NOT reset profession- or bonus-applied skill values back to their defaults.
    const existingSkillValues = {};
    skillsContainer.querySelectorAll('input[id^="cs-skill-"]').forEach(el => {
        existingSkillValues[el.id.replace('cs-skill-', '')] = parseInt(el.value);
    });
    skillsContainer.innerHTML = '';
    // Base skills only — specialty skills (Art, Craft, Science, Pilot, Military Science) are
    // rendered separately via renderSpecialtySkills() using appState.specialtyInstances.
    let gridIdx = 0;
    skillsList.forEach(([key, label, def]) => {
        if (SPECIALTY_SKILL_KEYS.has(key)) return; // handled as specialty instances
        const colPair = gridIdx % 3;
        const gridRow = Math.floor(gridIdx / 3) + 1;
        gridIdx++;

        const pairDiv = document.createElement('div');
        pairDiv.className = 'cs-skill-pair';
        pairDiv.style.gridColumn = colPair + 1;
        pairDiv.style.gridRow = gridRow;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'cs-skill-name';
        nameSpan.textContent = label + ':';
        if (SKILL_TOOLTIPS[key]) {
            nameSpan.dataset.tooltipKey = key;
        }

        const inputEl = document.createElement('input');
        inputEl.type = 'number';
        inputEl.id = `cs-skill-${key}`;
        // Prefer any previously-set value so re-renders don't clobber applied profession/bonus values.
        inputEl.value = (key in existingSkillValues) ? existingSkillValues[key] : def;
        inputEl.min = 0;
        inputEl.max = 100;
        inputEl.className = 'cs-skill-input';

        const lpCb = document.createElement('input');
        lpCb.type = 'checkbox';
        lpCb.className = 'lp-skill-check lp-only';
        lpCb.id = `lp-ck-${key}`;
        lpCb.title = 'Mark skill attempted this session';
        nameSpan.appendChild(lpCb);

        const pctSpan = document.createElement('span');
        pctSpan.className = 'cs-skill-pct';
        pctSpan.textContent = '%';
        const valueWrap = document.createElement('span');
        valueWrap.className = 'cs-skill-value-wrap';
        valueWrap.appendChild(inputEl);
        valueWrap.appendChild(pctSpan);
        pairDiv.appendChild(nameSpan);
        pairDiv.appendChild(valueWrap);
        skillsContainer.appendChild(pairDiv);
    });
    // Re-render any specialty instances that survive stat syncs (persisted in appState)
    renderSpecialtySkills();

    // populate other simple fields
    // Compute and display derived attributes (HP, WP, SAN, BP) from stat spans
    updateDerivedAttributes();

    // populate biography fields
    const setIfEmpty = (id, def = '') => { const el = document.getElementById(id); if (!el) return; if (!el.value) el.value = def; };
    // cs-bio-profession is now a read-only display driven by the profession dropdown
    setIfEmpty('cs-bio-employer', '');
    setIfEmpty('cs-bio-nationality', '');
    setIfEmpty('cs-bio-sex', '');
    setIfEmpty('cs-bio-age', '');
    setIfEmpty('cs-bio-education', '');
    setIfEmpty('cs-physical-desc', '');
}

/**
 * Adds a blank custom skill row to the sheet.
 * The Program doesn't officially recognise this skill. Add it anyway.
 * Good for homebrew disciplines, Handler additions, or anything the rulebook
 * neglected to cover.
 */
function addCustomSkill() {
    const customSkillsDiv = document.getElementById('cs-custom-skills');

    const skillRow = document.createElement('div');
    skillRow.className = 'custom-skill-row';

    const _uid = `cskill-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = `${_uid}-name`;
    nameInput.name = `${_uid}-name`;
    nameInput.autocomplete = 'off';
    nameInput.placeholder = 'Skill Name';
    nameInput.className = 'custom-skill-name';

    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.id = `${_uid}-val`;
    valueInput.name = `${_uid}-val`;
    valueInput.autocomplete = 'off';
    valueInput.placeholder = '0';
    valueInput.className = 'custom-skill-value';
    valueInput.min = '0';
    valueInput.value = '0';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => skillRow.remove();

    // Add event listeners to highlight empty skill names
    const updateEmptyState = () => {
        nameInput.classList.toggle('empty-reminder', nameInput.value.trim() === '');
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
 * Handles profession selection: shows the profession description, lists optional
 * skills as checkboxes, and reveals the Apply button.
 * Clearing or re-selecting a profession resets the button state.
 * @param {string} professionKey - Key from the professions.js object
 */
function selectProfession(professionKey) {
    const infoDiv = document.getElementById('cs-profession-info');
    const optionalDiv = document.getElementById('cs-profession-optional-skills');
    const applyRow = document.getElementById('bio-profession-apply-row');
    const applyBtn = document.getElementById('apply-profession-button');

    if (!professionKey || !professions[professionKey]) {
        infoDiv.textContent = '';
        optionalDiv.innerHTML = '';
        if (applyRow) applyRow.style.display = 'none';
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

    // Build collapsible info block — collapsed by default so the form stays clean
    const profName = profession.title || professionKey;
    // Strip the BONDS line from body text since it's shown in the summary
    const bodyText = displayText.replace(/^BONDS:\s*\d+\n\n/, '');
    infoDiv.innerHTML = `<details class="profession-details">
      <summary class="profession-details-summary">
        <span class="prof-name-pill">${profName}</span><span class="prof-bonds-pill">BONDS: ${bondCount}</span><span class="prof-expand-hint">▼ Click for full profession description &amp; skills</span>
      </summary>
      <pre class="profession-details-text">${bodyText}</pre>
    </details>`;

    // Display optional skills with checkboxes
    if (profession.optionalSkills && profession.optionalSkills.length > 0 && chooseText) {
        // Parse the limit from "Choose any two", "Choose any 3", "Choose one" etc.
        const wordNums = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
        const limitMatch = chooseText.match(/choose\s+(?:any\s+)?(\w+)/i);
        const limitRaw = limitMatch ? limitMatch[1].toLowerCase() : '1';
        const limit = wordNums[limitRaw] || parseInt(limitRaw) || 1;

        let html = `<div class="optional-skills-container" data-max="${limit}">
            <div class="optional-skill-choose-text">${chooseText}</div>
            <div class="optional-skill-counter"><span class="optional-skill-count">0</span> / ${limit} chosen</div>
            <div>`;

        profession.optionalSkills.forEach((skill, idx) => {
            const checkboxId = `profession-optional-skill-${idx}`;
            html += `<div class="optional-skill-item">
                <input type="checkbox" id="${checkboxId}" class="profession-optional-skill optional-skill-check" data-skill-name="${skill.name}" data-skill-value="${skill.value}" data-limit="${skill.limit}">
                <label for="${checkboxId}" class="optional-skill-label">» ${skill.name} ${skill.value}%</label>
            </div>`;
        });
        html += '</div></div>';
        optionalDiv.innerHTML = html;

        // Enforce the limit: disable unchecked boxes once limit is reached
        optionalDiv.querySelectorAll('.optional-skill-check').forEach(cb => {
            cb.addEventListener('change', () => {
                const container = optionalDiv.querySelector('.optional-skills-container');
                const all = optionalDiv.querySelectorAll('.optional-skill-check');
                const checked = [...all].filter(c => c.checked);
                const countEl = optionalDiv.querySelector('.optional-skill-count');
                if (countEl) countEl.textContent = checked.length;
                const atLimit = checked.length >= limit;
                all.forEach(c => {
                    if (!c.checked) {
                        c.disabled = atLimit;
                        c.closest('.optional-skill-item').style.opacity = atLimit ? '0.4' : '';
                    } else {
                        c.disabled = false;
                        c.closest('.optional-skill-item').style.opacity = '';
                    }
                });
            });
        });
    } else {
        optionalDiv.innerHTML = '';
    }

    if (applyRow) applyRow.style.display = profession.requiredSkills.length > 0 ? 'flex' : 'none';
    // Reset button/reminder state for the newly selected profession
    if (applyBtn) { applyBtn.classList.remove('apply-profession-done'); applyBtn.style.display = ''; applyBtn.textContent = 'Apply Professional Skills'; }
    const badge = document.getElementById('apply-profession-done-badge');
    if (badge) badge.style.display = 'none';
    const reminder = document.getElementById('reminder-apply-profession');
    if (reminder) reminder.style.display = '';
}

/**
 * Clears all profession-applied skills from the character sheet
 * Removes all custom skill rows and resets predefined skill values to 0
 */
function clearProfessionSkills() {
    // Reset base skill values to defaults (specialty skills are managed as instances)
    CONFIG.SKILLS.forEach(([key, , defaultValue]) => {
        if (SPECIALTY_SKILL_KEYS.has(key)) return;
        const input = document.getElementById(`cs-skill-${key}`);
        if (input) input.value = defaultValue;
    });

    // Remove all profession-sourced specialty instances and re-render
    appState.specialtyInstances = appState.specialtyInstances.filter(i => i.source !== 'profession');
    renderSpecialtySkills();

    // Remove Foreign Language and other custom rows added during profession application
    const customSkillsDiv = document.getElementById('cs-custom-skills');
    if (customSkillsDiv) {
        customSkillsDiv.querySelectorAll('.custom-skill-row').forEach(row => row.remove());
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

    /**
     * Parses "Skill Name (Specialty)" into base key + specialty.
     * Treats "choose one / choose another" as specialty=null (user must pick).
     */
    function parseSkillName(skillName) {
        const match = skillName.match(/^([^(]+)(?:\s*\(([^)]+)\))?$/);
        if (!match) return { base: skillName.toLowerCase().replace(/\s+/g, '_'), specialty: null };
        const basePart = match[1].trim().toLowerCase().replace(/\s+/g, '_');
        const specialtyRaw = match[2] ? match[2].trim() : null;
        const isChoice = specialtyRaw && specialtyRaw.toLowerCase().includes('choose');
        return { base: basePart, specialty: isChoice ? null : specialtyRaw };
    }

    function applySkill(skillName, skillValue) {
        const parsed = parseSkillName(skillName);

        // Specialty skills (Art, Craft, Foreign Language, Military Science, Pilot, Science)
        // always become instances — never predefined slots or custom DOM rows.
        if (SPECIALTY_SKILL_KEYS.has(parsed.base)) {
            _addSpecialtyInstance(parsed.base, parsed.specialty, skillValue, 'profession');
            appliedCount++;
            return;
        }

        // Base skill — set the predefined input
        const input = document.getElementById(`cs-skill-${parsed.base}`);
        if (input) {
            input.value = skillValue;
            appliedCount++;
        } else {
            // Unknown skill: add as a custom row
            if (addCustomSkillFromProfession(skillName, skillValue)) appliedCount++;
        }
    }

    // Apply required skills
    profession.requiredSkills.forEach(skill => applySkill(skill.name, skill.value));

    // Apply selected optional skills
    document.querySelectorAll('.profession-optional-skill:checked').forEach(checkbox => {
        const skillName = checkbox.getAttribute('data-skill-name');
        const skillValue = parseInt(checkbox.getAttribute('data-skill-value'));
        applySkill(skillName, skillValue);
    });

    // Re-render the specialty section once all instances have been created
    renderSpecialtySkills();

    if (appliedCount > 0) {
        const reminder = document.getElementById('reminder-apply-profession');
        if (reminder) reminder.style.display = 'none';
        const btn = document.getElementById('apply-profession-button');
        if (btn) { btn.classList.add('apply-profession-done'); btn.textContent = 'Professional Skills Applied'; }
    } else {
        alert('No skills were applied. Make sure the skills exist in the character sheet.');
    }
    if (typeof syncLpFromForm === 'function') syncLpFromForm();
    window.dgSaveLoad?.save?.();
}

/**
 * Collects all user-defined skill rows from the custom skills section.
 * Returns an array of { name, value } objects for use in bonus dropdowns and Foundry export.
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

/**
 * Called from the wizard tips panel package dropdown.
 * Renders the chosen package's skills as a bullet list in the detail box.
 */
function _wizShowBonusPkg(idx) {
    const d = document.getElementById('wiz-pkg-detail');
    if (!d) return;
    if (idx === '' || typeof BONUS_PACKAGES === 'undefined') { d.style.display = 'none'; return; }
    const p = BONUS_PACKAGES[parseInt(idx)];
    if (!p) { d.style.display = 'none'; return; }
    const items = p.desc.split(' \u00b7 ');
    d.innerHTML = '<strong style="display:block;margin-bottom:4px">'
        + p.label + '</strong>'
        + '<ul style="margin:0 0 0 16px;padding:0;list-style:disc">'
        + items.map(s => '<li>' + s + '</li>').join('')
        + '</ul>';
    d.style.display = '';
}

function prepareBonusSkills() {
    // Show the bonus fieldset and populate the dropdowns.
    // Specialty skills are tracked in appState.specialtyInstances;
    // the dropdown expands all SPECIALTY_OPTIONS sub-options so the user can
    // boost an existing specialty instance or create a new one.
    const bonusSection = document.getElementById('bonus-skills-section');
    if (bonusSection) bonusSection.style.display = 'block';

    populateBonusSkillDropdowns();

    const btn = document.getElementById('prepare-bonus-button');
    if (btn) { btn.classList.add('prepare-bonus-done'); btn.textContent = 'Skills Prepared for Bonus Points'; }
    const reminder = document.getElementById('reminder-prepare-bonus');
    if (reminder) reminder.style.display = 'none';
}

/**
 * Populate the 8 bonus skill dropdown selectors with all available skills.
 * Specialty skills (Art, Craft, Science, Pilot, Military Science) are expanded
 * to show every sub-option (e.g. "Craft (Mechanic)") matching the Pick dropdowns.
 */
function populateBonusSkillDropdowns() {
    const bonusSkillsDiv = document.getElementById('bonus-dropdowns');
    bonusSkillsDiv.innerHTML = '';

    // Populate the package picker row (already exists in HTML; populate once).
    let pkgRow = document.getElementById('bonus-package-row');
    if (pkgRow && !document.getElementById('bonus-package-select')) {
        pkgRow.className = 'bonus-package-row';
        pkgRow.innerHTML =
            '<div class="bonus-package-controls">'
            + '<label for="bonus-package-select">Background package:</label>'
            + '<select id="bonus-package-select"><option value="">\u2014 Choose a background \u2014</option></select>'
            + '<button type="button" onclick="fillBonusPackage()">Fill Dropdowns</button>'
            + '</div>'
            + '<p id="bonus-package-desc" class="bonus-package-desc"></p>';
        const pkgSelect = document.getElementById('bonus-package-select');
        BONUS_PACKAGES.forEach((pkg, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = pkg.label;
            pkgSelect.appendChild(opt);
        });
    }

    const allSkillOptions = []; // [ [value, displayText], ... ]

    // Expand CONFIG.SKILLS: specialty skills become individual sub-option entries;
    // plain skills are added as-is.
    CONFIG.SKILLS.forEach(([key, label]) => {
        const subs = SPECIALTY_OPTIONS[key];
        if (subs) {
            subs.forEach(sub => {
                const display = `${label} (${sub})`;
                allSkillOptions.push([display, display]);
            });
            // Custom entry so the user can boost a specialty they named themselves
            allSkillOptions.push([`${label} (custom)`, `${label} (custom\u2026)`]);
        } else {
            allSkillOptions.push([key, label]);
        }
    });

    // Specialty-only skills NOT in CONFIG.SKILLS (Foreign Language)
    Object.entries(SPECIALTY_OPTIONS).forEach(([key, subs]) => {
        if (CONFIG.SKILLS.some(([k]) => k === key)) return; // already handled above
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        subs.forEach(sub => {
            const display = `${label} (${sub})`;
            allSkillOptions.push([display, display]);
        });
        allSkillOptions.push([`${label} (custom)`, `${label} (custom\u2026)`]);
    });

    // User-defined custom rows (plain free-text skills the player added manually)
    getCustomSkills().forEach(skill => {
        const alreadyListed = allSkillOptions.some(([v]) => v === skill.name);
        if (!alreadyListed) allSkillOptions.push([skill.name, skill.name]);
    });

    // Homebrew specialty instances (key === 'homebrew', specialty is the custom free-text name)
    if (typeof appState !== 'undefined') {
        appState.specialtyInstances
            .filter(inst => inst.key === 'homebrew' && inst.specialty)
            .forEach(inst => {
                const alreadyListed = allSkillOptions.some(([v]) => v === inst.specialty);
                if (!alreadyListed) allSkillOptions.push([inst.specialty, inst.specialty]);
            });
    }

    // Cache for fillBonusPackage() to rebuild filtered dropdowns
    _bonusAllSkillOptions = allSkillOptions;

    // Create 8 dropdown selectors
    for (let i = 0; i < 8; i++) {
        const wrapper = document.createElement('label');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '4px';
        wrapper.style.color = 'inherit';
        wrapper.style.alignItems = 'center';
        wrapper.textContent = `Boost ${i + 1}`;

        const select = document.createElement('select');
        select.id = `cs-bonus-skill-${i}`;
        select.className = 'cs-bonus-skill-select';

        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Select Skill --';
        select.appendChild(emptyOption);

        allSkillOptions.forEach(([val, text]) => {
            const option = document.createElement('option');
            option.value = val;
            option.textContent = text;
            select.appendChild(option);
        });

        // Remove highlight when a value is chosen; restore it if the user goes back to
        // an empty sentinel slot (placeholder text starts with ↓).
        select.addEventListener('change', function () {
            if (this.value) {
                this.classList.remove('highlight-empty-input');
            } else {
                const emptyOpt = this.querySelector('option[value=""]');
                if (emptyOpt && emptyOpt.textContent.startsWith('\u2193')) {
                    this.classList.add('highlight-empty-input');
                }
            }
        });

        wrapper.appendChild(select);
        bonusSkillsDiv.appendChild(wrapper);
    }
}

/**
 * Pre-fills the 8 bonus skill dropdowns from a chosen BONUS_PACKAGES entry.
 * Null slots in the package are left as "-- Select Skill --" for the player to choose.
 */
/**
 * Rebuilds a bonus skill <select> with a given subset of options.
 * @param {HTMLSelectElement} select
 * @param {Array} options   - [[value, text], ...]
 * @param {string} emptyText - placeholder text for the blank first option
 */
function _rebuildBonusDropdown(select, options, emptyText) {
    select.innerHTML = '';
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = emptyText;
    select.appendChild(emptyOpt);
    options.forEach(([val, text]) => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = text;
        select.appendChild(opt);
    });
}

function fillBonusPackage() {
    const sel = document.getElementById('bonus-package-select');
    if (!sel || sel.value === '') return;
    const pkg = BONUS_PACKAGES[parseInt(sel.value)];
    if (!pkg) return;

    // First pass: restore all 8 dropdowns to the full option list and clear any highlights.
    for (let i = 0; i < 8; i++) {
        const dd = document.getElementById(`cs-bonus-skill-${i}`);
        if (dd && _bonusAllSkillOptions.length) {
            _rebuildBonusDropdown(dd, _bonusAllSkillOptions, '-- Select Skill --');
            dd.classList.remove('highlight-empty-input');
        }
    }

    // Second pass: fill values or apply category filters.
    pkg.skills.forEach((val, i) => {
        const dd = document.getElementById(`cs-bonus-skill-${i}`);
        if (!dd) return;
        if (val && val.startsWith('?')) {
            const filter = PKG_HINT_FILTER[val];
            const hint = PKG_HINTS[val] || '\u2193 Choose a skill';
            if (filter && _bonusAllSkillOptions.length) {
                // Rebuild dropdown with only the matching category options.
                _rebuildBonusDropdown(dd, _bonusAllSkillOptions.filter(filter), hint);
            } else {
                // ?any / ?any_from_list: keep full list, just update placeholder.
                const emptyOpt = dd.querySelector('option[value=""]');
                if (emptyOpt) emptyOpt.textContent = hint;
            }
            dd.value = '';
            dd.classList.add('highlight-empty-input');
        } else if (val) {
            dd.value = val;
            if (dd.value !== val) dd.value = '';
        } else {
            dd.value = '';
        }
    });

    const descEl = document.getElementById('bonus-package-desc');
    if (descEl) { descEl.textContent = pkg.desc; descEl.style.display = ''; }
}

/**
 * Applies bonus skill points from the 8 dropdown selectors.
 * Each selected skill gets +CONFIG.BONUS_SKILL_POINTS, capped at CONFIG.MAX_SKILL_VALUE.
 * Specialty instances are boosted in place, or created if they don't exist yet.
 * Records what was applied in appState.appliedBonuses so resetBonusSkills() can undo it.
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
        const specialtyMatch = skillKey.match(/^(.+?)\s*\((.+?)\)$/);

        if (specialtyMatch) {
            const baseSkillLabel = specialtyMatch[1].trim();
            const specialty = specialtyMatch[2].trim();
            const baseSkillKey = baseSkillLabel.toLowerCase().replace(/\s+/g, '_');

            if (SPECIALTY_SKILL_KEYS.has(baseSkillKey)) {
                // 'custom…' sentinel means create a blank instance for the player to name
                const resolvedSpecialty = specialty === 'custom\u2026' ? null : specialty;
                // Boost an existing specialty instance, or create a new one
                const existing = appState.specialtyInstances.find(
                    i => i.key === baseSkillKey && i.specialty === resolvedSpecialty
                );
                if (existing) {
                    existing.value = Math.min(existing.value + CONFIG.BONUS_SKILL_POINTS, CONFIG.MAX_SKILL_VALUE);
                } else {
                    _addSpecialtyInstance(baseSkillKey, resolvedSpecialty, CONFIG.BONUS_SKILL_POINTS, 'bonus');
                }
                appliedCount++;
            } else {
                // Parenthetical but not a specialty group — treat as a plain base skill
                const skillInput = document.getElementById(`cs-skill-${baseSkillKey}`);
                if (skillInput) {
                    skillInput.value = Math.min((parseInt(skillInput.value) || 0) + CONFIG.BONUS_SKILL_POINTS, CONFIG.MAX_SKILL_VALUE);
                    appliedCount++;
                }
            }
        } else {
            // Plain base skill
            const skillInput = document.getElementById(`cs-skill-${skillKey}`);
            if (skillInput) {
                skillInput.value = Math.min((parseInt(skillInput.value) || 0) + CONFIG.BONUS_SKILL_POINTS, CONFIG.MAX_SKILL_VALUE);
                appliedCount++;
            } else {
                // Custom skill (Foreign Language etc.) — find by exact name
                document.querySelectorAll('.custom-skill-row').forEach(row => {
                    const nameInput = row.querySelector('.custom-skill-name');
                    const valueInput = row.querySelector('.custom-skill-value');
                    if (nameInput && nameInput.value === skillKey && valueInput) {
                        valueInput.value = Math.min((parseInt(valueInput.value) || 0) + CONFIG.BONUS_SKILL_POINTS, CONFIG.MAX_SKILL_VALUE);
                        appliedCount++;
                    }
                });
            }
        }
    });
    if (appliedCount > 0) {
        // Re-render specialty section to reflect boosted/new instances
        renderSpecialtySkills();
        // Record what was applied so resetBonusSkills() can reverse it
        selectedSkills.forEach(skillKey => {
            appState.appliedBonuses[skillKey] = (appState.appliedBonuses[skillKey] || 0) + CONFIG.BONUS_SKILL_POINTS;
        });
        alert(`Applied +${CONFIG.BONUS_SKILL_POINTS} bonus to ${appliedCount} skill(s)!`);
        // Turn button green and hide reminder
        const btn = document.getElementById('apply-bonus-button');
        if (btn) { btn.classList.add('apply-bonus-done'); btn.textContent = 'Bonuses Applied'; }
        const reminder = document.getElementById('reminder-apply-bonus');
        if (reminder) reminder.style.display = 'none';
        const resetBtn = document.getElementById('reset-bonus-button');
        if (resetBtn) resetBtn.style.display = 'inline-block';
    } else {
        alert('Could not find selected skills to boost.');
    }
    // Push updated values to LP sheet and persist to storage
    if (typeof syncLpFromForm === 'function') syncLpFromForm();
    window.dgSaveLoad?.save?.();
}

/**
 * Reverse all bonus points that were applied via applyBonusSkills().
 * Uses appState.appliedBonuses to know exactly what to subtract.
 */
function resetBonusSkills() {
    const applied = appState.appliedBonuses;
    if (Object.keys(applied).length === 0) {
        alert('No bonus skills have been applied yet.');
        return;
    }

    Object.entries(applied).forEach(([skillKey, totalAdded]) => {
        const specialtyMatch = skillKey.match(/^(.+?)\s*\((.+?)\)$/);

        if (specialtyMatch) {
            const baseSkillLabel = specialtyMatch[1].trim();
            const specialty = specialtyMatch[2].trim();
            const baseSkillKey = baseSkillLabel.toLowerCase().replace(/\s+/g, '_');

            if (SPECIALTY_SKILL_KEYS.has(baseSkillKey)) {
                // Find the matching specialty instance and reverse the bonus
                const inst = appState.specialtyInstances.find(
                    i => i.key === baseSkillKey && i.specialty === specialty
                );
                if (inst) {
                    inst.value = Math.max(0, inst.value - totalAdded);
                    // Remove the instance if it was created purely by the bonus step
                    if (inst.value <= 0 && inst.source === 'bonus') {
                        appState.specialtyInstances = appState.specialtyInstances.filter(i => i !== inst);
                    }
                }
            } else {
                // Non-specialty parenthetical — reverse on the base skill input
                const input = document.getElementById(`cs-skill-${baseSkillKey}`);
                if (input) input.value = Math.max(0, (parseInt(input.value) || 0) - totalAdded);
            }
        } else {
            // Plain base skill
            const skillInput = document.getElementById(`cs-skill-${skillKey}`);
            if (skillInput) {
                skillInput.value = Math.max(0, (parseInt(skillInput.value) || 0) - totalAdded);
            } else {
                // Custom skill (Foreign Language etc.)
                document.querySelectorAll('.custom-skill-row').forEach(row => {
                    const nameInput = row.querySelector('.custom-skill-name');
                    const valueInput = row.querySelector('.custom-skill-value');
                    if (nameInput && nameInput.value === skillKey && valueInput) {
                        valueInput.value = Math.max(0, (parseInt(valueInput.value) || 0) - totalAdded);
                    }
                });
            }
        }
    });

    appState.appliedBonuses = {};
    renderSpecialtySkills();

    const btn = document.getElementById('apply-bonus-button');
    if (btn) { btn.classList.remove('apply-bonus-done'); btn.textContent = 'Apply Bonuses'; }
    const reminder = document.getElementById('reminder-apply-bonus');
    if (reminder) reminder.style.display = '';
    const resetBtn = document.getElementById('reset-bonus-button');
    if (resetBtn) resetBtn.style.display = 'none';

    if (typeof syncLpFromForm === 'function') syncLpFromForm();
    window.dgSaveLoad?.save?.();
}

/**
 * Reverses applyProfessionSkills() — resets all profession-applied skills back to
 * their defaults and restores the Apply button to its pre-clicked state.
 */
function resetProfessionSkills() {
    clearProfessionSkills();
    const btn = document.getElementById('apply-profession-button');
    if (btn) { btn.classList.remove('apply-profession-done'); btn.style.display = ''; btn.textContent = 'Apply Professional Skills'; }
    const badge = document.getElementById('apply-profession-done-badge');
    if (badge) badge.style.display = 'none';
    const reminder = document.getElementById('reminder-apply-profession');
    if (reminder) reminder.style.display = '';
    if (typeof syncLpFromForm === 'function') syncLpFromForm();
    window.dgSaveLoad?.save?.();
}

/**
 * Adds a profession-sourced custom skill row to the sheet when the skill
 * isn't one of the predefined base slots (e.g. Foreign Language, or any
 * skill the profession data defines that isn't in CONFIG.SKILLS).
 * @param {string} skillName  - Display name, may include a specialty in parens
 * @param {number} skillValue - Starting proficiency value
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
    const _uid = `cskill-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

    // Specialty options come from the shared SPECIALTY_OPTIONS constant

    // Create name input or label based on specialty
    if (skillBase === 'foreign_language') {
        // Foreign Language is user-editable
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Foreign Language:';
        nameLabel.htmlFor = `${_uid}-name`;
        nameLabel.style.flex = '0 0 auto';
        nameLabel.style.minWidth = '120px';
        skillRow.appendChild(nameLabel);

        // Create editable text input for language name
        const langInput = document.createElement('input');
        langInput.type = 'text';
        langInput.id = `${_uid}-name`;
        langInput.name = `${_uid}-name`;
        langInput.autocomplete = 'off';
        langInput.placeholder = 'e.g., French, Spanish, Mandarin';
        langInput.className = 'custom-skill-name';
        langInput.style.flex = '1';
        langInput.style.maxWidth = '200px';
        langInput.style.padding = '4px 8px';
        langInput.style.borderRadius = '4px';
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

        // Pre-fill the language name if restoring from saved state
        if (specialty) {
            langInput.value = specialty;
        }

        langInput.addEventListener('input', updateLangInputHighlight);
        langInput.addEventListener('blur', updateLangInputHighlight);
        langInput.addEventListener('focus', updateLangInputHighlight);
        updateLangInputHighlight(); // Initial check (respects pre-filled value)

        skillRow.appendChild(langInput);
    } else if (SPECIALTY_OPTIONS[skillBase]) {
        // Skill has specialty dropdown
        const nameLabel = document.createElement('label');
        nameLabel.textContent = skillBase.charAt(0).toUpperCase() + skillBase.slice(1) + ':';
        nameLabel.htmlFor = `${_uid}-spec`;
        nameLabel.style.flex = '0 0 auto';
        nameLabel.style.minWidth = '100px';
        skillRow.appendChild(nameLabel);

        // Create specialty dropdown
        const specSelect = document.createElement('select');
        specSelect.id = `${_uid}-spec`;
        specSelect.name = `${_uid}-spec`;
        specSelect.autocomplete = 'off';
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

        SPECIALTY_OPTIONS[skillBase].forEach(option => {
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
                    option.selected = true;
                    found = true;
                    break;
                }
            }
            if (!found) {
                for (let option of specSelect.options) {
                    if (option.text.toLowerCase() === specialtyToMatch.toLowerCase()) {
                        option.selected = true;
                        found = true;
                        break;
                    }
                }
            }
            if (found) {
                specSelect.classList.remove('highlight-empty-input');
                specSelect.style.color = '';
                specSelect.style.fontWeight = '';
            }
        }

        specSelect.addEventListener('change', () => {
            if (specSelect.value === '') {
                specSelect.classList.add('highlight-empty-input');
                specSelect.style.color = '#fe640b';
                specSelect.style.fontWeight = 'bold';
            } else {
                specSelect.classList.remove('highlight-empty-input');
                specSelect.style.color = '';
                specSelect.style.fontWeight = '';
            }
        });

        skillRow.appendChild(specSelect);
    } else {
        // Regular skill without specialty
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = `${_uid}-name`;
        nameInput.name = `${_uid}-name`;
        nameInput.autocomplete = 'off';
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
    valueInput.id = `${_uid}-val`;
    valueInput.name = `${_uid}-val`;
    valueInput.autocomplete = 'off';
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
 * Builds a complete Foundry VTT Delta Green character actor JSON from the current form state.
 * Covers stats, skills, typed/specialty skills, biography, sanity adaptations, bonds, and items.
 *
 * To add weapons, tomes, gear, or other Foundry item objects to the export, paste raw item JSON
 * into the "Items JSON" textarea (cs-items-json). Equipment picker items merge in automatically.
 * Custom items follow equipment picker entries; bonds always come first.
 *
 * @returns {object} A complete Foundry actor object ready for drag-and-drop import
 * @throws {Error} If the form data is unreadable or a critical field is malformed
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
        const motivations = document.getElementById('cs-motivations')?.value || '';
        const personalDetails = document.getElementById('cs-personal-details')?.value || '';
        // Derive profession title from the dropdown's selected option (single source of truth)
        const profSelect = document.getElementById('cs-profession-select');
        const bioProfession = profSelect && profSelect.selectedIndex > 0
            ? profSelect.options[profSelect.selectedIndex].text
            : '';
        const bioEmployer = document.getElementById('cs-bio-employer')?.value || '';
        const bioNationality = document.getElementById('cs-bio-nationality')?.value || '';
        const bioSex = document.getElementById('cs-bio-sex')?.value || '';
        const bioAge = document.getElementById('cs-bio-age')?.value || '';
        const bioEducation = document.getElementById('cs-bio-education')?.value || '';
        const corruptionValue = 0;

        // Skills — use getCompletedSkills() as the single authoritative source
        const skillsObj = {};
        const typedSkillsObj = {};
        const specialtyGroupMap = { art: 'Art', craft: 'Craft', science: 'Science', pilot: 'Pilot', military_science: 'Military Science' };

        getCompletedSkills().forEach(skill => {
            if (skill.specialty !== null) {
                // Specialty skill instance → goes into Foundry's typedSkills
                const typedSkillId = Date.now().toString() + Math.random().toString(36).substring(2, 11);
                const group = specialtyGroupMap[skill.key] || skill.label;
                typedSkillsObj[typedSkillId] = { label: skill.specialty || skill.displayName, group, proficiency: skill.value, failure: false };
            } else {
                // Base skill → goes into Foundry's skills
                skillsObj[skill.key] = { label: skill.label, proficiency: skill.value, failure: false };
            }
        });

        // Add custom skills (Foreign Language etc.) to typedSkills
        const customSkills = getCustomSkills();
        customSkills.forEach(customSkill => {
            const customSkillId = Date.now().toString() + Math.random().toString(36).substring(2, 11);
            // Use 'Other' — valid group key in Foundry DG system (DG.TypeSkills.Other is defined)
            typedSkillsObj[customSkillId] = { label: customSkill.name, group: 'Other', proficiency: customSkill.value, failure: false };
        });

        // Prototype token and items JSON (allow raw editing)
        let items = [];
        try { items = JSON.parse(document.getElementById('cs-items-json')?.value || '[]'); } catch (e) {
            console.warn('Failed to parse custom items JSON:', e);
            items = [];
        }

        // Merge equipment picker loadout
        if (typeof window.dgEquipment?.getLoadout === 'function') {
            items = window.dgEquipment.getLoadout().concat(items);
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
                    relationship: bond.relationship || '?',
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

        // Get sanity adaptations from checkboxes
        const violenceAdaptations = {
            incident1: document.getElementById('cs-violence-incident1')?.checked || false,
            incident2: document.getElementById('cs-violence-incident2')?.checked || false,
            incident3: document.getElementById('cs-violence-incident3')?.checked || false
        };

        const helplessnessAdaptations = {
            incident1: document.getElementById('cs-helplessness-incident1')?.checked || false,
            incident2: document.getElementById('cs-helplessness-incident2')?.checked || false,
            incident3: document.getElementById('cs-helplessness-incident3')?.checked || false
        };

        // Build motivation items — one per non-empty line of the motivations textarea
        const motivationItems = motivations
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(text => ({
                name: text,
                type: 'motivation',
                img: 'systems/deltagreen/assets/icons/swap-bag-black-bg.svg',
                system: { name: '', description: '', disorder: '', crossedOut: false, disorderCured: false },
                effects: [],
                folder: null,
                sort: 0,
                flags: {}
            }));

        // Read wounds from the LP sheet wounds field
        const lpWounds = document.getElementById('lp-wounds')?.value?.trim() || '';

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
                sanity: { value: sanityValue, currentBreakingPoint: breakingPoint, adaptations: { violence: violenceAdaptations, helplessness: helplessnessAdaptations } },
                physical: { description: physicalDesc, wounds: lpWounds, firstAidAttempted: false, exhausted: false, exhaustedPenalty: -20 },
                biography: { profession: bioProfession, employer: bioEmployer, nationality: bioNationality, sex: bioSex, age: bioAge, education: bioEducation, notes: personalDetails },
                corruption: { value: corruptionValue, haveSeenTheYellowSign: false, gift: '', insight: '' }
            },
            items: items.concat(motivationItems),
            effects: [],
            flags: { exportSource: { world: 'generated', system: 'deltagreen' } }
        };

        return foundry;
    } catch (error) {
        console.error('Error building Foundry JSON:', error);
        alert(`Error building character export: ${error.message}`);
        throw error;
    }
}

/**
 * Toggles the Foundry VTT JSON preview panel.
 * First call: builds the form, generates the JSON, and shows it.
 * Second call: hides it again.
 */
function populateCharacterJSON() {
    const jsonPreviewEl = document.getElementById('cs-json');
    const btn = document.getElementById('preview-json');
    if (!jsonPreviewEl) return;
    // Toggle off if already visible
    if (jsonPreviewEl.style.display === 'block') {
        jsonPreviewEl.style.display = 'none';
        if (btn) btn.textContent = 'Preview Foundry VTT .json';
        return;
    }
    try {
        populateCharacterSheetForm();
        const obj = buildFoundryJSON();
        const pretty = JSON.stringify(obj, null, 2);
        jsonPreviewEl.innerText = pretty;
        jsonPreviewEl.style.display = 'block';
        if (btn) btn.textContent = 'Hide Foundry VTT .json';
    } catch (error) {
        console.error('Error populating JSON:', error);
        alert('Failed to generate JSON preview. Check console for details.');
    }
}

/**
 * Exports the character as a downloadable Foundry VTT .json file.
 * Triggers a browser download with the actor data — ready for drag-and-drop import.
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

/* ── JSON drop-zone helper ──────────────────────────────────────────── */
window.jsonDropZone = {
    over(e) {
        e.preventDefault();
        document.getElementById('json-drop-zone')?.classList.add('drag-over');
    },
    leave(e) {
        document.getElementById('json-drop-zone')?.classList.remove('drag-over');
    },
    drop(e) {
        e.preventDefault();
        document.getElementById('json-drop-zone')?.classList.remove('drag-over');
        const file = e.dataTransfer?.files?.[0];
        if (file) this._read(file);
    },
    fileSelected(e) {
        const file = e.target?.files?.[0];
        if (file) this._read(file);
        // Reset so same file can be re-selected
        e.target.value = '';
    },
    _read(file) {
        if (!file.name.endsWith('.json') && file.type !== 'application/json') {
            alert('Please select a .json file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const textarea = document.getElementById('json-import-area');
            if (textarea) textarea.value = ev.target.result;
            // Update drop zone label to show loaded filename
            const lbl = document.querySelector('.json-drop-label');
            if (lbl) lbl.textContent = '\u2713 ' + file.name;
        };
        reader.readAsText(file);
    }
};

/**
 * Reads a pasted Foundry VTT character JSON back into the editor.
 * Think of it as loading a classified dossier: stats, skills, biography, bonds,
 * typed/specialty skills, and equipment are all restored from the actor object.
 * Useful for editing a character that started life in Foundry, or picking up
 * mid-operation after a browser refresh killed the session.
 */
function importFoundryJSONToEditor() {
    const textarea = document.getElementById('json-import-area');
    if (!textarea || !textarea.value.trim()) {
        alert('Please paste a Foundry VTT character JSON first.');
        return;
    }
    let data;
    try {
        data = JSON.parse(textarea.value.trim());
    } catch (e) {
        alert('Invalid JSON — please check the pasted content and try again.');
        return;
    }

    // Pause the MutationObserver so writing to stat spans doesn't re-trigger
    // populateCharacterSheetForm() mid-import and reset skill values to defaults.
    observer.disconnect();

    try {
        const sys = data.system || {};
        const setInput = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

        // Name
        setInput('cs-name', data.name || '');

        // Core stats — write to display spans
        const statistics = sys.statistics || {};
        CONFIG.STATS.forEach(stat => {
            const key = stat.toLowerCase();
            const raw = statistics[key]?.value;
            if (raw === undefined) return;
            const val = Math.max(3, Math.min(18, parseInt(raw) || 3));
            const spanEl = document.getElementById(`${stat}-value`);
            if (spanEl) {
                spanEl.innerText = val;
                const x5El = document.getElementById(`${stat}-x5-value`);
                if (x5El) x5El.innerText = val * 5;
                const descEl = document.getElementById(`${stat}-descriptor`);
                if (descEl) descEl.innerText = getDescriptor(stat, val);
            }
        });
        updateTotalPoints();

        // Rebuild the character sheet form with the new stat values
        // (creates cs-STR, cs-skill-* inputs etc.)
        populateCharacterSheetForm();

        // Set stat inputs explicitly (populateCharacterSheetForm already reads spans correctly,
        // this is a belt-and-suspenders pass)
        CONFIG.STATS.forEach(stat => {
            const key = stat.toLowerCase();
            const raw = statistics[key]?.value;
            if (raw !== undefined) setInput(`cs-${stat}`, Math.max(3, Math.min(18, parseInt(raw) || 3)));
        });

        // Derived: hp, wp, sanity, breaking point (overwrite the auto-calculated values)
        setInput('cs-hp', sys.health?.max ?? sys.health?.value ?? 0);
        setInput('cs-wp', sys.wp?.max ?? sys.wp?.value ?? 0);
        setInput('cs-sanity-value', sys.sanity?.value ?? 0);
        setInput('cs-breaking-point', sys.sanity?.currentBreakingPoint ?? 0);

        // Predefined skill values — handle both this app's 'proficiency' key and
        // real Foundry VTT exports that use 'value'
        const skills = sys.skills || {};
        Object.entries(skills).forEach(([key, skillData]) => {
            const prof = skillData.proficiency ?? skillData.value ?? 0;
            setInput(`cs-skill-${key}`, prof);
        });

        // Biography
        const bio = sys.biography || {};
        setInput('cs-bio-employer', bio.employer || '');
        setInput('cs-bio-nationality', bio.nationality || '');
        setInput('cs-bio-sex', bio.sex || '');
        setInput('cs-bio-age', bio.age || '');
        setInput('cs-bio-education', bio.education || '');

        // Physical description
        const physDescEl = document.getElementById('cs-physical-desc');
        if (physDescEl) physDescEl.value = sys.physicalDescription || sys.physical?.description || '';

        // Wounds — populate LP wounds field if present
        const importedWounds = sys.physical?.wounds || '';
        if (importedWounds) {
            const woundsEl = document.getElementById('lp-wounds');
            if (woundsEl) woundsEl.value = importedWounds;
        }

        // Motivations — read from type:motivation items (real Foundry DG schema)
        const motivationsEl = document.getElementById('cs-motivations');
        if (motivationsEl) {
            const motivationNames = (data.items || [])
                .filter(item => item.type === 'motivation')
                .map(item => item.name || '')
                .filter(n => n.length > 0);
            motivationsEl.value = motivationNames.length > 0
                ? motivationNames.join('\n')
                : (sys.biography?.motivations || '');
        }

        // Personal details — stored in sys.biography.notes
        const personalDetailsEl = document.getElementById('cs-personal-details');
        if (personalDetailsEl) personalDetailsEl.value = sys.biography?.notes || '';

        // Sanity adaptation checkboxes
        const adaptations = sys.sanity?.adaptations || {};
        ['violence', 'helplessness'].forEach(type => {
            [1, 2, 3].forEach(i => {
                const cb = document.getElementById(`cs-${type}-incident${i}`);
                if (cb) cb.checked = !!(adaptations[type]?.[`incident${i}`]);
            });
        });

        // Typed / custom skills — clear existing rows first
        const customSkillsDiv = document.getElementById('cs-custom-skills');
        if (customSkillsDiv) customSkillsDiv.querySelectorAll('.custom-skill-row').forEach(r => r.remove());
        const typedSkills = sys.typedSkills || {};
        Object.values(typedSkills).forEach(ts => {
            const label = (ts.group && ts.group !== 'Other')
                ? `${ts.group} (${ts.label})`
                : ts.label;
            const prof = ts.proficiency ?? ts.value ?? 0;
            addCustomSkillFromProfession(label, prof);
        });

        // Bonds — clear sheet bonds and re-import from items
        window.bondsOnSheet = [];
        (data.items || [])
            .filter(item => item.type === 'bond')
            .forEach(item => {
                const s = item.system || {};
                const rawDesc = (s.description || '').replace(/<[^>]+>/g, '').trim();
                window.bondsOnSheet.push({
                    id: 'bond-' + Date.now() + Math.random().toString(36).substring(2, 11),
                    name: item.name || '',
                    relationship: s.relationship || '',
                    description: rawDesc,
                    score: s.score ?? 10
                });
            });
        renderBondsOnSheet();

        // Equipment loadout — clear existing and re-add by catalog name
        if (typeof window.dgEquipment?.clear === 'function') {
            window.dgEquipment.clear();
            const equipTypes = new Set(['weapon', 'armor', 'gear', 'item']);
            (data.items || [])
                .filter(item => item.type !== 'bond' && (equipTypes.has(item.type) || !item.type))
                .forEach(item => {
                    if (item.name) window.dgEquipment.add(item.name);
                });
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        alert(`"${data.name || 'Character'}" loaded into the editor!`);
    } finally {
        // Always re-attach the observer
        const statsEl = document.getElementById('stats');
        if (statsEl) observer.observe(statsEl, { childList: true, subtree: true, characterData: true });
    }

    // Apply button states after the observer is back and any pending repaints have settled.
    setTimeout(() => {
        const prepBtn = document.getElementById('prepare-bonus-button');
        if (prepBtn) { prepBtn.classList.add('prepare-bonus-done'); prepBtn.textContent = 'Skills Prepared for Bonus Points'; }
        const prepReminder = document.getElementById('reminder-prepare-bonus');
        if (prepReminder) prepReminder.style.display = 'none';
        const bonusSection = document.getElementById('bonus-skills-section');
        if (bonusSection) bonusSection.style.display = 'block';
        populateBonusSkillDropdowns();

        const applyBonusBtn = document.getElementById('apply-bonus-button');
        if (applyBonusBtn) { applyBonusBtn.classList.add('apply-bonus-done'); applyBonusBtn.textContent = 'Bonuses Applied'; }
        const applyBonusReminder = document.getElementById('reminder-apply-bonus');
        if (applyBonusReminder) applyBonusReminder.style.display = 'none';
    }, 0);
}

// Keep the character sheet form in sync when stats change
let _populatePending = false;
const observer = new MutationObserver(() => {
    if (_populatePending) return;
    _populatePending = true;
    requestAnimationFrame(() => {
        try { populateCharacterSheetForm(); } catch (e) { }
        _populatePending = false;
    });
});
// Expose so save-load.js can pause the observer during state restore
window._dgStatsObserver = observer;

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

    // Bond container event delegation — handles all bond field changes and removals
    const bondsEl = document.getElementById('cs-bonds');
    if (bondsEl) {
        bondsEl.addEventListener('input', (e) => {
            if (e.target.tagName === 'TEXTAREA' && e.target.classList.contains('bond-entry-field')) {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
            }
        });
        bondsEl.addEventListener('change', (e) => {
            const entry = e.target.closest('.bond-entry');
            if (!entry) return;
            const bondId = entry.dataset.bondId;
            if (!bondId) return;
            const field = e.target.dataset.field;
            if (field === 'name') updateBondName(bondId, e.target.value);
            else if (field === 'relationship') updateBondRelationship(bondId, e.target.value);
            else if (field === 'description') updateBondDescription(bondId, e.target.value);
            else if (field === 'score') updateBondScore(bondId, e.target.value);
        });
        bondsEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.bond-remove-button');
            if (!btn) return;
            const entry = btn.closest('.bond-entry');
            if (entry?.dataset.bondId) removeBondFromSheet(entry.dataset.bondId);
        });
    }

    // initialize theme from storage and wire selector
    // Auto-apply mobile theme on small screens if no preference is saved yet
    try {
        const stored = localStorage.getItem('dg_theme');
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const savedTheme = stored || (isMobile ? 'mobile' : 'xfiles');
        setTheme(savedTheme, { skipSave: true });
        const sel = document.getElementById('cs-theme-select');
        if (sel) sel.addEventListener('change', (e) => setTheme(e.target.value));
    } catch (e) { }

    initBondPyramid();
};

/**
 * Initialises the rotating wireframe pyramid inside the bond text box.
 * Rendered via canvas 2D with a simple perspective projection.
 * The animation loop only does real draw work when the X-Files theme is active
 * (window._pyramidVisible) and pauses automatically during the bond typing effect.
 */
function initBondPyramid() {
    const canvas = document.getElementById('bond-pyramid-canvas');
    const container = document.getElementById('bondText');
    if (!canvas || !container) return;

    // Square pyramid: apex + 4 base corners (Y-up, unit scale)
    const verts = [
        [0, -1.2, 0],  // apex
        [-1, 0.6, -1],  // base NW
        [1, 0.6, -1],  // base NE
        [1, 0.6, 1],  // base SE
        [-1, 0.6, 1],  // base SW
    ];
    const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3], [3, 4], [4, 1]];

    let ay = 0;
    const ax = 0.38; // fixed forward tilt so the base square is always visible
    const ctx = canvas.getContext('2d'); // cached once — avoids repeated internal lookups
    const FRAME_MS = 1000 / 24;         // cap to ~24 fps
    let lastFrameTime = 0;

    function rotY(v, a) {
        return [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
    }
    function rotX(v, a) {
        return [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)];
    }
    function project(v, cx, cy, scale) {
        const fov = 4.5;
        const s = (fov / (v[2] + fov)) * scale;
        return [cx + v[0] * s, cy + v[1] * s];
    }

    function draw(now) {
        // Skip all canvas work when pyramid is not visible or page is hidden — keep looping
        if (!window._pyramidVisible || document.hidden) {
            requestAnimationFrame(draw);
            return;
        }
        // When paused, stop the loop entirely — canvas._resume() will restart it
        if (window._pyramidPaused) return;
        // FPS cap — bail early if not enough time has elapsed
        if (now - lastFrameTime < FRAME_MS) {
            requestAnimationFrame(draw);
            return;
        }
        const elapsed = now - lastFrameTime;
        lastFrameTime = now;

        const W = container.offsetWidth || 300;
        const H = container.offsetHeight || 150;
        if (canvas.width !== W) canvas.width = W;
        if (canvas.height !== H) canvas.height = H;

        ctx.clearRect(0, 0, W, H);

        const scale = Math.min(W, H) * 0.26;
        const pts = verts.map(v => project(rotX(rotY(v, ay), ax), W / 2, H / 2, scale));

        // Wide dim glow pass — all 8 edges in one batched path (replaces 8 separate strokes)
        ctx.strokeStyle = 'rgba(0, 180, 30, 0.10)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        edges.forEach(([a, b]) => {
            ctx.moveTo(pts[a][0], pts[a][1]);
            ctx.lineTo(pts[b][0], pts[b][1]);
        });
        ctx.stroke();

        // Core phosphor line pass — batched, no shadowBlur (glow pass above handles the bloom)
        ctx.strokeStyle = 'rgba(0, 130, 25, 0.70)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        edges.forEach(([a, b]) => {
            ctx.moveTo(pts[a][0], pts[a][1]);
            ctx.lineTo(pts[b][0], pts[b][1]);
        });
        ctx.stroke();

        // Time-normalised rotation so speed is consistent regardless of FPS or monitor refresh rate
        ay += 0.00036 * elapsed; // 0.006 rad per 16.67 ms ≈ 0.36 rad/sec
        requestAnimationFrame(draw);
    }

    // Expose a handle so setTheme can gate drawing to xfiles-only.
    // Only initialise to false if setTheme hasn't already set it (i.e. initBondPyramid
    // runs after setTheme in window.onload, so we must not clobber the value).
    if (window._pyramidVisible === undefined) window._pyramidVisible = false;
    canvas._draw = draw;
    canvas._resume = () => requestAnimationFrame(draw); // called after typing to restart the loop

    requestAnimationFrame(draw);
}

/**
 * Returns a runic/occult placeholder string when Son of Sam theme is active,
 * otherwise returns the original placeholder text unchanged.
 * @param {string} text - The original placeholder text
 * @returns {string}
 */
function sosPlaceholder(text) {
    if (!document.body.classList.contains('theme-son-of-sam')) return text;
    const map = {
        'Bond Name': 'ᚱᚢᚾᛖ ᚾᚨᛗᛖ',
        'Bond Description/Text': 'ᛞᛖᛋᚲᚱᛁᛈᛏᛁᛟᚾ',
        'Edit relationship...': 'ᚱᛖᛚᚨᛏᛁᛟᚾᛋᚺᛁᛈ',
        'Skill Name': 'ᛋᚲᛁᛚᛚ',
    };
    return map[text] ?? text;
}

/**
 * Applies one of the available visual themes: xfiles, modern, son-of-sam, field-notes, field-doc.
 * Saves the selection to localStorage, flushes any pending form state, and handles
 * theme-specific setup — LP sheet build/sync, pyramid visibility, button states,
 * and Son of Sam's plus-button glyphs.
 */
function setTheme(theme, { skipSave = false } = {}) {
    try {
        // Flush any LP skill % values the user edited back to the underlying form
        // inputs before saving — but ONLY when we are leaving the LP theme.
        // Running this flush when switching TO the LP theme would overwrite
        // fresher form values with the stale values last shown in the LP grid.
        const currentTheme = document.getElementById('cs-theme-select')?.value
            || (document.body.classList.contains('theme-field-doc') ? 'field-doc' : '');
        if (currentTheme === 'field-doc' && theme !== 'field-doc') {
            document.querySelectorAll('#lp-sheet .lp-skill-val[data-skill-src]').forEach(inp => {
                const raw = parseInt(inp.value);
                if (!isNaN(raw)) {
                    const srcEl = document.getElementById(inp.dataset.skillSrc);
                    if (srcEl) srcEl.value = raw;
                }
            });
        }

        // Save current state synchronously before switching so no form values are
        // lost through the debounce window.
        // Skip this during initial page load — character state hasn't been restored
        // yet and saving now would overwrite the persisted save with a blank slate.
        if (!skipSave) window.dgSaveLoad?.save?.();

        const body = document.body;
        // Deactivate wizard before class swap so panels return to their original DOM positions;
        // remember the active step so we can re-activate after the theme swap.
        const _wizActive = document.getElementById('wiz-outer') !== null;
        const _wizStep = _wizActive ? (window.dgWizard?._currentStep?.() ?? 0) : null;
        window.dgWizard?.deactivate();

        body.classList.remove('theme-xfiles', 'theme-modern', 'theme-son-of-sam', 'theme-field-notes', 'theme-field-doc', 'theme-mobile');
        body.classList.add('theme-' + theme);
        localStorage.setItem('dg_theme', theme);
        const sel = document.getElementById('cs-theme-select');
        if (sel) sel.value = theme;
        // Son of Sam: swap all stat increment buttons between + and ⛧
        const plusSymbol = theme === 'son-of-sam' ? '\u26E7' : '+';
        document.querySelectorAll('.stat-inc-btn').forEach(btn => {
            btn.textContent = plusSymbol;
        });
        // Gate pyramid RAF loop — only do real drawing work on xfiles
        window._pyramidVisible = (theme === 'xfiles');
        // Rebuild the character sheet form so skill/stat DOM elements pick up the
        // new theme's CSS rather than retaining inline styles from creation time.
        if (typeof populateCharacterSheetForm === 'function') {
            populateCharacterSheetForm();
        }
        // Refresh bond entries so their placeholders update immediately
        if (typeof renderBondsOnSheet === 'function' && window.bondsOnSheet && window.bondsOnSheet.length > 0) {
            renderBondsOnSheet();
        }
        // Re-activate wizard on the same step if it was running when the theme changed
        if (_wizStep !== null && !isNaN(_wizStep) && typeof window.dgWizard?.activate === 'function') {
            localStorage.setItem('dg-wiz-step', String(_wizStep));
            window.dgWizard.activate();
        }
        // Show download/upload buttons only in field-doc; show copy/clear in all other themes
        const dlBtn = document.getElementById('download-sheet-btn');
        const ulBtn = document.getElementById('upload-sheet-btn');
        const clearLpBtn = document.getElementById('clear-sheet-lp-btn');
        const copyBtn = document.getElementById('copy-link-btn');
        const clearBtn = document.getElementById('clear-save-btn');
        const isLivePlay = theme === 'field-doc';
        if (dlBtn) dlBtn.style.display = isLivePlay ? 'inline-block' : 'none';
        if (ulBtn) ulBtn.style.display = isLivePlay ? 'inline-block' : 'none';
        if (clearLpBtn) clearLpBtn.style.display = isLivePlay ? 'inline-block' : 'none';
        if (copyBtn) copyBtn.style.display = isLivePlay ? 'none' : 'inline-block';
        if (clearBtn) clearBtn.style.display = isLivePlay ? 'none' : 'inline-block';
        const lpIoGroup = document.getElementById('lp-sheet-io-group');
        if (lpIoGroup) lpIoGroup.style.display = isLivePlay ? 'none' : '';
        // Field Document (Live Play): build/sync LP sheet, sync tracker bar, auto-expand dice roller
        if (theme === 'field-doc') {
            // Only do a full build if the LP sheet hasn't been built yet.
            // Skipping the rebuild on subsequent theme switches preserves any
            // notes, wounds, session remarks and manually-added weapon rows
            // the player entered while on the field-doc theme.
            if (!document.getElementById('lp-weapons-tbody')) {
                buildLpSheet();
            } else {
                syncLpFromForm();
                _populateLpGear();
                lpSyncBar();
                if (typeof renderLpBonds === 'function') renderLpBonds();
            }
            // Expand the dice roller if it is currently collapsed
            const drPanel = document.getElementById('dr-panel');
            if (drPanel && drPanel.classList.contains('dr-collapsed')) {
                window.dgDice?._toggle?.();
            }
        }
        // Swap BMC badge colour to match theme
        const BMC_SRC = {
            'xfiles': 'https://cdn.buymeacoffee.com/buttons/v2/default-black.png',
            'modern': 'https://cdn.buymeacoffee.com/buttons/v2/default-violet.png',
            'son-of-sam': 'https://cdn.buymeacoffee.com/buttons/v2/default-red.png',
            'field-doc': 'https://cdn.buymeacoffee.com/buttons/v2/default-blue.png',
            'field-notes': 'https://cdn.buymeacoffee.com/buttons/v2/default-orange.png',
        };
        const bmcImg = document.getElementById('bmc-img');
        if (bmcImg && BMC_SRC[theme]) bmcImg.src = BMC_SRC[theme];
    } catch (e) { }
}

/* ============================================================
   LIVE PLAY FUNCTIONS
   ============================================================ */

/**
 * Adjusts a derived-attribute tracker value from the live play bar (+/− button).
 * Writes directly to the underlying form input so save-load and all other views
 * stay in sync.
 */
function lpAdjust(inputId, delta) {
    const el = document.getElementById(inputId);
    if (!el) return;
    const newVal = Math.max(0, (parseInt(el.value) || 0) + delta);
    el.value = newVal;
    el.dispatchEvent(new Event('input', { bubbles: true })); // trigger auto-save
    lpSyncBar();
}

/**
 * Syncs the live play tracker bar and LP sheet max cells with the underlying form values.
 * Handles HP/WP/SAN status labels (DYING, UNCONSCIOUS, BREAKING PT, PERM. MADNESS)
 * and proxy inputs. Safe to call at any time, even when the tracker bar isn't visible.
 */
function lpSyncBar() {
    const getVal = id => parseInt(document.getElementById(id)?.value) || 0;
    // Use textContent (not innerText) so stat spans work even when display:none
    const getStat = st => parseInt(document.getElementById(`${st}-value`)?.textContent) || 0;
    const setText = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    const toggle = (id, cls, on) => { const e = document.getElementById(id); if (e) e.classList.toggle(cls, on); };

    const hp = getVal('cs-hp');
    const wp = getVal('cs-wp');
    const san = getVal('cs-sanity-value');
    const bp = getVal('cs-breaking-point');

    // Compute max values from underlying stat spans
    const str = getStat('STR'), con = getStat('CON'), pow = getStat('POW');
    const maxHp = (str || con) ? Math.ceil((str + con) / 2) : hp;
    const maxWp = pow || wp;
    const maxSan = pow ? pow * 5 : san;
    const maxBp = pow ? pow * 4 : bp;

    // ── Tracker bar: current values ────────────────────────────────
    setText('lp-cur-hp', hp);
    setText('lp-cur-wp', wp);
    setText('lp-cur-san', san);
    setText('lp-cur-bp', bp);

    // ── Tracker bar: max values ────────────────────────────────────
    setText('lp-bar-max-hp', maxHp);
    setText('lp-bar-max-wp', maxWp);
    setText('lp-bar-max-san', maxSan);

    // ── Tracker bar: HP status ─────────────────────────────────────
    setText('lp-bar-sta-hp', hp === 0 ? 'DYING' : hp <= 2 ? 'UNCONSCIOUS' : '');
    toggle('lp-track-hp', 'lp-dying', hp === 0);
    toggle('lp-track-hp', 'lp-critical', hp > 0 && hp <= 2);

    // ── Tracker bar: SAN status ────────────────────────────────────
    const sanCritical = san === 0;
    const sanWarning = !sanCritical && san <= bp;
    setText('lp-bar-sta-san', sanCritical ? 'PERM. MADNESS' : sanWarning ? 'BREAKING PT' : '');
    toggle('lp-track-san', 'lp-critical', sanCritical);
    toggle('lp-track-san', 'lp-warning', sanWarning);

    // ── LP sheet: max cells (if sheet is built) ────────────────────
    setText('lp-max-HP', maxHp);
    setText('lp-max-WP', maxWp);
    setText('lp-max-SAN', maxSan);
    setText('lp-max-BP', maxBp);

    // ── LP sheet: sync proxy current inputs (skip focused element) ─
    [['lp-inp-hp', 'cs-hp'], ['lp-inp-wp', 'cs-wp'],
    ['lp-inp-san', 'cs-sanity-value'], ['lp-inp-bp', 'cs-breaking-point']
    ].forEach(([proxyId, srcId]) => {
        const el = document.getElementById(proxyId);
        if (el && el !== document.activeElement) el.value = getVal(srcId);
    });
}

/**
 * Reduces a bond's score by 1 when the −1 DMG button is pressed in the live play view.
 * Bonds don't heal easily. That's rather the point.
 */
function lpDamageBond(btn) {
    const entry = btn.closest('.bond-entry');
    if (!entry) return;
    const scoreInput = entry.querySelector('input[data-field="score"]');
    if (!scoreInput) return;
    const current = parseInt(scoreInput.value) || 0;
    if (current > 0) {
        scoreInput.value = current - 1;
        scoreInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

/**
 * Rolls a quick percentile (D%) from the live play tracker bar.
 * Forwards to the dice roller module for a full animated result if available,
 * or falls back to plain Math.random(). Press it often enough and something bad will happen.
 */
function lpQuickRoll() {
    const resultEl = document.getElementById('lp-dice-result');
    const roll = Math.floor(Math.random() * 100) + 1;
    const display = roll === 100 ? '00' : String(roll).padStart(2, '0');
    if (resultEl) {
        resultEl.textContent = display;
        resultEl.style.color = roll === 100 ? '#ff4444' : roll === 1 ? '#f5c542' : '#a89878';
    }
    // Also forward to dice roller so it shows the full animated result
    if (window.dgDice?.roll) window.dgDice.roll(0, 'Quick Roll');
}

/* ============================================================
   LIVE PLAY SHEET — DD FORM 315 interactive view
   ============================================================ */

/**
 * Rebuilds the skills grid inside the LP sheet from the current form state.
 * Handles CONFIG.SKILLS (with specialty labels), form-level custom skills, and
 * LP-only rows added via addLpSkill(). Preserves all checkbox states across rebuilds.
 * Skips the rebuild while the user is actively typing inside the grid.
 * Called by syncLpFromForm() on every form change and by buildLpSheet() on initial render.
 */
function _buildLpSkillsGrid() {
    const lp = document.getElementById('lp-sheet');
    if (!lp) return;
    const grid = lp.querySelector('.lp-skills-grid');
    if (!grid) return;

    // Skip rebuild while the user is actively typing inside the skills grid
    // (every form change fires this; we must not destroy a live input mid-keystroke)
    if (grid.contains(document.activeElement)) return;

    const esc = s => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // ── Save state before rebuild ──────────────────────────────────────
    const checkedSkillKeys = new Set();   // CONFIG.SKILLS (by key)
    const checkedCustomNames = new Set(); // form-custom skills (by raw decoded name)
    const lpOnlySkills = [];              // LP-only rows (editable name inputs via addLpSkill)

    grid.querySelectorAll('.lp-skill-table tbody tr').forEach(tr => {
        const nameInp = tr.querySelector('.lp-skill-name-inp');
        if (nameInp) {
            // LP-only row — preserve verbatim
            lpOnlySkills.push({
                name: nameInp.value,
                val: tr.querySelector('.lp-skill-cust-val')?.value || '',
                checked: tr.querySelector('.lp-skill-cb')?.checked || false,
            });
            return;
        }
        if (!tr.querySelector('.lp-skill-cb')?.checked) return;
        const valInp = tr.querySelector('.lp-skill-val');
        if (valInp?.dataset.skillSrc) {
            checkedSkillKeys.add(valInp.dataset.skillSrc.replace('cs-skill-', ''));
        } else {
            const nameTd = tr.querySelector('td:nth-child(2)');
            if (nameTd) checkedCustomNames.add(nameTd.textContent.trim());
        }
    });

    // ── Build skillRows from current form state ────────────────────────
    // Use getCompletedSkills() as the canonical source (base skills + specialty instances).
    const skillRows = getCompletedSkills().map(skill => ({
        key: skill.specialty === null ? skill.key : null,  // keyed only for base skills
        display: esc(skill.displayName),
        rawName: skill.displayName,
        val: skill.value
    }));
    document.querySelectorAll('#cs-custom-skills .custom-skill-row').forEach(row => {
        const valInput = row.querySelector('.custom-skill-value');
        if (!valInput) return;
        const specSelect = row.querySelector('select');        // any select in the row
        const nameInput = row.querySelector('.custom-skill-name');
        const baseLabel = row.querySelector('label')?.textContent.replace(/:$/, '').trim() || '';
        let rawName = '';
        if (specSelect) {
            // Science / Art / Craft / Pilot / Military Science — label + dropdown
            const specVal = specSelect.value;
            if (!specVal) return; // "Pick" still selected — skip
            // Use parentheses format to match collectState / addCustomSkillFromProfession
            rawName = baseLabel ? `${baseLabel} (${specVal})` : specVal;
        } else if (baseLabel && nameInput) {
            // Foreign Language — label + editable text input
            const spec = nameInput.value.trim();
            rawName = spec ? `${baseLabel} (${spec})` : baseLabel;
        } else if (nameInput) {
            // Plain user-added custom skill (no label)
            rawName = nameInput.value.trim();
        }
        if (rawName) skillRows.push({ key: null, display: esc(rawName), rawName, val: parseInt(valInput.value) || 0 });
    });

    // ── Build column HTML ──────────────────────────────────────────────
    // Balanced 3-way split: columns differ by at most 1 row (remainder front-to-back)
    const n = skillRows.length;
    const base = Math.floor(n / 3);
    const r = n % 3;
    const c1End = base + (r > 0 ? 1 : 0);
    const c2End = c1End + base + (r > 1 ? 1 : 0);

    // Tallest column determines target row count.
    // LP-only rows are appended to col3 after the grid HTML is written, so
    // they must be accounted for here so col1/col2 get the right pad count.
    const maxColSize = Math.max(c1End, c2End - c1End, n - c2End + lpOnlySkills.length);

    const blankRow = `<tr>
                <td class="lp-tc lp-sk-cb-td"></td>
                <td class="lp-tc lp-sk-name-td"></td>
                <td class="lp-tc lp-sk-val-td"></td>
            </tr>`;

    const buildCol = (start, end, padCount) => {
        const rows = skillRows.slice(start, end).map(sk => {
            const cbId = sk.key ? ` id="lp-sk-cb-${sk.key}"` : '';
            const pct = sk.val != null ? sk.val + '%' : '';
            const skillSrc = sk.key ? ` data-skill-src="cs-skill-${sk.key}"` : '';
            const isChecked = sk.key
                ? checkedSkillKeys.has(sk.key)
                : checkedCustomNames.has(sk.rawName || '');
            const cbName = sk.key ? `lp-skill-cb-${sk.key}` : `lp-skill-cb-cust`;
            const valName = sk.key ? `lp-skill-val-${sk.key}` : `lp-skill-val-cust`;
            const isZero = !sk.val;
            return `<tr>
                <td class="lp-tc lp-sk-cb-td">
                    <input type="checkbox" class="lp-skill-cb${isZero ? ' lp-skill-cb-zero' : ''}" name="${cbName}" autocomplete="off"${cbId}${isChecked && !isZero ? ' checked' : ''}${isZero ? ' disabled' : ''}>
                </td>
                <td class="lp-tc lp-sk-name-td" title="${sk.display}">${sk.display}</td>
                <td class="lp-tc lp-sk-val-td">
                    <input type="text" inputmode="numeric" class="lp-skill-val" name="${valName}" autocomplete="off"${skillSrc} value="${pct}" style="width:100%;box-sizing:border-box;">
                </td>
            </tr>`;
        }).join('');
        const padding = Array(Math.max(0, padCount)).fill(blankRow).join('');
        return `<table class="lp-skill-table"><thead><tr>
            <th class="lp-tc lp-sk-cb-td"></th>
            <th class="lp-tc lp-sk-name-td">SKILL</th>
            <th class="lp-tc lp-sk-val-td">%</th>
        </tr></thead><tbody>${rows}${padding}</tbody></table>`;
    };

    grid.innerHTML = `
        ${buildCol(0, c1End, maxColSize - c1End)}
        ${buildCol(c1End, c2End, maxColSize - (c2End - c1End))}
        ${buildCol(c2End, n, maxColSize - (n - c2End) - lpOnlySkills.length)}
    `;

    // ── Re-append LP-only skill rows to last table's tbody ─────────────
    if (lpOnlySkills.length) {
        const tables = grid.querySelectorAll('table.lp-skill-table');
        const lastTbody = tables[tables.length - 1]?.querySelector('tbody');
        if (lastTbody) {
            lpOnlySkills.forEach(sk => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="lp-tc lp-sk-cb-td">
                        <input type="checkbox" class="lp-skill-cb" name="lp-skill-cb-extra" autocomplete="off"${sk.checked ? ' checked' : ''}>
                    </td>
                    <td class="lp-tc lp-sk-name-td">
                        <input type="text" class="lp-skill-name-inp" name="lp-skill-name-extra" autocomplete="off" placeholder="Skill name" value="${esc(sk.name)}">
                    </td>
                    <td class="lp-tc lp-sk-val-td">
                        <input type="text" inputmode="numeric" class="lp-skill-val lp-skill-cust-val" name="lp-skill-val-extra" autocomplete="off" value="${esc(sk.val)}" placeholder="%" style="width:100%;box-sizing:border-box;" title="Click to roll">
                    </td>`;
                lastTbody.appendChild(tr);
            });
        }
    }
}

/**
 * Builds and injects the full DD Form 315-style live play sheet into #lp-sheet.
 * Only called once — subsequent theme switches sync without rebuilding, so any
 * notes, wounds, or weapon rows the player entered mid-session are preserved.
 * After injection: wires proxies, renders bonds, populates from current form state.
 */
function buildLpSheet() {
    const container = document.getElementById('lp-sheet');
    if (!container) return;

    // ── Helpers ────────────────────────────────────────────────────
    const proxy = (id, extraClass = '', extra = '') =>
        `<input type="text" class="lp-proxy${extraClass ? ' ' + extraClass : ''}" name="${id}" data-src="${id}" autocomplete="off"${extra}>`;

    const adjBtn = (srcId, delta, lbl) =>
        `<button type="button" class="lp-adj-btn" onclick="lpAdjust('${srcId}',${delta})" title="${lbl}">${delta > 0 ? '+' : '−'}</button>`;

    // ── Stat rows ──────────────────────────────────────────────────
    const STAT_LABELS = {
        STR: 'Strength (STR)', DEX: 'Dexterity (DEX)', CON: 'Constitution (CON)',
        INT: 'Intelligence (INT)', POW: 'Power (POW)', CHA: 'Charisma (CHA)'
    };
    const statRowsHtml = CONFIG.STATS.map(st => `
        <tr>
            <td class="lp-tc" style="border-left:none;font-size:10pt;">${STAT_LABELS[st] || st}</td>
            <td class="lp-tc" style="width:50px;min-width:50px;text-align:center;font-size:10pt;font-weight:bold;white-space:nowrap;">
                <input type="text" inputmode="numeric" pattern="[0-9]*" id="lp-stat-${st}" name="lp-stat-${st}" class="lp-stat-inp" autocomplete="off" value="&mdash;">
            </td>
            <td class="lp-tc" style="width:50px;min-width:50px;text-align:center;font-size:10pt;white-space:nowrap;">
                <span id="lp-stat-${st}-x5" style="font-family:Arial,Helvetica,sans-serif;font-size:10pt;">—</span>
            </td>
            <td class="lp-tc" style="border-right:none;font-size:10pt;">
                <input type="text" id="lp-feat-${st}" name="lp-feat-${st}" class="lp-feat-inp" autocomplete="off" placeholder="">
            </td>
        </tr>`).join('');

    // ── Derived attribute rows (HP/WP/SAN/BP) with +/- ─────────────
    const ATTR_LABELS = {
        HP: 'Hit Points (HP)', WP: 'Willpower (WP)',
        SAN: 'Sanity (SAN)', BP: 'Breaking Point (BP)'
    };
    const ATTR_SRCS = { HP: 'cs-hp', WP: 'cs-wp', SAN: 'cs-sanity-value', BP: 'cs-breaking-point' };
    const ATTR_IDS = { HP: 'lp-inp-hp', WP: 'lp-inp-wp', SAN: 'lp-inp-san', BP: 'lp-inp-bp' };
    const attrRowsHtml = ['HP', 'WP', 'SAN', 'BP'].map(key => {
        const hasBtns = key !== 'BP';
        const srcId = ATTR_SRCS[key];
        const inpId = ATTR_IDS[key];
        const ctrl = hasBtns
            ? `<div class="lp-attr-controls">
                ${adjBtn(srcId, -1, `Reduce ${key}`)}
                <input type="text" inputmode="numeric" pattern="[0-9]*" id="${inpId}" name="${inpId}" class="lp-proxy" data-src="${srcId}" autocomplete="off" value="0" style="width:50px;flex:0 0 50px;text-align:center;font-family:'Permanent Marker',cursive;font-size:12pt;border:1px solid #000;background:#fff;padding:1px 2px;box-sizing:border-box;">
                ${adjBtn(srcId, +1, `Restore ${key}`)}
               </div>`
            : `<div class="lp-attr-controls">
                <input type="text" inputmode="numeric" pattern="[0-9]*" id="${inpId}" name="${inpId}" class="lp-proxy" data-src="${srcId}" autocomplete="off" value="0" style="width:50px;flex:0 0 50px;text-align:center;font-family:'Permanent Marker',cursive;font-size:12pt;border:1px solid #000;background:#fff;padding:1px 2px;box-sizing:border-box;">
               </div>`;
        return `<tr>
            <td class="lp-tc" style="border-left:none;font-size:10pt;">${ATTR_LABELS[key]}</td>
            <td class="lp-tc" style="width:58px;min-width:58px;text-align:center;font-size:10pt;white-space:nowrap;">
                <span id="lp-max-${key}" style="font-family:Arial,Helvetica,sans-serif;font-size:10pt;">—</span>
            </td>
            <td class="lp-tc" style="width:130px;min-width:130px;border-right:none;">${ctrl}</td>
        </tr>`;
    }).join('');

    // ── Full HTML ──────────────────────────────────────────────────
    container.innerHTML = `
    <div class="lp-dg-title">DELTA GREEN</div>

    <!-- ── Band 7: Personal Data ─────────────────────────────────── -->
    <div class="lp-band">
        <span class="lp-rot-label"></span>
        <div style="flex:1;">
            <div class="lp-sec-hd">PERSONAL DATA</div>
            <table class="lp-full-table"><tr>
                <td class="lp-cell" style="min-width:120px;border-right:1px solid #000;">
                    <div class="lp-field-label">NAME</div>${proxy('cs-name', 'lp-name-input lp-handwritten')}
                </td>
                <td class="lp-cell" style="width:18%;border-right:1px solid #000;">
                    <div class="lp-field-label">PROFESSION / BACKGROUND</div>
                    <span id="lp-profession-display" class="lp-handwritten" style="display:block;"></span>
                </td>
                <td class="lp-cell" style="width:20%;border-right:1px solid #000;">
                    <div class="lp-field-label">EMPLOYER</div>${proxy('cs-bio-employer', 'lp-handwritten')}
                </td>
                <td class="lp-cell" style="width:14%;border-right:1px solid #000;">
                    <div class="lp-field-label">NATIONALITY</div>${proxy('cs-bio-nationality', 'lp-handwritten')}
                </td>
                <td class="lp-cell" style="width:7%;border-right:1px solid #000;">
                    <div class="lp-field-label">SEX</div>${proxy('cs-bio-sex', 'lp-tiny lp-handwritten')}
                </td>
                <td class="lp-cell" style="width:5%;border-right:1px solid #000;">
                    <div class="lp-field-label">AGE</div>${proxy('cs-bio-age', 'lp-tiny lp-handwritten')}
                </td>
                <td class="lp-cell" style="flex:1;">
                    <div class="lp-field-label">EDUCATION / BACKGROUND</div>${proxy('cs-bio-education', 'lp-handwritten')}
                </td>
            </tr></table>
        </div>
    </div>

    <!-- ── Bands 8–13: Stats + Psych Data side by side ────────────── -->
    <div class="lp-band lp-stats-psych-row" style="align-items:stretch;">
        <span class="lp-rot-label" style="writing-mode:vertical-rl;transform:rotate(180deg);background:#000;color:#fff;font-size:8pt;font-weight:bold;letter-spacing:1px;padding:5px 2px;width:14px;min-width:14px;text-align:center;"></span>

        <div class="lp-sp-grid">
            <!-- Row 1: STATISTICS (left) | BONDS (right) -->
            <div class="lp-sp-row">
                <div class="lp-sp-col-l">
                    <div class="lp-sec-hd">STATISTICS</div>
                    <table class="lp-full-table">
                        <thead><tr>
                            <th class="lp-tc" style="border-left:none;text-align:left;font-size:10pt;">STATISTIC</th>
                            <th class="lp-tc" style="width:50px;min-width:50px;font-size:10pt;">SCORE</th>
                            <th class="lp-tc" style="width:50px;min-width:50px;font-size:10pt;">×5</th>
                            <th class="lp-tc" style="border-right:none;font-size:10pt;">DISTINGUISHING FEATURES</th>
                        </tr></thead>
                        <tbody>${statRowsHtml}</tbody>
                    </table>
                </div>
                <div class="lp-sp-col-r">
                    <div class="lp-sec-hd">BONDS</div>
                    <table class="lp-full-table">
                        <thead><tr>
                            <th class="lp-tc" style="border-left:none;text-align:left;font-size:10pt;">NAME &amp; RELATIONSHIP</th>
                            <th class="lp-tc" style="width:50px;font-size:10pt;text-align:center;">SCORE</th>
                            <th class="lp-tc" style="width:52px;font-size:10pt;border-right:none;text-align:center;">DMG</th>
                        </tr></thead>
                        <tbody id="lp-bonds-tbody"></tbody>
                    </table>
                </div>
            </div>

            <!-- Row 2: DERIVED ATTRIBUTES (left) | MOTIVATIONS (right) -->
            <div class="lp-sp-row">
                <div class="lp-sp-col-l">
                    <div class="lp-sec-hd">DERIVED ATTRIBUTES</div>
                    <table class="lp-full-table">
                        <thead><tr>
                            <th class="lp-tc" style="border-left:none;text-align:left;font-size:10pt;">ATTRIBUTE</th>
                            <th class="lp-tc" style="width:48px;font-size:10pt;text-align:center;">MAXIMUM</th>
                            <th class="lp-tc" style="border-right:none;font-size:10pt;text-align:center;">CURRENT</th>
                        </tr></thead>
                        <tbody>${attrRowsHtml}</tbody>
                    </table>
                </div>
                <div class="lp-sp-col-r">
                    <div class="lp-sec-hd">MOTIVATIONS &amp; MENTAL DISORDERS</div>
                    <div class="lp-section-block">
                        <textarea class="lp-ta lp-proxy" name="cs-motivations" data-src="cs-motivations" autocomplete="off" style="min-height:28px;overflow:hidden;resize:none;"></textarea>
                    </div>
                </div>
            </div>

            <!-- Row 3: PHYSICAL DESCRIPTION (left) | INCIDENTS OF SAN LOSS (right) -->
            <!-- Both cols share one flex row — headers guaranteed same y -->            
            <div class="lp-sp-row lp-sp-last-row">
                <div class="lp-sp-col-l">
                    <div class="lp-sec-hd">PHYSICAL DESCRIPTION</div>
                    <div class="lp-section-block">
                        <textarea class="lp-ta lp-proxy" name="cs-physical-desc" data-src="cs-physical-desc" autocomplete="off" style="min-height:60px;"></textarea>
                    </div>
                </div>
                <div class="lp-sp-col-r">
                    <div class="lp-sec-hd">INCIDENTS OF SAN LOSS WITHOUT GOING INSANE</div>
                    <div style="padding:2px 4px;border-top:1px solid #000;">
                        <div class="lp-san-row">
                            <strong style="font-size:10pt;min-width:90px;">Violence:</strong>
                            <input type="checkbox" class="lp-skill-cb" id="lp-vi1" name="lp-vi1" autocomplete="off" data-san-src="cs-violence-incident1">
                            <input type="checkbox" class="lp-skill-cb" id="lp-vi2" name="lp-vi2" autocomplete="off" data-san-src="cs-violence-incident2">
                            <input type="checkbox" class="lp-skill-cb" id="lp-vi3" name="lp-vi3" autocomplete="off" data-san-src="cs-violence-incident3">
                            <span style="font-size:8pt;opacity:0.7;margin-left:5px;">adapted if all 3 checked</span>
                        </div>
                        <div class="lp-san-row">
                            <strong style="font-size:10pt;min-width:90px;">Helplessness:</strong>
                            <input type="checkbox" class="lp-skill-cb" id="lp-hi1" name="lp-hi1" autocomplete="off" data-san-src="cs-helplessness-incident1">
                            <input type="checkbox" class="lp-skill-cb" id="lp-hi2" name="lp-hi2" autocomplete="off" data-san-src="cs-helplessness-incident2">
                            <input type="checkbox" class="lp-skill-cb" id="lp-hi3" name="lp-hi3" autocomplete="off" data-san-src="cs-helplessness-incident3">
                            <span style="font-size:8pt;opacity:0.7;margin-left:5px;">adapted if all 3 checked</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ── Band 14: Applicable Skill Sets ─────────────────────────── -->
    <div class="lp-band">
        <span class="lp-rot-label"></span>
        <div style="flex:1;">
            <div class="lp-sec-hd">APPLICABLE SKILL SETS</div>
            <div class="lp-skills-grid">
            </div>
            <div class="lp-skills-footer">
                <span>Checkbox = Failed this session (mark after use)</span>
                <div style="display:flex;gap:6px;">
                    <button type="button" class="lp-btn-sm" onclick="addLpSkill()" title="Add a custom skill row to this sheet. Use for any skill your agent has that isn't already listed.">+ ADD SKILL</button>
                    <button type="button" class="lp-btn-sm" onclick="lpClearSkillChecks()" title="Uncheck all session-failure checkboxes. Do this at the start of a new session once improvement rolls are done.">CLEAR SESSION MARKS</button>
                    <button type="button" class="lp-btn-sm lp-btn-advance" onclick="lpRollAdvancement()" title="Do this at the end of a session. Rolls for skill improvement on every skill marked as failed. Skills that roll higher than their current value improve by 1d4. Results are shown in a summary before applying.">ROLL IMPROVEMENTS</button>
                </div>
            </div>
        </div>
    </div>

    <!-- ── Band 15: Wounds ────────────────────────────────────────── -->
    <div class="lp-band">
        <span class="lp-rot-label"></span>
        <div style="flex:1;">
            <div class="lp-sec-hd">WOUNDS AND AILMENTS</div>
            <textarea class="lp-ta" id="lp-wounds" name="lp-wounds" autocomplete="off" placeholder="Record wounds, injuries, and conditions here..." style="min-height:48px;overflow:hidden;resize:none;"></textarea>
        </div>
    </div>

    <!-- ── Band 16a: Gear & Armor ─────────────────────────────────── -->
    <div class="lp-band">
        <span class="lp-rot-label"></span>
        <div style="flex:1;">
            <div class="lp-sec-hd">GEAR &amp; ARMOR</div>
            <textarea id="lp-gear-content" name="lp-gear-content" class="lp-ta" autocomplete="off" style="min-height:48px;overflow:hidden;resize:none;" placeholder="List gear and armor items picked up..."></textarea>
        </div>
    </div>

    <!-- ── Band 16b: Weapons ──────────────────────────────────────── -->
    <div class="lp-band">
        <span class="lp-rot-label"></span>
        <div style="flex:1;">
            <div class="lp-sec-hd">WEAPONS</div>
            <div style="overflow-x:auto;">
                <table class="lp-full-table lp-skill-table" id="lp-weapons-table">
                    <thead><tr>
                        <th class="lp-tc" style="text-align:left;font-size:9pt;">NAME</th>
                        <th class="lp-tc" style="width:52px;font-size:9pt;">SKILL%</th>
                        <th class="lp-tc" style="width:54px;font-size:9pt;">RANGE</th>
                        <th class="lp-tc" style="width:54px;font-size:9pt;">DAMAGE</th>
                        <th class="lp-tc" style="width:50px;font-size:9pt;">LETHALITY</th>
                        <th class="lp-tc" style="width:40px;font-size:9pt;">AMMO</th>
                        <th class="lp-tc" style="width:22px;border-right:none;"></th>
                    </tr></thead>
                    <tbody id="lp-weapons-tbody"><tr><td colspan="7" class="lp-tc" style="font-size:7.5pt;text-align:center;opacity:0.6;border-left:none;border-right:none;">(none — use ADD WEAPON to add)</td></tr></tbody>
                </table>
            </div>
            <div style="padding:3px 4px;">
                <button type="button" class="lp-btn-sm" onclick="addLpWeapon()">+ ADD WEAPON</button>
            </div>
        </div>
    </div>

    <!-- ── Band 17: Session Notes ─────────────────────────────────── -->
    <div class="lp-band">
        <span class="lp-rot-label"></span>
        <div style="flex:1;">
            <div class="lp-sec-hd">PERSONAL DETAILS AND NOTES</div>
            <textarea class="lp-ta" id="lp-remarks" name="lp-remarks" autocomplete="off" placeholder="Session notes, clues, leads, contacts..." style="min-height:60px;overflow:hidden;resize:none;"></textarea>
        </div>
    </div>

    <div class="lp-footnote">DELTA GREEN — Live Play (Field Notes) — Unclassified</div>
    `;

    // Wire, populate, render
    _wireLpProxies();
    // Wire stat score inputs → write back to main form spans + cascade
    CONFIG.STATS.forEach(st => {
        const inp = document.getElementById(`lp-stat-${st}`);
        if (!inp) return;
        inp.addEventListener('change', () => {
            let val = parseInt(inp.value);
            if (isNaN(val)) { inp.value = '—'; return; }
            val = Math.max(3, Math.min(18, val));
            inp.value = val;
            const mainSpan = document.getElementById(`${st}-value`);
            const mainX5 = document.getElementById(`${st}-x5-value`);
            const mainDesc = document.getElementById(`${st}-descriptor`);
            if (mainSpan) mainSpan.textContent = val;
            if (mainX5) mainX5.textContent = val * 5;
            if (mainDesc) mainDesc.textContent = getDescriptor(st, val) || '';
            if (typeof updateTotalPoints === 'function') updateTotalPoints();
            if (typeof updateDerivedAttributes === 'function') updateDerivedAttributes();
            const x5Span = document.getElementById(`lp-stat-${st}-x5`);
            if (x5Span) x5Span.textContent = val * 5;
            lpSyncBar();
        });
    });
    renderLpBonds();
    syncLpFromForm();
    _populateLpGear();
    lpSyncBar();
    requestAnimationFrame(lpAlignSections);
}

/**
 * Populates all LP sheet fields from the current character form.
 * Call after buildLpSheet() and after save-restore to keep the two views in sync.
 */
function syncLpFromForm() {
    const lp = document.getElementById('lp-sheet');
    if (!lp) return;

    // Helper: set proxy value without firing events (avoids write-back loop)
    const syncProxy = (dataId, val) => {
        const el = lp.querySelector(`.lp-proxy[data-src="${dataId}"]`);
        if (el && el !== document.activeElement) {
            if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') el.value = val;
        }
    };

    // ── Bio fields ─────────────────────────────────────────────────
    ['cs-name', 'cs-bio-employer', 'cs-bio-nationality', 'cs-bio-sex', 'cs-bio-age',
        'cs-bio-education', 'cs-physical-desc', 'cs-motivations'].forEach(id => {
            const src = document.getElementById(id);
            if (src) syncProxy(id, src.value || '');
        });

    // ── Profession display (read-only span) ────────────────────────
    const profKey = document.getElementById('cs-profession-select')?.value || '';
    const profTitle = (profKey && professions?.[profKey]) ? professions[profKey].title : profKey || '';
    const profSpan = document.getElementById('lp-profession-display');
    if (profSpan) profSpan.textContent = profTitle;

    // ── Stats: read using textContent (works even when section hidden) ─
    CONFIG.STATS.forEach(st => {
        const rawEl = document.getElementById(`${st}-value`);
        const x5El = document.getElementById(`${st}-x5-value`);
        const raw = parseInt(rawEl?.textContent) || 0;
        const x5 = parseInt(x5El?.textContent) || raw * 5;
        const inpRaw = document.getElementById(`lp-stat-${st}`);
        const spanX5 = document.getElementById(`lp-stat-${st}-x5`);
        const featInp = document.getElementById(`lp-feat-${st}`);
        if (inpRaw && inpRaw !== document.activeElement) inpRaw.value = raw || '—';
        if (spanX5) spanX5.textContent = x5 || '—';
        // Only seed the feature descriptor if the field is still empty (user may override)
        if (featInp && !featInp.value && raw) featInp.value = getDescriptor(st, raw) || '';
    });

    // ── Derived attrs and LP sheet max cells ───────────────────────
    lpSyncBar(); // this fills lp-inp-* values and lp-max-* spans

    // ── Skills grid: values, specialty labels, custom skills ────────
    _buildLpSkillsGrid();

    // ── SAN adaptation checkboxes ──────────────────────────────────
    [['lp-vi1', 'cs-violence-incident1'], ['lp-vi2', 'cs-violence-incident2'],
    ['lp-vi3', 'cs-violence-incident3'], ['lp-hi1', 'cs-helplessness-incident1'],
    ['lp-hi2', 'cs-helplessness-incident2'], ['lp-hi3', 'cs-helplessness-incident3']
    ].forEach(([lpId, srcId]) => {
        const lpCb = document.getElementById(lpId);
        const srcCb = document.getElementById(srcId);
        if (lpCb && srcCb) lpCb.checked = srcCb.checked;
    });
    requestAnimationFrame(lpAlignSections);
}

/**
 * Renders the bonds table in the LP sheet from window.bondsOnSheet.
 * Shows name, score, and a −1 DMG button per entry. The Handler does the rest.
 */
function renderLpBonds() {
    const tbody = document.getElementById('lp-bonds-tbody');
    if (!tbody) return;

    const bonds = (window.bondsOnSheet || []).filter(b => b && b.name);
    let html = '';
    if (bonds.length === 0) {
        html = `<tr><td class="lp-tc" colspan="3" style="font-size:7pt;opacity:0.5;text-align:center;padding:3px;border-left:none;border-right:none;">(no bonds on sheet)</td></tr>`;
    } else {
        bonds.forEach((b, i) => {
            const nameVal = escapeHtml(b.name + (b.relationship ? ' — ' + b.relationship : ''));
            const scoreVal = parseInt(b.score) || 0;
            const bondId = escapeHtml(b.id);
            const descVal = escapeHtml((b.description || '').replace(/<[^>]+>/g, '').trim());
            html += `<tr class="lp-bond-row" data-desc="${descVal}">
                <td class="lp-tc" style="border-left:none;padding:1px 3px;">
                    <input type="text" class="lp-bond-name-input" name="lp-bond-name" autocomplete="off" value="${nameVal}" data-bond-idx="${i}">
                </td>
                <td class="lp-tc" style="width:38px;padding:1px 2px;">
                    <input type="text" inputmode="numeric" pattern="[0-9]*" class="lp-bond-score-input" name="lp-bond-score" autocomplete="off" value="${scoreVal}" data-bond-idx="${i}">
                </td>
                <td class="lp-tc" style="width:52px;border-right:none;text-align:center;padding:1px 2px;">
                    <button type="button" class="lp-bond-dmg-btn" data-bond-id="${bondId}" title="Bond damaged — reduce score by 1">−1 DMG</button>
                </td>
            </tr>`;
        });
    }
    tbody.innerHTML = html;

    // Wire bond name changes
    tbody.querySelectorAll('.lp-bond-name-input').forEach(inp => {
        inp.addEventListener('change', () => {
            const idx = parseInt(inp.dataset.bondIdx);
            const b = (window.bondsOnSheet || []).filter(b => b && b.name)[idx];
            if (!b) return;
            const parts = inp.value.split(' — ');
            b.name = parts[0]?.trim() || b.name;
            if (parts[1] !== undefined) b.relationship = parts[1]?.trim() || '';
            _saveBonds();
        });
    });

    // Wire bond score changes
    tbody.querySelectorAll('.lp-bond-score-input').forEach(inp => {
        inp.addEventListener('input', () => {
            const idx = parseInt(inp.dataset.bondIdx);
            const bonds = (window.bondsOnSheet || []).filter(b => b && b.name);
            const b = bonds[idx];
            if (!b) return;
            b.score = Math.max(0, parseInt(inp.value) || 0);
            inp.value = b.score;
            _saveBonds();
        });
    });

    // Wire −1 DMG buttons
    tbody.querySelectorAll('.lp-bond-dmg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const bondId = btn.dataset.bondId;
            const b = (window.bondsOnSheet || []).find(x => x.id === bondId);
            if (!b) return;
            b.score = Math.max(0, (parseInt(b.score) || 0) - 1);
            _saveBonds();
            renderLpBonds();
            requestAnimationFrame(lpAlignSections);
            renderBondsOnSheet?.(); // keep main sheet in sync
        });
    });
}

/**
 * Wires all .lp-proxy inputs so edits in the LP sheet flow back to the underlying
 * form inputs (and from there to auto-save and all other views).
 * Also wires the SAN adaptation checkboxes.
 */
function _wireLpProxies() {
    const lp = document.getElementById('lp-sheet');
    if (!lp) return;

    // Skill % edits in LP grid → write back to the source form input so all
    // other themes stay in sync. Delegated on the grid so it survives rebuilds.
    const skillGrid = lp.querySelector('.lp-skills-grid');
    if (skillGrid) {
        // Write the value to the form input on every keystroke so it is always
        // current — no matter when the user switches themes (even if blur hasn't fired).
        skillGrid.addEventListener('input', e => {
            const inp = e.target;
            if (!inp.classList.contains('lp-skill-val')) return;
            // Live-toggle checkbox disabled state as value is typed
            const cb = inp.closest('tr')?.querySelector('.lp-skill-cb');
            if (cb) {
                const raw = parseInt(inp.value.replace('%', ''));
                const isZero = isNaN(raw) || raw < 1;
                cb.disabled = isZero;
                cb.classList.toggle('lp-skill-cb-zero', isZero);
                if (isZero) cb.checked = false;
            }
            const srcId = inp.dataset.skillSrc;
            if (!srcId) return;
            const srcEl = document.getElementById(srcId);
            if (!srcEl) return;
            const raw = parseInt(inp.value.replace('%', ''));
            if (!isNaN(raw)) srcEl.value = raw;
        });

        // On blur (change), normalise display and fire the full input chain so
        // auto-save, stat recalcs and other themes all update correctly.
        skillGrid.addEventListener('change', e => {
            const inp = e.target;
            if (!inp.classList.contains('lp-skill-val')) return;
            const srcId = inp.dataset.skillSrc;
            if (!srcId) return;
            const srcEl = document.getElementById(srcId);
            if (!srcEl) return;
            const raw = parseInt(inp.value.replace('%', '')) || 0;
            inp.value = raw + '%';
            srcEl.value = raw;
            srcEl.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    // Text/number/textarea proxies → write to data-src input → fire input event → auto-save
    lp.querySelectorAll('.lp-proxy[data-src]').forEach(proxy => {
        const evtType = proxy.tagName === 'TEXTAREA' ? 'input' : 'input';
        proxy.addEventListener(evtType, () => {
            const srcEl = document.getElementById(proxy.dataset.src);
            if (!srcEl || srcEl === proxy) return;
            const numericSrcs = ['cs-hp', 'cs-wp', 'cs-sanity-value', 'cs-breaking-point'];
            const isNumeric = proxy.type === 'number' || numericSrcs.includes(proxy.dataset.src);
            const val = isNumeric ? (parseInt(proxy.value) || 0) : proxy.value;
            srcEl.value = val;
            srcEl.dispatchEvent(new Event('input', { bubbles: true }));
            if (numericSrcs.includes(proxy.dataset.src)) {
                lpSyncBar();
            }
        });
    });

    // SAN incident checkboxes in LP sheet → sync to underlying hidden checkboxes
    lp.querySelectorAll('[data-san-src]').forEach(cb => {
        cb.addEventListener('change', () => {
            const srcEl = document.getElementById(cb.dataset.sanSrc);
            if (!srcEl) return;
            srcEl.checked = cb.checked;
            srcEl.dispatchEvent(new Event('change', { bubbles: true }));
            if (typeof updateSanityAdaptations === 'function') updateSanityAdaptations();
        });
    });
}

/**
 * Seeds the gear textarea and weapons table in the LP sheet from the equipment
 * picker loadout. Only overwrites the gear textarea if it's still empty;
 * weapon rows that came from the loadout are marked so they can be replaced
 * without disturbing anything the player added by hand.
 */
function _populateLpGear() {
    const gearTa = document.getElementById('lp-gear-content');
    const weapTbody = document.getElementById('lp-weapons-tbody');
    if (!weapTbody) return;

    if (typeof window.dgEquipment?.getLoadout !== 'function') return;

    const loadout = window.dgEquipment.getLoadout();
    const weapons = [], gearLines = [];

    loadout.forEach(item => {
        if (!item) return;
        const s = item.system || {};
        if (item.type === 'weapon') {
            const skillInput = document.getElementById(`cs-skill-${s.skill}`);
            const skillPctNum = skillInput ? (parseInt(skillInput.value) || 0) : 0;
            weapons.push({
                name: item.name || '',
                skillPct: skillPctNum ? String(skillPctNum) : '',
                range: s.range || '',
                damage: s.damage || '',
                lethality: s.lethality ? String(s.lethality) : '',
                ammo: s.ammo !== undefined ? String(s.ammo) : ''
            });
        } else {
            const rawDesc = (s.description || '').replace(/<[^>]+>/g, '').trim();
            gearLines.push(item.name + (rawDesc ? ': ' + rawDesc : ''));
        }
    });

    // Only seed gear textarea if still empty (preserve user edits)
    if (gearTa && !gearTa.value.trim() && gearLines.length) {
        gearTa.value = gearLines.join('\n');
        lpAutoExpand(gearTa);
    }

    // Remove rows previously seeded from equipment loadout, keeping user-added rows
    weapTbody.querySelectorAll('tr.lp-weapon-equip').forEach(r => r.remove());

    if (weapons.length) {
        weapons.forEach(w => addLpWeapon(w, true));
    } else if (!weapTbody.querySelector('tr')) {
        weapTbody.innerHTML = `<tr><td colspan="7" class="lp-tc" style="font-size:7.5pt;text-align:center;opacity:0.6;border-left:none;border-right:none;">(none — use ADD WEAPON to add)</td></tr>`;
    }
}

/**
 * Appends an editable row to the LP weapons table.
 * Equipment picker items are marked with a CSS class so they can be replaced
 * cleanly on subsequent gear syncs without touching user-added rows.
 * @param {Object}  w         - Weapon data object (all fields optional)
 * @param {boolean} fromEquip - true if seeded from the equipment picker loadout
 */
function addLpWeapon(w = {}, fromEquip = false) {
    const tbody = document.getElementById('lp-weapons-tbody');
    if (!tbody) return;
    // Remove the placeholder row if present
    const ph = tbody.querySelector('td[colspan]');
    if (ph) ph.closest('tr').remove();

    const H = escapeHtml;
    const tr = document.createElement('tr');
    if (fromEquip) tr.classList.add('lp-weapon-equip');
    tr.innerHTML = `
        <td class="lp-tc" style="border-left:none;padding:1px 2px;">
            <input type="text" class="lp-weapon-name-inp" name="lp-weapon-name" autocomplete="off" value="${H(w.name || '')}" placeholder="Weapon name">
        </td>
        <td class="lp-tc" style="padding:1px 2px;text-align:center;">
            <div style="position:relative;display:inline-block;width:calc(100% - 4px);">
                <input type="text" inputmode="numeric" class="lp-weapon-skill-inp" name="lp-weapon-skill" autocomplete="off" value="${H(w.skillPct || '')}" placeholder="—" title="Click to roll, type to edit" style="width:100%;box-sizing:border-box;padding-right:12px;text-align:center;">
                <span style="position:absolute;right:3px;top:50%;transform:translateY(-50%);font-size:8pt;opacity:0.8;pointer-events:none;">%</span>
            </div>
        </td>
        <td class="lp-tc" style="padding:1px 2px;text-align:center;">
            <input type="text" class="lp-weapon-range-inp" name="lp-weapon-range" autocomplete="off" value="${H(w.range || '')}" placeholder="—">
        </td>
        <td class="lp-tc" style="padding:1px 2px;text-align:center;">
            <input type="text" class="lp-weapon-dmg-inp" name="lp-weapon-damage" autocomplete="off" value="${H(w.damage || '')}" placeholder="—">
        </td>
        <td class="lp-tc" style="padding:1px 2px;text-align:center;">
            <div style="position:relative;display:inline-block;width:calc(100% - 4px);">
                <input type="text" inputmode="numeric" class="lp-weapon-leth-inp" name="lp-weapon-lethality" autocomplete="off" value="${H(w.lethality || '')}" placeholder="—" style="width:100%;box-sizing:border-box;padding-right:${w.lethality ? '12' : '4'}px;text-align:center;">
                <span class="lp-leth-pct" style="position:absolute;right:3px;top:50%;transform:translateY(-50%);font-size:8pt;opacity:0.8;pointer-events:none;${w.lethality ? '' : 'display:none;'}">%</span>
            </div>
        </td>
        <td class="lp-tc" style="padding:1px 2px;text-align:center;">
            <input type="text" inputmode="numeric" class="lp-weapon-ammo-inp" name="lp-weapon-ammo" autocomplete="off" value="${H(w.ammo || '')}" placeholder="—">
        </td>
        <td class="lp-tc" style="padding:1px;text-align:center;border-right:none;">
            <button type="button" class="lp-weapon-del-btn" title="Remove">×</button>
        </td>`;
    tbody.appendChild(tr);
    tr.querySelector('.lp-weapon-leth-inp').addEventListener('input', function () {
        const pct = tr.querySelector('.lp-leth-pct');
        if (this.value.trim()) {
            pct.style.display = '';
            this.style.paddingRight = '12px';
        } else {
            pct.style.display = 'none';
            this.style.paddingRight = '4px';
        }
    });
    tr.querySelector('.lp-weapon-del-btn').addEventListener('click', () => {
        tr.remove();
        if (!tbody.querySelector('tr')) {
            tbody.innerHTML = `<tr><td colspan="7" class="lp-tc" style="font-size:7.5pt;text-align:center;opacity:0.6;border-left:none;border-right:none;">(none — use ADD WEAPON to add)</td></tr>`;
        }
    });
}

/**
 * Aligns the PHYSICAL DESCRIPTION and INCIDENTS OF SAN LOSS section headers
 * vertically by expanding the MOTIVATIONS textarea to fill any height gap between them.
 * Called after every LP sheet rebuild and after the bond table changes.
 */
function lpAlignSections() {
    const sheet = document.getElementById('lp-sheet');
    if (!sheet || sheet.style.display === 'none') return;

    const motTa = sheet.querySelector('[data-src="cs-motivations"]');
    if (!motTa) return;

    // Reset height so we can measure naturally
    motTa.style.minHeight = '28px';
    motTa.style.height = 'auto';

    const physHd = Array.from(sheet.querySelectorAll('.lp-sec-hd'))
        .find(el => el.textContent.trim() === 'PHYSICAL DESCRIPTION');
    const incHd = Array.from(sheet.querySelectorAll('.lp-sec-hd'))
        .find(el => el.textContent.includes('INCIDENTS OF SAN LOSS'));
    if (!physHd || !incHd) return;

    const physTop = physHd.getBoundingClientRect().top;
    const incTop = incHd.getBoundingClientRect().top;
    const gap = physTop - incTop;

    if (gap > 1) {
        const taHeight = motTa.getBoundingClientRect().height;
        motTa.style.minHeight = Math.ceil(taHeight + gap) + 'px';
    }
}

/**
 * Clears all session skill-use checkboxes in the LP sheet.
 * Call at the end of each session — or whenever the agent needs to forget everything.
 */
function lpClearSkillChecks() {
    document.querySelectorAll('#lp-sheet .lp-skill-cb').forEach(cb => { cb.checked = false; });
}

/* ── Character Advancement ────────────────────────────────────────────────── */

// Stores the pending advancement results between roll and confirm
let _lpAdvancementPending = null;

/**
 * Rolls 1d100 for each checked (failed) skill.
 * If the roll exceeds the current skill%, improve by 1d4 (capped at 99%).
 * Shows a confirmation modal before applying any changes.
 */
function lpRollAdvancement() {
    const rows = [];
    document.querySelectorAll('#lp-sheet .lp-skill-table tbody tr').forEach(tr => {
        const cb = tr.querySelector('.lp-skill-cb');
        if (!cb?.checked) return;
        const valInp = tr.querySelector('.lp-skill-val');
        const nameInp = tr.querySelector('.lp-skill-name-inp');
        const nameTd = tr.querySelector('.lp-sk-name-td');
        const name = nameInp
            ? (nameInp.value.trim() || '(custom)')
            : (nameTd?.textContent?.trim() || 'Unknown');
        const current = parseInt(valInp?.value) || 0;
        const roll = Math.floor(Math.random() * 100) + 1;
        const improved = roll > current;
        const improve = improved ? (Math.floor(Math.random() * 4) + 1) : 0;
        rows.push({
            name,
            current,
            roll,
            improved,
            improve,
            newVal: improved ? Math.min(99, current + improve) : current,
            valInp,
            skillSrc: valInp?.dataset?.skillSrc || null,
        });
    });

    if (!rows.length) {
        alert('No skills are checked. Mark skills you attempted and failed during the session before rolling improvements.');
        return;
    }

    _lpAdvancementPending = rows;
    lpShowAdvancementResults(rows);
}

function lpShowAdvancementResults(rows) {
    let modal = document.getElementById('lp-adv-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'lp-adv-modal';
        modal.innerHTML = `
            <div class="lp-adv-dialog">
                <div class="lp-adv-title">END-OF-SESSION ADVANCEMENT</div>
                <p class="lp-adv-rule">Roll &gt; current % = improve by 1d4 (max 99%)</p>
                <table class="lp-adv-table">
                    <thead><tr>
                        <th>SKILL</th>
                        <th>CURRENT&nbsp;%</th>
                        <th>ROLL</th>
                        <th>RESULT</th>
                    </tr></thead>
                    <tbody id="lp-adv-tbody"></tbody>
                </table>
                <div id="lp-adv-summary" class="lp-adv-summary"></div>
                <div class="lp-adv-footer">
                    <button type="button" class="lp-btn-sm lp-btn-advance" onclick="lpApplyAdvancement()">APPLY &amp; CLEAR MARKS</button>
                    <button type="button" class="lp-btn-sm" onclick="lpDismissAdvancement()">DISMISS</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) lpDismissAdvancement(); });
    }

    const tbody = document.getElementById('lp-adv-tbody');
    tbody.innerHTML = rows.map(r => `
        <tr class="${r.improved ? 'lp-adv-improved' : 'lp-adv-unchanged'}">
            <td>${r.name}</td>
            <td>${r.current}%</td>
            <td>${r.roll}</td>
            <td>${r.improved ? `+${r.improve} &rarr; <strong>${r.newVal}%</strong>` : 'No change'}</td>
        </tr>`).join('');

    const improved = rows.filter(r => r.improved).length;
    document.getElementById('lp-adv-summary').textContent =
        `${improved} of ${rows.length} skill${rows.length !== 1 ? 's' : ''} improved`;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function lpApplyAdvancement() {
    if (!_lpAdvancementPending) return;
    _lpAdvancementPending.forEach(r => {
        if (!r.improved) return;
        if (r.valInp) r.valInp.value = r.newVal + '%';
        if (r.skillSrc) {
            const src = document.getElementById(r.skillSrc);
            if (src) src.value = r.newVal;
        }
    });
    lpClearSkillChecks();
    lpDismissAdvancement();
}

function lpDismissAdvancement() {
    const modal = document.getElementById('lp-adv-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
    _lpAdvancementPending = null;
}

/**
 * Appends a blank, fully-editable skill row to the LP skills grid (right-most column).
 * Use this to track skills the agent picked up since the last print, or ones the
 * Handler invented five minutes ago.
 */
function addLpSkill(noFocus) {
    const grid = document.querySelector('#lp-sheet .lp-skills-grid');
    if (!grid) return;
    // Append to the last table in the grid
    const tables = grid.querySelectorAll('table.lp-skill-table');
    const target = tables[tables.length - 1];
    if (!target) return;
    const tbody = target.querySelector('tbody');
    if (!tbody) return;
    const idx = Date.now();
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="lp-tc" style="width:20px;text-align:center;padding:1px;">
            <input type="checkbox" class="lp-skill-cb" name="lp-skill-cb-extra" autocomplete="off">
        </td>
        <td class="lp-tc" style="font-size:12pt;padding:1px 3px;">
            <input type="text" class="lp-skill-name-inp" name="lp-skill-name-extra" autocomplete="off" placeholder="Skill name" value="" style="width:100%;background:transparent;border:none;font-family:'Permanent Marker',cursive;font-size:11pt;padding:0;box-sizing:border-box;">
        </td>
        <td class="lp-tc" style="width:52px;text-align:center;padding:1px;">
            <input type="text" inputmode="numeric" class="lp-skill-val lp-skill-cust-val" name="lp-skill-val-extra" autocomplete="off" value="" placeholder="%" style="width:100%;box-sizing:border-box;" title="Click to roll">
        </td>`;
    tbody.appendChild(tr);
    if (!noFocus) tr.querySelector('.lp-skill-name-inp').focus();
}

/**
 * Auto-expands a textarea to fit its content, eliminating the scrollbar.
 */
function lpAutoExpand(ta) {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
}

// Wire auto-expand on all lp-ta textareas after the LP sheet is shown
document.addEventListener('input', e => {
    if (e.target.matches('#lp-sheet .lp-ta[overflow-hidden], #lp-sheet textarea[style*="overflow:hidden"]')) {
        lpAutoExpand(e.target);
    }
    if (e.target.matches('#lp-wounds, #lp-gear-content, #lp-remarks, #lp-sheet [data-src="cs-motivations"], #cs-motivations')) {
        lpAutoExpand(e.target);
    }
});

// Enter key commits and removes focus from LP single-line inputs
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const t = e.target;
    // Only fire inside the LP sheet, only on single-line inputs (not textareas)
    if (!t.closest('#lp-sheet')) return;
    if (t.tagName === 'TEXTAREA') return;
    e.preventDefault();
    t.blur();
});

// Auto-append % to skill value fields on blur if the user didn't type one
document.addEventListener('focusout', e => {
    const t = e.target;
    if (!t.matches('#lp-sheet .lp-skill-val')) return;
    const v = t.value.trim();
    if (v === '' || v === '%') return;
    if (!v.endsWith('%')) t.value = v + '%';
});

/* ── Specialty skill ⓘ tooltip — fixed-position, never clipped ─────────── */
window.addEventListener('load', function () {
    // Create the panel if it wasn't in the HTML yet
    let panel = document.getElementById('specialty-tooltip-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'specialty-tooltip-panel';
        panel.setAttribute('role', 'tooltip');
        panel.setAttribute('aria-hidden', 'true');
        document.body.appendChild(panel);
    }

    let _hideTimer = null;

    function showTip(icon) {
        const key = icon.dataset.tooltipKey;
        if (!key || !SKILL_TOOLTIPS[key]) return;
        clearTimeout(_hideTimer);
        panel.textContent = SKILL_TOOLTIPS[key];

        // panel is position:fixed — use raw viewport (client) coordinates only, no scroll offset
        panel.style.display = 'block';
        panel.style.top = '0';
        panel.style.left = '0';

        const rect = icon.getBoundingClientRect();
        const GAP = 8;
        const pw = panel.offsetWidth;
        const ph = panel.offsetHeight;

        let top = rect.bottom + GAP;
        let left = rect.left;

        // Clamp right edge
        const maxLeft = window.innerWidth - pw - 12;
        left = Math.max(8, Math.min(left, maxLeft));

        // Flip above if it would overflow the bottom
        if (top + ph > window.innerHeight - 8) {
            top = rect.top - ph - GAP;
        }

        panel.style.top = top + 'px';
        panel.style.left = left + 'px';
        panel.removeAttribute('aria-hidden');
    }

    function hideTip() {
        _hideTimer = setTimeout(() => {
            panel.style.display = 'none';
            panel.setAttribute('aria-hidden', 'true');
        }, 120);
    }

    document.addEventListener('mouseover', e => {
        const icon = e.target.closest('[data-tooltip-key]');
        if (icon) showTip(icon);
    });
    document.addEventListener('mouseout', e => {
        if (e.target.closest('[data-tooltip-key]')) hideTip();
    });
    document.addEventListener('scroll', () => { panel.style.display = 'none'; }, true);
    window.addEventListener('resize', () => { panel.style.display = 'none'; });
});


/**
 * Picks a random bond from the checked categories and types it out character by character.
 * The result is held in appState.currentBond until the agent decides what to do with it.
 * Bond data is defined in bonds.js as { name, relationship, description } objects.
 * The pyramid animation pauses while typing — some things deserve your full attention.
 */
function generateRandomBond() {
    const bondButton = document.getElementById('bonds-button');
    bondButton.disabled = true;

    const selectedCategories = Array.from(document.querySelectorAll('input[name="bond-category"]:checked')).map(checkbox => checkbox.value);
    const availableBonds = selectedCategories.flatMap(category => bonds[category] || []);

    const bondTextElement = document.getElementById('bondText');
    const bondContentEl = document.getElementById('bond-text-content');
    bondContentEl.innerHTML = ''; // Clear previous text — canvas is a sibling, not a child of this span

    // Colour and border are handled by CSS var(--primary-color) — no inline override needed.

    if (availableBonds.length > 0) {
        const randomBond = availableBonds[Math.floor(Math.random() * availableBonds.length)];
        // Store the original bond in appState for later parsing
        appState.currentBond = randomBond;

        // Build display segments from bond object properties; wrap relationship in parens.
        // Using createTextNode avoids the innerHTML re-parse/re-serialize cost
        // on every character, which was the main source of per-character jank on all themes.
        const relDisplay = randomBond.relationship ? `(${randomBond.relationship})` : '';
        const segments = [randomBond.name, relDisplay, randomBond.description].filter(Boolean);

        // Build a flat list of {type, text} tokens: 'text' chars interleaved with 'br' breaks
        const tokens = [];
        segments.forEach((seg, idx) => {
            for (const ch of seg) tokens.push({ type: 'char', ch });
            if (idx < segments.length - 1) tokens.push({ type: 'br' });
        });

        let i = 0;
        window._pyramidPaused = true;
        bondTextElement.classList.add('typing-active');
        document.body.classList.add('bond-typing'); // freeze all X-Files page animations during typing
        function typeChar() {
            if (i >= tokens.length) {
                bondTextElement.classList.remove('typing-active');
                document.body.classList.remove('bond-typing');
                window._pyramidPaused = false;
                const pyramidCanvas = document.getElementById('bond-pyramid-canvas');
                if (pyramidCanvas?._resume) pyramidCanvas._resume();
                bondButton.disabled = false;
                return;
            }
            const tok = tokens[i++];
            if (tok.type === 'br') {
                bondContentEl.appendChild(document.createElement('br'));
            } else {
                bondContentEl.appendChild(document.createTextNode(tok.ch));
            }
            setTimeout(typeChar, CONFIG.TYPING_SPEED_MS);
        }
        typeChar(); // Start typing effect
    } else {
        bondContentEl.innerHTML = 'No bond available.';
        bondButton.disabled = false;
        appState.currentBond = null;
    }
}

// Track bonds added to sheet as array of objects
if (!window.bondsOnSheet) {
    window.bondsOnSheet = [];
}

const BONDS_STORAGE_KEY = 'dg-bonds-sheet';

function _saveBonds() {
    try { localStorage.setItem(BONDS_STORAGE_KEY, JSON.stringify(window.bondsOnSheet)); } catch (e) { }
}

function _loadBonds() {
    try {
        const saved = JSON.parse(localStorage.getItem(BONDS_STORAGE_KEY) || '[]');
        if (Array.isArray(saved) && saved.length > 0) window.bondsOnSheet = saved;
    } catch (e) { }
}

// Load persisted bonds as soon as the DOM is ready (mirrors equipment picker pattern)
document.addEventListener('DOMContentLoaded', function () {
    _loadBonds();
    if (window.bondsOnSheet.length > 0) renderBondsOnSheet();
});

/**
 * Returns the max bonds allowed by the selected profession when the wizard
 * is active, or null when the wizard is inactive (no restriction applies).
 */
function _wizardBondLimit() {
    if (window.dgWizard?._currentStep() === null || window.dgWizard?._currentStep() === undefined) return null;
    const profSelect = document.getElementById('cs-profession-select');
    const key = profSelect ? profSelect.value : '';
    if (!key || !professions[key]) return null;
    const m = professions[key].description.match(/BONDS:\s*(\d+)/);
    return m ? parseInt(m[1]) : null;
}

/**
 * Disables/enables the bond add buttons when the wizard is open and the
 * profession bond limit has been reached. No effect outside the wizard.
 */
function _updateWizardBondButtons() {
    const limit = _wizardBondLimit();
    const atLimit = limit !== null && window.bondsOnSheet.length >= limit;
    [document.getElementById('add-bond-button'), document.getElementById('new-empty-bond-button')].forEach(btn => {
        if (!btn) return;
        if (!btn.dataset.origTitle) btn.dataset.origTitle = btn.title;
        btn.disabled = atLimit;
        btn.title = atLimit ? `Bond limit reached (${limit} for this profession)` : btn.dataset.origTitle;
    });
}

/**
 * Adds a blank bond to the sheet for manual entry.
 * Default score is set to the agent's current CHA value — the Program's
 * rough measure of how much someone can still stand to lose.
 */
function addEmptyBond() {
    const _limit = _wizardBondLimit();
    if (_limit !== null && window.bondsOnSheet.length >= _limit) {
        window.dgSaveLoad?.showToast?.(`Bond limit reached — ${_limit} bonds allowed for this profession.`);
        return;
    }
    const bondId = 'bond-' + Date.now() + Math.random().toString(36).substring(2, 11);
    const chaEl = document.getElementById('CHA-value');
    const defaultScore = chaEl ? (parseInt(chaEl.innerText) || 10) : 10;
    window.bondsOnSheet.push({
        id: bondId,
        name: '',
        relationship: '',
        description: '',
        score: defaultScore
    });
    _saveBonds();
    renderBondsOnSheet();
    if (typeof window.dgSaveLoad?.save === 'function') window.dgSaveLoad.save();
    // Focus the name field of the new entry so user can start typing immediately
    const entries = document.querySelectorAll('#cs-bonds .bond-entry');
    const newEntry = entries[entries.length - 1];
    if (newEntry) {
        const nameInput = newEntry.querySelector('input[data-field="name"]');
        if (nameInput) { nameInput.focus(); newEntry.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    }
}

/**
 * Commits the currently generated bond to the character sheet.
 * Reads name, relationship, and description from appState.currentBond, assigns a unique
 * ID, and renders the entry. Son of Sam theme gets a runic reveal animation because
 * some bonds deserve to carve themselves into existence.
 */
function addBondToSheet() {
    if (!appState.currentBond) {
        alert('Generate a bond first!');
        return;
    }
    const _limit = _wizardBondLimit();
    if (_limit !== null && window.bondsOnSheet.length >= _limit) {
        window.dgSaveLoad?.showToast?.(`Bond limit reached — ${_limit} bonds allowed for this profession.`);
        return;
    }

    try {
        const bondName = appState.currentBond.name;
        const bondRelationship = appState.currentBond.relationship;
        const bondDescription = appState.currentBond.description;

        // Validate bond data
        if (!bondName) {
            throw new Error('Bond name is empty');
        }

        // Create a unique ID for this bond entry
        const bondId = 'bond-' + Date.now() + Math.random().toString(36).substring(2, 11);

        // Get CHA stat value for default bond score
        const csCharInput = document.getElementById('cs-CHA');
        let chaValue = 10; // default fallback
        if (csCharInput) {
            const parsed = parseInt(csCharInput.value);
            if (!isNaN(parsed)) chaValue = parsed;
        } else {
            const mainCharEl = document.getElementById('CHA-value');
            if (mainCharEl) {
                const parsed = parseInt(mainCharEl.innerText);
                if (!isNaN(parsed)) chaValue = parsed;
            }
        }

        // Create bond object with parsed values
        const chaEl = document.getElementById('CHA-value');
        const defaultScore = chaEl ? (parseInt(chaEl.innerText) || 10) : 10;
        const bondObj = {
            id: bondId,
            name: bondName,
            relationship: bondRelationship,
            description: bondDescription,
            score: defaultScore
        };

        window.bondsOnSheet.push(bondObj);
        _saveBonds();
        renderBondsOnSheet();
        // Immediately flush to dg-agent-v1 so save-load.js restores bonds on refresh
        // (the auto-save debounce is 1.5 s — too slow if user refreshes right away)
        if (typeof window.dgSaveLoad?.save === 'function') window.dgSaveLoad.save();

        // Son of Sam: bond entry carves itself into existence
        if (document.body.classList.contains('theme-son-of-sam')) {
            const entries = document.querySelectorAll('#cs-bonds .bond-entry');
            const newEntry = entries[entries.length - 1];
            if (newEntry) {
                newEntry.classList.add('sos-carving');
                newEntry.addEventListener('animationend', () => newEntry.classList.remove('sos-carving'), { once: true });
                // Scramble the description text before it resolves
                const descTA = newEntry.querySelector('textarea.bond-entry-field');
                if (descTA && descTA.value) {
                    const finalText = descTA.value;
                    const runic = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ⸸⛧☽';
                    let step = 0;
                    const steps = 18;
                    const timer = setInterval(() => {
                        step++;
                        if (step >= steps) { descTA.value = finalText; clearInterval(timer); return; }
                        const revealed = Math.floor((step / steps) * finalText.length);
                        descTA.value = Array.from(finalText).map((c, i) => {
                            if (i < revealed || c === ' ' || c === '\n') return c;
                            return runic[Math.floor(Math.random() * runic.length)];
                        }).join('');
                    }, Math.round(3500 / steps));
                }
            }
        }
    } catch (error) {
        console.error('Error adding bond to sheet:', error);
        alert(`Failed to add bond: ${error.message}`);
    }
}

/**
 * Permanently removes a bond from the character sheet by ID.
 * @param {string} bondId - Unique identifier for the bond to remove
 */
function removeBondFromSheet(bondId) {
    window.bondsOnSheet = window.bondsOnSheet.filter(b => b.id !== bondId);
    _saveBonds();
    renderBondsOnSheet();
    if (typeof window.dgSaveLoad?.save === 'function') window.dgSaveLoad.save();
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
        _saveBonds();
    }
}

/**
 * Updates a bond's description field
 * @param {string} bondId - Bond's unique identifier
 * @param {string} newDescription - New description text
 */
function updateBondDescription(bondId, newDescription) {
    const bond = window.bondsOnSheet.find(b => b.id === bondId);
    if (bond) {
        bond.description = newDescription;
        _saveBonds();
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
        _saveBonds();
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
        _saveBonds();
    }
}

/**
 * Renders all current bonds as editable entries on the character sheet.
 * Each bond gets fields for name, description, relationship, and score.
 * Also keeps the LP sheet bond table in sync if it has been built.
 */
function renderBondsOnSheet() {
    _saveBonds();
    const bondsContainer = document.getElementById('cs-bonds');

    if (window.bondsOnSheet.length === 0) {
        bondsContainer.innerHTML = '<p style="opacity:0.8;margin:0;text-align:center;width:100%;">(No bonds yet — add bonds using the BONDS button to the left.)</p>';
        return;
    }

    let html = '';
    window.bondsOnSheet.forEach(bond => {
        const safeId = escapeHtml(bond.id);
        const safeName = escapeHtml(bond.name);
        const safeRelationship = escapeHtml(bond.relationship);
        const safeDescription = escapeHtml(bond.description);
        const safeScore = escapeHtml(bond.score);
        html += `
            <div class="bond-entry" data-bond-id="${safeId}">
                <div style="display:flex;gap:8px;margin-bottom:6px;">
                    <input type="text" class="bond-entry-field" name="bond-name-${safeId}" autocomplete="off" placeholder="${sosPlaceholder('Bond Name')}" value="${safeName}" data-field="name" style="flex:1;min-width:0;">
                    <button type="button" class="bond-remove-button" title="Permanently remove this bond from your character sheet.">Remove</button>
                </div>
                <div style="margin-bottom:6px;">
                    <textarea class="bond-entry-field" name="bond-desc-${safeId}" autocomplete="off" placeholder="${sosPlaceholder('Bond Description/Text')}" data-field="description" style="min-height:80px;height:auto;overflow:hidden;resize:none;">${safeDescription}</textarea>
                </div>
                <div style="display:flex;gap:8px;">
                    <div style="flex:1;">
                        <label for="bond-rel-${safeId}" style="font-size:0.85em;opacity:0.8;">Relationship:</label>
                        <input type="text" id="bond-rel-${safeId}" class="bond-entry-field" name="bond-rel-${safeId}" autocomplete="off" placeholder="${sosPlaceholder('Edit relationship...')}" value="${safeRelationship}" data-field="relationship">
                    </div>
                    <div style="flex:0 0 100px;">
                        <label for="bond-score-${safeId}" style="font-size:0.85em;opacity:0.8;">Score:</label>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <input type="number" id="bond-score-${safeId}" class="bond-entry-field" name="bond-score-${safeId}" autocomplete="off" value="${safeScore}" min="0" max="20" data-field="score">
                            <button type="button" class="lp-bond-damage-btn lp-only" onclick="lpDamageBond(this)" title="Bond damaged — reduce score by 1">−1 DMG</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    bondsContainer.innerHTML = html;
    // Auto-size description textareas to their content
    bondsContainer.querySelectorAll('textarea.bond-entry-field').forEach(ta => {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
    });
    // Keep LP sheet bond table in sync
    if (document.getElementById('lp-bonds-tbody') && typeof renderLpBonds === 'function') {
        renderLpBonds();
    }
    // Update add-bond button state when the wizard is open
    _updateWizardBondButtons();
}

/**
 * Reads the Violence and Helplessness incident checkboxes and caches their
 * state as data attributes on the character sheet element for Foundry JSON export.
 * Three checked incidents of the same type = the agent has adapted. Progress, of a sort.
 */
function updateSanityAdaptations() {
    // Get all checkbox states
    const violenceIncident1 = document.getElementById('cs-violence-incident1')?.checked || false;
    const violenceIncident2 = document.getElementById('cs-violence-incident2')?.checked || false;
    const violenceIncident3 = document.getElementById('cs-violence-incident3')?.checked || false;
    const helplessnessIncident1 = document.getElementById('cs-helplessness-incident1')?.checked || false;
    const helplessnessIncident2 = document.getElementById('cs-helplessness-incident2')?.checked || false;
    const helplessnessIncident3 = document.getElementById('cs-helplessness-incident3')?.checked || false;

    // Store in a data attribute for later retrieval during JSON export
    document.getElementById('character-sheet').dataset.violenceAdaptations = JSON.stringify({
        incident1: violenceIncident1,
        incident2: violenceIncident2,
        incident3: violenceIncident3
    });

    document.getElementById('character-sheet').dataset.helplessnessAdaptations = JSON.stringify({
        incident1: helplessnessIncident1,
        incident2: helplessnessIncident2,
        incident3: helplessnessIncident3
    });
}
