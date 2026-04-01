/**
 * DELTA GREEN STATS — Equipment Catalog
 * Sourced from the Delta Green: Agent's Handbook Foundry VTT compendium.
 * Used by the equipment picker to build character loadouts for Foundry export.
 */
'use strict';

window.DG_EQUIPMENT_CATALOG = [

    // ── FIREARMS ──────────────────────────────────────────────────────────────────
    {
        category: 'Firearms', name: 'Light pistol', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/pistol.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Revolver capacity: 6. Examples: .22 LR, .32 ACP, .380 ACP, .38 Special: S&amp;W Model 36, Walther PPK.</em></p>', skill: 'firearms', skillModifier: 0, customSkillTarget: 50, range: '10M', damage: '1D8', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '7', expense: 'Standard', equipped: true }
    },
    {
        category: 'Firearms', name: 'Medium pistol', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/pistol.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Revolver capacity: 6. Examples: 9×19 mm, .40 S&amp;W, .45 ACP: Beretta Mod 92FS (M9), Colt M1911A1, Glock 17, Glock 22.</em></p>', skill: 'firearms', skillModifier: 0, customSkillTarget: 50, range: '15M', damage: '1D10', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '15', expense: 'Standard', equipped: true }
    },
    {
        category: 'Firearms', name: 'Heavy pistol', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/pistol.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Revolver capacity: 6. Examples: .357 Magnum, .44 Magnum, .50 AE: Colt Delta Elite, Glock 20, S&amp;W Model 13.</em></p>', skill: 'firearms', skillModifier: 0, customSkillTarget: 50, range: '20M', damage: '1D12', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '10', expense: 'Standard', equipped: true }
    },
    {
        category: 'Firearms', name: 'Light rifle or carbine', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/rifle.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED IF CAPABLE OF FULLY AUTOMATIC FIRE.</strong> Use the Lethality rating if firing bursts. Examples: AR-15, Colt M4, FN SCAR-L. <strong>Lethality: 10%</strong></em></p>', skill: 'firearms', skillModifier: 0, customSkillTarget: 50, range: '100M', damage: '1D12', armorPiercing: 3, lethality: 10, isLethal: false, killRadius: 'N/A', ammo: '10 or 30', expense: 'Standard', equipped: true }
    },
    {
        category: 'Firearms', name: 'Heavy rifle', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/rifle.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED IF CAPABLE OF FULLY AUTOMATIC FIRE.</strong> Examples: H&amp;K G3, FN FAL, Remington Model 700 (M24). <strong>Lethality: 10%</strong></em></p>', skill: 'firearms', skillModifier: 0, customSkillTarget: 50, range: '150M', damage: '1D12+2', armorPiercing: 5, lethality: 10, isLethal: false, killRadius: 'N/A', ammo: '10 or 20', expense: 'Unusual', equipped: true }
    },
    {
        category: 'Firearms', name: 'Very heavy rifle', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/rifle.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Examples: .408 CheyTac, .50 Browning: Barrett Model 82A1, CheyTac M200.</em></p>', skill: 'firearms', skillModifier: 0, customSkillTarget: 50, range: '250M', damage: '', armorPiercing: 5, lethality: 20, isLethal: true, killRadius: 'N/A', ammo: '10', expense: 'Major', equipped: true }
    },
    {
        category: 'Firearms', name: 'Submachine gun (SMG)', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/smg.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED IF CAPABLE OF FULLY AUTOMATIC FIRE.</strong> Examples: B&amp;T MP9, FN P90, H&amp;K MP5, IMI Uzi, KRISS Vector. <strong>Lethality: 10%</strong></em></p>', skill: 'firearms', skillModifier: 0, customSkillTarget: 50, range: '50M', damage: '1D10', armorPiercing: 0, lethality: 10, isLethal: false, killRadius: 'N/A', ammo: '30', expense: 'Unusual', equipped: true }
    },
    {
        category: 'Firearms', name: 'Shotgun (firing shot)', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/shotgun.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Half damage beyond base range. Includes +20% bonus for firing shot. Examples: Mossberg Model 500, Remington Model 870.</em></p>', skill: 'firearms', skillModifier: 20, customSkillTarget: 50, range: '75M', damage: '2D8', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '5', expense: 'Standard', equipped: true }
    },
    {
        category: 'Firearms', name: 'Shotgun (firing slug)', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/shotgun.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Damage reduced to 2D6 beyond base range.</em></p>', skill: 'firearms', skillModifier: 0, customSkillTarget: 50, range: '75M', damage: '2D8', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '5', expense: 'Standard', equipped: true }
    },
    {
        category: 'Firearms', name: 'Shotgun (firing nonlethal)', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/shotgun.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><strong>Damage:</strong> 1D6 and Stunned</p>', skill: 'firearms', skillModifier: 0, customSkillTarget: 50, range: '10M', damage: '1D6', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '5', expense: 'Standard', equipped: true }
    },

    // ── MELEE WEAPONS ─────────────────────────────────────────────────────────────
    {
        category: 'Melee Weapons', name: 'Unarmed attack', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/unarmed.svg', flags: {}, effects: [],
        system: { name: '', description: '', skill: 'unarmed_combat', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D4-1', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'NA', equipped: true }
    },
    {
        category: 'Melee Weapons', name: 'Brass knuckles, heavy flashlight, or steel-toe boots', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/brass-knuckles.svg', flags: {}, effects: [],
        system: { name: '', description: '', skill: 'unarmed_combat', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D4', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Melee Weapons', name: 'Garrote', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/rope.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Works only from surprise. Target is pinned and cannot make a sound; does 1D6 damage per round until escape or death. A Kevlar garrote can cut through flexible cuffs.</em></p>', skill: 'unarmed_combat', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D6', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Melee Weapons', name: 'Knife', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/knife.svg', flags: {}, effects: [],
        system: { name: '', description: '', skill: 'melee_weapons', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D4', armorPiercing: 3, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Melee Weapons', name: 'Long knife or combat dagger', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/combat-knife.svg', flags: {}, effects: [],
        system: { name: '', description: '', skill: 'melee_weapons', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D6', armorPiercing: 3, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Melee Weapons', name: 'Hatchet', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/hatchet.svg', flags: {}, effects: [],
        system: { name: '', description: '', skill: 'melee_weapons', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D4', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Melee Weapons', name: 'Club, nightstick, baton, or collapsible baton', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/baton.svg', flags: {}, effects: [],
        system: { name: '', description: '', skill: 'melee_weapons', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D6', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Melee Weapons', name: 'Baseball bat or rifle butt', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/baseball-bat.svg', flags: {}, effects: [],
        system: { name: '', description: '', skill: 'melee_weapons', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D8', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Melee Weapons', name: 'Machete, tomahawk, or sword', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/tomahawk.svg', flags: {}, effects: [],
        system: { name: '', description: '', skill: 'melee_weapons', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D8', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Melee Weapons', name: 'Spear or fixed bayonet', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/bayonet.svg', flags: {}, effects: [],
        system: { name: '', description: '', skill: 'melee_weapons', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D8', armorPiercing: 3, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Melee Weapons', name: 'Wood axe', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/wood-axe.svg', flags: {}, effects: [],
        system: { name: '', description: '', skill: 'melee_weapons', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D10', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Melee Weapons', name: 'Long sword', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/long-sword.svg', flags: {}, effects: [],
        system: { name: '', description: '', skill: 'melee_weapons', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D10', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'Standard', equipped: true }
    },
    {
        category: 'Melee Weapons', name: 'Two-handed sword', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/two-handed-sword.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Requires special training.</em></p>', skill: 'melee_weapons', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '1D12', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '', expense: 'Standard', equipped: true }
    },

    // ── HEAVY WEAPONS ─────────────────────────────────────────────────────────────
    {
        category: 'Heavy Weapons', name: 'Hand grenade', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/grenade.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Requires special training. <strong>RESTRICTED.</strong> Examples: M67, RGO. Includes +20% blast-zone bonus.</em></p>', skill: 'athletics', skillModifier: 20, customSkillTarget: 50, range: '20M', damage: '', armorPiercing: 0, lethality: 15, isLethal: true, killRadius: '10M', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Heavy Weapons', name: 'Grenade launcher (GL)', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/grenade.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Revolver capacity: 6. Examples: Colt M203, H&amp;K M320, Springfield M79. Includes +20% blast-zone bonus.</em></p>', skill: 'heavy_weapons', skillModifier: 20, customSkillTarget: 50, range: '150M', damage: '', armorPiercing: 0, lethality: 15, isLethal: true, killRadius: '10M', ammo: '1', expense: 'Major', equipped: true }
    },
    {
        category: 'Heavy Weapons', name: 'Grenade machine gun (GMG)', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/grenade.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> If firing a burst (5 grenades), Lethality is 20%. Examples: H&amp;K GMG, Saco MK 19 MOD 3. Includes +20% blast-zone bonus.</em></p>', skill: 'heavy_weapons', skillModifier: 20, customSkillTarget: 50, range: '300M', damage: '', armorPiercing: 0, lethality: 15, isLethal: true, killRadius: '10M', ammo: '30', expense: 'Major', equipped: true }
    },
    {
        category: 'Heavy Weapons', name: 'Rocket-propelled grenade launcher (RPG)', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/grenade.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Examples: ATK M72 LAW, Bazalt RPG-7V, Bofors AT4. Includes +20% blast-zone bonus.</em></p>', skill: 'heavy_weapons', skillModifier: 20, customSkillTarget: 50, range: '200M', damage: '', armorPiercing: 20, lethality: 30, isLethal: true, killRadius: '10M', ammo: '1', expense: 'Standard', equipped: true }
    },
    {
        category: 'Heavy Weapons', name: 'Light machine gun (LMG)', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/machine-gun.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Examples: FN MINIMI (M249 SAW), Molot RPK.</em></p>', skill: 'heavy_weapons', skillModifier: 0, customSkillTarget: 50, range: '200M', damage: '', armorPiercing: 3, lethality: 10, isLethal: true, killRadius: '1M', ammo: '100 or 200', expense: 'Major', equipped: true }
    },
    {
        category: 'Heavy Weapons', name: 'General-purpose machine gun (GPMG)', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/machine-gun.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Examples: FN MAG (M240), Kovrov PKM, Saco M60.</em></p>', skill: 'heavy_weapons', skillModifier: 0, customSkillTarget: 50, range: '300M', damage: '', armorPiercing: 3, lethality: 15, isLethal: true, killRadius: '1M', ammo: '100', expense: 'Major', equipped: true }
    },
    {
        category: 'Heavy Weapons', name: 'Heavy machine gun (HMG)', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/machine-gun.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Examples: Browning M2HB, Degtyaryov DShKM, Kovrov NSV.</em></p>', skill: 'heavy_weapons', skillModifier: 0, customSkillTarget: 50, range: '400M', damage: '', armorPiercing: 5, lethality: 20, isLethal: true, killRadius: '1M', ammo: '100', expense: 'Major', equipped: true }
    },
    {
        category: 'Heavy Weapons', name: 'Autocannon', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/autocannon.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Examples: ATK M242 Bushmaster, KBP 2A70.</em></p>', skill: 'heavy_weapons', skillModifier: 0, customSkillTarget: 50, range: '400M', damage: '', armorPiercing: 5, lethality: 30, isLethal: true, killRadius: '3M', ammo: '100', expense: 'Extreme', equipped: true }
    },
    {
        category: 'Heavy Weapons', name: 'Minigun', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/minigun.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Examples: Dillon GAU-17/A, GE M134, KBP GShG-7.62.</em></p>', skill: 'heavy_weapons', skillModifier: 0, customSkillTarget: 50, range: '300M', damage: '', armorPiercing: 5, lethality: 20, isLethal: true, killRadius: '3M', ammo: '4000', expense: 'Extreme', equipped: true }
    },
    {
        category: 'Heavy Weapons', name: 'Handheld flamethrower', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/flamethrower.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Example: Ion XM42.</em></p>', skill: 'heavy_weapons', skillModifier: 0, customSkillTarget: 50, range: '5M', damage: '', armorPiercing: 0, lethality: 10, isLethal: true, killRadius: '1M', ammo: '20', expense: 'Unusual', equipped: true }
    },
    {
        category: 'Heavy Weapons', name: 'Military flamethrower', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/flamethrower.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Example: AEC M9A1-7.</em></p>', skill: 'heavy_weapons', skillModifier: 0, customSkillTarget: 50, range: '10M', damage: '', armorPiercing: 0, lethality: 10, isLethal: true, killRadius: '2M', ammo: '5', expense: 'Unusual', equipped: true }
    },

    // ── ARTILLERY ─────────────────────────────────────────────────────────────────
    {
        category: 'Artillery', name: 'Light mortar', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/mortar.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Examples: M224, Hirtenberger M6.</em></p>', skill: 'artillery', skillModifier: 20, customSkillTarget: 50, range: '2KM', damage: '', armorPiercing: 0, lethality: 20, isLethal: true, killRadius: '25M', ammo: '1', expense: 'Major', equipped: true }
    },
    {
        category: 'Artillery', name: 'Heavy mortar', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/mortar.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Examples: M120, 2B11 Sani.</em></p>', skill: 'artillery', skillModifier: 20, customSkillTarget: 50, range: '4KM', damage: '', armorPiercing: 5, lethality: 35, isLethal: true, killRadius: '50M', ammo: '1', expense: 'Major', equipped: true }
    },
    {
        category: 'Artillery', name: 'General-purpose bomb', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/general-purpose-bomb.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Requires special training. Examples: MK 82, FAB-250.</em></p>', skill: 'artillery', skillModifier: 20, customSkillTarget: 50, range: 'Air-dropped', damage: '', armorPiercing: 10, lethality: 70, isLethal: true, killRadius: '100M', ammo: '', expense: 'Unusual', equipped: true }
    },
    {
        category: 'Artillery', name: 'Anti-tank guided missile (ATGM)', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/rocket.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Examples: AGM-114 Hellfire, 9M120 Ataka. Includes +20% blaze-zone bonus.</em></p>', skill: 'artillery', skillModifier: 20, customSkillTarget: 50, range: '4KM', damage: '', armorPiercing: 25, lethality: 45, isLethal: true, killRadius: '50M', ammo: '', expense: 'Extreme', equipped: true }
    },
    {
        category: 'Artillery', name: 'Cruise missile', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/cruise-missile.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Requires special training. Examples: BGM-109 Tomahawk, Kh-55SM. Includes +20% blaze-zone bonus.</em></p>', skill: 'artillery', skillModifier: 20, customSkillTarget: 50, range: '100KM', damage: '', armorPiercing: 15, lethality: 80, isLethal: true, killRadius: '150M', ammo: '', expense: 'Extreme', equipped: true }
    },

    // ── DEMOLITIONS ───────────────────────────────────────────────────────────────
    {
        category: 'Demolitions', name: 'ANFO explosive', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/anfo.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Ammonium nitrate fuel oil — requires Science (Chemistry) and Demolitions skills. Includes +20% blast-zone bonus.</em></p>', skill: 'demolitions', skillModifier: 20, customSkillTarget: 50, range: '', damage: '', armorPiercing: 0, lethality: 30, isLethal: true, killRadius: '20M', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Demolitions', name: 'Improvised explosive device (IED)', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/ied.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED</strong>, though the ingredients usually are not. Example: Pipe bomb. Includes +20% blast-zone bonus.</em></p>', skill: 'demolitions', skillModifier: 20, customSkillTarget: 50, range: '', damage: '', armorPiercing: 0, lethality: 15, isLethal: true, killRadius: '10M', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Demolitions', name: 'Large IED', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/ied.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED</strong>, though the ingredients usually are not. Example: Car bomb. Includes +20% blast-zone bonus.</em></p>', skill: 'demolitions', skillModifier: 20, customSkillTarget: 50, range: '', damage: '', armorPiercing: 0, lethality: 60, isLethal: true, killRadius: '75M', ammo: '', expense: 'Standard', equipped: true }
    },
    {
        category: 'Demolitions', name: 'C4 plastic explosive block, 570 g', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/c4.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Example: M112. Includes +20% blast-zone bonus.</em></p>', skill: 'demolitions', skillModifier: 20, customSkillTarget: 50, range: '', damage: '', armorPiercing: 0, lethality: 30, isLethal: true, killRadius: '2M', ammo: '', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Demolitions', name: 'Explosively formed penetrator mine', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/penetrator-mine.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Example: M21. Includes +20% blast-zone bonus.</em></p>', skill: 'demolitions', skillModifier: 20, customSkillTarget: 50, range: '', damage: '', armorPiercing: 20, lethality: 25, isLethal: true, killRadius: '10M', ammo: '', expense: 'Standard', equipped: true }
    },

    // ── LESS-LETHAL ───────────────────────────────────────────────────────────────
    {
        category: 'Less-Lethal', name: 'Stun gun', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/electroshock.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>Victim\'s Penalty:</strong> \u221220% for 1D20 turns</em></p>', skill: 'unarmed_combat', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '10', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Less-Lethal', name: 'Shock baton', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/electroshock.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>Victim\'s Penalty:</strong> \u221220% for 1D20 turns</em></p>', skill: 'melee_weapons', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '200', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Less-Lethal', name: 'CED pistol', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/electroshock.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Requires special training. <strong>Victim\'s Penalty:</strong> \u221220% for 1D20 turns</em></p>', skill: 'firearms', skillModifier: 0, customSkillTarget: 50, range: '4M', damage: '', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '4', expense: 'Standard', equipped: true }
    },
    {
        category: 'Less-Lethal', name: 'Flash-bang grenade, thrown', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/flash-bang-grenade.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>Restricted.</strong> Requires special training. Radius halved outdoors. Radius: 10 m. <strong>Victim\'s Penalty:</strong> \u221240% for 1D6 turns</em></p>', skill: 'athletics', skillModifier: 0, customSkillTarget: 50, range: '20M', damage: '', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '1', expense: 'Standard', equipped: true }
    },
    {
        category: 'Less-Lethal', name: 'Flash-bang grenade, launched', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/flash-bang-grenade.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>Restricted.</strong> Radius halved outdoors. Radius: 10 m. <strong>Victim\'s Penalty:</strong> \u221240% for 1D6 turns</em></p>', skill: 'heavy_weapons', skillModifier: 0, customSkillTarget: 50, range: '50M', damage: '', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '1', expense: 'Standard', equipped: true }
    },
    {
        category: 'Less-Lethal', name: 'Tear gas grenade, thrown', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/tear-gas-grenade.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>Restricted.</strong> Requires special training. Radius: 10 m. <strong>Victim\'s Penalty:</strong> \u221240% for 1 hr</em></p>', skill: 'athletics', skillModifier: 0, customSkillTarget: 50, range: '20M', damage: '', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: '10M', ammo: '1', expense: 'Standard', equipped: true }
    },
    {
        category: 'Less-Lethal', name: 'Tear gas grenade, launched', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/tear-gas-grenade.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>Restricted. Radius:</strong> 10 m. <strong>Victim\'s Penalty:</strong> \u221240% for 1 hr</em></p>', skill: 'heavy_weapons', skillModifier: 0, customSkillTarget: 50, range: '50M', damage: '', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: '10M', ammo: '1', expense: 'Standard', equipped: true }
    },
    {
        category: 'Less-Lethal', name: 'Pepper spray keychain', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/pepper-spray-keychain.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Radius: 1 target. <strong>Victim\'s Penalty:</strong> \u221220% for 1 hr</em></p>', skill: 'unarmed_combat', skillModifier: 0, customSkillTarget: 50, range: '1M', damage: '', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '1', expense: 'Incidental', equipped: true }
    },
    {
        category: 'Less-Lethal', name: 'Pepper spray can', type: 'weapon',
        img: 'systems/deltagreen/assets/icons/pepper-spray-can.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Radius: 2 targets. <strong>Victim\'s Penalty:</strong> \u221220% for 1 hr</em></p>', skill: 'unarmed_combat', skillModifier: 0, customSkillTarget: 50, range: '3M', damage: '', armorPiercing: 0, lethality: 0, isLethal: false, killRadius: 'N/A', ammo: '12', expense: 'Incidental', equipped: true }
    },

    // ── ARMOR ─────────────────────────────────────────────────────────────────────
    {
        category: 'Armor', name: 'Kevlar vest', type: 'armor',
        img: 'systems/deltagreen/assets/icons/kevlar-vest.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>If worn below outer garments, noticing it requires an Alertness test.</em></p>', protection: 3, equipped: true, expense: 'Standard' }
    },
    {
        category: 'Armor', name: 'Reinforced Kevlar vest', type: 'armor',
        img: 'systems/deltagreen/assets/icons/kevlar-vest.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>If worn below outer garments, noticing it requires an Alertness test at +20%.</em></p>', protection: 4, equipped: true, expense: 'Unusual' }
    },
    {
        category: 'Armor', name: 'Tactical body armor', type: 'armor',
        img: 'systems/deltagreen/assets/icons/tactical-body-armor.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Cannot be concealed.</em></p>', protection: 5, equipped: true, expense: 'Unusual' }
    },
    {
        category: 'Armor', name: 'Kevlar helmet', type: 'armor',
        img: 'systems/deltagreen/assets/icons/helmet.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Adds its Armor Rating to any other armor. Cannot be concealed.</em></p>', protection: 1, equipped: true, expense: 'Standard' }
    },
    {
        category: 'Armor', name: 'Riot helmet', type: 'armor',
        img: 'systems/deltagreen/assets/icons/helmet.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Adds its Armor Rating to any other armor. Effective only against melee, thrown, and unarmed attacks. Cannot be concealed.</em></p>', protection: 1, equipped: true, expense: 'Standard' }
    },
    {
        category: 'Armor', name: 'Bomb suit', type: 'armor',
        img: 'systems/deltagreen/assets/icons/bomb-suit.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Already includes a helmet. Cannot be concealed.</em></p>', protection: 10, equipped: true, expense: 'Extreme' }
    },

    // ── SURVEILLANCE ──────────────────────────────────────────────────────────────
    {
        category: 'Surveillance', name: 'Simple directional microphone', type: 'gear',
        img: 'systems/deltagreen/assets/icons/microphone.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Surveillance', name: 'Voice-activated recorder', type: 'gear',
        img: 'systems/deltagreen/assets/icons/sound.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Surveillance', name: 'Directional microphone & acoustic software', type: 'gear',
        img: 'systems/deltagreen/assets/icons/microphone.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>20 m. range in typical urban conditions. Advanced versions have 50 m. range as an Unusual expense.</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Surveillance', name: 'Fiber optic scope', type: 'gear',
        img: 'systems/deltagreen/assets/icons/optics.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Surveillance', name: 'Bug detector', type: 'gear',
        img: 'systems/deltagreen/assets/icons/bug-detector.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Surveillance', name: 'GPS tracking device', type: 'gear',
        img: 'systems/deltagreen/assets/icons/gps-tracking.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Unusual' }
    },
    {
        category: 'Surveillance', name: 'GPS jammer', type: 'gear',
        img: 'systems/deltagreen/assets/icons/jammer.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Surveillance', name: 'Audio jammer (RF/cellular)', type: 'gear',
        img: 'systems/deltagreen/assets/icons/jammer.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Unusual' }
    },
    {
        category: 'Surveillance', name: 'Basic, open-market drone', type: 'gear',
        img: 'systems/deltagreen/assets/icons/drone.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Requires special training (DEX).</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Surveillance', name: 'Advanced drone', type: 'gear',
        img: 'systems/deltagreen/assets/icons/drone.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Requires Pilot (Drone) skill.</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Surveillance', name: 'Military-grade drone', type: 'gear',
        img: 'systems/deltagreen/assets/icons/drone.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Requires Pilot (Drone) skill; can carry weapons.</em></p>', equipped: true, expense: 'Extreme' }
    },
    {
        category: 'Surveillance', name: 'Ground-penetrating radar', type: 'gear',
        img: 'systems/deltagreen/assets/icons/ground-penetrating-radar.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>About the size of a lawn mower; requires special training (INT).</em></p>', equipped: true, expense: 'Major' }
    },

    // ── COMMS & TECH ──────────────────────────────────────────────────────────────
    {
        category: 'Comms & Tech', name: 'Burner phone', type: 'gear',
        img: 'systems/deltagreen/assets/icons/phone.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Comms & Tech', name: 'Short-range walkie talkie or early-generation mobile phone', type: 'gear',
        img: 'systems/deltagreen/assets/icons/walkie-talkie.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Comms & Tech', name: 'Earpiece communication set', type: 'gear',
        img: 'systems/deltagreen/assets/icons/sound.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Comms & Tech', name: 'Tablet computer or smartphone', type: 'gear',
        img: 'systems/deltagreen/assets/icons/tablet.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Comms & Tech', name: 'Satellite phone', type: 'gear',
        img: 'systems/deltagreen/assets/icons/satellite-phone.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Unusual' }
    },
    {
        category: 'Comms & Tech', name: 'Ordinary computer', type: 'gear',
        img: 'systems/deltagreen/assets/icons/computer.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Comms & Tech', name: 'Powerful computer', type: 'gear',
        img: 'systems/deltagreen/assets/icons/computer.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Major' }
    },
    {
        category: 'Comms & Tech', name: 'Portable IMSI catcher for cell surveillance', type: 'gear',
        img: 'systems/deltagreen/assets/icons/imsi-catcher.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Cannot be concealed.</em></p>', equipped: true, expense: 'Major' }
    },
    {
        category: 'Comms & Tech', name: '"Script kiddie" hacking software', type: 'gear',
        img: 'systems/deltagreen/assets/icons/software.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Requires Computer Science; a failed Luck roll indicates it\'s faulty.</em></p>', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Comms & Tech', name: 'Advanced data-analysis software', type: 'gear',
        img: 'systems/deltagreen/assets/icons/software.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Requires Computer Science or special training (INT).</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Comms & Tech', name: 'Cutting-edge encryption or data-mining software', type: 'gear',
        img: 'systems/deltagreen/assets/icons/software.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Requires Computer Science or special training (INT).</em></p>', equipped: true, expense: 'Major' }
    },
    {
        category: 'Comms & Tech', name: '3D printer (plastic)', type: 'gear',
        img: 'systems/deltagreen/assets/icons/3d-printer.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Comms & Tech', name: '3D printer (metal)', type: 'gear',
        img: 'systems/deltagreen/assets/icons/3d-printer.svg', flags: {}, effects: [],
        system: { name: '', description: '', equipped: true, expense: 'Major' }
    },

    // ── OPTICS & VISION ───────────────────────────────────────────────────────────
    {
        category: 'Optics & Vision', name: 'Large flashlight', type: 'gear',
        img: 'systems/deltagreen/assets/icons/flashlight.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Useful to 100 m. Runs for 10 hours.</em></p>', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Optics & Vision', name: 'Tactical light or weapon light', type: 'gear',
        img: 'systems/deltagreen/assets/icons/flashlight.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Useful to 50 m. Runs for 1 hour. Available with optional IR or UV filters.</em></p>', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Optics & Vision', name: 'Ordinary binoculars', type: 'gear',
        img: 'systems/deltagreen/assets/icons/binoculars.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>\u00d710 magnification; allows Alertness tests at greater distance.</em></p>', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Optics & Vision', name: 'Advanced binoculars or telescope', type: 'gear',
        img: 'systems/deltagreen/assets/icons/binoculars.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>\u00d720 magnification; allows Alertness tests at greater distance.</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Optics & Vision', name: 'Powerful telescope', type: 'gear',
        img: 'systems/deltagreen/assets/icons/telescope.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>\u00d750 magnification; allows Alertness tests at greater distance.</em></p>', equipped: true, expense: 'Unusual' }
    },
    {
        category: 'Optics & Vision', name: 'Civilian night vision goggles (NVG)', type: 'gear',
        img: 'systems/deltagreen/assets/icons/goggles.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Allows operating in reduced light. Most skill tests at \u221220% penalty. Runs for 100 hours.</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Optics & Vision', name: 'Military-grade night vision goggles', type: 'gear',
        img: 'systems/deltagreen/assets/icons/goggles.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Allows operating in reduced light. Most skills at no penalty; finely detailed perception at \u221220%.</em></p>', equipped: true, expense: 'Major' }
    },

    // ── WEAPON ACCESSORIES ────────────────────────────────────────────────────────
    {
        category: 'Weapon Accessories', name: 'Holographic sight', type: 'gear',
        img: 'systems/deltagreen/assets/icons/holographic-sight.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>+20% bonus to hit as long as the Agent has taken no damage since their last action.</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Weapon Accessories', name: 'Telescopic sight', type: 'gear',
        img: 'systems/deltagreen/assets/icons/telescopic-sight.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Doubles a firearm\'s base range if the Agent spent the previous turn taking the Aim action.</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Weapon Accessories', name: 'Targeting laser', type: 'gear',
        img: 'systems/deltagreen/assets/icons/laser.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>+20% bonus to hit if undamaged since last action. Useful to 200 m. Runs for 100 hours. Also available with IR mode (Unusual expense).</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Weapon Accessories', name: 'Night vision sight', type: 'gear',
        img: 'systems/deltagreen/assets/icons/optics.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Allows aiming in reduced light. Useful to 400 m. Runs for 100 hours. Doubles a firearm\'s base range at night if the Agent spends the previous turn Aiming.</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Weapon Accessories', name: 'Thermal Weapon Sight (TWS)', type: 'gear',
        img: 'systems/deltagreen/assets/icons/optics.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Allows aiming in complete darkness. Useful to 400 m. Runs for two hours. Doubles range if Agent spent previous turn Aiming.</em></p>', equipped: true, expense: 'Unusual' }
    },
    {
        category: 'Weapon Accessories', name: 'Advanced Combat Optical Gunsight (ACOG)', type: 'gear',
        img: 'systems/deltagreen/assets/icons/acog.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Combines holographic sight and telescopic sight: +20% to hit if undamaged; doubles range if previous turn spent Aiming.</em></p>', equipped: true, expense: 'Unusual' }
    },
    {
        category: 'Weapon Accessories', name: 'Sound suppressor', type: 'gear',
        img: 'systems/deltagreen/assets/icons/suppressor.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em><strong>RESTRICTED.</strong> Requires an Alertness test to hear from beyond a wall or door.</em></p>', equipped: true, expense: 'Standard' }
    },

    // ── ENTRY TOOLS ───────────────────────────────────────────────────────────────
    {
        category: 'Entry Tools', name: 'Lockpick kit', type: 'gear',
        img: 'systems/deltagreen/assets/icons/lockpick-kit.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Requires special training (DEX).</em></p>', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Entry Tools', name: 'Halligan forcible-entry tool', type: 'gear',
        img: 'systems/deltagreen/assets/icons/forcible-entry-tool.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Allows a STR test to get through a hard barrier.</em></p>', equipped: true, expense: 'Standard' }
    },

    // ── RESTRAINTS ────────────────────────────────────────────────────────────────
    {
        category: 'Restraints', name: 'Handcuffs', type: 'gear',
        img: 'systems/deltagreen/assets/icons/handcuffs.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Require a cuff key, special training with lockpicks, or Craft (Locksmith) to open; or a DEX\u00d75 test at \u221220% to wriggle out.</em></p>', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Restraints', name: 'Flexible cuffs', type: 'gear',
        img: 'systems/deltagreen/assets/icons/flexible-cuffs.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Requires a blade or scissors to cut open. A zip-tie used as makeshift cuffs can be broken with a STR\u00d75 test at +20%.</em></p>', equipped: true, expense: 'Incidental' }
    },

    // ── SURVIVAL & MEDICAL ────────────────────────────────────────────────────────
    {
        category: 'Survival & Medical', name: 'Individual first aid kit', type: 'gear',
        img: 'systems/deltagreen/assets/icons/first-aid-kit.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Adds +20% to a single First Aid roll.</em></p>', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Survival & Medical', name: 'First responder medical kit', type: 'gear',
        img: 'systems/deltagreen/assets/icons/first-aid-kit.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Bandages, IV kits and fluids, medications, stethoscope, suture and intubation kits, hemostatic gel. Adds +20% to four First Aid rolls.</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Survival & Medical', name: 'Basic camping gear', type: 'gear',
        img: 'systems/deltagreen/assets/icons/camping-gear.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Daypack, bivouac sack, survival blanket, compass, flashlight, matches, meal bars, water purification tablets. Grants +20% to Survival for 3 days.</em></p>', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Survival & Medical', name: 'Extended camping gear', type: 'gear',
        img: 'systems/deltagreen/assets/icons/camping-gear.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Large backpack, sleeping bag, tent, compass, headlamp, firestarter, dehydrated meals, water filter, canister stove. Grants +20% to Survival for 14 days.</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Survival & Medical', name: 'Handheld GPS', type: 'gear',
        img: 'systems/deltagreen/assets/icons/handheld-gps.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Does not require a radio signal. Battery life is 14 to 25 hours.</em></p>', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Survival & Medical', name: 'SCUBA gear', type: 'gear',
        img: 'systems/deltagreen/assets/icons/scuba-gear.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Requires special training (Swim).</em></p>', equipped: true, expense: 'Unusual' }
    },
    {
        category: 'Survival & Medical', name: 'Personal protection equipment (PPE)', type: 'gear',
        img: 'systems/deltagreen/assets/icons/ppe.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Apron, goggles, gloves, breath mask; provides 2 Armor against chemical and acid splashes and fumes.</em></p>', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Survival & Medical', name: 'Gas mask', type: 'gear',
        img: 'systems/deltagreen/assets/icons/gas-mask.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Effective against airborne hazards.</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Survival & Medical', name: 'HAZMAT suit', type: 'gear',
        img: 'systems/deltagreen/assets/icons/hazmat-suit.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Effective against airborne or contact hazards. Requires 30 minutes to don safely.</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Survival & Medical', name: 'Small fire extinguisher (CO2)', type: 'gear',
        img: 'systems/deltagreen/assets/icons/fire-extinguisher.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Douses a small fire. Can be used with a DEX\u00d75 test to spray an animal in the face to make it run away.</em></p>', equipped: true, expense: 'Incidental' }
    },
    {
        category: 'Survival & Medical', name: 'Heavy-duty fire extinguisher', type: 'gear',
        img: 'systems/deltagreen/assets/icons/fire-extinguisher.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Douses a room-sized fire.</em></p>', equipped: true, expense: 'Standard' }
    },
    {
        category: 'Survival & Medical', name: 'Polypropylene barrel filled with acid', type: 'gear',
        img: 'systems/deltagreen/assets/icons/acid.svg', flags: {}, effects: [],
        system: { name: '', description: '<p><em>Sufficient to reduce a corpse to sludge. Remember to wear PPE!</em></p>', equipped: true, expense: 'Unusual' }
    },

]; // end DG_EQUIPMENT_CATALOG
