// Delta Green Professions Database with skills data
const professions = {
    "anthropologist": {
        title: "Anthropologist or Historian",
        recommendedStats: "INT",
        bonds: 4,
        requiredSkills: [
            { name: "Anthropology", value: 50 },
            { name: "Bureaucracy", value: 40 },
            { name: "History", value: 60 },
            { name: "Occult", value: 40 },
            { name: "Persuade", value: 40 }
        ],
        optionalSkills: [
            { name: "Anthropology", value: 40, limit: 2 },
            { name: "Archeology", value: 40, limit: 2 },
            { name: "HUMINT", value: 50, limit: 2 },
            { name: "Navigate", value: 50, limit: 2 },
            { name: "Ride", value: 50, limit: 2 },
            { name: "Search", value: 60, limit: 2 },
            { name: "Survival", value: 50, limit: 2 }
        ]
    },
    "computer_scientist": {
        title: "Computer Scientist or Engineer",
        recommendedStats: "INT",
        bonds: 3,
        requiredSkills: [
            { name: "Computer Science", value: 60 },
            { name: "Craft (Electrician)", value: 30 },
            { name: "Craft (Mechanic)", value: 30 },
            { name: "Craft (Microelectronics)", value: 40 },
            { name: "Science (Mathematics)", value: 40 },
            { name: "SIGINT", value: 40 }
        ],
        optionalSkills: [
            { name: "Accounting", value: 50, limit: 4 },
            { name: "Bureaucracy", value: 50, limit: 4 },
            { name: "Craft", value: 40, limit: 4 },
            { name: "Foreign Language", value: 40, limit: 4 },
            { name: "Heavy Machinery", value: 50, limit: 4 },
            { name: "Law", value: 40, limit: 4 },
            { name: "Science", value: 40, limit: 4 }
        ]
    },
    "federal_agent": {
        title: "Federal Agent",
        recommendedStats: "CON, POW, CHA",
        bonds: 3,
        requiredSkills: [
            { name: "Alertness", value: 50 },
            { name: "Bureaucracy", value: 40 },
            { name: "Criminology", value: 50 },
            { name: "Drive", value: 50 },
            { name: "Firearms", value: 50 },
            { name: "Forensics", value: 30 },
            { name: "HUMINT", value: 60 },
            { name: "Law", value: 30 },
            { name: "Persuade", value: 50 },
            { name: "Search", value: 50 },
            { name: "Unarmed Combat", value: 60 }
        ],
        optionalSkills: [
            { name: "Accounting", value: 60, limit: 1 },
            { name: "Computer Science", value: 50, limit: 1 },
            { name: "Foreign Language", value: 50, limit: 1 },
            { name: "Heavy Weapons", value: 50, limit: 1 },
            { name: "Pharmacy", value: 50, limit: 1 }
        ]
    },
    "physician": {
        title: "Physician",
        recommendedStats: "INT, POW, DEX",
        bonds: 3,
        requiredSkills: [
            { name: "Bureaucracy", value: 50 },
            { name: "First Aid", value: 60 },
            { name: "Medicine", value: 60 },
            { name: "Persuade", value: 40 },
            { name: "Pharmacy", value: 50 },
            { name: "Science (Biology)", value: 60 },
            { name: "Search", value: 40 }
        ],
        optionalSkills: [
            { name: "Forensics", value: 50, limit: 2 },
            { name: "Psychotherapy", value: 60, limit: 2 },
            { name: "Science", value: 50, limit: 2 },
            { name: "Surgery", value: 50, limit: 2 }
        ]
    },
    "scientist": {
        title: "Scientist",
        recommendedStats: "INT",
        bonds: 4,
        requiredSkills: [
            { name: "Bureaucracy", value: 40 },
            { name: "Computer Science", value: 40 },
            { name: "Science", value: 60 }
        ],
        optionalSkills: [
            { name: "Accounting", value: 50, limit: 3 },
            { name: "Craft", value: 40, limit: 3 },
            { name: "Foreign Language", value: 40, limit: 3 },
            { name: "Forensics", value: 40, limit: 3 },
            { name: "Law", value: 40, limit: 3 },
            { name: "Pharmacy", value: 40, limit: 3 }
        ]
    },
    "special_operator": {
        title: "Special Operator",
        recommendedStats: "STR, CON, POW",
        bonds: 2,
        requiredSkills: [
            { name: "Alertness", value: 60 },
            { name: "Athletics", value: 60 },
            { name: "Demolitions", value: 40 },
            { name: "Firearms", value: 60 },
            { name: "Heavy Weapons", value: 50 },
            { name: "Melee Weapons", value: 50 },
            { name: "Military Science (Land)", value: 60 },
            { name: "Navigate", value: 50 },
            { name: "Stealth", value: 50 },
            { name: "Survival", value: 50 },
            { name: "Swim", value: 50 },
            { name: "Unarmed Combat", value: 60 }
        ],
        optionalSkills: []
    },
    "criminal": {
        title: "Criminal",
        recommendedStats: "STR, DEX",
        bonds: 4,
        requiredSkills: [
            { name: "Alertness", value: 50 },
            { name: "Athletics", value: 50 },
            { name: "Criminology", value: 60 },
            { name: "Dodge", value: 40 },
            { name: "Drive", value: 50 },
            { name: "Firearms", value: 40 },
            { name: "Law", value: 20 },
            { name: "Melee Weapons", value: 40 },
            { name: "Persuade", value: 50 },
            { name: "Stealth", value: 50 },
            { name: "Unarmed Combat", value: 50 }
        ],
        optionalSkills: [
            { name: "Craft (Locksmithing)", value: 40, limit: 2 },
            { name: "Demolitions", value: 40, limit: 2 },
            { name: "Disguise", value: 50, limit: 2 },
            { name: "Foreign Language", value: 40, limit: 2 },
            { name: "Forensics", value: 40, limit: 2 },
            { name: "HUMINT", value: 50, limit: 2 },
            { name: "Navigate", value: 50, limit: 2 },
            { name: "Occult", value: 50, limit: 2 },
            { name: "Pharmacy", value: 40, limit: 2 }
        ]
    },
    "firefighter": {
        title: "Firefighter",
        recommendedStats: "STR, DEX, CON",
        bonds: 3,
        requiredSkills: [
            { name: "Alertness", value: 50 },
            { name: "Athletics", value: 60 },
            { name: "Craft (Electrician)", value: 40 },
            { name: "Craft (Mechanic)", value: 40 },
            { name: "Demolitions", value: 50 },
            { name: "Drive", value: 50 },
            { name: "First Aid", value: 50 },
            { name: "Forensics", value: 40 },
            { name: "Heavy Machinery", value: 50 },
            { name: "Navigate", value: 50 },
            { name: "Search", value: 40 }
        ],
        optionalSkills: []
    },
    "foreign_service": {
        title: "Foreign Service Officer",
        recommendedStats: "INT, CHA",
        bonds: 3,
        requiredSkills: [
            { name: "Accounting", value: 40 },
            { name: "Anthropology", value: 40 },
            { name: "Bureaucracy", value: 60 },
            { name: "Foreign Language", value: 50 },
            { name: "History", value: 40 },
            { name: "HUMINT", value: 50 },
            { name: "Law", value: 40 },
            { name: "Persuade", value: 50 }
        ],
        optionalSkills: []
    },
    "intelligence_analyst": {
        title: "Intelligence Analyst",
        recommendedStats: "INT",
        bonds: 3,
        requiredSkills: [
            { name: "Anthropology", value: 40 },
            { name: "Bureaucracy", value: 50 },
            { name: "Computer Science", value: 40 },
            { name: "Criminology", value: 40 },
            { name: "History", value: 40 },
            { name: "HUMINT", value: 50 },
            { name: "SIGINT", value: 40 }
        ],
        optionalSkills: []
    },
    "intelligence_case_officer": {
        title: "Intelligence Case Officer",
        recommendedStats: "INT, POW, CHA",
        bonds: 2,
        requiredSkills: [
            { name: "Alertness", value: 50 },
            { name: "Bureaucracy", value: 40 },
            { name: "Criminology", value: 50 },
            { name: "Disguise", value: 50 },
            { name: "Drive", value: 40 },
            { name: "Firearms", value: 40 },
            { name: "HUMINT", value: 60 },
            { name: "Persuade", value: 60 },
            { name: "SIGINT", value: 40 },
            { name: "Stealth", value: 50 },
            { name: "Unarmed Combat", value: 50 }
        ],
        optionalSkills: []
    },
    "lawyer_executive": {
        title: "Lawyer or Business Executive",
        recommendedStats: "INT, CHA",
        bonds: 4,
        requiredSkills: [
            { name: "Accounting", value: 50 },
            { name: "Bureaucracy", value: 50 },
            { name: "HUMINT", value: 40 },
            { name: "Persuade", value: 60 }
        ],
        optionalSkills: [
            { name: "Computer Science", value: 50, limit: 4 },
            { name: "Criminology", value: 60, limit: 4 },
            { name: "Foreign Language", value: 50, limit: 4 },
            { name: "Law", value: 50, limit: 4 },
            { name: "Pharmacy", value: 50, limit: 4 }
        ]
    },
    "media_specialist": {
        title: "Media Specialist",
        recommendedStats: "INT, CHA",
        bonds: 4,
        requiredSkills: [
            { name: "Art (Creative Writing)", value: 60 },
            { name: "History", value: 40 },
            { name: "HUMINT", value: 40 },
            { name: "Persuade", value: 50 }
        ],
        optionalSkills: [
            { name: "Anthropology", value: 40, limit: 5 },
            { name: "Archeology", value: 40, limit: 5 },
            { name: "Art", value: 40, limit: 5 },
            { name: "Bureaucracy", value: 50, limit: 5 },
            { name: "Computer Science", value: 40, limit: 5 },
            { name: "Criminology", value: 50, limit: 5 },
            { name: "Foreign Language", value: 40, limit: 5 },
            { name: "Law", value: 40, limit: 5 },
            { name: "Military Science", value: 40, limit: 5 },
            { name: "Occult", value: 50, limit: 5 },
            { name: "Science", value: 40, limit: 5 }
        ]
    },
    "nurse_paramedic": {
        title: "Nurse or Paramedic",
        recommendedStats: "INT, POW, CHA",
        bonds: 4,
        requiredSkills: [
            { name: "Alertness", value: 40 },
            { name: "Bureaucracy", value: 40 },
            { name: "First Aid", value: 60 },
            { name: "HUMINT", value: 40 },
            { name: "Medicine", value: 40 },
            { name: "Persuade", value: 40 },
            { name: "Pharmacy", value: 40 },
            { name: "Science (Biology)", value: 40 }
        ],
        optionalSkills: [
            { name: "Drive", value: 60, limit: 2 },
            { name: "Forensics", value: 40, limit: 2 },
            { name: "Navigate", value: 50, limit: 2 },
            { name: "Psychotherapy", value: 50, limit: 2 },
            { name: "Search", value: 60, limit: 2 }
        ]
    },
    "pilot_sailor": {
        title: "Pilot or Sailor",
        recommendedStats: "DEX, INT",
        bonds: 3,
        requiredSkills: [
            { name: "Alertness", value: 60 },
            { name: "Bureaucracy", value: 30 },
            { name: "Craft (Electrician)", value: 40 },
            { name: "Craft (Mechanic)", value: 40 },
            { name: "Navigate", value: 50 },
            { name: "Pilot", value: 60 },
            { name: "Science (Meteorology)", value: 40 },
            { name: "Swim", value: 40 }
        ],
        optionalSkills: [
            { name: "Foreign Language", value: 50, limit: 2 },
            { name: "Pilot", value: 50, limit: 2 },
            { name: "Heavy Weapons", value: 50, limit: 2 },
            { name: "Military Science", value: 50, limit: 2 }
        ]
    },
    "police_officer": {
        title: "Police Officer",
        recommendedStats: "STR, CON, POW",
        bonds: 3,
        requiredSkills: [
            { name: "Alertness", value: 60 },
            { name: "Bureaucracy", value: 40 },
            { name: "Criminology", value: 40 },
            { name: "Drive", value: 50 },
            { name: "Firearms", value: 40 },
            { name: "First Aid", value: 30 },
            { name: "HUMINT", value: 50 },
            { name: "Law", value: 30 },
            { name: "Melee Weapons", value: 50 },
            { name: "Navigate", value: 40 },
            { name: "Persuade", value: 40 },
            { name: "Search", value: 40 },
            { name: "Unarmed Combat", value: 60 }
        ],
        optionalSkills: [
            { name: "Forensics", value: 50, limit: 1 },
            { name: "Heavy Machinery", value: 60, limit: 1 },
            { name: "Heavy Weapons", value: 50, limit: 1 },
            { name: "Ride", value: 60, limit: 1 }
        ]
    },
    "program_manager": {
        title: "Program Manager",
        recommendedStats: "INT, CHA",
        bonds: 4,
        requiredSkills: [
            { name: "Accounting", value: 60 },
            { name: "Bureaucracy", value: 60 },
            { name: "Computer Science", value: 50 },
            { name: "Criminology", value: 30 },
            { name: "History", value: 40 },
            { name: "Law", value: 40 },
            { name: "Persuade", value: 50 }
        ],
        optionalSkills: [
            { name: "Anthropology", value: 30, limit: 1 },
            { name: "Art", value: 30, limit: 1 },
            { name: "Craft", value: 30, limit: 1 },
            { name: "Science", value: 30, limit: 1 }
        ]
    },
    "soldier_marine": {
        title: "Soldier or Marine",
        recommendedStats: "STR, CON",
        bonds: 4,
        requiredSkills: [
            { name: "Alertness", value: 50 },
            { name: "Athletics", value: 50 },
            { name: "Bureaucracy", value: 30 },
            { name: "Drive", value: 40 },
            { name: "Firearms", value: 40 },
            { name: "First Aid", value: 40 },
            { name: "Military Science (Land)", value: 40 },
            { name: "Navigate", value: 40 },
            { name: "Persuade", value: 30 },
            { name: "Unarmed Combat", value: 50 }
        ],
        optionalSkills: [
            { name: "Artillery", value: 40, limit: 3 },
            { name: "Computer Science", value: 40, limit: 3 },
            { name: "Craft", value: 40, limit: 3 },
            { name: "Demolitions", value: 40, limit: 3 },
            { name: "Foreign Language", value: 40, limit: 3 },
            { name: "Heavy Machinery", value: 50, limit: 3 },
            { name: "Heavy Weapons", value: 40, limit: 3 },
            { name: "Search", value: 60, limit: 3 },
            { name: "SIGINT", value: 40, limit: 3 },
            { name: "Swim", value: 60, limit: 3 }
        ]
    },
    "new_profession": {
        title: "New Profession",
        recommendedStats: "Varies",
        bonds: 3,
        requiredSkills: [],
        optionalSkills: []
    }
};
