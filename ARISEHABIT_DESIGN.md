# AriseHabit — Product, Game Design & Technical Architecture

> Transform the MVP into a deeply engaging, RPG-style habit system that improves health, discipline and quality of life.

---

## 1. PRODUCT & GAME DESIGN

### 1.1 Character Attributes (RPG Core)

**Why:** Linear XP alone feels shallow. Attributes make progress tangible and tie habits to real-life dimensions (health, mind, discipline).

| Attribute   | Id          | Description                    | Habits that typically boost it        |
|------------|-------------|--------------------------------|--------------------------------------|
| Willpower  | `willpower` | Consistency, saying no         | Morning routine, no-sugar, limits     |
| Endurance  | `endurance` | Physical / mental stamina      | Sleep, exercise, water, steps         |
| Calmness   | `calmness`  | Stress resilience, recovery    | Meditation, breath, nature, sleep    |
| Focus      | `focus`     | Deep work, attention           | No-phone blocks, single-tasking, Pomodoro |

- **Model:** Each habit has `attributes: { willpower?: number, endurance?: number, calmness?: number, focus?: number }` (weights 0–1 or 1–3). Completing a habit adds progress to those attributes.
- **Display:** Attribute bars (e.g. 0–100) derived from recent completion rate + time. Optional “level” per attribute for extra milestones.
- **Engagement:** Players see “this quest trains Endurance + Calmness”, reinforcing meaning beyond a checkbox.

### 1.2 XP & Level Progression (Meaningful, Not Linear)

**Why:** Flat XP per habit makes every day feel the same. Curved progression creates milestones and “level-up” moments.

- **Current:** Fixed `XP_PER_HABIT_FULL`, linear level thresholds.
- **Target:**
  - **XP formula:** Base XP × streak multiplier × attribute bonus × daily completeness. Example: `baseXp * (1 + 0.1 * min(streak, 7)) * (1 + 0.05 * perfectDaysThisWeek)`.
  - **Level curve:** Exponential or step-based (e.g. levels 1–5 fast, 6–10 slower, 11+ prestige feel). Store curve in config (e.g. `GAME_CONFIG.xp.levelCurve`).
  - **Soft cap:** Optional weekly XP cap to avoid burnout and encourage sustainable pace.

### 1.3 Soft Penalties (Missed Habits)

**Why:** No consequence for skipping reduces commitment. Light penalties increase weight of choice without feeling punitive.

- **XP decay:** If user had activity yesterday and has none today by end-of-day, apply a small XP penalty (e.g. -5% of yesterday’s XP) or “fatigue” that reduces next day’s gain. Implement as `applyEndOfDayPenalty(dateKey)`.
- **Streak loss:** Already present; optionally “grace day” once per week (configurable) to protect streak from one miss.
- **Fatigue / debuff:** After 3+ missed days in a row, show “Fatigue” state: next completion gives +10% XP (comeback bonus) or reduced XP until one full day is completed (design choice). Stored as `character.fatigueUntil` or `character.comebackBonusUntil`.

### 1.4 Streaks (Flexible Rules)

**Why:** “Daily only” excludes people who design habits as 3×/week. Flexible rules improve inclusivity and realism.

- **Modes:** `daily` | `per_week` (min times per week) | `custom` (e.g. “at least 4 of last 7 days”).
- **Schema:** `habit.streakRule: { type: 'daily' } | { type: 'per_week', minTimes: 3 } | { type: 'rolling', windowDays: 7, minDays: 4 }`.
- **Computation:** Per-habit streak based on `completions[habitId]` and `streakRule`. Global “activity streak” (any habit done) remains; add per-habit streak in UI and for achievements.

### 1.5 Long-Term Goals, Seasons, Milestones

**Why:** Long-term goals and seasons give something to work toward beyond daily lists; milestones create celebration moments.

- **Goals:** `character.goals: [{ id, title, targetType: 'xp'|'streak'|'habit_count', targetValue, deadline, completedAt }]`. UI: “Reach level 5 by end of month”, “7-day streak”.
- **Seasons:** Optional “Season 1 (Jan–Mar)” with a theme, seasonal quests, and a season pass–style progress bar (free track). Stored as `season: { id, start, end, progress, rewardsClaimed }`.
- **Milestone rewards:** Unlock titles, avatars, or perks at level/streak thresholds (see Equipment / Perks below).

