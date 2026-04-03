/**
 * DELTA GREEN STATS — DD Form 315 PDF Export
 *
 * Lazy-loads pdf-lib from CDN, fetches the hosted DD Form 315 fillable PDF,
 * populates the AcroForm fields by name, and triggers a download.
 *
 * Field names were extracted directly from the PDF AcroForm dictionary.
 */
(function () {
    "use strict";

    const TEMPLATE_URL = "assets/Delta-Green-RPG-Character-Sheet.pdf";
    const PDF_LIB_CDN = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";

    const SKILL_FIELD = {
        accounting: "Accounting 10",
        alertness: "Alertness 20",
        anthropology: "Anthropology 0",
        archeology: "Archeology 0",
        art: "Art 0",
        artillery: "Artillery 0",
        athletics: "Athletics 30",
        bureaucracy: "Bureaucracy 10",
        computer_science: "Computer Science 0",
        craft: "Craft 0",
        criminology: "Criminology 10",
        demolitions: "Demolitions 0",
        disguise: "Disguise 10",
        dodge: "Dodge 30",
        drive: "Drive 20",
        firearms: "Firearms 20",
        first_aid: "First Aid 10",
        forensics: "Forensics 0",
        heavy_machiner: "Heavy Machinery 10",
        heavy_weapons: "Heavy Weapons 0",
        history: "History 10",
        humint: "HUMINT 10",
        law: "Law 0",
        medicine: "Medicine 0",
        melee_weapons: "Melee Weapons 30",
        military_science: "Military Science 0",
        navigate: "Navigate 10",
        occult: "Occult 10",
        persuade: "Persuade 20",
        pharmacy: "Pharmacy 0",
        pilot: "Pilot 0",
        psychotherapy: "Psychotherapy 10",
        ride: "Ride 10",
        science: "Science 0",
        search: "Search 20",
        sigint: "SIGINT 0",
        stealth: "Stealth 10",
        surgery: "Surgery 0",
        survival: "Survival 10",
        swim: "Swim 20",
        unarmed_combat: "Unarmed Combat 40",
        unnatural: "Unnatural 0",
    };

    const SPECIALTY_LABEL_FIELD = {
        art: "Art",
        craft: "Craft",
        pilot: "Pilot",
        science: "Science",
        military_science: "Military Science",
    };

    const WEAPON_LETTERS = ["a", "b", "c", "d", "e", "f", "g"];

    /**
     * Returns up to 7 weapon rows for the PDF.
     * LP theme populates lpWeapons directly; other themes fall back to the
     * equipment picker loadout (which carries full item data including stats).
     */
    function getWeaponRows(lpWeapons) {
        if (lpWeapons.length > 0) return lpWeapons;
        if (typeof window.dgEquipment?.getLoadout !== "function") return [];
        return window.dgEquipment.getLoadout()
            .filter(item => item && item.type === "weapon")
            .map(item => {
                const s = item.system || {};
                const skillInput = document.getElementById("cs-skill-" + s.skill);
                const skillPct = skillInput ? (parseInt(skillInput.value) || 0) + "%" : "";
                return {
                    name: item.name || "",
                    skillPct,
                    range: s.range || "",
                    damage: s.isLethal ? "" : (s.damage || ""),
                    lethality: s.lethality ? s.lethality + "%" : "",
                    killRadius: s.killRadius || s.kill_radius || "",
                    ammo: s.ammo !== undefined ? String(s.ammo) : "",
                };
            });
    }

    function loadPdfLib() {
        return new Promise((resolve, reject) => {
            if (window.PDFLib) { resolve(); return; }
            const s = document.createElement("script");
            s.src = PDF_LIB_CDN;
            s.onload = resolve;
            s.onerror = () => reject(new Error("Could not load pdf-lib from CDN."));
            document.head.appendChild(s);
        });
    }

    function setField(form, fieldName, value) {
        if (value === null || value === undefined || value === "") return;
        const str = String(value).trim();
        if (!str) return;
        try { form.getTextField(fieldName).setText(str); } catch (_) { }
    }

    function checkBox(form, fieldName, doCheck) {
        if (!doCheck) return;
        try { form.getCheckBox(fieldName).check(); } catch (_) { }
    }

    async function exportToPDF() {
        if (window.showToast) showToast("Building PDF\u2026");
        try {
            await loadPdfLib();
            const { PDFDocument } = window.PDFLib;

            const bytes = await fetch(TEMPLATE_URL).then(r => {
                if (!r.ok) throw new Error("Template not found (HTTP " + r.status + ").");
                return r.arrayBuffer();
            });

            const pdfDoc = await PDFDocument.load(bytes);
            const form = pdfDoc.getForm();

            const state = window.dgSaveLoad.collectState();
            const bio = state.bio || {};
            const stats = state.csStats || state.stats || {};
            const derived = state.derived || {};
            const skills = state.skills || {};
            const skillSpec = state.skillSpecs || {};
            const bonds = state.bonds || [];
            const custom = state.customSkills || [];
            const specialtyInstances = state.specialtyInstances || [];
            const sanity = state.sanity || {};
            const lpNotes = state.lpNotes || {};
            const lpFeat = state.lpFeat || {};
            const lpWeapons = state.lpWeapons || [];
            const equipment = state.equipment || [];

            // Personal data
            setField(form, "1 LAST NAME FIRST NAME MIDDLE INITIAL", bio.name);
            setField(form, "2 PROFESSION RANK IF APPLICABLE", bio.profession);
            setField(form, "3 EMPLOYER", bio.employer);
            setField(form, "4 NATIONALITY", bio.nationality);
            setField(form, "SEX", bio.sex);
            setField(form, "6 AGE AND DOB", bio.age);
            setField(form, "7 EDUCATION AND OCCUPATION", bio.education);
            setField(form, "10 PHYSICAL DESCRIPTION", bio.physicalDesc);
            setField(form, "12 MOTIVATIONS AND MENTAL DISORDERSPSYCHOLOGICAL DATA", bio.motivations);

            // Statistics + distinguishing features
            ["STR", "CON", "DEX", "INT", "POW", "CHA"].forEach(st => {
                const val = stats[st] || 3;
                setField(form, st, String(val));
                setField(form, st + "x5", String(val * 5));
                // LP theme stores custom feat text in lp-feat-{st};
                // all themes always render a descriptor span #STR-descriptor etc. as fallback
                const feat = lpFeat[st]
                    || document.getElementById(st + "-descriptor")?.textContent?.trim()
                    || "";
                setField(form, st + " DISTINGUISHING FEATURES", feat);
            });

            // Derived attributes
            setField(form, "MAXIMUMHit Points HP", derived.hp);
            setField(form, "CURRENTHit Points HP", derived.hp);
            setField(form, "MAXIMUMWillpower Points WP", derived.wp);
            setField(form, "CURRENTWillpower Points WP", derived.wp);
            setField(form, "MAXIMUMSanity Points SAN", derived.san);
            setField(form, "CURRENTSanity Points SAN", derived.san);
            setField(form, "CURRENTBreaking Point BP", derived.bp);

            // Specialty skill keys that have both a score field and a label field in the PDF
            const SPECIALTY_KEYS = Object.keys(SPECIALTY_LABEL_FIELD); // art, craft, science, pilot, military_science
            const SPECIALTY_BASE_NAME = { art: "Art", craft: "Craft", science: "Science", pilot: "Pilot", military_science: "Military Science" };

            // Overflow specialty instances that don't fit the main row → Foreign Languages slots
            const overflowSpecialties = [];

            // Foreign Language has no PDF main-row field — all instances go straight to overflow
            specialtyInstances
                .filter(i => i.key === "foreign_language" && i.value > 0)
                .sort((a, b) => b.value - a.value)
                .forEach(inst => {
                    overflowSpecialties.push({
                        name: inst.specialty || "Foreign Language",
                        value: inst.value,
                    });
                });

            // Specialty skills: highest-value instance fills the main row; extras go to overflow
            SPECIALTY_KEYS.forEach(key => {
                const instances = specialtyInstances
                    .filter(i => i.key === key && i.value > 0)
                    .sort((a, b) => b.value - a.value);
                if (instances.length === 0) {
                    // Fall back to skills[key] + skillSpec[key] (old data or LP theme)
                    const val = skills[key];
                    if (val && val > 0) {
                        setField(form, SKILL_FIELD[key], String(val));
                        const spec = skillSpec[key];
                        if (spec) setField(form, SPECIALTY_LABEL_FIELD[key], spec);
                    }
                    return;
                }
                // Best instance → main row
                const best = instances[0];
                setField(form, SKILL_FIELD[key], String(best.value));
                setField(form, SPECIALTY_LABEL_FIELD[key], best.specialty || SPECIALTY_BASE_NAME[key]);
                // Remaining instances → overflow queue
                instances.slice(1).forEach(inst => {
                    const label = inst.specialty
                        ? SPECIALTY_BASE_NAME[key] + " (" + inst.specialty + ")"
                        : SPECIALTY_BASE_NAME[key];
                    overflowSpecialties.push({ name: label, value: inst.value });
                });
            });

            // Non-specialty skills
            Object.entries(SKILL_FIELD).forEach(([key, fieldName]) => {
                if (SPECIALTY_KEYS.includes(key)) return; // handled above
                const val = skills[key];
                if (val && val > 0) setField(form, fieldName, String(val));
            });

            // Bonds (up to 6)
            bonds.slice(0, 6).forEach((b, i) => {
                const n = i + 1;
                const name = b.name || b.label || "";
                const rel = b.relationship || "";
                const bondLabel = name && rel ? name + " (" + rel + ")" : name || rel;
                setField(form, "BOND " + n, bondLabel);
                setField(form, "BOND " + n + " SCORE", b.score != null ? String(b.score) : "");
            });

            // Foreign Languages / Other Skills — overflow specialties first, then custom skills (up to 6 total)
            // De-duplicate: skip customSkills whose name already appears in overflowSpecialties
            const overflowNames = new Set(overflowSpecialties.map(s => s.name.toLowerCase()));
            const foreignSlots = [
                ...overflowSpecialties,
                ...custom.filter(s => s.value > 0 && !overflowNames.has(s.name.toLowerCase())),
            ].slice(0, 6);
            foreignSlots.forEach((sk, i) => {
                const n = i + 1;
                setField(form, "Foreign Languages and Other Skills " + n, sk.name || "");
                setField(form, "Foreign Languages and Other Skills " + n + " Score", String(sk.value));
            });

            // SAN incident checkboxes — Box1-3 Violence, Box4-6 Helplessness
            (sanity.violence || []).forEach((v, i) => checkBox(form, "Check Box" + (i + 1), v));
            (sanity.helplessness || []).forEach((v, i) => checkBox(form, "Check Box" + (i + 4), v));

            // Page 2
            setField(form, "14 WOUNDS AND AILMENTS_2", lpNotes.wounds);

            // Gear — non-weapon loadout items (weapons go in the weapons table below)
            const gearLines = [];
            if (lpNotes.gear) gearLines.push(lpNotes.gear);
            if (typeof window.dgEquipment?.getLoadout === "function") {
                window.dgEquipment.getLoadout()
                    .filter(item => item && item.type !== "weapon")
                    .forEach(item => { if (item.name) gearLines.push(item.name); });
            } else {
                // Fallback: dump all equipment names (no type info available)
                equipment.forEach(n => { if (n) gearLines.push(n); });
            }
            setField(form, "15 ARMOR AND GEAR", gearLines.join("\n").trim());

            setField(form, "17 PERSONAL DETAILS AND NOTES", lpNotes.remarks);

            // Weapons — exact field names from PDF AcroForm dictionary
            const weaponRows = getWeaponRows(lpWeapons);
            weaponRows.slice(0, 7).forEach((w, i) => {
                const lt = WEAPON_LETTERS[i];
                setField(form, "WEAPON" + lt, w.name || "");
                setField(form, "SKILL " + lt, w.skillPct || "");
                setField(form, "BASE RANGE" + lt, w.range || "");
                setField(form, "DAMAGE" + lt, w.damage || "");
                setField(form, "KILL DAMAGE" + lt, w.lethality || "");
                setField(form, "KILL RADIUS" + lt, w.killRadius || "");
                setField(form, "AMMO " + lt, w.ammo || "");
            });

            // Special training — overflow custom skills beyond slot 6
            custom.filter(s => s.value > 0).slice(6).slice(0, 6).forEach((sk, i) => {
                const lt = WEAPON_LETTERS[i];
                setField(form, "SPECIAL TRAINING" + lt, sk.name || "");
                setField(form, "SKILL OR STAT" + lt, String(sk.value));
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const safeName = (bio.name || "Agent").replace(/[^a-z0-9 \-_]/gi, "").trim() || "Agent";
            const a = Object.assign(document.createElement("a"), {
                href: url,
                download: safeName + " - DD Form 315.pdf",
            });
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 8000);

            if (window.showToast) showToast("PDF downloaded!");
        } catch (err) {
            console.error("[DG PDF Export]", err);
            if (window.showToast) showToast("PDF export failed \u2014 see console for details.");
        }
    }

    window.exportToPDF = exportToPDF;
})();
