# Prep Lab — student and maintainer notes

## What is included?

Prep Lab is available at `/prep-lab`. The route is added to the TanStack route tree, and navigation links are included in the app's Tests & Practice menu and Test Series page.

The generated bank has 2,000 original parameterised items split evenly:

- Physics: 500
- Chemistry: 500
- Mathematics: 500
- Biology: 500

Most questions are generated from transparent numerical/concept templates. Stable IDs and deterministic choice ordering keep question IDs and answer positions consistent between renders.

## Important scope

These questions are **not official PYQs** or official exam questions. The bank is starter practice content generated from templates, not a substitute for reviewed question sets or official mock tests. Review scientific accuracy and difficulty before relying on it for an assessed event.

## Learner workflow

1. Select JEE Main, JEE Advanced, or NEET UG.
2. Filter subject, chapter and difficulty.
3. Choose Balanced mix, Smart weak topics, Challenge mode or Revision queue.
4. Select 10, 20, 50 or 100 questions and optionally set a time target.
5. Check answers to see the explanation, bookmark tough items, and use Mistakes & Revision for another pass.

Attempts, bookmarks, session history, custom imports and the daily target are stored in browser `localStorage` under `jee-prep-hub-prep-lab-v1`. This data remains on that browser/device; it is not a cloud backup.

## Import format

Export a JSON bank from the Prep Lab, then use the `questions` array as the template. Each imported item must contain:

- `subject`: `Physics`, `Chemistry`, `Mathematics`, or `Biology`
- `chapter` and `topic`: strings
- `difficulty`: `Foundation`, `Standard`, or `Advanced`
- `exams`: a non-empty array containing `JEE Main`, `JEE Advanced`, and/or `NEET UG`
- `question`: text
- `options`: exactly four unique strings
- `answerIndex`: zero-based correct answer index from 0 to 3
- `explanation`: text

The importer accepts JSON only, caps file size at 5 MB and imported question count at 5,000, validates fields, and displays text as React text rather than interpreting it as HTML. Imported items are marked “User imported” in the local workspace.

## Maintainer checklist

- Run `npm install`, then `npm run build` and `npm run lint`.
- Smoke-check `/prep-lab` at desktop and mobile widths.
- Confirm question count, unique IDs, four distinct options and valid answer indexes when updating templates.
- Keep `.env` files, service-role credentials and private API keys out of source control.