### 1.6 Motivation Loop (Trigger → Action → Reward → Progression)

- **Trigger:** Notifications (existing), morning “today’s quests” view, optional “focus quest” (one habit highlighted).
- **Action:** Quick-tap completion (existing dots/buttons), optional “quick complete” from home widget or notification.
- **Reward:** Immediate: animation + sound + XP pop; short-term: streak tick, attribute bar move; medium: level-up modal; long-term: achievement, perk unlock.
- **Progression:** Always visible: level bar, attribute bars, streak counter, “next milestone” line. Reduces “did this matter?” doubt.

---

## 2. GAMIFICATION SYSTEMS

### 2.1 Skill Tree / Progression Paths

**Why:** Choice and branching increase ownership and replayability.

- **Model:** `GAME_CONFIG.skillTree: [{ id, name, icon, unlockAtLevel, requires: [], effects: { xpBonus?: number, attributeBonus?: object } }]`. Character stores `unlockedNodes: string[]`.
- **UI:** Small tree or “paths” (e.g. Path of Discipline vs Path of Balance). Unlocking a node can add +5% XP for “Focus” habits or +1 grace day per week.

### 2.2 Equipment / Perks (Unlocked via Achievements)

**Why:** Achievements that only show a badge are underused. Unlockable perks make achievements desirable.

- **Model:** `GAME_CONFIG.perks: [{ id, name, description, unlockAchievementId, effect: { type: 'xp_multiplier'|'grace_day'|'attribute_boost', value } }]`. Character: `equippedPerks: string[]` (or one slot per “slot type”).
- **Examples:** “Silver Streak” (achievement) → unlock perk “+1 grace day per week”; “Full Week” → “+5% XP on Sundays”.

### 2.3 Rare Rewards & Collectibles

**Why:** Variable rewards and collectibles increase dopamine variance and long-term goals.

- **Random drop:** On level-up or perfect day, small chance to “drop” a collectible (e.g. title, avatar skin). `character.collectibles: string[]`, `GAME_CONFIG.collectibles: [{ id, name, rarity: 'common'|'rare'|'epic' }, ...]`.
- **Rarity:** Common 80%, rare 15%, epic 5% (config-driven). Display in “Collection” panel.

### 2.4 Daily & Weekly Quests

**Why:** Rotating objectives keep the loop fresh and align with “quest” language.

- **Daily:** “Complete 3 habits before 12:00”, “Get 100% on any one habit”. Stored in config; progress in `character.dailyQuestProgress: { questId: count }`; reset at midnight.
- **Weekly:** “7-day streak”, “Complete 20 habits total”. Same idea, reset on Monday or Sunday.
- **Rewards:** Bonus XP, or progress toward a seasonal track.

### 2.5 Visual & Audio Feedback

**Why:** Immediate feedback reinforces the action–reward loop.

- **On completion:** Short animation (e.g. check burst, bar fill), optional sound (toggle in settings). CSS animation + optional Web Audio beep.
- **Level-up:** Modal or full-screen “Level Up!” with new level and optional perk choice.
- **Achievement unlock:** Toast or small modal with icon and title.

### 2.6 Achievement Tiers

**Why:** Bronze/silver/gold (already present) create hierarchy; can gate perks or cosmetics.

- Keep current tier in `ACHIEVEMENTS_LIST`; use for styling and for “unlocks perk X”.

---

## 3. UX & ONBOARDING

### 3.1 Interactive Onboarding

- **Flow:** (1) Welcome + “What’s your main goal?” → (2) Choose preset (Health / Discipline / Mindfulness / Productivity) or Custom → (3) Preset suggests 3–5 habits; user can add/remove → (4) Name character, optional goal text → (5) “Start” → main app.
- **Why:** Reduces blank-screen anxiety and makes first session productive in &lt;2 minutes.

### 3.2 Goal Presets

- **Presets:** Health (sleep, water, exercise, steps), Discipline (wake time, no-sugar, limits), Mindfulness (meditation, breath, journal), Productivity (deep work, Pomodoro, plan day). Each preset = list of habit templates with `attributes` and names.
- **Storage:** User’s habits are still stored as habits; preset is only for initial seed.

