export const JSON_SCHEMA_EXAMPLE = `{
  "name": "Orbit 2.0 — Week 18",
  "source": "Coaching institute name",
  "batch": "JEE 2027 Morning",
  "timezone": "Asia/Kolkata",
  "lectures": [
    {
      "title": "Rotational Motion — Moment of Inertia",
      "subject": "physics",
      "chapter": "Rotational Motion",
      "date": "2026-09-08",
      "startTime": "08:00",
      "endTime": "09:30",
      "faculty": "Mehta",
      "type": "lecture"
    }
  ],
  "tests": [
    {
      "title": "Weekly Test 18",
      "subject": "full",
      "date": "2026-09-13",
      "startTime": "09:00",
      "durationMinutes": 180,
      "syllabus": ["Rotational Motion", "Chemical Bonding", "Sequences"],
      "type": "part",
      "maxScore": 300
    }
  ]
}`;

export const SAMPLE_TIMETABLE_TEXT = `Week 18 (8 Sep – 13 Sep 2026)  |  JEE 2027 Morning  |  IST

Mon 8/9
Slot 1  Phy  Rotational Motion — Moment of Inertia     Mehta
Slot 2  Chem Chemical Bonding — MOT                    Banerjee
Slot 3  Maths Sequences and Series — AP / GP           Qureshi

Tue 9/9
Slot 1  Phy  Rotational Motion — Torque                Mehta
Slot 2  Chem Chemical Bonding — VSEPR                  Banerjee
Slot 3  Maths Sequences — Special Series               Qureshi

Sun 13/9
Weekly Test 18   9:00–12:00   Full PCM
Syllabus: Rotational Motion, Chemical Bonding, Sequences`;

export const CHATGPT_PROMPT = `You convert a JEE coaching lecture planner into a strict JSON file for the JEE 360 app.

Return ONLY valid JSON. No markdown fences, no commentary, no trailing text.

Follow this schema exactly:
{
  "name": "string — planner / week / batch name",
  "source": "string — institute, optional",
  "batch": "string — batch name, optional",
  "timezone": "Asia/Kolkata",
  "lectures": [
    {
      "title": "string",
      "subject": "physics" | "chemistry" | "maths",
      "chapter": "string",
      "date": "YYYY-MM-DD",
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "faculty": "string, optional",
      "type": "lecture" | "revision" | "doubt" | "dpp" | "lab",
      "notes": "string, optional"
    }
  ],
  "tests": [
    {
      "title": "string",
      "subject": "physics" | "chemistry" | "maths" | "full",
      "date": "YYYY-MM-DD",
      "startTime": "HH:mm",
      "durationMinutes": number,
      "syllabus": ["chapter names"],
      "type": "chapter" | "part" | "full" | "mock" | "pyq",
      "maxScore": number
    }
  ]
}

Conversion rules:
- Dates must be YYYY-MM-DD. Times must be 24-hour HH:mm in IST.
- subject is only physics, chemistry, or maths (use maths, not mathematics / math).
- Expand repeating rows. "Mon–Sat Physics 8:00 Rotational Motion" becomes one lecture object per dated weekday.
- If the source uses slots, map: Slot 1 = 08:00–09:30, Slot 2 = 10:00–11:30, Slot 3 = 12:00–13:30, Slot 4 = 14:30–16:00, Slot 5 = 16:30–18:00. If custom slots are printed, use those instead.
- If only a start time exists, set endTime 90 minutes later.
- If a week is given without calendar dates, infer the year from context.
- Skip holidays / off days that are clearly marked. Keep Sunday tests if listed.
- Put DPP, revision, and doubt classes in lectures with the matching type.
- Put all announced tests in tests. Combined PCM papers use subject "full".
- title should be human: "Gravitation — Escape Velocity", not "PHY-L42".
- Keep faculty names if present.
- If a field is unknown, omit optional fields.
- lectures must contain at least one item.

Example of good output:
${JSON_SCHEMA_EXAMPLE}

Now convert the planner pasted below (PDF text, Excel dump, timetable, WhatsApp schedule, or a description of a screenshot):

`;
