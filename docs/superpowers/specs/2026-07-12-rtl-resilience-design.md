# Design — RTL עמיד לגרסאות (v0.1.8)

**תאריך:** 2026-07-12
**סטטוס:** מאושר לכתיבת תוכנית מימוש
**גרסת יעד:** 0.1.8

---

## 1. הבעיה

לקוח דיווח שאחרי עדכון Cursor, התוסף "Cursor Chat RTL Support" הפסיק לעבוד כמו שצריך:
הכפתור ⇄ מופיע, אך תגובות ה‑AI **אינן מיושרות לימין**.

### אבחון — שורש הבעיה (מאושר מול DOM חי + bundle של Cursor)

התוסף מזריק CSS/JS ל‑`workbench.html` של Cursor. שכבת הקבצים תקינה (הכפתור מופיע → ה‑JS רץ,
מזהי‑הפקודות של הסרגל תקפים). מה שנשבר הוא **שכבת ה‑CSS**: Cursor שינה מבנה ושמות‑מחלקות של
רכיבי הצ'אט, והסלקטורים שלנו התיישנו.

הגורם המרכזי: **תוכן ה‑AI הוצא מתוך `.composer-rendered-message`.**

| רכיב | מבנה קודם (שהתוסף מצפה לו) | מבנה נוכחי (Cursor 1.1.3+) |
|---|---|---|
| הודעת משתמש | `.composer-rendered-message` | `.composer-rendered-message` + `[data-message-role="human"]` |
| **הודעת AI** | `.composer-rendered-message .markdown-root` | `[data-message-role="ai"]` → `.agent-transcript-row-markdown` → `.markdown-root` (**ללא** `.composer-rendered-message`) |

הכלל `body.cursor-chat-rtl .composer-rendered-message .markdown-root { direction: rtl }` לא תופס
יותר תגובות AI, כי הן כבר לא יושבות בתוך `.composer-rendered-message`. לכן "יש כפתור אבל אין יישור".

### תוצאת בדיקת‑הסלקטורים המלאה (audit)

נבדק כל סלקטור ב‑`src/content.ts` מול ה‑bundle הנוכחי:

**שכבת legacy — 15 סלקטורים, 0 hits בגרסה החדשה (ממשק VS Code הישן ש‑Cursor נטש):**
`chat-markdown-part`, `interactive-input-editor`, `interactive-result-code-block`,
`interactive-result-editor`, `chat-thinking-box`, `chat-used-context`, `chat-attached-context`,
`interactive-item-container`, `chat-footer-toolbar`, `interactive-result-vulns`,
`interactive-input-and-execute-toolbar`, `interactive-input-and-side-toolbar`,
`checkpoint-container`, `checkpoint-restore-container`, `request-hover`.
> החלטה: **נשמרים** כ‑fallback לגרסאות Cursor שלא עודכנו (ראה סעיף 3). 0‑hits בגרסה החדשה = לא מזיקים.

**חורים בהגנות ה‑LTR של קוד — GONE:**
`composer-code-block-container`, `composer-diff-block`, `composer-terminal-output`.
העוגן האמיתי לקוד היום הוא `.ui-code-block` (34 hits).

**עוגנים תקפים (מאושרים):**
`markdown-root` (36), `composer-questionnaire-toolbar` (32), `ui-code-block` (34),
`ui-code-block-copy-overlay` (7), `ui-step-group-header` (7), `composer-message-codeblock` (3),
`composer-human-message` (3), `aislash-editor-input-readonly` (3),
`composer-rendered-message` (1, רק הודעות משתמש).

**טקסונומיה סמנטית יציבה חדשה (design‑system של Cursor, לא hashes):**
`ui-markdown__paragraph`, `__list`, `__list-item`, `__heading`, `__hr`, `__blockquote`,
`__table`, `__thead`, `__tr`, `__th`, `__td`, `__table-cell-content`, `__inline-code`,
`__link`, `__del`, `__task-checkbox`.

---

## 2. עיקרון‑על ודרישות

**עיקרון‑העל: שינוי מינימלי ששומר על המבנה הקיים.** המטרה היא להחזיר תפקוד ל‑99% מהמקרים
על ידי תיקון הבאג האמיתי (סלקטורים מיושנים), **לא** שכתוב התנהגותי. ההתנהגות הקיימת
(`unicode-bidi: plaintext` + `text-align: start`) נשמרת.

**A — תגובות AI לפי סוג הטקסט (אוטומטי), לא כפיית RTL.**
תשובה שכולה אנגלית → נשארת LTR; תשובה בעברית → RTL. מושג עם `unicode-bidi: plaintext` +
`text-align: start` פר‑בלוק — כל פסקה/כותרת/פריט מחליטים כיוון לפי תוכנם.
> **טרייד‑אוף מקובל:** פסקה עברית שמתחילה במילה אנגלית מודגשת תתיישר שמאלה (`plaintext` מחליט
> לפי האות החזקה הראשונה). זה המחיר של טיפול נכון בתוכן שכולו אנגלית. דרישת הלקוח ל"תמיד RTL"
> **אינה מחייבת** והוכרעה לטובת התנהגות‑לפי‑תוכן.

