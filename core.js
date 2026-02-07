/**
 * Чистая логика трекера привычек (без DOM и state).
 * Используется в app.js и в тестах.
 */
(function (global) {
  'use strict';

  var XP_LEVELS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];
  var XP_PER_HABIT_FULL = 15;

  function getLevelFromXp(totalXp, xpLevels) {
    xpLevels = xpLevels || XP_LEVELS;
    var level = 1;
    for (var i = 1; i < xpLevels.length; i++) {
      if (totalXp >= xpLevels[i]) level = i + 1;
      else break;
    }
    return level;
  }

  function xpForNextLevel(level, xpLevels) {
    xpLevels = xpLevels || XP_LEVELS;
    return xpLevels[level] !== undefined ? xpLevels[level] - xpLevels[level - 1] : 500;
  }

  function xpAtLevelStart(level, xpLevels) {
    xpLevels = xpLevels || XP_LEVELS;
    return xpLevels[level - 1] || 0;
  }

  function todayKey(date) {
    var d = date ? new Date(date) : new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getCompletionsFor(completions, habitId, dateKey) {
    if (!completions[habitId]) return 0;
    return completions[habitId][dateKey] || 0;
  }

  function getDayStats(habits, completions, dateKey, xpPerHabitFull) {
    xpPerHabitFull = xpPerHabitFull != null ? xpPerHabitFull : XP_PER_HABIT_FULL;
    var totalPct = 0;
    var xp = 0;
    habits.forEach(function (h) {
      var c = getCompletionsFor(completions, h.id, dateKey);
      var t = Math.max(1, h.target || 1);
      var pct = Math.min(1, c / t);
      totalPct += pct;
      xp += Math.round(pct * xpPerHabitFull);
    });
    var percent = habits.length ? Math.round((totalPct / habits.length) * 100) : 0;
    return { percent: percent, xp: xp };
  }

  function dailySeed(dateKey) {
    var h = 0;
    for (var i = 0; i < dateKey.length; i++) h = ((h << 5) - h) + dateKey.charCodeAt(i) | 0;
    return Math.abs(h);
  }

  function getTodaysVariation(habit, dateKey) {
    var v = habit.variations || [habit.name];
    if (!v.length) return habit.name || '';
    var seed = dailySeed(dateKey + (habit.id || ''));
    return v[seed % v.length];
  }

  var api = {
    XP_LEVELS: XP_LEVELS,
    XP_PER_HABIT_FULL: XP_PER_HABIT_FULL,
    getLevelFromXp: getLevelFromXp,
    xpForNextLevel: xpForNextLevel,
    xpAtLevelStart: xpAtLevelStart,
    todayKey: todayKey,
    getDayStats: getDayStats,
    getCompletionsFor: getCompletionsFor,
    dailySeed: dailySeed,
    getTodaysVariation: getTodaysVariation
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (global) {
    global.HabitCore = api;
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
