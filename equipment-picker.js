/**
 * DELTA GREEN STATS — Equipment Picker
 * Provides a searchable catalog UI for building character equipment loadouts.
 * Loadout items are included in the Foundry VTT JSON export.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'dg-equipment-loadout';
    var _loadout = [];
    var _searchQuery = '';
    var _activeCategory = 'All';

    var CATEGORIES = [
        'All', 'Firearms', 'Melee Weapons', 'Heavy Weapons', 'Artillery',
        'Demolitions', 'Less-Lethal', 'Armor', 'Surveillance', 'Comms & Tech',
        'Optics & Vision', 'Weapon Accessories', 'Entry Tools', 'Restraints',
        'Survival & Medical'
    ];

    // ── Helpers ────────────────────────────────────────────────────────────────

    var CAT_COLORS = {
        'Firearms':          '#e74c3c',
        'Melee Weapons':     '#e67e22',
        'Heavy Weapons':     '#c0392b',
        'Artillery':         '#c0392b',
        'Demolitions':       '#c0392b',
        'Less-Lethal':       '#f39c12',
        'Armor':             '#2980b9',
        'Restraints':        '#2980b9',
        'Surveillance':      '#8e44ad',
        'Comms & Tech':      '#16a085',
        'Optics & Vision':   '#1abc9c',
        'Weapon Accessories':'#e67e22',
        'Entry Tools':       '#7f8c8d',
        'Survival & Medical':'#27ae60'
    };

    function _catColor(cat) { return CAT_COLORS[cat] || '#888888'; }

    function _statSummary(item) {
        var s = item.system;
        if (item.type === 'weapon') {
            var dmgPart = s.isLethal ? (s.lethality + '% lethality') : (s.damage || (s.lethality ? s.lethality + '%' : ''));
            var rangePart = s.range || '';
            if (dmgPart && rangePart) return dmgPart + ' \u00b7 ' + rangePart;
            return dmgPart || rangePart || '';
        }
        if (item.type === 'armor') {
            return 'Prot ' + s.protection;
        }
        return '';
    }

    function _expenseColor(expense) {
        var map = { Incidental: '#6abf6a', Standard: '#6abf6a', Unusual: '#d4a800', Major: '#d47800', Extreme: '#c0392b' };
        return map[expense] || '#888';
    }

    function _expenseBadge(expense) {
        if (!expense) return '';
        return '<span class="eq-expense-badge" style="color:' + _expenseColor(expense) + '">' + _escHtml(expense) + '</span>';
    }

    function _filtered() {
        var catalog = window.DG_EQUIPMENT_CATALOG || [];
        var q = _searchQuery.trim().toLowerCase();
        return catalog.filter(function (item) {
            if (_activeCategory !== 'All' && item.category !== _activeCategory) return false;
            if (q && item.name.toLowerCase().indexOf(q) === -1 && item.category.toLowerCase().indexOf(q) === -1) return false;
            return true;
        });
    }

    function _groupByCategory(items) {
        var groups = {}, order = [];
        items.forEach(function (item) {
            if (!groups[item.category]) { groups[item.category] = []; order.push(item.category); }
            groups[item.category].push(item);
        });
        return { groups: groups, order: order };
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    function _catalogItemHTML(item) {
        var summary = _statSummary(item);
        var expense = item.system.expense || '';
        var safeName = item.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        var color = _catColor(item.category);
        return '<div class="eq-catalog-item" style="--eq-cat-color:' + color + '">' +
            '<div class="eq-item-info">' +
            '<span class="eq-item-name">' + _escHtml(item.name) + '</span>' +
            '<span class="eq-item-meta">' +
            (summary ? _escHtml(summary) + ' \u00b7 ' : '') +
            _expenseBadge(expense) +
            '</span>' +
            '</div>' +
            '<button type="button" class="eq-add-btn" title="Add to loadout" ' +
            'onclick="dgEquipment.add(\'' + safeName + '\')">+</button>' +
            '</div>';
    }

    function _renderCatalog() {
        var list = document.getElementById('eq-catalog-list');
        var countEl = document.getElementById('eq-catalog-count');
        if (!list) return;

        var items = _filtered();
        if (countEl) countEl.textContent = items.length;

        if (items.length === 0) {
            list.innerHTML = '<div class="eq-empty">No items match</div>';
            return;
        }

        // Single-category filter: flat list, no group headers needed
        if (_activeCategory !== 'All') {
            list.innerHTML = items.map(_catalogItemHTML).join('');
            return;
        }

        // All categories: render grouped sections with sticky headers
        var grouped = _groupByCategory(items);
        list.innerHTML = grouped.order.map(function (cat) {
            var catItems = grouped.groups[cat];
            var color = _catColor(cat);
            return '<div class="eq-cat-group">' +
                '<div class="eq-cat-group-header" style="--eq-cat-color:' + color + '">' +
                '<span class="eq-cat-group-bar"></span>' +
                '<span class="eq-cat-group-label">' + _escHtml(cat) + '</span>' +
                '<span class="eq-cat-group-count">' + catItems.length + '</span>' +
                '</div>' +
                catItems.map(_catalogItemHTML).join('') +
                '</div>';
        }).join('');
    }

    function _renderLoadout() {
        var list = document.getElementById('eq-loadout-list');
        var legend = document.getElementById('eq-picker-legend');
        if (!list) return;

        if (legend) {
            legend.textContent = 'EQUIPMENT LOADOUT' + (_loadout.length ? ' \u2014 ' + _loadout.length + ' items' : '');
        }

        if (_loadout.length === 0) {
            list.innerHTML = '<div class="eq-empty">No items\u2014click + from the catalog to add gear</div>';
            return;
        }

        // Build index-aware list for grouped render (indices must match _loadout)
        var groups = {}, order = [];
        _loadout.forEach(function (item, i) {
            if (!groups[item.category]) { groups[item.category] = []; order.push(item.category); }
            groups[item.category].push({ item: item, index: i });
        });

        list.innerHTML = order.map(function (cat) {
            var entries = groups[cat];
            var color = _catColor(cat);
            return '<div class="eq-loadout-section">' +
                '<div class="eq-loadout-section-header" style="border-left-color:' + color + '">' +
                _escHtml(cat) +
                '</div>' +
                '<div class="eq-loadout-cards">' +
                entries.map(function (e) {
                    var summary = _statSummary(e.item);
                    var expense = e.item.system.expense || '';
                    return '<div class="eq-loadout-card" style="--eq-cat-color:' + color + '">' +
                        '<button type="button" class="eq-remove-btn" title="Remove" ' +
                        'onclick="dgEquipment.remove(' + e.index + ')">\u00d7</button>' +
                        '<div class="eq-card-name">' + _escHtml(e.item.name) + '</div>' +
                        '<div class="eq-card-stats">' +
                        (summary ? _escHtml(summary) : '') +
                        (summary && expense ? ' \u00b7 ' : '') +
                        (expense ? '<span style="color:' + _expenseColor(expense) + '">' + _escHtml(expense) + '</span>' : '') +
                        '</div>' +
                        '</div>';
                }).join('') +
                '</div>' +
                '</div>';
        }).join('');
    }

    function _render() {
        _renderCatalog();
        _renderLoadout();
    }

    function _escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Persistence ────────────────────────────────────────────────────────────

    function _saveLoadout() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(_loadout.map(function (i) { return i.name; })));
        } catch (e) { /* storage unavailable */ }
    }

    function _loadLoadout() {
        try {
            var names = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            var catalog = window.DG_EQUIPMENT_CATALOG || [];
            _loadout = names.map(function (n) {
                var found = null;
                for (var i = 0; i < catalog.length; i++) {
                    if (catalog[i].name === n) { found = catalog[i]; break; }
                }
                return found ? JSON.parse(JSON.stringify(found)) : null;
            }).filter(Boolean);
        } catch (e) {
            _loadout = [];
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    function addItem(name) {
        var catalog = window.DG_EQUIPMENT_CATALOG || [];
        var item = null;
        for (var i = 0; i < catalog.length; i++) {
            if (catalog[i].name === name) { item = catalog[i]; break; }
        }
        if (!item) return;
        _loadout.push(JSON.parse(JSON.stringify(item)));
        _saveLoadout();
        _render();
    }

    function removeItem(index) {
        _loadout.splice(index, 1);
        _saveLoadout();
        _render();
    }

    function clearLoadout() {
        _loadout = [];
        _saveLoadout();
        _render();
    }

    /** Returns Foundry-ready item copies (category field stripped). */
    function getLoadout() {
        return _loadout.map(function (item) {
            var copy = JSON.parse(JSON.stringify(item));
            delete copy.category;
            return copy;
        });
    }

    function _onSearch(val) {
        _searchQuery = val;
        _renderCatalog();
    }

    function _onCat(val) {
        _activeCategory = val;
        _renderCatalog();
    }

    // ── UI Build ───────────────────────────────────────────────────────────────

    function buildUI() {
        var container = document.getElementById('eq-picker-container');
        if (!container) return;

        var catOptions = CATEGORIES.map(function (c) {
            return '<option value="' + c + '">' + c + '</option>';
        }).join('');

        container.innerHTML =
            '<div class="eq-controls">' +
            '<input type="text" id="eq-search" class="eq-search-input" placeholder="Search equipment\u2026"' +
            ' oninput="dgEquipment._onSearch(this.value)" autocomplete="off" spellcheck="false" />' +
            '<select id="eq-cat-select" class="eq-cat-select" onchange="dgEquipment._onCat(this.value)">' +
            catOptions +
            '</select>' +
            '</div>' +
            '<div class="eq-panels">' +
            '<div class="eq-catalog-panel">' +
            '<div class="eq-panel-header">' +
            'CATALOG <span id="eq-catalog-count" class="eq-count"></span>' +
            '</div>' +
            '<div id="eq-catalog-list" class="eq-scrolllist"></div>' +
            '</div>' +
            '<div class="eq-loadout-panel">' +
            '<div class="eq-panel-header">' +
            'LOADOUT' +
            '<button type="button" class="eq-clear-btn" onclick="dgEquipment.clear()" title="Clear all items">CLEAR</button>' +
            '</div>' +
            '<div id="eq-loadout-list" class="eq-scrolllist"></div>' +
            '</div>' +
            '</div>' +
            '<p class="eq-hint">Items in the loadout are included when exporting to Foundry VTT.</p>';

        _render();
    }

    // ── Init ───────────────────────────────────────────────────────────────────

    window.dgEquipment = {
        add: addItem,
        remove: removeItem,
        clear: clearLoadout,
        getLoadout: getLoadout,
        _onSearch: _onSearch,
        _onCat: _onCat
    };

    document.addEventListener('DOMContentLoaded', function () {
        _loadLoadout();
        buildUI();
    });

}());