### 3.3 Quick Actions (&lt;30s Daily Flow)

- **One-tap complete:** Already present (dots). Add “Complete all” for a single habit when target is 1.
- **Home focus:** Top 3 “today’s priorities” or “focus quests” at top; rest below or in “More”.
- **Swipe or long-press:** Swipe to complete (mobile), long-press for options (edit/delete). Optional.

### 3.4 Highly Visual Progress

- **Bars:** Level bar (existing), attribute bars (new), daily % bar.
- **Heatmap:** Calendar as heatmap (color by % or streak), e.g. GitHub-style.
- **Streak indicators:** Flame + number; “at risk” if today not done by evening.

---

## 4. ANALYTICS & INSIGHTS

### 4.1 Data to Store (Extend Completions)

- Keep `completions: { [habitId]: { [dateKey]: number } }`.
- Add optional `completionLog: { dateKey, habitId, completedAt (timestamp), value }` for “first completion time” (early_bird) and future analytics. Can derive from existing data + new “completedAt” if needed.

### 4.2 Habit Completion Trends

- **Per habit:** Completion rate last 7 / 30 days; trend “up / down / stable” (compare two halves of period).
- **Overall:** Average % last 7 days, 30 days. Functions: `getHabitTrend(habitId, days)`, `getOverallTrend(days)`.

### 4.3 Weekly / Monthly Stats

- **API:** `getWeekStats(weekStartDate)`, `getMonthStats(monthKey)`: total completions, total XP, days active, best streak in period.
- **UI:** “This week: 18 completions, 120 XP, 5/7 days active.”

### 4.4 Heatmaps & Charts

- **Heatmap:** Grid 7×N (weeks); cell color by `getDayStats(dateKey).percent` or streak. Reuse calendar data.
- **Charts:** Existing 7-day chart; add 30-day view (optional), and attribute progress over time if attributes are stored historically.

### 4.5 Streak History & Recovery

- **History:** `character.streakHistory: { dateKey: number }` (optional) or compute from completions. Show “Longest streak: 12 days”.
- **Recovery suggestion:** If streak just broke: “Start a new streak today. One quest counts.”

---

## 5. SOCIAL & RETENTION (Architecture Only)

**Why:** Designed in now so we don’t paint ourselves into a corner.

- **Identity:** Keep `character` as local; later add optional `userId` (anonymous or from auth) for sync.
- **Friends / leaderboards:** Table `friends` (userId, friendId); `leaderboard` view: aggregate XP or streak per user in period. API: getLeaderboard(period, limit).
- **Group quests:** “Challenge: our group completes 100 habits this week.” Model: `challenge: { id, type: 'group', target, start, end, participants: [userId] }`, progress from participants’ completions.
- **Sharing:** Share achievement or level-up as image (canvas) or deep link. No backend required for image generation.

---

## 6. TECHNICAL ARCHITECTURE

### 6.1 Data Models (Schemas)

```ts
// Habit (extended)
interface Habit {
  id: string;
  name: string;
  target: number;
  reminders: string[];
  variations?: string[];
  // NEW: game design
  attributes?: { [attrId: string]: number };  // e.g. { willpower: 1, endurance: 0.5 }
  streakRule?: { type: 'daily' } | { type: 'per_week'; minTimes: number } | { type: 'rolling'; windowDays: number; minDays: number };
  category?: string;  // for presets/filter
}

// Character (extended)
interface Character {
  name: string;
  goal?: string;
  totalXp: number;
  streak: number;
  lastActivityDate: string | null;
  achievements: string[];
  xpAddedToday: number;
  xpAddedTodayDate: string | null;
  // NEW
  attributes?: { [attrId: string]: number };  // 0–100 current value
  level?: number;  // derived from totalXp, can cache
  goals?: Array<{ id: string; title: string; targetType: string; targetValue: number; deadline?: string; completedAt?: string }>;
  season?: { id: string; start: string; end: string; progress: number; rewardsClaimed: string[] };
  unlockedPerks?: string[];
  equippedPerks?: string[];
  collectibles?: string[];
  dailyQuestProgress?: Record<string, number>;
  weeklyQuestProgress?: Record<string, number>;
  fatigueUntil?: string;  // dateKey
  comebackBonusUntil?: string;
}

// Completions (unchanged, maybe add completedAt per entry later)
// completions[habitId][dateKey] = number
```

