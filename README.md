## DELTA-GREEN-STATS

https://pigeon-labs-stack.github.io/DELTA-GREEN-STATS/

A user-friendly character creation and management tool for the Delta Green RPG system.

• Single-page web app designed for simplicity
• Build characters, manage skills, generate bonds, and export to Foundry VTT
• No need to know the rules or do any math
• Perfect for new players and seasoned veterans alike

---

## Screenshot Gallery

<div style="text-align: center; margin: 20px 0;">
  <img src="assets/art/Screenshot launch.png" alt="X-Files Theme Launch Screen" style="max-width: 100%; height: auto; max-height: 400px; border: 2px solid #00b521; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
</div>

<details>
<summary style="text-align: center; cursor: pointer; font-size: 16px; font-weight: bold; padding: 10px;">Click to view all themes →</summary>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 20px;">
  <a href="assets/art/Screenshot%20X-Files.png" target="_blank" style="text-decoration: none;">
    <img src="assets/art/Screenshot%20X-Files.png" alt="X-Files Theme" style="width: 100%; aspect-ratio: 16/9; object-fit: cover; border: 3px solid #00b521; border-radius: 4px; cursor: pointer;">
  </a>
  <a href="assets/art/Screenshot%20Modern.png" target="_blank" style="text-decoration: none;">
    <img src="assets/art/Screenshot%20Modern.png" alt="Modern Theme" style="width: 100%; aspect-ratio: 16/9; object-fit: cover; border: 3px solid #89b4fa; border-radius: 4px; cursor: pointer;">
  </a>
  <a href="assets/art/Screenshot%20Mobile.png" target="_blank" style="text-decoration: none;">
    <img src="assets/art/Screenshot%20Mobile.png" alt="Mobile Theme" style="width: 100%; aspect-ratio: 16/9; object-fit: cover; border: 3px solid #5e81f4; border-radius: 4px; cursor: pointer;">
  </a>
  <a href="assets/art/Screenshot%20Son%20of%20sam.png" target="_blank" style="text-decoration: none;">
    <img src="assets/art/Screenshot%20Son%20of%20sam.png" alt="Son of Sam Theme" style="width: 100%; aspect-ratio: 16/9; object-fit: cover; border: 3px solid #ff5555; border-radius: 4px; cursor: pointer;">
  </a>
  <a href="assets/art/HTML%20Sheet.png" target="_blank" style="text-decoration: none;">
    <img src="assets/art/HTML%20Sheet.png" alt="Printable Sheet Export" style="width: 100%; aspect-ratio: 16/9; object-fit: cover; border: 3px solid #d0d0d0; border-radius: 4px; cursor: pointer;">
  </a>
</div>
</details>

---

## Quick Start

1. **Build Stats** → Choose Point Buy, Random, or Dice Roll
2. **Pick Profession** → Select from 20 professions, apply skills
3. **Add Skills** → Base skills + specialties + custom skills + bonus points
4. **Fill Biography** → Character details (name, description, etc.)
5. **Generate Bonds** → Random bond creation (optional)
6. **Export** → Download JSON and import to Foundry VTT (or view raw HTML)

---

## Features

### Character Creation
- **Point Buy** | **Random Allocation** | **Dice Roll (4d6)**
- Auto-calculated derived attributes (HP, WP, SAN, BP)
- Real-time stat updates

### Professions
- 20 official Delta Green professions
- Auto-apply profession skills
- Select optional skills per profession

### Skills System
- 42+ Delta Green skills with base proficiencies
- Specialty support (Art, Craft, Science, Pilot, Military)
- Add custom skills (languages, special abilities)
- **Bonus Skill Points**: Enhance up to 8 skills with +20 each (capped at 80%)

### Bond Management
- Random bond generation from 5 categories:
  - PISCES (UK) | DELTA GREEN (US)
  - Friends & Family | Underworld | LGBTQ
- Add multiple bonds to your character
- Automatic Foundry export

### Foundry VTT Export
- Complete JSON export with all character data
- Typed skills in Foundry format
- Bonds as items
- Ready to import into Delta Green system
- View raw HTML preview before export

### Printable Character Sheet
- **HTML Export**: Generate printable character sheet for pen & paper play
- **Print-Optimized Layout**: Clean formatting with fillable sections
- **All Character Data**: Stats, skills, bonds, biography on one page
- **Pen & Paper Ready**: Perfect for table use without digital tools

---

## Themes

| Theme | Style | Best For |
|-------|-------|----------|
| **X-Files** (Default) | Green terminal aesthetic | Classic retro feel |
| **Modern** | Catppuccin color palette | Enhanced readability |
| **Morris** | Dracula colors | Dark mode preference |
| **Son of Sam** | Red/black high contrast | Alternative dark |
| **Mobile** | Blue responsive design | Mobile devices (auto-detects) |

---

## Technologies

