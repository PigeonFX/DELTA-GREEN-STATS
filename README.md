## DELTA GREEN STATS

**https://pigeon-labs-stack.github.io/DELTA-GREEN-STATS/**

A full-featured character creation, management, and live play tool for the **Delta Green** tabletop RPG. Build agents, run sessions, and export directly to Foundry VTT — all in a single dependency-free web app.

- No installation. No account. Runs entirely in the browser.
- Covers the full agent lifecycle: creation → session play → export
- Six distinct visual themes including a dedicated live play field sheet
- Zero math required — all derived values calculated automatically

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

1. **Roll or buy stats** — point buy, full random, or 4d6 drop lowest
2. **Pick a profession** — choose from 18 official Delta Green professions; skills apply automatically
3. **Tune your skills** — adjust specialties, add custom skills, and spend bonus skill points
4. **Fill your biography** — hit *Random Bio* for an instant procedurally generated agent, or write your own
5. **Pick your gear** — browse the equipment catalog and build your loadout
6. **Generate bonds** — pull from five NPC pools or write your own
7. **Export** — download a Foundry VTT actor JSON, a printable HTML sheet, or a shareable link
8. **Play** — switch to *Live Play (Field Notes)* for an in-session tracking sheet with HP/WP/SAN controls

---

## Features

### Stat Generation
- **Point Buy** — distribute a fixed pool of points across STR, DEX, CON, INT, POW, CHA
- **Random Allocation** — 72 points spread randomly
- **Dice Roll** — roll 4d6, drop the lowest for each stat
- Derived attributes (HP, WP, SAN, BP) calculated live as you build

### Professions
18 official Delta Green professions, each with a fixed skill package and optional skill picks:

| Profession | Bonds |
|---|---|
| Anthropologist or Historian | 4 |
| Computer Scientist or Engineer | 3 |
| Criminal | 4 |
| Federal Agent | 3 |
| Firefighter | 3 |
| Foreign Service Officer | 3 |
| Intelligence Analyst | 3 |
| Intelligence Case Officer | 2 |
| Lawyer or Business Executive | 4 |
| Media Specialist | 4 |
| Nurse or Paramedic | 4 |
| Physician | 3 |
| Pilot or Sailor | 3 |
| Police Officer | 3 |
| Program Manager | 4 |
| Scientist | 4 |
| Soldier or Marine | 4 |
| Special Operator | 2 |

A **Build a New Profession** template is also included for custom agents: 400 points across 10 skills, with bonds traded ±50 points each.

### Skills System
42 base skills covering the full Delta Green rulebook, each with a tooltip explanation drawn from the sourcebook.

Specialty skills (Art, Craft, Military Science, Pilot, Science) use dropdowns with curated sub-type lists and a free-text custom entry option:

| Skill | Example Specialties |
|---|---|
| **Art** | Photography, Painting, Sculpting, Acting, Creative Writing, Guitar, Singing… |
| **Craft** | Mechanic, Electrician, Gunsmith, Locksmith, Carpenter, Microelectronics… |
| **Military Science** | Land, Air, Sea, Special Operations |
| **Pilot** | Airplane, Helicopter, Drone, Small Boat, Ship, Jet Aircraft, Space Shuttle |
| **Science** | Biology, Chemistry, Physics, Mathematics, Genetics, Geology, Meteorology… |
| **Foreign Language** | 18 preset languages + free text |

Multiple instances of the same specialty skill can be added (e.g. Science (Chemistry) and Science (Physics) as separate rows).

### Bonus Skill Points
After finalising your profession and custom skills, optionally boost up to 8 skills by +20 each (capped at 80%). Each dropdown shows the full skill name including specialty — no guessing which *Chemistry* you're boosting.