### 6.2 Config-Driven Constants (No Hardcoding)

- **Single source:** `game-config.js` (or `GAME_CONFIG` in app) holds:
  - `xp`: baseXpPerHabit, levelCurve[], streakMultiplier, decayPenalty, comebackBonus
  - `attributes`: [{ id, name, icon, maxValue }]
  - `achievements`: full list with tier, unlockConditions, optional perkId
  - `perks`, `skillTree`, `collectibles`, `dailyQuests`, `weeklyQuests`
- **Why:** Tuning and A/B tests without touching logic; same config can drive UI labels and formulas.

### 6.3 Separation: Game Logic vs UI

- **Game logic:** Pure functions in `core.js` and a new `game-engine.js`: `computeXp(habit, completions, dateKey, character)`, `getLevelFromXp(totalXp, config)`, `evaluateAchievements(character, habits, completions)`, `getAttributeProgress(character, habitId, completions)`. No DOM.
- **UI:** `app.js` or `views/*` only call game-engine and render; all state changes go through engine (e.g. “complete habit” → engine returns new character + completions; UI saves and re-renders).
- **Why:** Testable, portable (e.g. future mobile app reuses engine).

### 6.4 Extensibility (AI, Social, Challenges)

- **Events:** Emit internal “events” (e.g. `habit_completed`, `level_up`, `achievement_unlocked`). Handlers can push to analytics, show toasts, or later call AI coach / social API.
- **Adapters:** “Storage adapter” (localStorage now; later IndexedDB or API). “Notification adapter” (Web now; later push). Keeps game logic free of storage/network details.

### 6.5 Refactoring Suggestions

| Area           | Current              | Recommendation |
|----------------|----------------------|----------------|
| XP / level     | Inline constants     | Use `GAME_CONFIG.xp` everywhere |
| Achievements   | Hardcoded list + logic| List in config; `evaluateAchievements(config, state)` |
| Character      | Flat object          | Add `attributes`, `goals`, `perks`, etc.; migration for old saves |
| Habits         | No attributes        | Add `attributes`, `streakRule`; defaults for existing |
| Completions    | habitId → date → count | Keep; optionally add `completedAt` in nested object |
| Save/load      | Multiple keys        | Single `ARISEHABIT_STATE` with version for migrations |

---

## 7. DELIVERABLES CHECKLIST

- [x] Architecture recommendations (this document)
- [x] Data models / schemas (Section 6.1)
- [x] Refactoring suggestions (Section 6.5)
- [x] Concrete code: game-config.js
- [x] Concrete code: extend character + habits in app.js with attributes and config
- [x] Comments in code explaining WHY for engagement/retention (in code)

---

## 8. IMPLEMENTATION STATUS

**Done:**
- **game-config.js** — Central config: `xp` (baseXpPerHabit, levelCurve, streakMultiplier), `attributes`, `achievements`, `perks`, `defaultAttributeWeights`. Used by app.js for XP, levels, achievements, and habit→attribute defaults.
- **app.js** — XP and ACHIEVEMENTS_LIST sourced from AriseConfig when present; `normalizeHabit()` adds `attributes` and `streakRule`; `loadCharacter()` migrates old saves to `character.attributes` and `unlockedPerks`/`equippedPerks`; `computeTodayXp()` applies streak multiplier from config.
- **DEFAULT_HABITS** — Each has `category` (sleep, water, exercise, breath, reading, screens_off, ritual) for default attribute weights.

**Next (recommended order):**
1. **UI for attributes** — Show character attribute bars (from `character.attributes`) and optional per-habit “trains: Endurance, Calmness” from `habit.attributes`.
2. **Perks application** — When evaluating XP or streak, apply `equippedPerks` (e.g. grace day, Sunday XP bonus).
3. **Onboarding presets** — Goal presets (Health / Discipline / Mindfulness / Productivity) that seed habits with categories.
4. **Daily/weekly quests** — Config in game-config; progress in character; reset and reward logic.
5. **Soft penalties** — End-of-day job or daily open: apply decay/comeback from config.
6. **Analytics** — getHabitTrend, getWeekStats, getMonthStats; heatmap from existing calendar data.
