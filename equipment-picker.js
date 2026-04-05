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
    var _catalogMap = null;

    var CATEGORIES = [
        'All', 'Firearms', 'Melee Weapons', 'Heavy Weapons', 'Artillery',
        'Demolitions', 'Less-Lethal', 'Armor', 'Surveillance', 'Comms & Tech',
        'Optics & Vision', 'Weapon Accessories', 'Entry Tools', 'Restraints',
        'Survival & Medical'
    ];

    // ── Helpers ────────────────────────────────────────────────────────────────

    function _getCatalogMap() {
        if (!_catalogMap) {
            _catalogMap = new Map();
            (window.DG_EQUIPMENT_CATALOG || []).forEach(function (item) {
                _catalogMap.set(item.name, item);
            });
        }
        return _catalogMap;
    }

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

    function _expenseBadge(expense) {
        if (!expense) return '';
        var cls = 'eq-expense-' + expense.toLowerCase();
        return '<span class="eq-expense-badge ' + cls + '">' + _escHtml(expense) + '</span>';
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

    function _escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    function _catalogItemHTML(item, isSoS) {
        var summary = _statSummary(item);
        var expense = item.system.expense || '';
        return '<div class="eq-catalog-item">' +
            '<div class="eq-item-info">' +
            '<span class="eq-item-name">' + _escHtml(item.name) + '</span>' +
            '<span class="eq-item-meta">' +
            (summary ? _escHtml(summary) + ' \u00b7 ' : '') +
            _expenseBadge(expense) +
            '</span>' +
            '</div>' +
            '<button type="button" class="eq-add-btn" title="Add to loadout" ' +
            'data-name="' + _escHtml(item.name) + '">' +
            (isSoS ? '\u26E7' : '+') + '</button>' +
            '</div>';
    }

    function _renderCatalog() {
        var list = document.getElementById('eq-catalog-list');
        var countEl = document.getElementById('eq-catalog-count');
        if (!list) return;

        var isSoS = document.body.classList.contains('theme-son-of-sam');
        var items = _filtered();
        if (countEl) countEl.textContent = items.length;

        if (items.length === 0) {
            list.innerHTML = '<div class="eq-empty">No items match</div>';
            return;
        }

        // Single-category filter: flat list, no group headers needed
        if (_activeCategory !== 'All') {
            list.innerHTML = items.map(function (item) { return _catalogItemHTML(item, isSoS); }).join('');
            return;
        }

        // All categories: render grouped sections with sticky headers
        var grouped = _groupByCategory(items);
        list.innerHTML = grouped.order.map(function (cat) {
            var catItems = grouped.groups[cat];
            return '<div class="eq-cat-group">' +
                '<div class="eq-cat-group-header">' +
                '<span class="eq-cat-group-bar"></span>' +
                '<span class="eq-cat-group-label">' + _escHtml(cat) + '</span>' +
                '</div>' +
                catItems.map(function (item) { return _catalogItemHTML(item, isSoS); }).join('') +
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

        // Build index-aware groups (indices must stay in sync with _loadout)
        var groups = {}, order = [];
        _loadout.forEach(function (item, i) {
            if (!groups[item.category]) { groups[item.category] = []; order.push(item.category); }
            groups[item.category].push({ item: item, index: i });
        });

        list.innerHTML = order.map(function (cat) {
            var entries = groups[cat];
            return '<div class="eq-loadout-section">' +
                '<div class="eq-loadout-section-header">' +
                _escHtml(cat) +
                '</div>' +
                '<div class="eq-loadout-cards">' +
                entries.map(function (e) {
                    var summary = _statSummary(e.item);
                    var expense = e.item.system.expense || '';
                    return '<div class="eq-loadout-card">' +
                        '<button type="button" class="eq-remove-btn" title="Remove" ' +
                        'data-index="' + e.index + '">\u00d7</button>' +
                        '<div class="eq-card-name">' + _escHtml(e.item.name) + '</div>' +
                        '<div class="eq-card-stats">' +
                        (summary ? _escHtml(summary) : '') +
                        (summary && expense ? ' \u00b7 ' : '') +
                        (expense ? '<span class="eq-expense-badge eq-expense-' + expense.toLowerCase() + '">' + _escHtml(expense) + '</span>' : '') +
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

    // ── Persistence ────────────────────────────────────────────────────────────

    function _saveLoadout() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(_loadout.map(function (i) {
                return i.isCustom ? { isCustom: true, name: i.name } : i.name;
            })));
        } catch (e) { /* storage unavailable */ }
    }

    function _loadLoadout() {
        try {
            var entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            var map = _getCatalogMap();
            _loadout = entries.map(function (e) {
                if (typeof e === 'object' && e.isCustom) {
                    return {
                        name: e.name, type: 'gear', category: 'Custom', isCustom: true,
                        system: { description: '', expense: '' }
                    };
                }
                var found = map.get(e);
                return found ? JSON.parse(JSON.stringify(found)) : null;
            }).filter(Boolean);
        } catch (e) {
            _loadout = [];
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    function addItem(name) {
        var item = _getCatalogMap().get(name);
        if (!item) return;
        _loadout.push(JSON.parse(JSON.stringify(item)));
        _saveLoadout();
        _render();
    }

    /** Add a plain-text custom item not found in the catalog. */
    function addCustomItem(name) {
        name = (name || '').trim();
        if (!name) return;
        _loadout.push({
            name: name, type: 'gear', category: 'Custom', isCustom: true,
            system: { description: '', expense: '' }
        });
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
            ' autocomplete="off" spellcheck="false" />' +
            '<select id="eq-cat-select" class="eq-cat-select">' +
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
            '<button type="button" id="eq-clear-btn" class="eq-clear-btn" title="Clear all items">CLEAR</button>' +
            '</div>' +
            '<div id="eq-loadout-list" class="eq-scrolllist"></div>' +
            '<div class="eq-custom-add-row">' +
            '<input type="text" id="eq-custom-name" class="eq-custom-name-input"' +
            ' placeholder="Add custom item\u2026" autocomplete="off" spellcheck="false" />' +
            '<button type="button" id="eq-custom-add-btn" class="eq-custom-add-btn">+ Add</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<p class="eq-hint">Items in the loadout are included when exporting to Foundry VTT.</p>';

        document.getElementById('eq-search').addEventListener('input', function () {
            _searchQuery = this.value;
            _renderCatalog();
        });
        document.getElementById('eq-cat-select').addEventListener('change', function () {
            _activeCategory = this.value;
            _renderCatalog();
        });
        document.getElementById('eq-clear-btn').addEventListener('click', clearLoadout);
        document.getElementById('eq-catalog-list').addEventListener('click', function (e) {
            var btn = e.target.closest('.eq-add-btn');
            if (btn) addItem(btn.dataset.name);
        });
        document.getElementById('eq-loadout-list').addEventListener('click', function (e) {
            var btn = e.target.closest('.eq-remove-btn');
            if (btn) removeItem(parseInt(btn.dataset.index, 10));
        });

        document.getElementById('eq-custom-add-btn').addEventListener('click', function () {
            var inp = document.getElementById('eq-custom-name');
            var val = (inp.value || '').trim();
            if (!val) return;
            addCustomItem(val);
            inp.value = '';
            inp.focus();
        });

        document.getElementById('eq-custom-name').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); document.getElementById('eq-custom-add-btn').click(); }
        });

        _render();
    }

    // ── Init ───────────────────────────────────────────────────────────────────

    window.dgEquipment = {
        add: addItem,
        addCustom: addCustomItem,
        remove: removeItem,
        clear: clearLoadout,
        getLoadout: getLoadout
    };

    document.addEventListener('DOMContentLoaded', function () {
        _loadLoadout();
        buildUI();
    });

}());