### Biography & Random Generation
- Fields for name, sex, age, nationality, employer, education, physical description, and motivations
- **Random Bio** button generates a complete biography instantly:
  - Name from gender-specific first name pools + 56 last names
  - Age 25–65
  - Nationality from a weighted pool (25+ countries, US-weighted to reflect faction)
  - Employer and education matched to the selected profession (e.g. FBI/DEA/ATF for Federal Agents; Johns Hopkins/NIH/CDC for Physicians)
  - Physical description procedurally constructed from build, height, hair, eyes, skin tone, and notable features — all stat-influenced

### Bond Management
Generate NPC bonds from five themed pools:

| Pool | Flavour |
|---|---|
| **Delta Green (US)** | FBI agents, Navy SEALs, CIA operatives, NSA analysts, DEA, Army Rangers… |
| **PISCES (UK)** | MI6 analysts, GCHQ officers, Metropolitan Police Special Branch, Home Office… |
| **Friends & Family** | Spouses, siblings, parents, children, neighbours — people who think you're normal |
| **Underworld** | Fixers, informants, safe house operators, shadow archivists, debt collectors… |
| **LGBTQ** | Partners, chosen family, community ties, queer underworld contacts… |

Each generated bond includes a name, relationship, and a flavour note — lightly touched by the unnatural. Bonds carry an editable score starting at CHA × 1.

### Equipment Picker
A searchable, filterable gear catalog across 14 categories:

- **Firearms** — pistols (light/medium/heavy), rifles, carbines, SMGs, shotguns
- **Melee Weapons** — unarmed, knives, clubs, axes, swords, garrote
- **Heavy Weapons** — grenades, RPGs, LMGs, GPMGs, miniguns, flamethrowers
- **Artillery** — mortars, bombs
- **Demolitions** — ANFO, C4, IEDs, shaped charges
- **Less-Lethal** — stun guns, CED pistols, flash-bangs, tear gas, pepper spray
- **Armor** — Kevlar vests, tactical body armor, helmets, bomb suit
- **Surveillance, Comms & Tech, Optics, Weapon Accessories, Entry Tools, Restraints, Survival & Medical**

Each item shows range, damage or lethality%, armor piercing, ammo capacity, and expense tier (Incidental → Extreme). Your loadout flows automatically into the Foundry VTT export and the printable sheet.

### Dice Roller
A floating, draggable dice panel available at all times.

- **Supported dice:** D4, D6, D8, D10, D12, D20, D% (percentile, default)
- Animated wireframe die face with a spin-and-land CSS animation
- **Percentile integration:** click any skill value on the character sheet to instantly roll D% against it — the skill name and target % auto-populate
- Result tiers per Agent's Handbook rules:
  - `01` → **Critical Success**
  - Matching double (e.g. 33) within target → **Critical Success**
  - ≤ target → **Success**
  - > target → **Failure**
  - Matching double at or above target → **Fumble**
  - `100` → **Fumble**

#### Custom Dice Expressions
Type a dice expression into the input field and press **ROLL** or **Enter** to run it without leaving the current die button selection.

**Input schema:** `[count]d<sides>[±modifier]`

| Expression | Meaning |
|---|---|
| `d6` | Roll one D6 |
| `2d6` | Roll two D6, sum the results |
| `6d6` | Roll six D6, sum the results |
| `d4-1` | Roll a D4 and subtract 1 |
| `3d8+5` | Roll three D8 and add 5 |
| `d20` | Roll a D20 |
| `2d10+3` | Roll two D10 and add 3 |

Rules:
- `count` is optional — omitting it rolls one die (`d8` = `1d8`)
- `count` may be 1–20
- `sides` may be 2–100
- Modifier is optional and may be positive (`+N`) or negative (`−N`)
- Individual die results are shown as a breakdown below the total (e.g. `[4, 2, 6] + 3`)
- Entering a plain number (e.g. `65`) still works as a D% target — existing behaviour unchanged

### Live Play — Field Notes
Select the **Live Play (Field Notes)** theme to switch from character creation mode into an in-session tracking sheet styled as a DD Form 315 classified document.

