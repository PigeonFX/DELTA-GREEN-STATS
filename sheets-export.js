/**
 * DELTA GREEN STATS — Google Sheets / Excel Export
 *
 * Uses JSZip to open the .xlsx template as a zip, patches only the cell
 * values in the worksheet XML (leaving styles, merged cells, borders, images,
 * and every other byte completely intact), then re-downloads the patched .xlsx.
 * The user uploads it to Google Drive → instant Sheet with full formatting.
 *
 * Cell addresses were mapped from the template's merged-cell structure.
 */
(function () {
    "use strict";

    const TEMPLATE_URL = "assets/Delta-Green-character-sheet-template.xlsx";
    const JSZIP_CDN = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";

    // ── Skill key → score cell (Front sheet) ────────────────────────────
    const SKILL_CELL = {
        // Left column (score in L)
        accounting: "L28",
        alertness: "L29",
        anthropology: "L30",
        archeology: "L31",
        art: "L32",
        artillery: "L34",
        athletics: "L35",
        bureaucracy: "L36",
        computer_science: "L37",
        craft: "L38",
        criminology: "L40",
        demolitions: "L41",
        disguise: "L42",
        dodge: "L43",
        drive: "L44",
        firearms: "L45",
        // Middle column (score in X)
        first_aid: "X28",
        forensics: "X29",
        heavy_machiner: "X30",
        heavy_weapons: "X31",
        history: "X32",
        humint: "X33",
        law: "X34",
        medicine: "X35",
        melee_weapons: "X36",
        military_science: "X37",
        navigate: "X39",
        occult: "X40",
        persuade: "X41",
        pharmacy: "X42",
        pilot: "X43",
        psychotherapy: "X45",
        // Right column (score in AJ)
        ride: "AJ28",
        science: "AJ29",
        search: "AJ31",
        sigint: "AJ32",
        stealth: "AJ33",
        surgery: "AJ34",
        survival: "AJ35",
        swim: "AJ36",
        unarmed_combat: "AJ37",
        unnatural: "AJ38",
    };

    // ── Skill key → failure-checkbox cell (t="b" in template) ──────────
    // Left-column scores are in L → failure checkbox is in C (same row).
    // Middle-column scores are in X → failure checkbox is in O (same row).
    // Right-column scores are in AJ → failure checkbox is in AA (same row).
    const SKILL_CHECKBOX_CELL = {};
    Object.entries(SKILL_CELL).forEach(([key, addr]) => {
        const row = addr.match(/\d+/)[0];
        const col = addr.replace(/\d+$/, "");
        const cbCol = col === "L" ? "C" : col === "X" ? "O" : col === "AJ" ? "AA" : null;
        if (cbCol) SKILL_CHECKBOX_CELL[key] = cbCol + row;
    });

    // Specialty type label cells (second row of each expandable skill area)
    const SPECIALTY_LABEL_CELL = {
        art: "D33",
        craft: "D39",
        military_science: "P38",   // label col for middle skill column
        pilot: "P44",
        science: "AB30",  // label col for right skill column
    };
    const SPECIALTY_BASE_NAME = {
        art: "Art", craft: "Craft", science: "Science",
        pilot: "Pilot", military_science: "Military Science",
    };

    // Foreign language overflow rows (name → AB, score → AJ)
    const FOREIGN_ROWS = [40, 41, 42, 43, 44, 45];

    // ── JSZip loader ─────────────────────────────────────────────────────
    function loadJSZip() {
        return new Promise((resolve, reject) => {
            if (window.JSZip) { resolve(); return; }
            const s = document.createElement("script");
            s.src = JSZIP_CDN;
            s.onload = resolve;
            s.onerror = () => reject(new Error("Could not load JSZip from CDN."));
            document.head.appendChild(s);
        });
    }

    /**
     * Patch a cell's value directly in worksheet XML, preserving its style (s="N").
     *
     * Cell types handled:
     *  - Blank self-closing:   <c r="ADDR" s="N"/>
     *  - Boolean (t="b"):      <c r="ADDR" s="N" t="b"><v>0</v></c>
     *                          → writes 1 (true) or 0 (false), keeps t="b"
     *  - Shared-string label:  <c r="ADDR" s="N" t="s"><v>N</v></c>
     *                          → never overwritten (label cells)
     *  - Formula (t="str"):    <c r="ADDR" s="N" t="str"><f ...>...</f><v></v></c>
     *                          → overwritten: formula removed, becomes plain value cell
     *
     * Output formats:
     *  – number  → <c r="ADDR" s="N"><v>42</v></c>
     *  – boolean → <c r="ADDR" s="N" t="b"><v>1</v></c>
     *  – string  → <c r="ADDR" s="N" t="inlineStr"><is><t>text</t></is></c>
     */
    function writeCell(xml, addr, value) {
        if (value === null || value === undefined) return xml;
        const raw = typeof value === "number" ? value : (typeof value === "boolean" ? value : String(value).trim());
        if (typeof raw === "string" && !raw) return xml;

        // Find the cell opening tag: <c r="ADDR" ...
        const openTag = `<c r="${addr}"`;
        const openIdx = xml.indexOf(openTag);
        if (openIdx < 0) return xml; // cell not in this sheet

        // Read to end of the opening tag (find the >)
        const gtIdx = xml.indexOf(">", openIdx);
        if (gtIdx < 0) return xml;

        const tagContent = xml.slice(openIdx, gtIdx + 1); // includes the >

        // Extract style index from the opening tag attrs
        const sMatch = tagContent.match(/s="(\d+)"/);
        const s = sMatch ? ` s="${sMatch[1]}"` : "";

        // ── Shared-string labels (t="s"): never overwrite ────────────────
        if (/\bt="s"/.test(tagContent)) return xml;

        // ── Self-closing cell (tag ends with />) ─────────────────────────
        if (tagContent.endsWith("/>")) {
            const replacement = buildCellXml(addr, s, raw);
            return xml.slice(0, openIdx) + replacement + xml.slice(openIdx + tagContent.length);
        }

        // ── Cell with children — find the matching </c> ───────────────────
        // The XML is a single long line. Children are at most 2 levels deep
        // (<f> and <v> tags). We find </c> by scanning forward from gtIdx.
        const closeTag = "</c>";
        const closeIdx = xml.indexOf(closeTag, gtIdx);
        if (closeIdx < 0) return xml;

        const fullCell = xml.slice(openIdx, closeIdx + closeTag.length);

        // ── Boolean cell (t="b"): keep boolean type for true/false/0/1 inputs.
        // If a plain string is passed (e.g. a Unicode symbol), fall through and
        // overwrite the cell type entirely so it renders correctly.
        if (/\bt="b"/.test(tagContent) && typeof raw !== "string") {
            const boolVal = (raw === true || raw === 1) ? "1" : "0";
            const boolReplacement = `${tagContent}<v>${boolVal}</v>${closeTag}`;
            return xml.slice(0, openIdx) + boolReplacement + xml.slice(openIdx + fullCell.length);
        }

        // ── All other cells with children (formula, existing value) ──────
        const replacement = buildCellXml(addr, s, raw);
        return xml.slice(0, openIdx) + replacement + xml.slice(openIdx + fullCell.length);
    }

    function buildCellXml(addr, sAttr, raw) {
        if (typeof raw === "number") {
            return `<c r="${addr}"${sAttr}><v>${raw}</v></c>`;
        }
        const esc = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const sp = raw.includes("\n") ? ' xml:space="preserve"' : "";
        return `<c r="${addr}"${sAttr} t="inlineStr"><is><t${sp}>${esc}</t></is></c>`;
    }

    /**
     * After writeCell calls, any shared-formula primary that was overwritten
     * leaves secondary cells with orphaned <f t="shared" si="N"/> references.
     * Excel reports "Removed Records: Shared formula" for these.
     * This function finds surviving primary si= values and strips orphaned secondaries.
     */
    function cleanOrphanedSharedFormulas(xml) {
        // Collect si values whose primary definition still exists.
        // Primary cells have a non-self-closing <f> with both t="shared" and ref=
        const primaries = new Set();
        const primaryRe = /<f t="shared" ref="[^"]*" si="(\d+)">|<f t="shared" si="(\d+)" ref="[^"]*">/g;
        let m;
        while ((m = primaryRe.exec(xml)) !== null) {
            primaries.add(m[1] || m[2]);
        }

        // Replace orphaned secondary cells:
        // <c r="ADDR" s="N" t="str"><f t="shared" si="N"/><v>VAL</v></c>
        // → <c r="ADDR" s="N"><v>VAL</v></c>
        return xml.replace(
            /<c r="([^"]+)" s="(\d+)" t="str"><f t="shared" si="(\d+)"\/>(<v>[^<]*<\/v>)<\/c>/g,
            (whole, addr, styleIdx, si, vTag) => {
                if (primaries.has(si)) return whole; // primary still exists
                return `<c r="${addr}" s="${styleIdx}">${vTag}</c>`;
            }
        );
    }

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

    // ── Main export ──────────────────────────────────────────────────────
    async function exportToSheets() {
        if (window.showToast) showToast("Building spreadsheet\u2026");
        try {
            await loadJSZip();

            const bytes = await fetch(TEMPLATE_URL).then(r => {
                if (!r.ok) throw new Error("Template not found (HTTP " + r.status + ").");
                return r.arrayBuffer();
            });

            // Open the .xlsx as a zip — all styles/images/merges stay untouched
            const zip = await JSZip.loadAsync(bytes);
            let s1 = await zip.file("xl/worksheets/sheet1.xml").async("string");
            let s2 = await zip.file("xl/worksheets/sheet2.xml").async("string");

            const state = window.dgSaveLoad.collectState();
            const bio = state.bio || {};
            const stats = state.csStats || state.stats || {};
            const derived = state.derived || {};
            const skills = state.skills || {};
            const skillSpec = state.skillSpecs || {};
            const specialtyInstances = state.specialtyInstances || [];
            const bonds = state.bonds || [];
            const custom = state.customSkills || [];
            const sanity = state.sanity || {};
            const lpCheckedSkills = state.lpCheckedSkills || [];
            const lpNotes = state.lpNotes || {};
            const lpFeat = state.lpFeat || {};
            const lpWeapons = state.lpWeapons || [];
            const equipment = state.equipment || [];

            // ── Front: Personal data ─────────────────────────────────────
            s1 = writeCell(s1, "C6", bio.name);
            s1 = writeCell(s1, "U6", bio.profession);
            s1 = writeCell(s1, "C8", bio.employer);
            s1 = writeCell(s1, "U8", bio.nationality);
            s1 = writeCell(s1, "C10", bio.sex);
            s1 = writeCell(s1, "K10", bio.age);
            s1 = writeCell(s1, "Q10", bio.education);
            s1 = writeCell(s1, "C25", bio.physicalDesc);
            s1 = writeCell(s1, "V20", bio.motivations);

            // ── Front: Stats + distinguishing features ───────────────────
            ["STR", "CON", "DEX", "INT", "POW", "CHA"].forEach((st, i) => {
                const row = 13 + i;
                const val = parseInt(stats[st]) || 0;
                if (val) s1 = writeCell(s1, "H" + row, val);
                const feat = lpFeat[st]
                    || document.getElementById(st + "-descriptor")?.textContent?.trim()
                    || "";
                if (feat) s1 = writeCell(s1, "L" + row, feat);
            });

            // ── Front: Derived current values (max/formula cells untouched)
            if (derived.hp) s1 = writeCell(s1, "P20", parseInt(derived.hp));
            if (derived.wp) s1 = writeCell(s1, "P21", parseInt(derived.wp));

            // ── Front: Bonds ─────────────────────────────────────────────
            bonds.slice(0, 6).forEach((b, i) => {
                const row = 13 + i;
                const name = b.name || b.label || "";
                const rel = b.relationship || "";
                const label = name && rel ? name + " (" + rel + ")" : name || rel;
                if (label) s1 = writeCell(s1, "V" + row, label);
                // Overwrite default formula cell with actual stored bond score
                if (b.score != null) s1 = writeCell(s1, "AJ" + row, parseInt(b.score) || 0);
            });

            // ── Front: SAN checkboxes ────────────────────────────────────
            // Unicode ballot boxes render correctly in Excel, Google Sheets,
            // and every other viewer. Interactive OOXML checkboxes are not
            // cross-compatible between Excel and Google Sheets — this is the
            // correct approach for portable, visually clear output.
            (sanity.violence || []).forEach((v, i) => {
                const cols = ["X", "Y", "Z"];
                if (cols[i]) s1 = writeCell(s1, cols[i] + "26", v ? "☑" : "☐");
            });
            (sanity.helplessness || []).forEach((v, i) => {
                const cols = ["AG", "AH", "AI"];
                if (cols[i]) s1 = writeCell(s1, cols[i] + "26", v ? "☑" : "☐");
            });

            // ── Front: Skill failure checkboxes ──────────────────────────
            const checkedSkillKeys = new Set(
                lpCheckedSkills.filter(s => s.type === "key").map(s => s.key)
            );
            const checkedSkillNames = new Set(
                lpCheckedSkills.filter(s => s.type === "name").map(s => s.name.toLowerCase())
            );
            Object.entries(SKILL_CHECKBOX_CELL).forEach(([key, addr]) => {
                const checked = checkedSkillKeys.has(key);
                s1 = writeCell(s1, addr, checked ? "☑" : "☐");
            });

            // ── Front: Specialty skills ───────────────────────────────────
            const SPECIALTY_KEYS = Object.keys(SPECIALTY_LABEL_CELL);
            const overflowSpecialties = [];

            // Foreign languages — all instances go to overflow rows
            specialtyInstances
                .filter(i => i.key === "foreign_language" && i.value > 0)
                .sort((a, b) => b.value - a.value)
                .forEach(inst => overflowSpecialties.push({
                    name: inst.specialty || "Foreign Language",
                    value: inst.value,
                }));

            SPECIALTY_KEYS.forEach(key => {
                const instances = specialtyInstances
                    .filter(i => i.key === key && i.value > 0)
                    .sort((a, b) => b.value - a.value);
                if (instances.length === 0) {
                    const val = skills[key];
                    if (val && val > 0) {
                        s1 = writeCell(s1, SKILL_CELL[key], val);
                        const spec = skillSpec[key];
                        if (spec) s1 = writeCell(s1, SPECIALTY_LABEL_CELL[key], spec);
                    }
                    return;
                }
                s1 = writeCell(s1, SKILL_CELL[key], instances[0].value);
                s1 = writeCell(s1, SPECIALTY_LABEL_CELL[key],
                    instances[0].specialty || SPECIALTY_BASE_NAME[key]);
                instances.slice(1).forEach(inst => {
                    const label = inst.specialty
                        ? SPECIALTY_BASE_NAME[key] + " (" + inst.specialty + ")"
                        : SPECIALTY_BASE_NAME[key];
                    overflowSpecialties.push({ name: label, value: inst.value });
                });
            });

            // Non-specialty skills
            Object.entries(SKILL_CELL).forEach(([key, addr]) => {
                if (SPECIALTY_KEYS.includes(key)) return;
                const val = skills[key];
                if (val && val > 0) s1 = writeCell(s1, addr, val);
            });

            // ── Front: Foreign languages / overflow → rows 40-45 ─────────
            const overflowNames = new Set(overflowSpecialties.map(s => s.name.toLowerCase()));
            const foreignSlots = [
                ...overflowSpecialties,
                ...custom.filter(s => s.value > 0 && !overflowNames.has(s.name.toLowerCase())),
            ].slice(0, 6);
            FOREIGN_ROWS.forEach((row, i) => {
                const sk = foreignSlots[i];
                if (sk?.name) s1 = writeCell(s1, "AB" + row, sk.name);
                if (sk?.value) s1 = writeCell(s1, "AJ" + row, sk.value);
                // Failure checkbox (AA column) — write for every row, filled or empty
                const checked = sk?.name && checkedSkillNames.has(sk.name.toLowerCase());
                s1 = writeCell(s1, "AA" + row, checked ? "☑" : "☐");
            });

            // ── Back: Has First Aid been attempted? (U9) ─────────────────
            // No interactive DOM element tracks this in the LP sheet;
            // always write ☐ so the cell shows a symbol instead of FALSE.
            s2 = writeCell(s2, "U9", "☐");

            // ── Back: Wounds ─────────────────────────────────────────────
            if (lpNotes.wounds) s2 = writeCell(s2, "C3", lpNotes.wounds);

            // ── Back: Armor and gear ──────────────────────────────────────
            const gearLines = [];
            if (lpNotes.gear) gearLines.push(lpNotes.gear);
            if (typeof window.dgEquipment?.getLoadout === "function") {
                window.dgEquipment.getLoadout()
                    .filter(item => item && item.type !== "weapon")
                    .forEach(item => { if (item.name) gearLines.push(item.name); });
            } else {
                equipment.forEach(n => { if (n) gearLines.push(n); });
            }
            if (gearLines.length) s2 = writeCell(s2, "C12", gearLines.join("\n"));

            // ── Back: Weapons table ───────────────────────────────────────
            getWeaponRows(lpWeapons).slice(0, 7).forEach((w, i) => {
                const row = 21 + i;
                s2 = writeCell(s2, "D" + row, w.name);
                s2 = writeCell(s2, "L" + row, w.skillPct);
                s2 = writeCell(s2, "N" + row, w.range);
                s2 = writeCell(s2, "R" + row, w.damage);
                s2 = writeCell(s2, "AA" + row, w.lethality);
                s2 = writeCell(s2, "AE" + row, w.killRadius);
                s2 = writeCell(s2, "AI" + row, w.ammo);
            });

            // ── Back: Personal notes ──────────────────────────────────────
            const _personalNotesVal = bio.personalDetails || lpNotes.remarks || '';
            if (_personalNotesVal) s2 = writeCell(s2, "C30", _personalNotesVal);

            // ── Write patched XML back and repack ─────────────────────────
            s1 = cleanOrphanedSharedFormulas(s1);
            zip.file("xl/worksheets/sheet1.xml", s1);
            zip.file("xl/worksheets/sheet2.xml", s2);

            // Patch styles.xml: replace "Droid Sans" with "Roboto" so Google
            // Sheets uses the direct successor font instead of falling back to
            // Arial (Droid Sans is deprecated and absent from Google Sheets).
            let stylesXml = await zip.file("xl/styles.xml").async("string");
            stylesXml = stylesXml.replace(/<name val="Droid Sans"\/>/g, '<name val="Roboto"/>');
            zip.file("xl/styles.xml", stylesXml);

            const outBytes = await zip.generateAsync({
                type: "arraybuffer",
                compression: "DEFLATE",
                compressionOptions: { level: 6 },
            });

            // ── Download ──────────────────────────────────────────────────
            const blob = new Blob([outBytes], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = URL.createObjectURL(blob);
            const safeName = (bio.name || "Agent").replace(/[^a-z0-9 \-_]/gi, "").trim() || "Agent";
            const a = Object.assign(document.createElement("a"), {
                href: url,
                download: safeName + " - Delta Green Character Sheet.xlsx",
            });
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 8000);

            if (window.showToast) showToast("Spreadsheet downloaded!");
        } catch (err) {
            console.error("[DG Sheets Export]", err);
            if (window.showToast) showToast("Spreadsheet export failed \u2014 see console for details.");
        }
    }

    window.exportToSheets = exportToSheets;
})();