**B — רשימות וטבלאות עוקבות אחר סוג הטקסט.**
`ul`/`ol`/`li` וטבלאות מקבלים אותו טיפול `plaintext` + `start` — מיושרים לפי תוכנם, לא בכפייה.

**C — כפתור ⇄ הפר‑קוד‑בלוק חייב לעבוד.**
כרגע מטפל‑הלחיצה מחפש `.composer-message-codeblock` שנעלם כעוגן העליון; המיכל היום הוא `.ui-code-block`.
לחיצה על הכפתור צריכה להפוך את אותו בלוק‑קוד ל‑RTL, וה‑RTL הזה חייב לנצח את כלל ה‑LTR הגלובלי.

**D — ריענון עמוק לפאנל השאלות (Questions).**
מעבר ל‑`direction: rtl` הבסיסי על `.composer-questionnaire-toolbar` — יישור מלא של הכרטיס:
טקסט השאלה, אפשרויות A/B/C/D, וכפתורי Skip / Continue. הטקסט עצמו לפי סוג‑תוכן
(`plaintext` + `start`), המבנה מיושר RTL (`direction: rtl`).
> **תלות‑מידע:** נדרש DOM חי של פאנל שאלות אמיתי כדי לדייק את הסלקטורים הפנימיים (כותרת, אפשרויות,
> כפתורים). ה‑audit אישר שהעוגן העליון `.composer-questionnaire-toolbar` תקף (32 hits), אך המבנה
> הפנימי טרם נלכד. ייאסף בתחילת המימוש.

**חוצה‑כל — קוד נשאר LTR כברירת‑מחדל** עד שלוחצים על הכפתור הפר‑בלוק שלו.

---

## 3. ארכיטקטורה

מנגנון ה‑patch נשאר ללא שינוי. **אין נגיעה** ב:
- `src/finder.ts` — איתור התקנה דרך `vscode.env.appRoot`.
- `src/injector.ts` — הזרקת `<link>`/`<script>`, גיבוי, הסרת checksum.
- זרימת ההפעלה / auto‑reactivate ב‑`src/extension.ts`.

השינוי מרוכז ב**תוכן** שמוזרק (`src/content.ts`) + פקודת אבחון חדשה. שכבת הקבצים הוכחה תקינה,
ולכן לא נוגעים בה — סיכון נמוך.

### עקרונות‑העל של ה‑CSS החדש
1. **תוסף, לא החלפה (backward‑compatible)** — הסלקטורים הישנים **נשמרים** כ‑fallback לגרסאות Cursor
   שלא עודכנו, והעוגנים החדשים מתווספים לצידם. הישנים הם 0‑hits בגרסה החדשה (לא מזיקים) ועדיין
   עובדים בישנה. זו גם צורת הגידור הכפול בין‑גרסאות.
2. **גידור כפול** — כל חוק תופס גם עוגן‑תג/מחלקה‑יציבה **וגם** data‑attribute, כך שעדכון צריך
   לשבור את שניהם יחד כדי לפגוע בנו.
3. **עוגנים יציבים** — שמות‑תגים (לא משתנים לעולם), `.markdown-root`, `.ui-code-block`,
   מחלקות `ui-markdown__*`, ו‑`[data-message-role]`.

---

## 4. עיצוב מפורט — CSS

### 4.1 טקסט הודעה (דרישות A + B) — אוטומטי לפי סוג הטקסט

```css
/* מיכל תוכן AI → כיוון בסיס RTL. גידור כפול: data-attr + מחלקה יציבה.
   העוגנים הישנים (.composer-rendered-message .markdown-root) נשמרים למטה כ-fallback. */
body.cursor-chat-rtl :is([data-message-role="ai"], .markdown-root) {
    direction: rtl;
}

/* כל בלוק מחליט כיוון לפי תוכנו (plaintext) ומיושר בהתאם (start).
   עוגן כפול: שמות-תגים + מחלקות ui-markdown__* */
body.cursor-chat-rtl :is([data-message-role="ai"], .markdown-root)
    :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, ul, ol,
        .ui-markdown__paragraph, .ui-markdown__list, .ui-markdown__list-item,
        .ui-markdown__heading, .ui-markdown__blockquote) {
    text-align: start !important;
    unicode-bidi: plaintext !important;   /* פסקה עברית→ימין, אנגלית→שמאל, אוטומטית */
}

/* טבלאות (דרישה B) — אותו טיפול אוטומטי */
body.cursor-chat-rtl :is([data-message-role="ai"], .markdown-root)
    :is(th, td, .ui-markdown__th, .ui-markdown__td) {
    text-align: start !important;
    unicode-bidi: plaintext !important;
}
```

