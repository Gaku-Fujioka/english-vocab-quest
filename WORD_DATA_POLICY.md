# WORD_DATA_POLICY.md

# Vocabulary Data Policy

## 1. Basic Policy

This app supports importing TOEIC vocabulary data from CSV or JSON.

The app must not hardcode or redistribute full vocabulary lists copied from third-party websites.

The app should provide an import feature so the user can prepare vocabulary data locally for personal study.

---

## 2. Reference Websites

The user may personally refer to vocabulary lists from websites such as:

* a-goes.com TOEIC word list
* toiguru.jp TOEIC vocabulary list

However, the repository should not include copied full word lists, Japanese meanings, or difficulty classifications from third-party websites unless explicit permission or an appropriate license is confirmed.

---

## 3. Recommended Workflow

1. The app provides CSV import.
2. The user prepares a local CSV file for personal study.
3. The CSV file is imported through the Settings screen.
4. The CSV file itself should not be committed to a public repository.

---

## 4. CSV Format

Required columns:

```csv
word,meaning,partOfSpeech,section
```

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

---

## 5. Repository Rule

Do not commit private vocabulary data.

The following files and folders should be ignored:

```gitignore
/private-vocab/
*.private.csv
*.private.json
/exports/
```

---

## 6. Development Data

For development, use only a small dummy dataset.

Example dummy words are acceptable, but do not include a large copied TOEIC vocabulary list in the repository.
