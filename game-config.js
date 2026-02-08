/**
 * AriseHabit — central game configuration.
 * WHY: Single source of truth for tuning; no hardcoded XP/rewards in app logic.
 * Enables A/B tests and design changes without touching engine code.
 */
(function (global) {
  'use strict';

  var GAME_CONFIG = {
    /** XP & level progression — meaningful curve, not linear */
    xp: {
      baseXpPerHabit: 15,
      /** Level thresholds (cumulative XP). Exponential feel: early levels fast, then slower. */
      levelCurve: [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000],
      /** Streak multiplier: up to +60% for 7+ day streak. WHY: rewards consistency. */
      streakMultiplierCap: 7,
      streakMultiplierPerDay: 0.1,
      /** Optional: soft penalty for missing a day after activity (0 = off). */
      decayPenaltyPercent: 0,
      /** Comeback: after 3+ missed days, bonus XP on next completion (0 = off). */
      comebackBonusPercent: 0,
      comebackAfterMissedDays: 3
    },

    /** Character attributes — tie habits to RPG-style stats for engagement */
    attributes: [
      { id: 'willpower', name: 'Сила воли', icon: '🛡️', maxValue: 100 },
      { id: 'endurance', name: 'Выносливость', icon: '❤️', maxValue: 100 },
      { id: 'calmness', name: 'Спокойствие', icon: '☁️', maxValue: 100 },
      { id: 'focus', name: 'Фокус', icon: '🎯', maxValue: 100 }
    ],

    /** Achievements: tier gates perks/collectibles; config-driven for easy new badges */
    achievements: [
      { id: 'first_steps', name: 'Первый бой', desc: 'Выполнить первый квест в приключении', icon: '⚔️', tier: 'bronze' },
      { id: 'streak_3', name: 'Серия х3', desc: '3 дня подряд без перерыва — огонь не гаснет', icon: '🔥', tier: 'bronze' },
      { id: 'streak_7', name: 'Неделя в огне', desc: '7 дней подряд. Настоящая серия.', icon: '💎', tier: 'silver' },
      { id: 'full_day', name: 'Идеальный раунд', desc: 'Все квесты дня на 100% — без единого промаха', icon: '👑', tier: 'gold' },
      { id: 'level_5', name: 'Уровень 5', desc: 'Достигнут 5-й уровень. Рост силы виден.', icon: '⬆️', tier: 'silver' },
      { id: 'week_one', name: 'Неделя в деле', desc: '7 дней с активностью — привычка закрепляется', icon: '🗡️', tier: 'bronze' },
      { id: 'early_bird', name: 'Ранняя пташка', desc: 'Квест выполнен до 10:00. Утро твоё.', icon: '🌅', tier: 'silver' },
      { id: 'ten_quests', name: 'Мастер квестов', desc: '10 квестов за один день — рекордный забег', icon: '🎯', tier: 'gold' }
    ],

    /** Perks unlocked by achievements — makes achievements desirable (retention) */
    perks: [
      { id: 'grace_day', name: 'День передышки', unlockAchievementId: 'streak_7', effect: { type: 'grace_day_per_week', value: 1 } },
      { id: 'xp_sunday', name: 'Воскресный бонус', unlockAchievementId: 'full_day', effect: { type: 'xp_multiplier_day', dayOfWeek: 0, value: 1.05 } }
    ],

    /** Default attribute weights per habit category — for preset habits and suggestions */
    defaultAttributeWeights: {
      sleep: { endurance: 1, calmness: 0.8 },
      water: { endurance: 0.6 },
      exercise: { endurance: 1, willpower: 0.5 },
      breath: { calmness: 1, focus: 0.5 },
      reading: { focus: 1, calmness: 0.3 },
      screens_off: { calmness: 0.8, willpower: 0.5 },
      ritual: { calmness: 0.8, willpower: 0.3 }
    }
  };

  /** Resolve XP per habit from config (for compatibility and future formula). */
  function getBaseXpPerHabit() {
    return GAME_CONFIG.xp.baseXpPerHabit;
  }

  /** Level curve array for getLevelFromXp / xpForNextLevel. */
  function getLevelCurve() {
    return GAME_CONFIG.xp.levelCurve;
  }

  /** Streak multiplier 1.0 .. 1 + cap (e.g. 1.7 for 7 days). WHY: rewards consistency. */
  function getStreakMultiplier(streakDays) {
    var cap = GAME_CONFIG.xp.streakMultiplierCap || 0;
    var per = GAME_CONFIG.xp.streakMultiplierPerDay || 0;
    if (!cap || !per) return 1;
    return 1 + Math.min(streakDays || 0, cap) * per;
  }

  /** Get attribute weights for a habit (from habit.attributes or defaults by category). */
  function getHabitAttributes(habit) {
    if (habit.attributes && Object.keys(habit.attributes).length) return habit.attributes;
    var cat = habit.category || (habit.id && habit.id.indexOf('default-') === 0 ? habit.id.replace('default-', '').split('-')[0] : '');
    return GAME_CONFIG.defaultAttributeWeights[cat] || {};
  }

  var api = {
    GAME_CONFIG: GAME_CONFIG,
    getBaseXpPerHabit: getBaseXpPerHabit,
    getLevelCurve: getLevelCurve,
    getStreakMultiplier: getStreakMultiplier,
    getHabitAttributes: getHabitAttributes
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (global) {
    global.AriseConfig = api;
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
