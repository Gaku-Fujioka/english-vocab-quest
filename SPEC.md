# SPEC.md

# TOEIC Vocabulary Quest

## 1. Overview

Build a mobile-first web app for TOEIC vocabulary learning.

The app focuses on:

* Daily review
* New word learning
* Spaced repetition
* Mastery tracking
* Weak word ranking
* Learning streak
* GitHub-style heatmap

This is a personal learning app for a user aiming to improve TOEIC vocabulary and reach a higher TOEIC score.

---

## 2. Tech Stack

Use the following stack:

* React
* TypeScript
* Vite
* LocalStorage

Do not implement a backend, authentication, or database in Version 1.

The app should work fully on the client side.

---

## 3. Main Screens

The app has four main screens:

1. Home
2. Study
3. My Page
4. Settings

Use bottom navigation for these four screens.

---

## 4. Home Screen

Purpose:

Show today's learning tasks and motivate the user to start studying.

Display:

* Today's review count
* Learning streak
* Total mastered words
* Overall mastery percentage
* Today's progress bar

Main button:

* Start Learning

When the user clicks Start Learning, show a modal or panel with:

* Today's review count
* New word mode selection:

  * Skip
  * Quick: 20 new words
  * Normal: 30 new words
  * Intensive: 40 new words

Learning flow:

1. Review words first.
2. After review is finished, start new words.
3. If the user selects Skip, only review words are studied.
4. After all words are finished, show the completion screen.

---

## 5. Study Screen

Purpose:

Flashcard-based vocabulary learning.

Card front:

* English word only

Card back:

* English word
* Japanese meaning
* Part of speech
* Remaining perfect reviews until mastery

Example:

inventory

Meaning:
在庫

Part of Speech:
noun

Mastery:
2 more perfect reviews needed

Rating buttons:

* Perfect
* Knew It
* Unsure
* Didn't Know

Button definitions:

* Perfect: The user remembered instantly.
* Knew It: The user remembered after thinking for a few seconds.
* Unsure: The user recognized the meaning after seeing the answer.
* Didn't Know: The user could not remember it.

The Study screen should be simple and distraction-free.

---

## 6. My Page

Purpose:

Show personal learning progress.

Sections:

### Profile Summary

Display:

* Target TOEIC score
* Total mastered words
* Learning streak

### Overall Progress

Display:

* Mastered words / total registered words
* Percentage

Example:

421 / 1200 words

35%

### Section Progress

Display progress for:

* 600 level
* 700 level
* 850 level
* 950 level

Each section should show:

* Mastered words in that section
* Total words in that section
* Progress percentage
* Progress bar

### Weak Word Ranking

Show top difficult words.

Display:

* Word
* Meaning
* Weak point

Sort by weakPoint descending.

### Learning Heatmap

Show a GitHub-style yearly heatmap.

* Each square represents one day.
* Darker color means more study activity.
* Use daily learning records.

---

## 7. Settings Screen

Purpose:

Manage goal and data.

Features:

### Goal Settings

The user can change the target TOEIC score.

Options:

* 600
* 730
* 850
* 950

### Vocabulary Import

The user can import vocabulary data from CSV.

Required CSV columns:

word,meaning,partOfSpeech,section

Valid section values:

* 600
* 700
* 850
* 950

### Data Management

Features:

* Export all app data as JSON
* Import app data from JSON
* Reset all data

Reset should require confirmation.

---

## 8. Vocabulary Data

Vocabulary data must be imported by CSV or JSON.

Do not hardcode real vocabulary lists copied from external websites.

Development can use a small dummy dataset only.

### Word Type

```ts
export type WordSection = "600" | "700" | "850" | "950";

export type Word = {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  section: WordSection;
};
```

---

## 9. Learning State

The learning state should be stored separately from the original word data.

```ts
export type Rating = "perfect" | "knew" | "unsure" | "unknown";

export type WordLearningState = {
  wordId: string;
  mastered: boolean;
  perfectCount: number;
  weakPoint: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  reviewCount: number;
};
```

---

## 10. Settings Type

```ts
export type TargetScore = 600 | 730 | 850 | 950;

export type AppSettings = {
  targetScore: TargetScore;
};
```

---

## 11. Daily Learning Record

```ts
export type DailyLearningRecord = {
  date: string;
  reviewCount: number;
  newCount: number;
  masteredIncrease: number;
};
```

Use this for:

* Today's progress bar
* Learning streak
* GitHub-style heatmap

---

## 12. Rating Rules

### Perfect

Meaning:

The user remembered instantly.

Effects:

* perfectCount + 1
* weakPoint - 1
* weakPoint minimum is 0
* nextReviewAt = 7 days later

If perfectCount becomes 3 or more:

* mastered = true
* nextReviewAt = 30 days later