- **HTML5** - Semantic markup
- **CSS3** - Organized theming with CSS variables
- **Vanilla JavaScript** - No dependencies, ES6+
- **Foundry VTT** - Compatible with Delta Green system

---

#### Adding Skills
Edit the `skillsList` array in `scripts.js` within `populateCharacterSheetForm()`:
```javascript
const skillsList = [
    ["accounting", "Accounting", 10],
    ["your_skill", "Your Skill", 20, false], // false = no specialty, true = has specialty
    // ...
];
```

#### Modifying Derived Attributes
Update the calculation formulas in `populateCharacterSheetForm()`:
```javascript
const hp = Math.ceil((STRv + CONv) / 2);  // HP formula
const san = POWv * 5;  // SAN formula
// etc...
```

#### Adding Bond Categories
Edit `bonds.js` to add new categories:
```javascript
const bonds = {
    YOUR_CATEGORY: [
        "Bond text here ^ ^ Relationship ^ ^ Description",
        // ...
    ]
};
```

## File Structure
```
DELTA-GREEN-STATS/
├── index.html          # Main HTML structure
├── scripts.js          # Core application logic
├── styles.css          # All styling (organized by section)
├── bonds.js            # Bond data and categories
├── README.md           # This file
└── assets/
    └── art/            # Images and logos
```

## Code Organization

### scripts.js - Key Functions

**Character Creation**
- `randomStats()` - Randomly distribute 72 points
- `randomDiceRoll()` - Roll 4d6 and apply to stats
- `resetStats()` - Clear all and return to start

**Skills & Bonus Points**
- `populateCharacterSheetForm()` - Display all skills
- `addCustomSkill()` - Add custom skill rows
- `getCustomSkills()` - Retrieve all custom skills
- `prepareBonusSkills()` - Show bonus points section
- `populateBonusSkillDropdowns()` - Create 8 bonus selectors
- `applyBonusSkills()` - Apply +20 to selected skills

**Professions**
- `selectProfession()` - Display selected profession info
- `applyProfessionSkills()` - Add profession skills to sheet

**Export & Data**
- `buildFoundryJSON()` - Construct complete JSON export
- `populateCharacterJSON()` - Preview the JSON
- `exportCharacterJSON()` - Download JSON file
- `generateRandomBond()` - Create random bond
- `addBondToSheet()` - Add bond to character

### styles.css - Organization
- **Configuration**: CSS variables for colors and spacing
- **Layout**: Grid and flexbox arrangements
- **Components**: Buttons, inputs, fieldsets, skills grid
- **Theming**: X-Files and Modern theme overrides
- **Bonus Skills**: Styling for bonus skill points section

### bonds.js
- **Bond Categories**: Arrays of bond strings by category
- **Bond Format**: `"Name ^ ^ Relationship ^ ^ Description"` format

## Foundry VTT Export Format

Exported JSON includes:
```json
{
  "name": "Character Name",
  "type": "agent",
  "img": "icons/svg/mystery-man.svg",
  "prototypeToken": { ... },
  "system": {
    "health": { value, min, max },
    "wp": { value, min, max },
    "statistics": { str, con, dex, int, pow, cha },
    "skills": { ... },
    "typedSkills": { ... },
    "sanity": { ... },
    "biography": { ... },
    "physical": { ... },
    "corruption": { ... }
  },
  "items": [ /* bonds and other items */ ]
}
```

## Troubleshooting

**Q: Bonus Skill Points section isn't showing**
- A: First add some skills or select profession skills, then click "Prepare Skills for Bonus Points"

**Q: Skills are showing wrong values after applying bonuses**
- A: Make sure you apply bonus skills, not individual selections. Each "Boost" dropdown adds +20

**Q: JSON export doesn't import to Foundry**
- A: Ensure you have the Delta Green system installed in Foundry. Check the JSON preview for any errors

**Q: Specialty skills aren't appearing in Foundry**
- A: They export to `typedSkills`. Make sure your Foundry Delta Green system supports typed skills

## Development

### Project Goals
- Keep the tool lightweight and dependency-free
- Maintain ease of customization for other users
- Ensure compatibility with Foundry VTT Delta Green system
- Provide clear, well-commented code
- User-friendly walkthrough for character creation

### Contributing
Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request with clear descriptions

## Browser Support
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License
This project is open source and available under the MIT License. Feel free to use, modify, and distribute as you see fit, keeping in mind the spirit of role-playing games and community collaboration.

---

<div align="center">
    <img src="assets/art/icon.png" width="150" height="150">
</div>

<p align="center">
  Built with ❤️ by <a href="https://github.com/pigeon-labs-stack">Pigeon Labs Stack</a> for Delta Green enthusiasts and role-playing game fans everywhere.
</p>

---

<div align="center">
  <a href="https://www.buymeacoffee.com/pigeon_labs" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="Buy Me A Coffee" style="height: 60px !important; width: 217px !important;">
  </a>
</div>