**Sticky tracker bar (always visible):**
- HP, WP, and SAN current/max with +/− buttons and live status labels (CRITICAL, DYING, BREAKING PT, PERM. MADNESS)
- Inline quick D% roll button

**Full field sheet includes:**
- Personal data synced bidirectionally with the main form
- Stat block with distinguishing feature fields per stat
- Bonds table with per-bond score and damage (−1) button
- Derived attribute controls (HP/WP/SAN/BP)
- Motivations, physical description, and sanity adaptations
- Three-column skill grid with session failure checkboxes and inline editable values
- Weapons table (seeded from equipment loadout) with skill% cells wired to the dice roller
- Gear & armor section (seeded from non-weapon loadout items)
- Wounds & injuries, session notes, and remarks fields
- Download / upload sheet buttons

### Printable Character Sheet
Export a self-contained `.html` file formatted as a **DD Form 315 Delta Green Agent Documentation Sheet** — ready to print or save.

- Stats, derived attributes, skills (3-column grid), bonds, and biography on one page
- Weapons table seeded from your equipment loadout
- Sanity adaptations checkboxes
- Can also be generated from an imported Foundry VTT actor `.json`

### Foundry VTT Export
One-click export of a complete Foundry VTT `agent` actor JSON:

- Full statistics, derived attributes, skills, typed specialty skills
- Equipment loadout as Foundry item objects (weapons, armor, gear)
- Bonds as `bond` items with name, relationship, description, and score
- Sanity adaptations, biography, physical description, wounds
- Prototype token config with HP/WP bars pre-configured
- Supports custom token overrides and custom items via JSON textarea

### Save, Load & Share
- **Auto-save** to `localStorage` on every change — your agent persists between sessions
- **Download / Upload** — save your full character state as a portable `.json` file
- **Share Link** — encodes the entire character into a URL hash for instant one-click sharing

---

## Themes

| Theme | Aesthetic |
|---|---|
| **X-Files** *(default)* | Dark grey terminal — retro TV surveillance |
| **Modern** | Catppuccin Mocha — soft dark purples and blues |
| **Son of Sam** | Black/red high contrast — animated occult sigil, glitch legend headers |
| **Field Notes** | Kraft paper notebook — aged parchment background, Permanent Marker headings, Caveat hand-written script, biro annotations, coffee stains |
| **Live Play (Field Notes)** | DD Form 315 classified document — Field Notes aesthetic applied to the in-session play interface |

---

## File Structure

```
DELTA-GREEN-STATS/
├── index.html           # Application shell and markup
├── scripts.js           # Core logic: stats, skills, professions, export
├── styles.css           # All styling — base + five theme overrides
├── bio.js               # Random biography data pools
├── bonds.js             # Bond NPC pools (five categories)
├── professions.js       # Profession definitions and skill packages
├── equipment-data.js    # Complete equipment catalog data
├── equipment-picker.js  # Equipment picker UI and loadout management
├── dice-roller.js       # Floating dice panel and roll logic
├── printable-sheet.js   # HTML printable sheet generator
├── save-load.js         # Auto-save, share links, import/export
└── assets/
    └── art/             # Screenshots, icons, artwork
```

---

## Technologies

- **HTML5** — semantic markup, no framework
- **CSS3** — custom properties, grid, flexbox, theme switching
- **Vanilla JavaScript** — ES6+, zero dependencies
- **Foundry VTT** — compatible with the Delta Green system

---

## Browser Support

Chrome/Chromium 90+ · Firefox 88+ · Safari 14+ · Edge 90+

---

## Contributing

Contributions welcome.

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with a clear description of the change

---

## License

[PolyForm Noncommercial License 1.0.0](LICENSE) — free to use, modify, and share for any noncommercial purpose. Commercial use is not permitted without explicit written permission from the author.

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
