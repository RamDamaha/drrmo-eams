# Documentation Guide

This project is also a capstone or thesis. The rule is simple: **document as you build, not at the end.** Every story leaves behind the notes, figures and evidence that the final paper needs, so writing the paper later is assembly, not memory work.

There are three layers of documentation:

| Layer | Where | Who reads it |
|---|---|---|
| Code documentation | In the code (PHPDoc, TSDoc, README per module) | Developers |
| System documentation | `docs/*.md` (architecture, database, modules, flows) | Developers, panel, IT staff |
| Capstone paper | `docs/capstone/` (chapters, figures, appendices) | Adviser, panel, DRRMO, library |

---

## 1. Code documentation rules

- Every class in `app/Modules/*` has a one-line PHPDoc saying what it does. Public methods on Contracts and Actions also describe parameters, return value and thrown exceptions.
- Every React page and hook has a one-line comment at the top saying what screen or data it serves.
- Comments explain **why**, not what. "Overlap check excludes cancelled assignments because a cancelled slot frees the person" is useful. "Loop over assignments" is not.
- Each module's `README.md` lists: purpose, owned tables, endpoints, events fired, contracts offered. Keep it in sync with MODULES.md.
- Keep a single source of truth. If a fact is in MODULES.md, the README links to it instead of copying it.

## 2. System documentation rules

Update these in the same PR as the code change:

| When you change | Update |
|---|---|
| A table or column | DATABASE.md (and its ERD), `docs/capstone/appendices/data-dictionary.md` |
| An endpoint | MODULES.md endpoints list, `docs/capstone/appendices/api-reference.md` |
| A permission | SECURITY_AND_PRIVACY.md matrix |
| A screen | SCREENS.md, and add a screenshot to `docs/capstone/figures/` |
| A flow or rule | USER_FLOWS.md |
| A scheduled job | ARCHITECTURE.md section 4 |

## 3. Capstone paper structure

The folder `docs/capstone/` follows the chapter layout most Philippine IT and CS capstone and thesis manuscripts use. Check the exact format your college requires (font, margins, citation style) and adjust the template, not the content.

| File | Chapter | What goes in it | Source material in this repo |
|---|---|---|---|
| `00-front-matter.md` | Front matter | Title page, approval sheet, acknowledgement, abstract, table of contents, lists of tables and figures | Written last |
| `01-introduction.md` | Chapter 1: Introduction | Background of the study, statement of the problem, objectives (general and specific), significance, scope and limitations, definition of terms | PROJECT_PLAN.md sections 1 to 3, the director interview |
| `02-review-of-related-literature.md` | Chapter 2: Review of Related Literature and Studies | Foreign and local literature and studies, synthesis, conceptual framework | Research log (section 5) |
| `03-methodology.md` | Chapter 3: Methodology | Research design, development model (Agile, iterative milestones), requirements gathering, system architecture, data flow and use case diagrams, ERD, tools and technologies, testing plan, evaluation instrument (for example ISO/IEC 25010 survey), data privacy handling | ARCHITECTURE.md, DATABASE.md, MODULES.md, SECURITY_AND_PRIVACY.md, CONTRIBUTING.md |
| `04-results-and-discussion.md` | Chapter 4: Results and Discussion | Screens with explanation, features per objective, test results, evaluation results with tables and interpretation | Screenshots, test reports, survey results |
| `05-summary-conclusion-recommendations.md` | Chapter 5: Summary, Conclusions and Recommendations | Findings per objective, conclusions, recommendations and future work (SMS, native app, background GPS) | Chapter 4, BACKLOG.md items left out |
| `06-references.md` | References | Every source cited, in the required style (usually APA 7th edition) | Research log |
| `appendices/` | Appendices | Data dictionary, API reference, user manual, test cases, interview transcript, consent forms, survey instrument, Gantt chart, curriculum vitae | Generated and written per milestone |

## 4. What to capture after every story

Add a short entry to `docs/capstone/DEV_LOG.md` when a story is merged:

```
## 2026-11-12 · S1.4 Admin assigns a person (events)
- What was built: candidate list filtered by role, assignment saved with audit row
- Decision and why: block inactive volunteers outright instead of warning, because the director said inactive means unavailable
- Problem met and fix: overlapping shift query missed cancelled rows, fixed by excluding status cancelled
- Evidence: tests/Feature/Events/AssignPersonTest.php, screenshot figures/a-assignment-editor.png
- Paper: Chapter 3 (system design), Chapter 4 (feature 3.4)
```

These entries become Chapter 3 and Chapter 4 material almost word for word.

Also capture, when they happen:

- **Screenshots**: save to `docs/capstone/figures/` as `<a|m>-<screen-name>.png`, for example `m-my-assignments.png`. Admin screens at 1280 px wide, mobile screens at 375 px. Use made-up data only.
- **Diagrams**: Mermaid source in the docs is the master copy. Export a PNG to `figures/` for the paper when the diagram is final.
- **Test results**: at each milestone, save the Pest and Vitest summary to `docs/capstone/appendices/test-results.md` with the date and commit.
- **Meetings and interviews**: notes in `docs/capstone/appendices/meetings.md`. No personal phone numbers or addresses.

## 5. Research log

Keep `docs/capstone/RESEARCH_LOG.md` for Chapter 2 and the references. One entry per source:

```
- Author, A. (Year). Title. Publisher or Journal. URL
  Used for: why this source matters (for example, GPS accuracy outdoors, Data Privacy Act consent rules)
```

Record sources the moment you use them. Facts checked during planning (Laravel 13 PHP requirement, Screen Wake Lock support, Oracle Always Free limits, NPC advisory on DPOs, email provider limits) are already listed there.

## 6. Writing style

- Plain, short sentences. Explain technical terms the first time in the Definition of Terms.
- No em dashes.
- Every figure and table has a number and a caption ("Figure 3.2. Entity relationship diagram") and is mentioned in the text before it appears.
- Use made-up names in examples and screenshots.
- Write in the voice your college prescribes (usually third person, past tense for what was done).

## 7. Milestone documentation checklist

At the end of each milestone (M0 to M6):

- [ ] DEV_LOG.md has an entry for every merged story
- [ ] New screens have screenshots in `figures/`
- [ ] Data dictionary and API reference match the code
- [ ] Test results saved to `appendices/test-results.md`
- [ ] The matching chapter sections are drafted (see the "Paper" line in each DEV_LOG entry)
