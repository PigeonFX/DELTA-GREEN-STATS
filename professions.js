// Delta Green Professions Database with skills data and descriptions
const professions = {
    "anthropologist": {
        title: "Anthropologist or Historian",
        description: "Anthropologist or Historian\nYou study humanity. You're concerned with the patterns that emerge over time, across land masses, cultures, and language groups. You might be a number-cruncher, a field worker trudging through the jungle, a consultant in a war zone, or a think-tank analyst sifting myth from history in studies of the Tcho-Tcho peoples.\n\nRECOMMENDED STATS: INT\n\nPROFESSIONAL SKILLS:\n» Anthropology 50% or Archeology 50%\n» Bureaucracy 40%\n» Foreign Language (choose one) 50%\n» Foreign Language (choose another) 40%\n» History 60%\n» Occult 40%\n» Persuade 40%\n\nChoose any two of these that you don't already have:\n» Anthropology 40%\n» Archeology 40%\n» HUMINT 50%\n» Navigate 50%\n» Ride 50%\n» Search 60%\n» Survival 50%\n\nBONDS: 4",
        requiredSkills: [
            { name: "Anthropology", value: 50 },
            { name: "Bureaucracy", value: 40 },
            { name: "Foreign Language", value: 50 },
            { name: "Foreign Language", value: 40 },
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
    "federal_agent": {
        title: "Federal Agent",
        description: "Federal Agent\nMany Delta Green Agents are federal law enforcement officers, mostly from the FBI. Delta Green decided long ago that federal agents have the optimum balance of skills and mental stability needed to confront the unnatural. For other versions of this profession see FEDERAL AGENCIES on page 104.\n\nRECOMMENDED STATS: CON, POW, CHA\n\nPROFESSIONAL SKILLS:\n» Alertness 50%\n» Bureaucracy 40%\n» Criminology 50%\n» Drive 50%\n» Firearms 50%\n» Forensics 30%\n» HUMINT 60%\n» Law 30%\n» Persuade 50%\n» Search 50%\n» Unarmed Combat 60%\n\nChoose one of these:\n» Accounting 60%\n» Computer Science 50%\n» Foreign Language (choose one) 50%\n» Heavy Weapons 50%\n» Pharmacy 50%\n\nBONDS: 3",
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
        description: "Physician\nDoctors are often the first to uncover signs of an unnatural incursion, and the most valuable investigators of its disastrous effects on humanity.\n\nRECOMMENDED STATS: INT, POW, DEX\n\nPROFESSIONAL SKILLS:\n» Bureaucracy 50%\n» First Aid 60%\n» Medicine 60%\n» Persuade 40%\n» Pharmacy 50%\n» Science (Biology) 60%\n» Search 40%\n\nChoose any two of these that you don't already have:\n» Forensics 50%\n» Psychotherapy 60%\n» Science (choose one) 50%\n» Surgery 50%\n\nBONDS: 3",
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
    "computer_scientist": {
        title: "Computer Scientist or Engineer",
        description: "Computer Scientist or Engineer\nComputers and machinery are the backbone of modern industry. You are a craftsman with data or machinery, possibly for the government and most definitely for profit. However you use your skills, the overlap between information technology and awareness of the unnatural could make this the most dangerous job on the planet.\n\nRECOMMENDED STATS: INT\n\nPROFESSIONAL SKILLS:\n» Computer Science 60%\n» Craft (Electrician) 30%\n» Craft (Mechanic) 30%\n» Craft (Microelectronics) 40%\n» Science (Mathematics) 40%\n» SIGINT 40%\n\nChoose any four of these that you don't already have:\n» Accounting 50%\n» Bureaucracy 50%\n» Craft (choose one) 40%\n» Foreign Language (choose one) 40%\n» Heavy Machinery 50%\n» Law 40%\n» Science (choose one) 40%\n\nBONDS: 3",
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
    "scientist": {
        title: "Scientist",
        description: "Scientist\nYou expand human knowledge in a field such as biology, physics, or chemistry. When certain forms of knowledge cause insanity and death, it's easy to conclude that some hypotheses should not be tested.\n\nRECOMMENDED STATS: INT\n\nPROFESSIONAL SKILLS:\n» Bureaucracy 40%\n» Computer Science 40%\n» Science (choose one) 60%\n» Science (choose another) 50%\n» Science (choose another) 50%\n\nChoose any three of these:\n» Accounting 50%\n» Craft (choose one) 40%\n» Foreign Language (choose one) 40%\n» Forensics 40%\n» Law 40%\n» Pharmacy 40%\n\nBONDS: 4",
        requiredSkills: [
            { name: "Bureaucracy", value: 40 },
            { name: "Computer Science", value: 40 },
            { name: "Science", value: 60 },
            { name: "Science", value: 50 },
            { name: "Science", value: 50 }
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
        description: "Special Operator\nAs part of a force like the U.S. Army Rangers, you volunteered for a more difficult path than other soldiers. You've spent years in the most grueling training on the planet, and now serve on the most dangerous missions around. For other versions of this profession (U.S. Army Special Forces, SEALs, USMC Raiders, FBI Hostage Rescue Team, CIA Special Operations Group, and so on), see FEDERAL AGENCIES on page 104.\n\nRECOMMENDED STATS: STR, CON, POW\n\nPROFESSIONAL SKILLS:\n» Alertness 60%\n» Athletics 60%\n» Demolitions 40%\n» Firearms 60%\n» Heavy Weapons 50%\n» Melee Weapons 50%\n» Military Science (Land) 60%\n» Navigate 50%\n» Stealth 50%\n» Survival 50%\n» Swim 50%\n» Unarmed Combat 60%\n\nBONDS: 2",
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
        description: "Criminal\nSo much is illegal that there are broad economies of crime. This profile fits a hardened militant or a traditional \"black collar\" criminal: pimp, burglar, extortionist, or thug. If you want a white-collar criminal, choose Computer Scientist or Business Executive and make very risky decisions.\n\nRECOMMENDED STATS: STR, DEX\n\nPROFESSIONAL SKILLS:\n» Alertness 50%\n» Athletics 50%\n» Criminology 60%\n» Dodge 40%\n» Drive 50%\n» Firearms 40%\n» Law 20%\n» Melee Weapons 40%\n» Persuade 50%\n» Stealth 50%\n» Unarmed Combat 50%\n\nChoose two from:\n» Craft (Locksmithing) 40%\n» Demolitions 40%\n» Disguise 50%\n» Foreign Language (choose one) 40%\n» Forensics 40%\n» HUMINT 50%\n» Navigate 50%\n» Occult 50%\n» Pharmacy 40%\n\nBONDS: 4",
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
        description: "Firefighter\nYour job oscillates between the tedium of maintaining your gear, exhilaration when the alarm finally comes, and the work of investigating a scene after the smoke has cleared. If you're involved with Delta Green, you clearly stumbled into something worse than a house fire.\n\nRECOMMENDED STATS: STR, DEX, CON\n\nPROFESSIONAL SKILLS:\n» Alertness 50%\n» Athletics 60%\n» Craft (Electrician) 40%\n» Craft (Mechanic) 40%\n» Demolitions 50%\n» Drive 50%\n» First Aid 50%\n» Forensics 40%\n» Heavy Machinery 50%\n» Navigate 50%\n» Search 40%\n\nBONDS: 3",
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
    "police_officer": {
        title: "Police Officer",
        description: "Police Officer\nYou serve and protect. Police officers walk the beat in uniform. Deputy sheriffs answer to an elected law enforcer and have jurisdiction over an entire county. Detectives come in after the fact and put the pieces together.\n\nRECOMMENDED STATS: STR, CON, POW\n\nPROFESSIONAL SKILLS:\n» Alertness 60%\n» Bureaucracy 40%\n» Criminology 40%\n» Drive 50%\n» Firearms 40%\n» First Aid 30%\n» HUMINT 50%\n» Law 30%\n» Melee Weapons 50%\n» Navigate 40%\n» Persuade 40%\n» Search 40%\n» Unarmed Combat 60%\n\nChoose one from:\n» Forensics 50%\n» Heavy Machinery 60%\n» Heavy Weapons 50%\n» Ride 60%\n\nBONDS: 3",
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
    "soldier_marine": {
        title: "Soldier or Marine",
        description: "Soldier or Marine\nGovernments will always need boots on the ground and steady hands holding rifles. When war begins, civilization gets out of the way. With the social contract void, unnatural things creep in at the edges. There's a reason Delta Green began in the military.\n\nRECOMMENDED STATS: STR, CON\n\nPROFESSIONAL SKILLS:\n» Alertness 50%\n» Athletics 50%\n» Bureaucracy 30%\n» Drive 40%\n» Firearms 40%\n» First Aid 40%\n» Military Science (Land) 40%\n» Navigate 40%\n» Persuade 30%\n» Unarmed Combat 50%\n\nChoose three from:\n» Artillery 40%\n» Computer Science 40%\n» Craft (choose one) 40%\n» Demolitions 40%\n» Foreign Language (choose one) 40%\n» Heavy Machinery 50%\n» Heavy Weapons 40%\n» Search 60%\n» SIGINT 40%\n» Swim 60%\n\nBONDS: 4",
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
    "foreign_service": {
        title: "Foreign Service Officer",
        description: "Foreign Service Officer\nYou travel to strange lands, meet interesting people, and try to get along with them. Odds are you work for the State Department, though USAID, the Commercial Service and the Foreign Agriculture Service also have FSOs. Either way, you've had every opportunity to learn exotic and deadly things; the kinds of things that qualify you for Delta Green clearance.\n\nRECOMMENDED STATS: INT, CHA\n\nPROFESSIONAL SKILLS:\n» Accounting 40%\n» Anthropology 40%\n» Bureaucracy 60%\n» Foreign Language (choose one) 50%\n» Foreign Language (choose one) 50%\n» Foreign Language (choose one) 40%\n» History 40%\n» HUMINT 50%\n» Law 40%\n» Persuade 50%\n\nBONDS: 3",
        requiredSkills: [
            { name: "Accounting", value: 40 },
            { name: "Anthropology", value: 40 },
            { name: "Bureaucracy", value: 60 },
            { name: "Foreign Language", value: 50 },
            { name: "Foreign Language", value: 50 },
            { name: "Foreign Language", value: 40 },
            { name: "History", value: 40 },
            { name: "HUMINT", value: 50 },
            { name: "Law", value: 40 },
            { name: "Persuade", value: 50 }
        ],
        optionalSkills: []
    },
    "intelligence_analyst": {
        title: "Intelligence Analyst",
        description: "Intelligence Analyst\nIn the FBI, NSA and CIA, there are those who gather information and those who decide what it means. You take information from disparate sources—newspapers, websites, informants, ELINT, and the assets developed by Case Officers—and figure out what it means. In short, your job is the piecing together of unrelated knowledge, a dangerous endeavor in the world of Delta Green.\n\nRECOMMENDED STATS: INT\n\nPROFESSIONAL SKILLS:\n» Anthropology 40%\n» Bureaucracy 50%\n» Computer Science 40%\n» Criminology 40%\n» Foreign Language (choose one) 50%\n» Foreign Language (choose one) 50%\n» Foreign Language (choose one) 40%\n» History 40%\n» HUMINT 50%\n» SIGINT 40%\n\nBONDS: 3",
        requiredSkills: [
            { name: "Anthropology", value: 40 },
            { name: "Bureaucracy", value: 50 },
            { name: "Computer Science", value: 40 },
            { name: "Criminology", value: 40 },
            { name: "Foreign Language", value: 50 },
            { name: "Foreign Language", value: 50 },
            { name: "Foreign Language", value: 40 },
            { name: "History", value: 40 },
            { name: "HUMINT", value: 50 },
            { name: "SIGINT", value: 40 }
        ],
        optionalSkills: []
    },
    "intelligence_case_officer": {
        title: "Intelligence Case Officer",
        description: "Intelligence Case Officer\nYou recruit people to spy on their own countries for your agency, probably the CIA. Your job is to develop foreign intelligence sources (\"assets\"), communicate with them, and keep them under control, productive, and alive. It's a hard business because you must view everyone as a potential threat, liar, or tool to further your agenda. If your name came to the attention of Delta Green, congratulations; you are now someone else's asset.\n\nRECOMMENDED STATS: INT, POW, CHA\n\nPROFESSIONAL SKILLS:\n» Alertness 50%\n» Bureaucracy 40%\n» Criminology 50%\n» Disguise 50%\n» Drive 40%\n» Firearms 40%\n» Foreign Language (choose one) 50%\n» Foreign Language (choose another) 40%\n» HUMINT 60%\n» Persuade 60%\n» SIGINT 40%\n» Stealth 50%\n» Unarmed Combat 50%\n\nBONDS: 2",
        requiredSkills: [
            { name: "Alertness", value: 50 },
            { name: "Bureaucracy", value: 40 },
            { name: "Criminology", value: 50 },
            { name: "Disguise", value: 50 },
            { name: "Drive", value: 40 },
            { name: "Firearms", value: 40 },
            { name: "Foreign Language", value: 50 },
            { name: "Foreign Language", value: 40 },
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
        description: "Lawyer or Business Executive\nYour tools are a computer and smartphone. You might be moving millions of dollars, or bits of data, or both. Or you might be a prosecutor, a defense attorney, or judge.\n\nRECOMMENDED STATS: INT, CHA\n\nPROFESSIONAL SKILLS:\n» Accounting 50%\n» Bureaucracy 50%\n» HUMINT 40%\n» Persuade 60%\n\nChoose four from:\n» Computer Science 50%\n» Criminology 60%\n» Foreign Language (choose one) 50%\n» Law 50%\n» Pharmacy 50%\n\nBONDS: 4",
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
        description: "Media Specialist\nYou might be an author, an editor, a researcher for a company or any branch of the government, a blogger, a TV reporter, or a scholar of rare texts. With the unnatural, you've uncovered the story of a lifetime.\n\nRECOMMENDED STATS: INT, CHA\n\nPROFESSIONAL SKILLS:\n» Art (choose one: Creative Writing, Journalism, Poetry, Scriptwriting, etc.) 60%\n» History 40%\n» HUMINT 40%\n» Persuade 50%\n\nChoose five from:\n» Anthropology 40%\n» Archeology 40%\n» Art (choose one) 40%\n» Bureaucracy 50%\n» Computer Science 40%\n» Criminology 50%\n» Foreign Language (choose one) 40%\n» Law 40%\n» Military Science (choose one) 40%\n» Occult 50%\n» Science (choose one) 40%\n\nBONDS: 4",
        requiredSkills: [
            { name: "Art", value: 60 },
            { name: "History", value: 40 },
            { name: "HUMINT", value: 40 },
            { name: "Persuade", value: 50 }
        ],
        optionalSkills: [
            { name: "Anthropology", value: 40, limit: 6 },
            { name: "Archeology", value: 40, limit: 6 },
            { name: "Art", value: 40, limit: 6 },
            { name: "Bureaucracy", value: 50, limit: 6 },
            { name: "Computer Science", value: 40, limit: 6 },
            { name: "Criminology", value: 50, limit: 6 },
            { name: "Foreign Language", value: 40, limit: 6 },
            { name: "Law", value: 40, limit: 6 },
            { name: "Military Science", value: 40, limit: 6 },
            { name: "Occult", value: 50, limit: 6 },
            { name: "Science", value: 40, limit: 6 }
        ]
    },
    "nurse_paramedic": {
        title: "Nurse or Paramedic",
        description: "Nurse or Paramedic\nMedical professionals are on the front line when awful things happen. Is that what brought you to the group's attention?\n\nRECOMMENDED STATS: INT, POW, CHA\n\nPROFESSIONAL SKILLS:\n» Alertness 40%\n» Bureaucracy 40%\n» First Aid 60%\n» HUMINT 40%\n» Medicine 40%\n» Persuade 40%\n» Pharmacy 40%\n» Science (Biology) 40%\n\nChoose two from:\n» Drive 60%\n» Forensics 40%\n» Navigate 50%\n» Psychotherapy 50%\n» Search 60%\n\nBONDS: 4",
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
        description: "Pilot or Sailor\nAir or sea, commercial or military, your duty is to keep your passengers alive and craft intact. This can lead to hard choices when your passengers put the vehicle in danger. Or are you a drone operator, flying a Predator from a thousand miles away? Either way, what op brought you to the attention of Delta Green?\n\nRECOMMENDED STATS: DEX, INT\n\nPROFESSIONAL SKILLS:\n» Alertness 60%\n» Bureaucracy 30%\n» Craft (Electrician) 40%\n» Craft (Mechanic) 40%\n» Navigate 50%\n» Pilot (choose one) 60%\n» Science (Meteorology) 40%\n» Swim 40%\n\nChoose two from:\n» Foreign Language (choose one) 50%\n» Pilot (choose one) 50%\n» Heavy Weapons 50%\n» Military Science (choose one) 50%\n\nBONDS: 3",
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
    "program_manager": {
        title: "Program Manager",
        description: "Program Manager\nYou run an organization. Someone has to secure funding, move resources, and make connections, and that's you. You control a budget and are responsible for how your program is maintained and where the money goes. Organizations discover the most startling things in their pursuit of profit or the public good.\n\nRECOMMENDED STATS: INT, CHA\n\nPROFESSIONAL SKILLS:\n» Accounting 60%\n» Bureaucracy 60%\n» Computer Science 50%\n» Criminology 30%\n» Foreign Language (choose one) 50%\n» History 40%\n» Law 40%\n» Persuade 50%\n\nChoose one from:\n» Anthropology 30%\n» Art (choose one) 30%\n» Craft (choose one) 30%\n» Science (choose one) 30%\n\nBONDS: 4",
        requiredSkills: [
            { name: "Accounting", value: 60 },
            { name: "Bureaucracy", value: 60 },
            { name: "Computer Science", value: 50 },
            { name: "Criminology", value: 30 },
            { name: "Foreign Language", value: 50 },
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
    "new_profession": {
        title: "Building a New Profession",
        description: "Building a New Profession\nIf none of the professions suit your Agent, use these guidelines to build a new one.\n\nPROFESSIONAL SKILLS: Pick ten professional skills for the new profession. Divide 400 skill points between them. Add those points to each skill's starting level. As a rule of thumb, professional skills should be 30% to 50%. No professional skill may be higher than 60%.\n\nBONDS: 3\n\nCUSTOMIZE: For each additional bond (to a maximum of 4), reduce professional skill points by 50. For each bond removed (to a minimum of 1), add 50 professional skill points.",
        requiredSkills: [],
        optionalSkills: []
    }
};
