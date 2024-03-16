const stats = ['STR', 'CON', 'DEX', 'INT', 'POW', 'CHA'];
const attributesText = ['Hit Points (HP)', 'Willpower Points (WP)', 'Sanity Points (SAN)', 'Breaking Point (BP)'];

function calculateAttributes() {
    const strValue = parseInt(document.getElementById('STR-value').innerText);
    const conValue = parseInt(document.getElementById('CON-value').innerText);
    const powValue = parseInt(document.getElementById('POW-value').innerText);

    const hp = Math.ceil((strValue + conValue) / 2);
    const wp = powValue;
    const san = powValue * 5;
    const bp = san - powValue;

    return [hp, wp, san, bp];
}

function updateAttributesValues() {
    const attributes = calculateAttributes();
    stats.forEach((stat, index) => {
        if (index < 4) {
            document.getElementById(`${stat}-attribute-value`).innerText = attributes[index];
        }
    });
}

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

function generateStatContainers() {
    const container = document.getElementById('stats');
    container.innerHTML = '';
    stats.forEach((stat, index) => {
        const attributeInfo = index < 4 ? `<span class="attributes">${attributesText[index]}</span><span class="attribute-values" id="${stat}-attribute-value"></span>` : '';
        container.innerHTML += `
                    <div class="stat-container">
                        <span class="stat-label">${stat}</span>
                        <button onclick="adjustStat('${stat}', -1)" class="adjust-button">-</button>
                        <span class="stat-value" id="${stat}-value">3</span>
                        <button onclick="adjustStat('${stat}', 1)" class="adjust-button">+</button>
                        <span class="x5-label">x5=</span>
                        <span class="x5-value" id="${stat}-x5-value">15</span>
                        <span class="descriptor" id="${stat}-descriptor">${getDescriptor(stat, 3)}</span>
                        ${attributeInfo}
                    </div>
                `;
    });
    updateAttributesValues();
    updateTotalPoints();
}

function adjustStat(stat, adjustment) {
    const valueElement = document.getElementById(`${stat}-value`);
    let currentValue = parseInt(valueElement.innerText) + adjustment;
    currentValue = Math.max(3, Math.min(currentValue, 18));
    valueElement.innerText = currentValue;
    document.getElementById(`${stat}-x5-value`).innerText = currentValue * 5;
    document.getElementById(`${stat}-descriptor`).innerText = getDescriptor(stat, currentValue);
    updateAttributesValues();
    updateTotalPoints();
}

function updateTotalPoints() {
    const totalPointsUsed = stats.reduce((total, stat) => total + parseInt(document.getElementById(`${stat}-value`).innerText), 0);
    const remainingPoints = 72 - totalPointsUsed;
    document.getElementById('totalPoints').innerText = remainingPoints;
}

function randomStats() {
    stats.forEach(stat => {
        document.getElementById(`${stat}-value`).innerText = '3';
    });

    let remainingPoints = 72 - (stats.length * 3);

    while (remainingPoints > 0) {
        for (let stat of stats) {
            if (remainingPoints <= 0) break;

            let currentValue = parseInt(document.getElementById(`${stat}-value`).innerText);
            if (currentValue < 18) {
                const pointsToAdd = Math.min(remainingPoints, 18 - currentValue);
                const add = Math.floor(Math.random() * pointsToAdd) + 1;
                currentValue += add;
                remainingPoints -= add;

                document.getElementById(`${stat}-value`).innerText = currentValue.toString();
                document.getElementById(`${stat}-x5-value`).innerText = (currentValue * 5).toString();
                document.getElementById(`${stat}-descriptor`).innerText = getDescriptor(stat, currentValue);
            }
        }
    }

    updateAttributesValues();
    updateTotalPoints();
}