---

### Knew It

Meaning:

The user remembered after thinking for a few seconds.

Effects:

* perfectCount unchanged
* weakPoint unchanged
* nextReviewAt = 7 days later

If the word was mastered:

* mastered = false
* perfectCount = 0
* nextReviewAt = 7 days later

---

### Unsure

Meaning:

The user recognized the meaning after seeing the answer.

Effects:

* perfectCount = 0
* weakPoint + 1
* mastered = false
* nextReviewAt = 3 days later

---

### Didn't Know

Meaning:

The user could not remember it.

Effects:

* perfectCount = 0
* weakPoint + 2
* mastered = false
* nextReviewAt = 1 day later

---

## 13. Mastery Rule

A word becomes mastered when:

perfectCount >= 3

After a word becomes mastered:

* It should be reviewed again after 30 days.
* If the user presses Perfect during the 30-day review, it stays mastered.
* If the user presses any other button, mastery is removed.

---

## 14. Review Selection

Review target:

Select all words where:

nextReviewAt <= today

Review limit:

40 words per day

Sort order:

1. Higher weakPoint first
2. Older nextReviewAt first

---

## 15. New Word Selection

New words are selected after review.

Modes:

* Skip: 0 words
* Quick: 20 words
* Normal: 30 words
* Intensive: 40 words

Only words not yet studied should be selected as new words.

A word is considered not yet studied if it has no WordLearningState.

---

## 16. New Word Section Allocation

The app uses progress-dependent automatic allocation.

The target score affects which sections are active.

For target score 600:

* Active sections: 600

For target score 730:

* Active sections: 600, 700

For target score 850:

* Active sections: 600, 700, 850

For target score 950:

* Active sections: 600, 700, 850, 950

Selection logic:

1. Calculate mastery rate for each active section.
2. Prioritize sections with lower mastery rate.
3. Do not select from sections with no unstudied words left.
4. Fill the requested number of new words.

Example:

If target score is 850 and mastery rates are:

* 600: 90%
* 700: 40%
* 850: 5%

The app should prioritize 850 and 700 over 600.

A simple weighted algorithm is acceptable for Version 1.

---

## 17. Progress Calculation

Overall progress:

mastered words / total registered words

Section progress:

mastered words in section / total words in section

---

## 18. Weak Word Ranking

Each word has weakPoint.

Rating effects:

* Perfect: -1
* Knew It: 0
* Unsure: +1
* Didn't Know: +2

weakPoint cannot be less than 0.

Ranking:

* Sort by weakPoint descending
* Show top 10 words

---

## 19. LocalStorage

Use these LocalStorage keys:

* toeic_vocab_words
* toeic_vocab_learning_states
* toeic_vocab_daily_records
* toeic_vocab_settings

---

## 20. CSV Import Format

Support CSV import.

Required columns:

word,meaning,partOfSpeech,section

Example:

```csv
word,meaning,partOfSpeech,section
inventory,在庫,noun,600
negotiate,交渉する,verb,700
available,利用できる,adjective,600
```

Valid section values:

* 600
* 700
* 850
* 950

The app should validate imported data.

Invalid rows should be skipped and reported to the user.

---

## 21. JSON Export Format

Export all app data as JSON.

The exported file should include:

* words
* learningStates
* dailyRecords
* settings

---

## 22. Completion Screen

After the daily session, show:

* Review completed count
* New words completed count
* Mastered words increased today
* Total mastered words
* Current learning streak

Example:

Today's study complete!

Review:
28 / 28

New Words:
20 / 20

Mastered:
+3

Current Streak:
17 days

---

## 23. Non-goals for Version 1

Do not implement:

* Authentication
* Database
* Cloud sync
* AI example sentence generation
* Audio pronunciation
* Reverse test
* Payment
* Mobile app packaging

---

## 24. Expected Folder Structure

```text
src/
  components/
    layout/
    home/
    study/
    mypage/
    settings/
  data/
    sampleWords.ts
  hooks/
  lib/
    storage.ts
    scheduler.ts
    progress.ts
    importExport.ts
  pages/
    HomePage.tsx
    StudyPage.tsx
    MyPage.tsx
    SettingsPage.tsx
  types/
    word.ts
    learning.ts
    settings.ts
  App.tsx
  main.tsx
```

---

## 25. Implementation Milestones

Build in this order:

1. Type definitions
2. LocalStorage utilities
3. Small dummy sample word dataset
4. Basic app layout with bottom navigation
5. Placeholder pages for Home, Study, My Page, and Settings
6. Home screen and study start modal
7. Study screen flashcard UI
8. Rating logic
9. Review scheduling
10. New word selection
11. My Page progress
12. Weak word ranking
13. Heatmap
14. Settings and import/export

Do not implement everything in one huge commit.
