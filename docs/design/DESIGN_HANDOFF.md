# DESIGN_HANDOFF.md

# Design Handoff

## 1. Design Source

The UI design was created using Google Stitch.

Use the files in this folder as visual references.

Expected screenshots:

```text
docs/design/screenshots/home.png
docs/design/screenshots/study.png
docs/design/screenshots/my-page.png
docs/design/screenshots/setting.png
```

If Stitch exported code exists, store it here:

```text
docs/design/stitch-export/
```

---

## 2. Design Direction

The app should feel:

* Clean
* Modern
* Motivating
* Mobile-first
* Easy to use every day

Visual inspiration:

* Duolingo for motivation
* Anki for flashcard learning
* Notion for simple layout

---

## 3. Navigation

Use bottom navigation with four tabs:

* Home
* Study
* My Page
* Settings

The UI should be optimized for smartphone usage.

---

## 4. Home Screen Requirements

The Home screen must include:

* Today's review count
* Learning streak
* Total mastered words
* Overall progress
* Today's progress bar
* Start Learning button

When Start Learning is clicked, show a modal or panel with:

* Review count
* New word options:

  * Skip
  * Quick 20
  * Normal 30
  * Intensive 40

---

## 5. Study Screen Requirements

The Study screen must include:

* Large flashcard
* Tap or click to reveal
* Four rating buttons

The card front shows:

* English word only

The card back shows:

* English word
* Japanese meaning
* Part of speech
* Remaining perfect reviews until mastery

Rating buttons:

* Perfect
* Knew It
* Unsure
* Didn't Know

---

## 6. My Page Requirements

The My Page screen must include:

* Target score
* Total mastered words
* Learning streak
* Overall progress
* Section progress
* Weak word ranking
* GitHub-style heatmap

Section progress should include:

* 600 level
* 700 level
* 850 level
* 950 level

---

## 7. Settings Screen Requirements

The Settings screen must include:

* Target score setting
* Vocabulary CSV import
* Data export
* Data import
* Reset data

---

## 8. Implementation Note

Do not blindly paste Stitch code into production.

Recreate the design using clean React components and TypeScript.

Use Stitch output as a reference for:

* Layout
* Spacing
* Colors
* Typography
* Visual hierarchy
* Component style
