// ============================================================================
// DELTA GREEN STATS - BIOGRAPHY DATA
// ============================================================================
// Contains randomization data for the RANDOM BIO generator
// ============================================================================

const bioData = {
    "firstNames": {
        "male": [
            "James", "Michael", "David", "Robert", "William", "Richard", "Joseph", "Thomas",
            "Charles", "Christopher", "Daniel", "Matthew", "Mark", "Donald", "Steven", "Paul",
            "Andrew", "Joshua", "Kenneth", "Kevin", "Brian", "George", "Edward", "Ronald",
            "Anthony", "Frank", "Ryan", "Gary", "Nicolas", "Eric", "Jonathan", "Stephen",
            "Larry", "Justin", "Scott", "Brandon", "Benjamin", "Samuel", "Raymond", "Patrick"
        ],
        "female": [
            "Sarah", "Jennifer", "Emily", "Jessica", "Amanda", "Melissa", "Lisa", "Michelle",
            "Maria", "Sandra", "Ashley", "Deborah", "Stephanie", "Catherine", "Carolyn", "Rebecca",
            "Sharon", "Nancy", "Karen", "Diane", "Julie", "Joyce", "Evelyn", "Ann",
            "Kathleen", "Alice", "Joan", "Martha", "Gloria", "Sara", "Janice", "Jean",
            "Abigail", "Patricia", "Barbara", "Bethany", "Brenda", "Caroline", "Cheryl", "Christine"
        ],
        "non-binary": [
            "Alex", "Jordan", "Casey", "Riley", "Morgan", "Parker", "Avery", "Quinn",
            "Reese", "Dakota", "Cameron", "Taylor", "Austin", "Blake", "Drew", "Jamie",
            "Skyler", "Rowan", "Shannon", "Sage", "Phoenix", "River", "Storm", "Winter",
            "Kai", "Sam", "Kelly", "Bailey", "Rory", "Shea", "Finley", "Emery"
        ]
    },
    "lastNames": [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Rodriguez",
        "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor",
        "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris",
        "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen",
        "King", "Wright", "Scott", "Torres", "Peterson", "Phillips", "Campbell", "Parker",
        "Evans", "Edwards", "Collins", "Reeves", "Morris", "Murphy", "Cook", "Morgan",
        "Bell", "Rogers", "Gibbs", "Sawyer", "Sutton", "Richmond", "Pearson", "Blake"
    ],
    "nationalities": [
        "American", "American", "American", "American", "American",
        "American", "American", "American", "American", "American",
        "American", "American",
        "British", "British", "British", "British", "British", "British",
        "Canadian", "Canadian", "Canadian", "Canadian",
        "Irish", "Irish",
        "Australian",
        "French", "German", "Italian", "Spanish", "Dutch",
        "Swedish", "Norwegian", "Danish", "Polish",
        "Czech", "Hungarian", "Russian", "Greek", "Turkish",
        "Israeli", "Japanese", "South Korean", "Chinese", "Indian",
        "Brazilian", "Mexican", "Argentine", "Chilean"
    ],

    // -------------------------------------------------------------------------
    // Physical description component pools — assembled at runtime based on stats
    // -------------------------------------------------------------------------
    "hairColors": [
        "black", "dark brown", "brown", "auburn", "chestnut", "dirty blonde",
        "blonde", "sandy", "red", "grey", "silver", "salt-and-pepper",
        "ash brown", "dark auburn", "light brown", "strawberry blonde"
    ],
    "hairStyles": [
        "close-cropped", "cropped short", "worn short", "kept neat and short",
        "unkempt", "curly", "wavy", "straight", "pulled back tight",
        "tied back", "thinning", "shaved close", "grown out past the collar",
        "swept back", "worn long", "buzzed", "cut military-short"
    ],
    "eyeColors": [
        "brown", "dark brown", "hazel", "green", "blue", "grey",
        "pale blue", "deep green", "amber", "steel grey", "dark hazel",
        "ice blue", "warm brown", "olive green"
    ],
    "skinTones": [
        "pale", "fair", "light", "light brown", "olive",
        "sun-tanned", "weathered", "bronze", "brown", "dark brown", "deeply tanned"
    ],
    "buildDescriptors": {
        "high": [
            "heavily built", "powerfully built", "broad-shouldered and solid",
            "thick-set", "stocky and strong", "imposing in frame",
            "the kind of build that comes from years of hard physical work"
        ],
        "athletic": [
            "athletic", "lean and muscular", "fit and rangy",
            "well-conditioned", "physically capable without being ostentatious",
            "carries themselves with easy physical confidence"
        ],
        "average": [
            "average build", "unremarkable build", "medium build",
            "neither large nor slight", "ordinary physique",
            "the kind of build that disappears in a crowd"
        ],
        "low": [
            "lean", "slight", "wiry", "thin but not fragile",
            "spare in frame", "slender", "reed-thin"
        ]
    },
    "heightDescriptors": {
        "tall": [
            "tall", "above average height", "notably tall",
            "standing well above most in a room", "the kind of tall that draws a second look"
        ],
        "average": [
            "average height", "of unremarkable height", "medium height",
            "neither tall nor short", "easy to lose in a crowd height-wise"
        ],
        "short": [
            "compact", "short", "below average height",
            "slight of stature", "not particularly tall"
        ]
    },
    "notableFeatures": {
        "high_str_con": [
            "a weathered, hard-edged face", "a jaw set like granite", "calloused hands and a squared stance",
            "a thick neck and military bearing", "broad shoulders that fill a doorframe",
            "forearms laced with old scars", "a nose that's been broken at least once",
            "the deliberate economy of movement of someone trained for it",
            "old scar tissue along the knuckles", "a flat, watchful expression that rarely changes",
            "the kind of stillness that comes from knowing how to handle a situation",
            "a squared, no-nonsense posture", "boots that have seen real mileage",
            "sun-darkened skin and the easy physicality of someone used to working outdoors",
            "a grip like a vice and eyes that have seen worse"
        ],
        "low_str_con": [
            "wire-rimmed glasses", "ink-stained fingers", "a perpetually tired expression",
            "a bookish air and careful posture", "reading glasses perpetually pushed up",
            "pale skin from long hours indoors", "precise, deliberate movements",
            "a distracted look that suggests their mind is elsewhere most of the time",
            "neat, methodical hands and very organized pockets",
            "a slight hunch from years hunched over a desk", "reading calluses on the fingertips",
            "the kind of measured speech that comes from careful thinking",
            "an almost nervous quality at odds with a sharp, penetrating gaze",
            "a habit of cataloguing the room — not from fear, from habit",
            "the look of someone who has spent more time with documents than people"
        ],
        "neutral": [
            "a steady, unreadable gaze", "a quiet, watchful manner", "unremarkable features that blend into a crowd",
            "a flat affect that gives little away", "quick eyes that miss nothing",
            "a slight scar above one brow", "a tired but alert expression",
            "the practiced blankness of someone used to keeping their own counsel",
            "a habit of going very still when thinking",
            "a low, considered way of speaking — they don't waste words",
            "faint lines around the eyes from squinting into the sun",
            "clean hands but worn clothes — cares about function, not appearance",
            "a detached, professional manner that never quite turns off",
            "the slight constant tension of someone who is never fully off duty",
            "moves through a room like someone quietly running a threat assessment"
        ]
    },

    // -------------------------------------------------------------------------
    // Profession-linked employer + education pools
    // Keys match profession keys in professions.js; "default" is the fallback
    // -------------------------------------------------------------------------
    "professionProfiles": {
        "anthropologist": {
            "employers": ["State University", "Miskatonic University", "National Geographic", "Smithsonian Institution",
                "National Endowment for the Humanities", "University Archaeological Department", "Think Tank"],
            "educations": ["PhD in Anthropology", "Master's in Archaeology", "PhD in History",
                "Master's in Cultural Studies", "Doctorate in Linguistics", "Post-Doctoral Fellowship"]
        },
        "federal_agent": {
            "employers": ["FBI", "DEA", "ATF", "Secret Service", "US Marshal Service",
                "DHS", "Postal Inspection Service", "IRS Criminal Investigation"],
            "educations": ["FBI National Academy", "Federal Law Enforcement Training Center",
                "Bachelor's in Criminal Justice", "Bachelor's in Law", "Master's in Criminology",
                "US Military Academy", "State University (Law Pre-Req)"]
        },
        "physician": {
            "employers": ["Johns Hopkins Hospital", "CDC", "NIH", "Military Medical Corps",
                "State Medical Examiner's Office", "Private Practice", "Emergency Medicine Group",
                "Veteran Affairs Medical Center", "FEMA Medical Reserve Corps"],
            "educations": ["MD — State Medical School", "MD — Ivy League Medical School",
                "MD / PhD (Research)", "Doctor of Osteopathic Medicine", "Medical Residency (Completed)",
                "Military Medical Officer Training"]
        },
        "engineer": {
            "employers": ["DARPA", "Lockheed Martin Skunk Works", "NSA Technical Division",
                "MIT Lincoln Laboratory", "Private Tech Corporation", "DoD Contractor",
                "Silicon Valley Startup", "Raytheon Technologies"],
            "educations": ["BS in Computer Science", "BS in Electrical Engineering",
                "MS in Computer Engineering", "PhD in Applied Mathematics",
                "MS in Cybersecurity", "MIT Graduate Program", "Technical Institute Certification"]
        },
        "scientist": {
            "employers": ["NIH", "CERN Research Partnership", "Oak Ridge National Laboratory",
                "University Research Division", "Private Research Institute", "CDC", "DARPA",
                "Los Alamos National Laboratory", "Naval Research Laboratory"],
            "educations": ["PhD in Biology", "PhD in Physics", "PhD in Chemistry",
                "PhD in Neuroscience", "Master's in Forensic Science",
                "Post-Doctoral Research Position", "National Science Foundation Grant Recipient"]
        },
        "special_operator": {
            "employers": ["US Army Rangers", "Navy SEALs", "USMC Raider Battalion",
                "Delta Force", "CIA Special Activities Center", "FBI Hostage Rescue Team",
                "Joint Special Operations Command"],
            "educations": ["US Military Academy (West Point)", "Ranger School", "BUD/S Training",
                "Special Forces Qualification Course", "Airborne School",
                "Advanced Military Training — Classified", "Non-Commissioned Officer Academy"]
        },
        "criminal": {
            "employers": ["Self-Employed", "Organized Crime Affiliate", "Freelance", "Street Crew",
                "Contract Work (Unspecified)", "Former Employer (Estranged)"],
            "educations": ["High School Diploma", "GED", "Some College (Dropped Out)",
                "Prison Education Program", "Street Education", "Self-Taught"]
        },
        "firefighter": {
            "employers": ["FDNY", "Los Angeles County Fire Department", "US Forest Service Fire Crew",
                "Municipal Fire Department", "Wildland Fire Crew", "Industrial Fire Brigade",
                "FEMA Urban Search & Rescue"],
            "educations": ["Fire Academy Certification", "EMT Certification", "Paramedic Certification",
                "Associate's in Fire Science", "Bachelor's in Emergency Management",
                "Hazmat Operations Certification"]
        },
        "police_officer": {
            "employers": ["NYPD", "LAPD", "Metropolitan Police", "County Sheriff's Office",
                "State Police", "Transit Police", "University Police Department", "Port Authority Police"],
            "educations": ["Police Academy", "Associate's in Criminal Justice",
                "Bachelor's in Criminal Justice", "Detective Training Program",
                "SWAT Qualification Course", "In-Service Training — Homicide Division"]
        },
        "soldier": {
            "employers": ["US Army", "US Marine Corps", "National Guard", "Army Reserve",
                "US Navy", "Air Force Security Forces"],
            "educations": ["Basic Combat Training", "Advanced Individual Training",
                "Non-Commissioned Officer Academy", "US Military Academy",
                "Officer Candidate School", "Infantry School", "Warrant Officer Training"]
        },
        "foreign_service_officer": {
            "employers": ["US Department of State", "USAID", "US Commercial Service",
                "Foreign Agriculture Service", "UN Diplomatic Mission", "Embassy Staff"],
            "educations": ["Foreign Service Institute Training", "Master's in International Relations",
                "Bachelor's in Political Science", "Master's in Foreign Policy",
                "Law Degree (International Focus)", "Ivy League — International Studies"]
        },
        "intelligence_analyst": {
            "employers": ["CIA", "NSA", "DIA", "FBI Analytical Division",
                "Department of State Intelligence Bureau", "NGA", "ODNI"],
            "educations": ["Master's in Intelligence Studies", "Bachelor's in Political Science",
                "Master's in International Security", "Intelligence Community Certification Program",
                "PhD in Area Studies", "NSA Language Training Program"]
        },
        "intelligence_case_officer": {
            "employers": ["CIA Directorate of Operations", "DIA HUMINT", "NSA Field Liaison",
                "State Department (Cover)", "Defense Attaché Office (Cover)", "Private Consulting (Cover)"],
            "educations": ["Farm Training (CIA Clandestine Service)", "Master's in Foreign Affairs",
                "Bachelor's in Regional Studies", "Military Intelligence Officer Course",
                "Foreign Language Intensive Program", "Ivy League Graduate School"]
        },
        "lawyer": {
            "employers": ["US Attorney's Office", "Department of Justice", "Private Law Firm",
                "Corporate Legal Counsel", "Public Defender's Office", "Federal Judiciary Clerk",
                "Securities and Exchange Commission"],
            "educations": ["JD — State Law School", "JD — Ivy League",
                "MBA / JD Dual Degree", "Master's in Tax Law",
                "Prosecutor Training Program", "Bar Exam (Licensed — Multiple States)"]
        },
        "media_specialist": {
            "employers": ["Major News Network", "Independent Publication", "University Press",
                "Government Communications Office", "Documentary Production Company",
                "Investigative Journalism Non-Profit", "Freelance"],
            "educations": ["Bachelor's in Journalism", "Master's in Communications",
                "Bachelor's in English Literature", "Self-Taught / Portfolio Career",
                "Graduate Program in Creative Writing", "School of Public Affairs"]
        },
        "nurse_paramedic": {
            "employers": ["County Hospital", "Veterans Affairs Medical Center", "Flight Medic Service",
                "Combat Medic — Active Duty", "Urban EMS Agency", "Rural Trauma Center"],
            "educations": ["Registered Nurse Certification", "Paramedic Certification",
                "Associate's in Nursing", "Bachelor's in Nursing (BSN)",
                "Emergency Medical Technician Certification", "Combat Medic Training"]
        },
        "pilot": {
            "employers": ["US Air Force", "Naval Air Station", "Commercial Airline (Retired)",
                "Coast Guard Aviation", "CIA Air Branch", "Contract Pilot — Classified",
                "Army Aviation Regiment"],
            "educations": ["US Air Force Academy", "Naval Test Pilot School",
                "Commercial Pilot License", "Military Flight Training",
                "Instrument Rating Certification", "FAA Air Traffic Control Training"]
        },
        "program_manager": {
            "employers": ["Department of Defense (Acquisition)", "Fortune 500 Corporation",
                "Government Contractor", "Intelligence Community Program Office",
                "Non-Governmental Organization", "National Security Agency — Programs"],
            "educations": ["MBA", "Master's in Public Administration",
                "PMP Certification", "Master's in Systems Engineering",
                "Bachelor's in Business Administration", "Senior Executive Service Program"]
        },
        "default": {
            "employers": ["FBI", "CIA", "NSA", "DHS", "Department of State",
                "CDC", "Interpol", "Private Corporation", "University", "Think Tank",
                "Defense Intelligence Agency", "Secret Service", "Non-profit",
                "Medical Research Institute", "Independent Contractor"],
            "educations": ["Bachelor's Degree", "Master's Degree", "Some College",
                "Technical Certification", "State University", "Community College"]
        }
    }
};

