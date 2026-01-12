/**
 * Printable Character Sheet Generator for Delta Green
 * Handles generation and export of printable HTML character sheets
 */

function exportPrintable() {
    try {
        // Gather all character data
        const name = document.getElementById('cs-name').value || 'Agent';
        const profession = document.getElementById('cs-profession-select').value || '';
        const professionTitle = profession ? professions[profession].title : 'No Profession Selected';

        // Get stats
        const statsData = {};
        const x5Data = {}; // Store x5 values
        stats.forEach(stat => {
            statsData[stat] = document.getElementById(`${stat}-value`).innerText;
            x5Data[stat] = document.getElementById(`${stat}-x5-value`)?.innerText || (statsData[stat] * 5);
        });

        // Get derived attributes
        const attrs = calculateAttributes();
        const attributeLabels = ['HP', 'WP', 'SAN', 'BP'];
        const attributeData = {};
        attributeLabels.forEach((label, idx) => {
            attributeData[label] = attrs[idx];
        });

        // Get biography data
        const bioData = {
            nationality: document.getElementById('cs-bio-nationality')?.value || '',
            sex: document.getElementById('cs-bio-sex')?.value || '',
            age: document.getElementById('cs-bio-age')?.value || '',
            description: document.getElementById('cs-physical-desc')?.value || ''
        };

        // Get skills - ALL skills, not just those with values > 0
        const skillElements = document.querySelectorAll('#cs-skills input[id^="cs-skill-"]');
        const skills = [];

        skillElements.forEach(elem => {
            const skillName = elem.id.replace('cs-skill-', '');
            const value = elem.value;
            const specialty = document.getElementById(`cs-skill-${skillName}-spec`)?.value || '';

            skills.push({
                name: skillName.replace(/_/g, ' '),
                value: value && value > 0 ? value : '',
                specialty: specialty
            });
        });

        // Also add custom skills
        const customSkillElements = document.querySelectorAll('.custom-skill-row');
        customSkillElements.forEach(row => {
            const nameInput = row.querySelector('.custom-skill-name');
            const valueInput = row.querySelector('.custom-skill-value');
            const specSelect = row.querySelector('select'); // Get specialty dropdown if it exists

            let skillName = '';
            let specialty = '';

            if (specSelect) {
                // This is a skill with specialty (Science, Craft, etc.)
                // Get skill name from label
                const label = row.querySelector('label');
                if (label && label.textContent) {
                    skillName = label.textContent.replace(':', '').trim();
                }
                // Get specialty from dropdown
                specialty = specSelect.value || '';
            } else if (nameInput) {
                // This is a regular custom skill or Foreign Language
                skillName = nameInput.value;
                specialty = '';
            }

            if (skillName && valueInput) {
                const value = valueInput.value;
                skills.push({
                    name: skillName,
                    value: value && value > 0 ? value : '',
                    specialty: specialty
                });
            }
        });

        // Get bonds
        const bondsData = window.bondsOnSheet || [];

        // Build stats HTML
        let statsHtml = '';
        stats.forEach(stat => {
            statsHtml += `
                <div class="stat-box">
                    <div class="stat-box-label">${stat}</div>
                    <div class="stat-box-value">${x5Data[stat]}</div>
                    <div style="font-size: 9px; margin-top: 3px; opacity: 0.8;">${statsData[stat]} × 5 =</div>
                </div>
            `;
        });

        // Build attributes HTML
        let attributesHtml = '';
        attributeLabels.forEach(label => {
            attributesHtml += `
                <div style="border: 1px solid #000; padding: 6px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; height: 100px;">
                    <div style="font-weight: bold; font-size: 11px;">${label}</div>
                    <div>
                        <div style="font-size: 9px; margin-bottom: 2px;">MAX</div>
                        <div style="font-size: 18px; font-weight: bold; line-height: 1;">${attributeData[label]}</div>
                    </div>
                    <div style="border-top: 1px solid #000; padding-top: 4px;">
                        <div style="font-size: 9px; margin-bottom: 2px;">CURRENT</div>
                        <div style="height: 20px; border: 1px solid #ccc;"></div>
                    </div>
                </div>
            `;
        });

        // Build skills HTML
        let skillsLeftHtml = '';
        let skillsRightHtml = '';
        const mid = Math.ceil(skills.length / 2);

        skills.slice(0, mid).forEach(skill => {
            skillsLeftHtml += `
                <div class="skill-item">
                    <span class="skill-name">${skill.name}${skill.specialty ? ' (' + skill.specialty + ')' : ''}</span>
                    <span class="skill-value" style="display: flex; align-items: center; gap: 3px; justify-content: flex-end;">
                        <span>${skill.value}${skill.value ? '%' : '%'}</span>
                        <input type="checkbox" style="width: 11px; height: 11px; cursor: pointer;">
                    </span>
                </div>
            `;
        });

        skills.slice(mid).forEach(skill => {
            skillsRightHtml += `
                <div class="skill-item">
                    <span class="skill-name">${skill.name}${skill.specialty ? ' (' + skill.specialty + ')' : ''}</span>
                    <span class="skill-value" style="display: flex; align-items: center; gap: 3px; justify-content: flex-end;">
                        <span>${skill.value}${skill.value ? '%' : '%'}</span>
                        <input type="checkbox" style="width: 11px; height: 11px; cursor: pointer;">
                    </span>
                </div>
            `;
        });

        // Build weapons table HTML
        let weaponsHtml = '';
        for (let i = 0; i < 7; i++) {
            weaponsHtml += `
                <tr>
                    <td style="border: 1px solid #000; padding: 4px; height: 20px;"></td>
                    <td style="border: 1px solid #000; padding: 4px; height: 20px;"></td>
                    <td style="border: 1px solid #000; padding: 4px; height: 20px;"></td>
                    <td style="border: 1px solid #000; padding: 4px; height: 20px;"></td>
                    <td style="border: 1px solid #000; padding: 4px; height: 20px;"></td>
                    <td style="border: 1px solid #000; padding: 4px; height: 20px;"></td>
                    <td style="border: 1px solid #000; padding: 4px; height: 20px;"></td>
                    <td style="border: 1px solid #000; padding: 4px; height: 20px;"></td>
                </tr>
            `;
        }

        // Build bonds HTML
        let bondsHtml = '';
        if (bondsData.length > 0) {
            bondsData.forEach(bond => {
                bondsHtml += `
                    <div class="bond-item">
                        <div class="bond-name">${bond.name || 'Unknown Bond'}</div>
                        <div class="bond-description">${bond.description}</div>
                        <div class="bond-relationship">Relationship: ${bond.relationship || 'N/A'} | Score: ${bond.score || 0}</div>
                    </div>
                `;
            });
        } else {
            bondsHtml = '<p style="font-size: 10px; opacity: 0.6;">(Add bonds here)</p>';
        }

        let bondsSpaceHtml = '';
        if (bondsData.length < 4) {
            bondsSpaceHtml = `
                <div style="margin-top: 8px; padding: 8px; border: 1px dashed #ccc; min-height: 40px; font-size: 9px;">
                    <span style="opacity: 0.5;">Additional Bond Space:</span>
                </div>
            `;
        }

        // Build background section
        let backgroundHtml = '';
        if (bioData.description) {
            backgroundHtml = `
                <div class="section">
                    <div class="section-title">PHYSICAL DESCRIPTION</div>
                    <div class="bio-text">${bioData.description.replace(/\n/g, '<br>')}</div>
                </div>
            `;
        }

        // Build special training table
        let trainingHtml = '';
        for (let i = 0; i < 7; i++) {
            trainingHtml += `
                <tr>
                    <td style="border: 1px solid #000; padding: 3px; height: 16px;"></td>
                    <td style="border: 1px solid #000; padding: 3px; height: 16px;"></td>
                </tr>
            `;
        }

        // Build notes grid lines
        let notesHtml = '';
        for (let i = 0; i < 6; i++) {
            notesHtml += '<div style="border-bottom: 1px dashed #ccc; height: 12px; margin-bottom: 2px;"></div>';
        }

        // Build personal details grid lines
        let personalHtml = '';
        for (let i = 0; i < 12; i++) {
            personalHtml += '<div style="border-bottom: 1px dashed #ccc; height: 10px; margin-bottom: 2px;"></div>';
        }

        // Build developments grid lines
        let developmentsHtml = '';
        for (let i = 0; i < 4; i++) {
            developmentsHtml += '<div style="border-bottom: 1px dashed #ccc; height: 10px; margin-bottom: 2px;"></div>';
        }

        // Create printable HTML
        const printableHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delta Green Character Sheet - ${name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            background: #fff;
            color: #000;
            padding: 20px;
            line-height: 1.4;
        }
        
        .character-sheet {
            max-width: 8.5in;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border: 2px solid #000;
        }
        
        .header {
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .header-title {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 8px;
        }
        
        .header-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            font-size: 12px;
        }
        
        .header-info-item {
            display: flex;
            justify-content: space-between;
        }
        
        .header-info-label {
            font-weight: bold;
            min-width: 80px;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .stat-box {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-size: 11px;
        }
        
        .stat-box-label {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 3px;
        }
        
        .stat-box-value {
            font-size: 18px;
            font-weight: bold;
        }
        
        .attributes-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .skills-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .skill-list {
            font-size: 10px;
        }
        
        .skill-item {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            border-bottom: 0.5px dotted #ccc;
        }
        
        .skill-name {
            flex: 1;
        }
        
        .skill-value {
            min-width: 30px;
            text-align: right;
            font-weight: bold;
        }
        
        .bond-item {
            margin-bottom: 10px;
            padding: 8px;
            border-left: 2px solid #000;
            page-break-inside: avoid;
        }
        
        .bond-name {
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .bond-description {
            font-size: 9px;
            margin-bottom: 2px;
        }
        
        .bond-relationship {
            font-size: 9px;
            opacity: 0.8;
        }
        
        .bio-text {
            font-size: 10px;
            line-height: 1.5;
            max-height: 60px;
            overflow: hidden;
        }
        
        .footer {
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-top: 20px;
            font-size: 8px;
            text-align: right;
            opacity: 0.7;
        }
        
        @media print {
            body {
                padding: 0;
            }
            .character-sheet {
                border: none;
                padding: 0;
                max-width: 100%;
            }
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="character-sheet">
        <div class="header">
            <div class="header-title">DELTA GREEN AGENT DOSSIER</div>
            <div class="header-info">
                <div class="header-info-item">
                    <span class="header-info-label">Agent Name:</span>
                    <span>${name}</span>
                </div>
                <div class="header-info-item">
                    <span class="header-info-label">Profession:</span>
                    <span>${professionTitle}</span>
                </div>
                <div class="header-info-item">
                    <span class="header-info-label">Nationality:</span>
                    <span>${bioData.nationality}</span>
                </div>
                <div class="header-info-item">
                    <span class="header-info-label">Age:</span>
                    <span>${bioData.age}</span>
                </div>
                <div class="header-info-item">
                    <span class="header-info-label">Sex:</span>
                    <span>${bioData.sex}</span>
                </div>
                <div class="header-info-item">
                    <span class="header-info-label">Created:</span>
                    <span>${new Date().toLocaleDateString()}</span>
                </div>
            </div>
        </div>
        
        <!-- Statistics Section -->
        <div class="section">
            <div class="section-title">Statistics</div>
            <div class="stats-grid">
                ${statsHtml}
            </div>
        </div>
        
        <!-- Attributes Section -->
        <div class="section">
            <div class="section-title">Derived Attributes</div>
            <div class="attributes-grid">
                ${attributesHtml}
            </div>
        </div>
        
        <!-- Skills Section -->
        <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-section">
                <div class="skill-list">
                    ${skillsLeftHtml}
                </div>
                <div class="skill-list">
                    ${skillsRightHtml}
                </div>
            </div>
        </div>
        
        <!-- Sanity Checks & Trauma Section -->
        <div class="section">
            <div class="section-title">Sanity & Trauma</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                <div style="border: 1px solid #000; padding: 8px; text-align: center;">
                    <div style="font-size: 9px; font-weight: bold; margin-bottom: 4px;">Current SAN</div>
                    <div style="font-size: 18px; min-height: 20px;">${attributeData['SAN']}</div>
                </div>
                <div style="border: 1px solid #000; padding: 8px; text-align: center;">
                    <div style="font-size: 9px; font-weight: bold; margin-bottom: 4px;">Breaking Point</div>
                    <div style="font-size: 18px; min-height: 20px;">${attributeData['BP']}</div>
                </div>
            </div>
            <div style="min-height: 120px; border: 1px solid #000; padding: 8px; font-size: 9px; display: flex; flex-direction: column;">
                <div style="font-weight: bold; margin-bottom: 8px; font-size: 10px;">MOTIVATIONS AND MENTAL DISORDERS:</div>
                <div style="flex-grow: 1; border-bottom: 1px dashed #ccc; margin-bottom: 8px; padding-bottom: 4px;"></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 8px;">
                    <div style="text-align: left; display: flex; align-items: center; gap: 4px;">
                        <span>Violence</span>
                        <input type="checkbox" style="width: 14px; height: 14px; accent-color: #000; cursor: pointer;" ${document.getElementById('cs-violence-incident1')?.checked ? 'checked' : ''}>
                        <input type="checkbox" style="width: 14px; height: 14px; accent-color: #000; cursor: pointer;" ${document.getElementById('cs-violence-incident2')?.checked ? 'checked' : ''}>
                        <input type="checkbox" style="width: 14px; height: 14px; accent-color: #000; cursor: pointer;" ${document.getElementById('cs-violence-incident3')?.checked ? 'checked' : ''}>
                        ${(document.getElementById('cs-violence-incident1')?.checked || document.getElementById('cs-violence-incident2')?.checked || document.getElementById('cs-violence-incident3')?.checked) ? '<span>Adapted</span>' : ''}
                    </div>
                    <div style="text-align: left; display: flex; align-items: center; gap: 4px;">
                        <span>Helplessness</span>
                        <input type="checkbox" style="width: 14px; height: 14px; accent-color: #000; cursor: pointer;" ${document.getElementById('cs-helplessness-incident1')?.checked ? 'checked' : ''}>
                        <input type="checkbox" style="width: 14px; height: 14px; accent-color: #000; cursor: pointer;" ${document.getElementById('cs-helplessness-incident2')?.checked ? 'checked' : ''}>
                        <input type="checkbox" style="width: 14px; height: 14px; accent-color: #000; cursor: pointer;" ${document.getElementById('cs-helplessness-incident3')?.checked ? 'checked' : ''}>
                        ${(document.getElementById('cs-helplessness-incident1')?.checked || document.getElementById('cs-helplessness-incident2')?.checked || document.getElementById('cs-helplessness-incident3')?.checked) ? '<span>Adapted</span>' : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Wounds and Ailments Section -->
        <div class="section">
            <div class="section-title">Wounds & Ailments</div>
            <div style="min-height: 60px; border: 1px solid #000; padding: 8px; font-size: 9px;"></div>
        </div>
        
        <!-- Armor and Gear Section -->
        <div class="section">
            <div class="section-title">Armor & Gear</div>
            <div style="min-height: 60px; border: 1px solid #000; padding: 8px; font-size: 9px;"></div>
            <div style="font-size: 8px; margin-top: 4px; opacity: 0.8;">Body armor reduces the damage of all attacks except Called Shots and successful Lethality rolls.</div>
        </div>
        
        <!-- Weapons Section -->
        <div class="section">
            <div class="section-title">Weapons</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                <thead>
                    <tr style="border-bottom: 2px solid #000;">
                        <th style="border: 1px solid #000; padding: 4px; text-align: left;">WEAPONS</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">SKILL %</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">BASE RANGE</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">DAMAGE</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">ARMOR PIERCING</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">LETHALITY %</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">KILL RADIUS</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">AMMO</th>
                    </tr>
                </thead>
                <tbody>
                    ${weaponsHtml}
                </tbody>
            </table>
        </div>
        
        ${backgroundHtml}
        
        <!-- Bonds Section -->
        <div class="section">
            <div class="section-title">Bonds</div>
            <div class="bonds-list">
                ${bondsHtml}
            </div>
            ${bondsSpaceHtml}
        </div>
        
        <!-- Notes Section -->
        <div class="section">
            <div class="section-title">Notes & Campaign Notes</div>
            <div style="min-height: 80px; border: 1px solid #000; padding: 8px; font-size: 9px; line-height: 1.4;">
                ${notesHtml}
            </div>
        </div>
        
        <!-- Personal Details and Developments Section -->
        <div class="section">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-height: 200px;">
                <!-- Left: Personal Details and Notes -->
                <div style="display: flex; flex-direction: column;">
                    <div style="font-weight: bold; font-size: 10px; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 3px;">PERSONAL DETAILS AND NOTES:</div>
                    <div style="flex-grow: 1; border: 1px solid #000; padding: 6px; font-size: 9px;">
                        ${personalHtml}
                    </div>
                </div>
                
                <!-- Right: Developments and Special Training -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <!-- Top Right: Developments -->
                    <div style="flex: 0 0 auto;">
                        <div style="font-weight: bold; font-size: 10px; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 3px;">DEVELOPMENTS WHICH AFFECT HOME AND FAMILY:</div>
                        <div style="border: 1px solid #000; padding: 6px; font-size: 9px; min-height: 60px;">
                            ${developmentsHtml}
                        </div>
                    </div>
                    
                    <!-- Bottom Right: Special Training Table -->
                    <div style="flex-grow: 1; display: flex; flex-direction: column;">
                        <div style="font-weight: bold; font-size: 10px; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 3px;">SPECIAL TRAINING:</div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 8px; flex-grow: 1;">
                            <thead>
                                <tr style="border-bottom: 1px solid #000;">
                                    <th style="border: 1px solid #000; padding: 3px; text-align: left; width: 50%;">SKILL</th>
                                    <th style="border: 1px solid #000; padding: 3px; text-align: left; width: 50%;">STAT USED</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${trainingHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            Delta Green Character Sheet | Generated on ${new Date().toLocaleString()}
        </div>
    </div>
    <script>
        window.addEventListener('load', function() {
            window.print();
        });
    </script>
</body>
</html>`;

        // Create blob and download
        const blob = new Blob([printableHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = 'DeltaGreen_' + name.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.html';
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Printable sheet exported successfully');
    } catch (error) {
        console.error('Error generating printable sheet:', error);
        alert('Error generating printable sheet. Check browser console for details.');
    }
}