הערה: `unicode-bidi: plaintext` נותן התנהגות‑לפי‑תוכן (כמו `dir="auto"`) — כל בלוק מחליט כיוון
לפי האות החזקה הראשונה שלו. תחת כיוון‑בסיס RTL, `text-align: start` מיישר כל בלוק לפי כיוונו‑שלו.
זו ההתנהגות הקיימת שנשמרת (עיקרון‑העל: שינוי מינימלי).

**Fallback ישן (נשמר לגרסאות Cursor שלא עודכנו):** אותם חוקים גם על
`.composer-rendered-message .markdown-root` ו‑`.chat-markdown-part.rendered-markdown`.

### 4.2 הודעת משתמש

`.composer-human-message` / `.aislash-editor-input-readonly` עדיין קיימים ומקבלים כבר
`dir="rtl"` נטיבית מ‑Cursor (lexical editor). נשמור כלל RTL קל, מגודר כפול, למקרה שזה משתנה:

```css
body.cursor-chat-rtl :is([data-message-role="human"], .composer-human-message,
    .aislash-editor-input-readonly) {
    direction: rtl !important;
    text-align: start !important;
}
```

### 4.3 קוד — LTR כברירת‑מחדל (חוצה‑כל)

עוגן חדש `.ui-code-block` (במקום ה‑`composer-*-container` שנעלמו):

```css
body.cursor-chat-rtl :is(.ui-code-block, .ui-default-code, .ui-default-code__line-content,
    code, pre, .ui-markdown__inline-code) {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}
```

`isolate` מבטיח שמחרוזות עברית בתוך קוד לא הופכות שורה. נשמרים גם עוגני‑LTR קיימים שעדיין תקפים
(`.ui-step-group-header`, `.composer-tool-call-container`, `.composer-tool-former-message`) +
מונקו‑אדיטורים.

### 4.4 פאנל שאלות (Questions) — דרישה D, ריענון עמוק

עוגן עליון `.composer-questionnaire-toolbar` (32 hits) → מבנה RTL; טקסט פנימי לפי סוג‑תוכן:

```css
/* מבנה הכרטיס מיושר RTL */
body.cursor-chat-rtl .composer-questionnaire-toolbar { direction: rtl !important; }

/* טקסט הכרטיס (שאלה + אפשרויות) לפי תוכן — סלקטורים פנימיים ייאמתו מול DOM חי */
body.cursor-chat-rtl .composer-questionnaire-toolbar :is(p, li, span, label /* + עוגנים פנימיים */) {
    text-align: start !important;
    unicode-bidi: plaintext !important;
}
/* כפתורי Skip / Continue — שמירה על סדר/יישור נכון (ייקבע לפי ה-DOM) */
```

**תלות‑מימוש:** הסלקטורים הפנימיים (כותרת, אפשרויות A/B/C/D, כפתורי פעולה) ייקבעו לאחר לכידת
DOM חי של פאנל שאלות בתחילת המימוש. העוגן העליון כבר מאושר.

### 4.5 כפתור פר‑קוד‑בלוק (דרישה C) — opt‑in, לא מגודר ב‑body class

```css
/* עוגן חדש .ui-code-block + fallback ישן. חייב לבוא אחרי כלל ה-LTR הגלובלי כדי לנצח */
.ui-code-block.cursor-code-rtl :is(.ui-default-code, .ui-default-code__line-content),
.composer-message-codeblock.cursor-code-rtl .ui-code-block {
    direction: rtl !important;
    text-align: right !important;
    unicode-bidi: plaintext !important;   /* כאן רצוי — קוד עברי, per-line auto */
}
.cursor-code-rtl-btn.cursor-rtl-active {
    background: var(--vscode-button-background, rgba(128,128,128,0.3)) !important;
    opacity: 1 !important;
}
```

**התנגשות specificity:** כלל ה‑LTR הגלובלי (`.ui-code-block { ltr !important }`) וכלל ה‑opt‑in
באותה specificity. הפתרון: ה‑opt‑in **בא אחרי** הגלובלי בקובץ (סדר‑מקור מכריע בין `!important` שווים).
זה כבר המבנה ב‑`RTL_CSS` (בלוק ה‑opt‑in אחרון). המימוש ישמור על הסדר הזה.

---

## 5. עיצוב מפורט — JS

שינוי יחיד ב‑`RTL_JS` בתוך `src/content.ts`, במטפל הכפתור הפר‑בלוק:

```js
// גידור כפול: עוגן חדש קודם, ישן כ-fallback
var codeblock = clicked.closest('.ui-code-block') || clicked.closest('.composer-message-codeblock');
if (!codeblock) return;
var nowActive = codeblock.classList.toggle('cursor-code-rtl');
clicked.classList.toggle('cursor-rtl-active', nowActive);
```

הזרקת הכפתור עצמו (`.ui-code-block-copy-overlay`) והכפתור הראשי בסרגל (`.editor-actions`,
`composer.createNewComposerTab`) נשארים — מאושר שהם עדיין תקפים.

---

## 6. פקודת אבחון (RTL: Diagnose Selectors)

**קובץ חדש `src/diagnose.ts`.** קורא את ה‑bundle של Cursor הנוכחי מ‑`appRoot`
(`out/vs/workbench/workbench.desktop.main.js`) ורץ בדיקת‑נוכחות על רשימת עוגנים ידועה
(class + data‑attribute). מדווח ל‑Output channel:

```
✓ [data-message-role]           7 hits
✓ .markdown-root               36 hits
✓ .ui-code-block               34 hits
✗ .composer-code-block-container  MISSING — סלקטור מיושן
```

- **רישום** ב‑`src/extension.ts` + הכרזה ב‑`package.json` (`contributes.commands`).
- **מטרה:** כשעדכון עתידי שובר משהו, הפקודה מצביעה תוך שניות על העוגן שנעלם.
- **מגבלה מוצהרת:** ה‑extension host לא קורא DOM חי (תהליך renderer נפרד), אלא את ה‑bundle שעל
  הדיסק — שמות‑המחלקות מופיעים שם כמחרוזות. אמין לזיהוי היעלמות עוגן, לא לאימות מבנה מדויק.

---

## 7. טסטים

- **ידני:** צ'אט עם (1) פסקה עברית → מיושרת לימין, ופסקה שכולה אנגלית → נשארת LTR (התנהגות‑לפי‑תוכן);
  (2) רשימת `ul` ותת‑כותרות → לפי תוכן; (3) טבלה; (4) בלוק קוד → נשאר LTR; (5) לחיצה על ⇄
  הפר‑בלוק → אותו בלוק הופך RTL; (6) פאנל שאלות עברי → כרטיס RTL, אפשרויות וכפתורים מיושרים (דרישה D);
  (7) toggle ראשי off/on; (8) גרסת Cursor ישנה → ה‑fallback הישן עדיין עובד.
- **אוטומטי:** unit‑test ש‑`RTL_CSS` מכיל את החוקים המגודרים‑כפול ואת סדר ה‑opt‑in‑אחרון;
  unit‑test ללוגיקת ה‑grep של `diagnose` מול fixture‑bundle.

---

## 8. קבצים שנוגעים בהם

| קובץ | שינוי |
|---|---|
| `src/content.ts` | שכתוב `RTL_CSS` (עיקר) + תיקון עוגן ב‑`RTL_JS` |
| `src/diagnose.ts` | **חדש** — לוגיקת בדיקת‑עוגנים |
| `src/extension.ts` | רישום פקודת diagnose |
| `package.json` | הכרזת פקודה + גרסה `0.1.8` |
| `changelog.md` | רשומת 0.1.8 |

---

## 9. סיכום עמידוּת (הצהרה כנה)

הגישה **לא מבטלת** שבירה עתידית — התוסף מטליא אפליקציה סגורה. היא מקטינה את **תדירות** ו**חומרת**
השבירה: פחות סלקטורים, עוגנים על השכבות היציבות ביותר (תגים / data‑attributes / design‑system classes),
גידור כפול שדורש שני שינויים בו‑זמנית כדי לשבור, ופקודת אבחון שהופכת את התיקון הבא מדקירה‑בחושך
לדקות ספורות.

## 10. החלטות שהתקבלו

1. **legacy:** ✅ הוכרע — **נשמרים** כל סלקטורי ה‑legacy כ‑fallback לגרסאות Cursor שלא עודכנו.
   הגישה תוספתית: ישן + חדש זה לצד זה (סעיף 3, עיקרון 1).
2. **התנהגות AI:** ✅ הוכרע — **אוטומטי לפי סוג הטקסט** (`plaintext` + `start`), לא כפיית RTL.
   דרישת הלקוח ל"תמיד RTL" אינה מחייבת (סעיף 2, דרישה A).
3. **עיקרון‑על:** ✅ שינוי מינימלי — תיקון עוגנים מיושנים, לא שכתוב התנהגותי.
4. **היקף 0.1.8:** ✅ כולל את **A/B/C/D + diagnose** — כולל ריענון עמוק לפאנל השאלות (דרישה D).

### תלות‑מידע פתוחה (לתחילת המימוש)
- **DOM של פאנל שאלות** — נדרש dump חי כדי לדייק את הסלקטורים הפנימיים של דרישה D.