function randomDiceRoll() {
    stats.forEach(stat => {
        const rolls = Array.from({length: 4}, () => Math.floor(Math.random() * 6) + 1)
                           .sort((a, b) => b - a)
                           .slice(0, 3);
        const finalValue = Math.max(3, Math.min(rolls.reduce((a, b) => a + b), 18));
        document.getElementById(`${stat}-value`).innerText = finalValue;
        document.getElementById(`${stat}-x5-value`).innerText = finalValue * 5;
        document.getElementById(`${stat}-descriptor`).innerText = getDescriptor(stat, finalValue);
    });
    updateAttributesValues();
    updateTotalPoints();
}

function resetStats() {
    stats.forEach(stat => {
        document.getElementById(`${stat}-value`).innerText = '3';
        document.getElementById(`${stat}-x5-value`).innerText = '15';
        document.getElementById(`${stat}-descriptor`).innerText = getDescriptor(stat, 3);
    });
    updateAttributesValues();
    updateTotalPoints();
}

function showInfo(type) {
    const infoText = document.getElementById('infoText');
    if (type === 'dice') {
        infoText.textContent = "'RANDOM DICE ROLL' Will roll 4xD6 and keep the three highest rolls. It will then update the value of each stat";
    } else if (type === 'pointBuy') {
        infoText.textContent = "'RANDOM POINT BUY' Will distribute 72 points across the six stats using a random allocation algorithm.";
    } else if (type === 'reset') {
        infoText.textContent = "'RESET' Will reset all stats to their default value of 3 and take you back to the Point Buy system with 54 points to spend on your stats for a total of 72 points.";
    } else if (type === 'bonds') {
        infoText.textContent = "'BONDS' Will randomly generate a bond based on the selected categories (DELTA GREEN, FRIENDS & FAMILY) and display it in the text box.";
    }
}

function clearInfo() {
    const infoText = document.getElementById('infoText');
    infoText.textContent = '';
}

function generateCharacterSheet() {
    var wb = XLSX.utils.book_new(),
        wsData = [["Stat", "Value", "Multiplier (x5)", "Descriptor"]];

    stats.forEach(stat => {
        let value = document.getElementById(`${stat}-value`).innerText;
        let x5 = document.getElementById(`${stat}-x5-value`).innerText;
        let descriptor = document.getElementById(`${stat}-descriptor`).innerText;
        wsData.push([stat, value, x5, descriptor]);
    });

    // Attributes part can be added similarly
    // wsData.push(["Attribute Name", "Value"]);

    var ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Character Stats");

    XLSX.writeFile(wb, "DeltaGreenCharacterSheet.xlsx");
}

function generateRandomBond() {
    const bondButton = document.getElementById('bonds-button');
    bondButton.disabled = true;

    const selectedCategories = Array.from(document.querySelectorAll('input[name="bond-category"]:checked')).map(checkbox => checkbox.value);
    const availableBonds = selectedCategories.flatMap(category => bonds[category] || []);

    const bondTextElement = document.getElementById('bondText');
    bondTextElement.innerHTML = ''; // Clear previous text

    if (availableBonds.length > 0) {
        let randomBond = availableBonds[Math.floor(Math.random() * availableBonds.length)];
        // Correctly replace ^ with <br> before typing effect starts
        randomBond = randomBond.replace(/\^/g, '<br>');

        let i = 0;
        function typeChar() {
            if (randomBond.substring(i, i + 4) === '<br>') {
                bondTextElement.innerHTML += '<br>';
                i += 4; // Skip past the <br> tag
            } else if (i < randomBond.length) {
                bondTextElement.innerHTML += randomBond[i];
                i++;
            }
            if (i < randomBond.length) {
                setTimeout(typeChar, 25); // Adjust typing speed as needed
            } else {
                bondButton.disabled = false; // Re-enable the button after typing
            }
        }
        typeChar(); // Start typing effect
    } else {
        bondTextElement.innerHTML = "No bond available.";
        bondButton.disabled = false;
    }
}

window.onload = generateStatContainers;
