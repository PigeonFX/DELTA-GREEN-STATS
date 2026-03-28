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
    var colors = { Incidental: '#6abf6a', Standard: '#6abf6a', Unusual: '#d4a800', Major: '#d47800', Extreme: '#c0392b', NA: '#555' };
    var c = colors[expense] || '#888';
    return '<span class="eq-expense-badge" style="color:' + c + '">' + (expense || '') + '</span>';
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

  // ── Render ─────────────────────────────────────────────────────────────────

  function _renderCatalog() {
    var list = document.getElementById('eq-catalog-list');
    var countEl = document.getElementById('eq-catalog-count');
    if (!list) return;

    var items = _filtered();
    if (countEl) countEl.textContent = '(' + items.length + ')';

    if (items.length === 0) {
      list.innerHTML = '<div class="eq-empty">No items match</div>';
      return;
    }

    list.innerHTML = items.map(function (item) {
      var summary = _statSummary(item);
      var safeName = item.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return '<div class="eq-catalog-item">' +
        '<div class="eq-item-info">' +
          '<span class="eq-item-name">' + _escHtml(item.name) + '</span>' +
          '<span class="eq-item-meta">' + _escHtml(item.category) +
            (summary ? ' \u00b7 ' + _escHtml(summary) : '') + ' \u00b7 ' +
            _expenseBadge(item.system.expense) +
          '</span>' +
        '</div>' +
        '<button type="button" class="eq-add-btn" title="Add to loadout" ' +
          'onclick="dgEquipment.add(\'' + safeName + '\')">+</button>' +
        '</div>';
    }).join('');
  }

  function _renderLoadout() {
    var list = document.getElementById('eq-loadout-list');
    var legend = document.getElementById('eq-picker-legend');
    if (!list) return;

    if (legend) {
      legend.textContent = 'EQUIPMENT LOADOUT' + (_loadout.length ? ' (' + _loadout.length + ')' : '');
    }

    if (_loadout.length === 0) {
      list.innerHTML = '<div class="eq-empty">No items added</div>';
      return;
    }

    list.innerHTML = _loadout.map(function (item, i) {
      return '<div class="eq-loadout-item">' +
        '<div class="eq-loadout-info">' +
          '<span class="eq-loadout-name">' + _escHtml(item.name) + '</span>' +
          '<span class="eq-loadout-meta">' + _escHtml(item.category) + '</span>' +
        '</div>' +
        '<button type="button" class="eq-remove-btn" title="Remove" ' +
          'onclick="dgEquipment.remove(' + i + ')">\u00d7</button>' +
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
