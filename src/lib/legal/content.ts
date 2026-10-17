/**
 * JEE Prep Hub — policy framework content.
 *
 * Everything written in [SQUARE BRACKETS] is a PLACEHOLDER that JEE Prep Hub
 * administrators must fill in before these documents are relied upon.
 * No addresses, emails, registrations, jurisdictions or affiliations are invented here.
 */

export const POLICY_VERSION = "1.0";
export const POLICY_EFFECTIVE_DATE = "[EFFECTIVE DATE]";
export const POLICY_LAST_UPDATED = "[LAST UPDATED DATE]";
export const POLICY_OWNER = "[POLICY OWNER / ADMIN TEAM]";

export type PolicySection = {
  heading: string;
  /** Lines starting with "- " render as bullets; "### " renders as a sub-heading; anything else is a paragraph. */
  body: string[];
};

export type PolicyDoc = {
  id: string;
  title: string;
  summary: string;
  sections: PolicySection[];
};

const AFFILIATION_DISCLAIMER: PolicySection = {
  heading: "Important official-affiliation disclaimer",
  body: [
    "JEE Prep Hub is a student-run, independent educational initiative. It is NOT an official organisation, agency, portal or partner of the National Testing Agency (NTA), JEE Main, JEE Advanced, JoSAA, any IIT or NIT, the Ministry of Education, or the Government of India.",
    "We do not claim affiliation, endorsement, authorisation, sponsorship or partnership with any examination authority, university, or coaching institute. We will only describe such a relationship if a genuine written agreement exists.",
    "Nothing on JEE Prep Hub is an official examination announcement. Everything we publish about examinations is informational assistance contributed by students, volunteers and moderators, and must be verified against official sources before you act on it.",
    "Always confirm examination information with the relevant authority:",
    "- National Testing Agency (NTA)",
    "- The official JEE Main portal",
    "- The official JEE Advanced portal",
    "- JoSAA and the official counselling portals",
    "- Official IIT / NIT / institute websites",
    "- Government of India / Ministry of Education notifications",
  ],
};

const VERSION_SECTION: PolicySection = {
  heading: "Document version",
  body: [
    `- Effective Date: ${POLICY_EFFECTIVE_DATE}`,
    `- Last Updated: ${POLICY_LAST_UPDATED}`,
    `- Version: ${POLICY_VERSION}`,
    `- Policy Owner: ${POLICY_OWNER}`,
  ],
};

export const POLICY_DOCS: PolicyDoc[] = [
  {
    id: "about",
    title: "About JEE Prep Hub",
    summary:
      "Who we are, what we are not, and how this student-run initiative operates.",
    sections: [
      {
        heading: "Introduction",
        body: [
          "JEE Prep Hub is a student-run, independent educational community built to help students preparing for JEE Main, JEE Advanced and related engineering entrance examinations.",
          "Depending on the features available at any time, the platform may provide study resources and notes, planning and scheduling tools, practice tests and question discussions, productivity tools, announcements, and community discussion spaces.",
          "Content may be contributed by students, volunteers, moderators and other community members. It is shared as peer educational assistance, not as an official source of examination rules.",
        ],
      },
      AFFILIATION_DISCLAIMER,
      {
        heading: "A student-led initiative",
        body: [
          "JEE Prep Hub operates as a student-led educational initiative. Features may be added, changed, paused or discontinued as volunteer time and resources allow.",
          "We make no claim to be a non-profit organisation, a registered NGO, a registered company, a government-recognised body, or an official educational institution. If any such status is ever obtained, it will be stated here with the relevant details.",
          "Current operating status: [DESCRIBE OPERATING STATUS — e.g. informal student initiative]. Operating entity or owner, if any: [LEGAL ENTITY OR INDIVIDUAL, IF APPLICABLE].",
        ],
      },
      {
        heading: "Social media and official channels",
        body: [
          "If JEE Prep Hub operates social-media accounts, the official ones will be listed here: [LIST OF OFFICIAL CHANNELS].",
          "- Do not assume that every account, group or channel using the JEE Prep Hub name is official.",
          "- Impersonating JEE Prep Hub, its team, its moderators or its channels is prohibited.",
          "- Where an announcement matters, verify it through an official JEE Prep Hub channel listed above, and verify examination facts with the examination authority.",
        ],
      },
      {
        heading: "Branding and trademark",
        body: [
          "The JEE Prep Hub name, logo, designs, interface, original written content, databases and software are the intellectual property of JEE Prep Hub and/or its contributors, as applicable.",
          "- You may not use our branding in a way that suggests official endorsement, affiliation or partnership.",
          "- You may not use our branding for misleading, commercial or deceptive purposes without written permission.",
          "- We make no claim of registered trademark status unless and until registration is completed and stated here: [TRADEMARK STATUS, IF ANY].",
          "Fair references — for example, mentioning JEE Prep Hub in a review, news item or academic discussion — are welcome.",
        ],
      },
      {
        heading: "Emergencies and urgent safety situations",
        body: [
          "JEE Prep Hub is an educational platform. It is not an emergency service, a crisis helpline, a medical service, a legal service or a counselling service.",
          "If you or someone else is in danger, or facing a medical, mental-health, safety or legal emergency, contact local emergency services, a trusted adult, a parent or guardian, school authorities, or a qualified professional immediately.",
          "Please do not rely on moderators or community members for emergency help — volunteers may be offline, and they are not trained responders.",
        ],
      },
      {
        heading: "Language",
        body: [
          "Content on JEE Prep Hub may appear in English, Hindi, Hinglish, Assamese or other languages used by our community.",
          "Translated or community-provided versions of these policies are offered for convenience only. Where a legal question arises, the authoritative version is the [AUTHORITATIVE LANGUAGE VERSION — e.g. English] version published on this website.",
        ],
      },
      VERSION_SECTION,
    ],
  },

  {
    id: "terms",
    title: "Terms of Use",
    summary:
      "The agreement that applies when you access or use JEE Prep Hub, including eligibility, responsibilities, liability and governing law.",
    sections: [
      {
        heading: "Acceptance of these terms",
        body: [
          "By accessing or using the JEE Prep Hub website, app or community spaces, you agree to these Terms of Use and to the other policies linked from them, including the Community Guidelines, Privacy Policy, Copyright Policy and Safety Policy.",
          "If you do not agree with any part of these terms, please discontinue use of the platform.",
        ],
      },
      AFFILIATION_DISCLAIMER,
      {
        heading: "Eligibility",
        body: [
          "JEE Prep Hub is intended for students preparing for engineering entrance examinations, and for parents or guardians, teachers, mentors, volunteers and other visitors with a genuine educational interest.",
          "- Some features may require you to create an account.",
          "- If you are below the age of majority in your country (18 in India), you should use the platform with the knowledge and permission of a parent or guardian.",
          "- Parents and guardians are responsible for supervising the online activity of the minors in their care, including what those students post, share and download here.",
          "- Where a specific minimum age applies to a feature, it will be stated on that feature: [MINIMUM AGE REQUIREMENTS, IF ANY].",
          "- We may refuse, restrict or remove access where use appears unsafe, unlawful or in breach of these terms.",
        ],
      },
      {
        heading: "Your responsibilities as a user",
        body: [
          "When using JEE Prep Hub you agree to:",
          "- Provide accurate information when you register, and keep your account details reasonably up to date.",
          "- Follow the Community Guidelines, Academic Integrity Policy and all other published rules.",
          "- Respect other students, volunteers and moderators.",
          "- Use the platform only for lawful educational purposes.",
          "- Respect intellectual property rights and upload only content you are allowed to share.",
          "- Keep your login credentials private and secure.",
          "- Verify important examination information with official authorities before acting on it.",
          "You agree not to misuse the platform, interfere with its operation, or attempt to gain access to areas, data or accounts that are not yours.",
        ],
      },
      {
        heading: "Educational disclaimer — no guarantee of results",
        body: [
          "JEE Prep Hub does not promise or guarantee any of the following:",
          "- a particular JEE rank, percentile, score or marks",
          "- admission to any institute, branch or programme",
          "- seat or college allocation in counselling",
          "- success in any examination or interview",
          "- any scholarship, award or recognition",
          "- any specific improvement in academic performance",
          "Examination outcomes depend on many factors, including your own preparation, aptitude, health, school and coaching support, examination conditions, competition and authority decisions. You remain fully responsible for your own preparation, study choices and academic decisions.",
        ],
      },
      {
        heading: "Changes to these terms",
        body: [
          "We may update these terms and other policies when features change, when rules need clarification, or where required by law.",
          "Where a change is material, we will make reasonable efforts to communicate it — for example through an in-app notice, an announcement in the community, or an updated 'Last Updated' date on this page.",
          "Continuing to use the platform after an update means you accept the updated terms. If you do not accept them, please stop using the platform.",
        ],
      },
      {
        heading: "Changes to the services",
        body: [
          "JEE Prep Hub may, at its discretion, add features, modify features, remove features, temporarily suspend a service, discontinue a service, update educational resources, or change community rules.",
          "Where practical, we will communicate significant changes in advance. Because this is a volunteer-run initiative, advance notice may not always be possible.",
        ],
      },
      {
        heading: "Service availability and interruptions",
        body: [
          "We cannot guarantee uninterrupted or error-free availability. Interruptions may occur because of:",
          "- planned or emergency maintenance",
          "- hosting, database or infrastructure failures",
          "- software bugs or configuration problems",
          "- internet or network outages",
          "- cyber incidents, abuse or attacks",
          "- third-party service failures (for example hosting, storage, email or video providers)",
          "- events outside our reasonable control (force majeure)",
          "Please keep your own copies of anything important to you. Do not rely on JEE Prep Hub as your only store of study material or records.",
        ],
      },
      {
        heading: "Payments and refunds",
        body: [
          "At the time of writing, JEE Prep Hub is intended to be usable free of charge. Where the platform is free, no paid-service or refund policy applies.",
          "Some optional features may involve voluntary contributions or donations to support running costs. Voluntary contributions are not purchases of a product or service and, unless stated otherwise, are not refundable.",
          "If paid features are ever introduced, the following must be published before any charge is taken: [PRICING], [BILLING CYCLE], [REFUND WINDOW AND CONDITIONS], [CANCELLATION PROCESS], [PAYMENT PROCESSOR], [SUPPORT CONTACT FOR BILLING].",
          "We do not invent or imply any refund period, guarantee or commercial commitment that has not been published.",
        ],
      },
      {
        heading: "Limitation of liability",
        body: [
          "To the maximum extent permitted by applicable law, JEE Prep Hub, its team, volunteers and moderators are not liable for loss or damage arising from:",
          "- reliance on educational content, notes, solutions or study plans",
          "- reliance on unofficial examination information published or discussed here",
          "- user-generated content, opinions or statements of other users",
          "- third-party content, links, platforms or services",
          "- service interruptions, downtime or technical errors",
          "- inaccurate, incomplete or outdated information",
          "- loss of data, content or account access",
          "- examination results, admission outcomes or counselling outcomes",
          "The platform and its content are provided on an 'as is' and 'as available' basis, to the extent permitted by law.",
          "Nothing in these terms excludes or limits any liability or right that cannot lawfully be excluded or limited under applicable Indian law — including liability for fraud, or rights available to consumers under law.",
        ],
      },
      {
        heading: "Indemnification",
        body: [
          "If a third party brings a claim against JEE Prep Hub because of something you did, you agree to reasonably cooperate with us and, to the extent permitted by applicable law, to be responsible for the reasonable costs and losses directly caused by:",
          "- your breach of these terms or our policies",
          "- your unlawful activity on or through the platform",
          "- your infringement of another person's intellectual property, privacy or other rights",
          "- your misuse of the platform, including security abuse or harassment of others",
          "This clause is intended to cover genuine misuse. It does not apply to good-faith mistakes, ordinary academic discussion, or matters for which we are ourselves responsible. Where a user is a minor, this clause is to be read together with the responsibility of their parent or guardian, and subject to applicable law.",
        ],
      },
      {
        heading: "Governing law and dispute resolution",
        body: [
          "These terms are intended to be governed by the laws of India.",
          "The specific jurisdiction and dispute-resolution mechanism must be finalised based on the actual legal structure and operating location of JEE Prep Hub, which has not yet been determined. Placeholders:",
          "- Governing law: the laws of India, with state-specific matters as applicable in [JURISDICTION / STATE, INDIA]",
          "- Courts: the competent courts at [CITY / DISTRICT, STATE, INDIA]",
          "- Alternative dispute resolution, if adopted: [MEDIATION / ARBITRATION DETAILS AND SEAT, IF ANY]",
          "We do not assert any court, seat, state or company jurisdiction until these placeholders are filled in by the administrators.",
          "Before any formal dispute, we ask you to contact us at [LEGAL EMAIL] so that we can try to resolve the issue directly and informally.",
        ],
      },
      {
        heading: "Termination",
        body: [
          "You may stop using JEE Prep Hub at any time, and may request deletion of your account as described in the Privacy Policy.",
          "We may restrict, suspend or remove an account where these terms or our policies are breached, where required by law, or where necessary to protect users — following the graduated enforcement process in the Community Guidelines, except where a serious risk requires immediate action.",
        ],
      },
      VERSION_SECTION,
    ],
  },

  {
    id: "community-guidelines",
    title: "Community Guidelines",
    summary:
      "The student code of conduct, study-group rules, anti-spam rules, moderation, reporting, appeals and enforcement levels.",
    sections: [
      {
        heading: "Our basic expectation",
        body: [
          "JEE Prep Hub is a study community of students, many of whom are school-age. Be the kind of senior or classmate you would want to have: helpful, patient and honest.",
          "You may disagree with anyone — about a solution, a strategy, a book or a coaching approach. Disagreement is welcome. Personal attacks are not.",
        ],
      },
      {
        heading: "Student code of conduct — prohibited behaviour",
        body: [
          "The following are prohibited anywhere on JEE Prep Hub, including posts, comments, messages, group chats, profiles, usernames and uploaded files:",
          "- harassment, bullying, threats or intimidation",
          "- hate speech or discrimination based on caste, religion, region, language, gender, disability, appearance, category, income or any similar characteristic",
          "- abusive, obscene or degrading language directed at a person",
          "- impersonation of any student, teacher, moderator, institute or authority",
          "- stalking, doxxing, or sharing another person's private information",
          "- sexual content of any kind, and any inappropriate content involving minors",
          "- unsolicited solicitation, scams, fraud or misleading money-making offers",
          "- cheating services, answer-selling or any form of academic dishonesty",
          "- malicious links, phishing pages, malware or harmful downloads",
          "- spam, flooding, repetitive posting or excessive self-promotion",
          "- any illegal activity, or encouraging others to break the law",
          "- attempts to bypass platform security, moderation or restrictions",
          "- coordinated abuse, brigading, or manipulation of votes, reports, ranks, leaderboards or other community systems",
        ],
      },
      {
        heading: "Respectful academic discussion",
        body: [
          "- Explain, don't humiliate. 'Here's where the step goes wrong' beats 'how do you not know this'.",
          "- Ask questions freely — no question is too basic in a study community.",
          "- Credit sources when you share someone else's notes, solution or idea.",
          "- Respect that different students follow different strategies, coaching, books and timelines.",
          "- Avoid rank-shaming, marks-shaming, board-shaming and category-shaming entirely.",
        ],
      },
      {
        heading: "Study group rules",
        body: [
          "Study groups, squads and topic rooms exist for focused academic work. Inside them:",
          "- Stay on topic for that group.",
          "- Help rather than humiliate.",
          "- No spam, flooding or off-topic link dumps.",
          "- No selling answers, papers, or 'guaranteed' material.",
          "- No cheating or coordinating cheating in any test, school exam or entrance examination.",
          "- No inappropriate, romantic or sexual conversations — many members are minors.",
          "- No unauthorised promotional activity, referral spam or recruitment.",
          "- Do not share personal contact details, addresses or documents in group chats.",
          "- Respect different preparation strategies and pace.",
          "Group owners and moderators may set additional reasonable rules for their group, as long as those rules do not conflict with these guidelines.",
        ],
      },
      {
        heading: "Anti-spam and anti-abuse",
        body: [
          "The following are prohibited:",
          "- mass unsolicited messages or invitations",
          "- automated spam posting or comment flooding",
          "- fake, duplicate or throwaway accounts used to evade rules",
          "- bot abuse of community features",
          "- referral manipulation, fake engagement, vote or view inflation",
          "- malicious automation of any kind",
          "- scraping or bulk extraction of platform content where prohibited",
          "- attempts to overload, slow or disrupt the service",
          "- abuse of application programming interfaces (APIs) or internal endpoints",
          "- credential-stuffing, password guessing or other unauthorised access attempts",
          "Legitimate automation and assistive technology — screen readers, accessibility tools, personal study scripts that respect our rules and rate limits — are not automatically prohibited. If you are unsure whether your tool is acceptable, ask us at [EMAIL] first.",
        ],
      },
      {
        heading: "Content moderation",
        body: [
          "To keep the community safe, moderators may:",
          "- remove or hide content that breaks the rules",
          "- edit or hide content where technically necessary (for example, to remove a phone number or a broken link)",
          "- restrict, suspend or ban accounts",
          "- remove spam and bulk-clean abuse",
          "- investigate reports and review account activity relevant to a report",
          "- restrict access to particular community areas or features",
          "- take protective action where a user's safety appears to be at risk",
          "Moderation decisions are to be based on these published rules and on applicable law — not on personal preference, rivalry or bias. Moderators are volunteers and may take time to respond.",
        ],
      },
      {
        heading: "Enforcement and penalties",
        body: [
          "We normally use a graduated approach:",
          "### Level 1 — Informal reminder",
          "A friendly, educational note explaining what went wrong.",
          "### Level 2 — Formal warning or content removal",
          "The content is removed and a recorded warning is issued.",
          "### Level 3 — Temporary restriction",
          "Limits on specific features, such as posting, messaging or uploads.",
          "### Level 4 — Temporary suspension",
          "Account access is suspended for a defined period.",
          "### Level 5 — Permanent removal or ban",
          "The account is permanently removed from the community.",
          "### Serious violations",
          "For serious matters — child-safety risks, sexual content involving minors, threats of violence, doxxing, fraud, examination-paper leaks, hacking or other illegal conduct — immediate restriction, suspension or removal may be applied, and stages may be skipped entirely. We may also preserve relevant records and, where appropriate or legally required, report the matter to the relevant authority.",
          "Attempting to evade an enforcement action (for example, by creating a new account) is itself a violation.",
        ],
      },
      {
        heading: "Reporting a problem",
        body: [
          "You can report any of the following:",
          "- harassment, bullying or threats",
          "- copyright infringement",
          "- misinformation about examinations",
          "- scams, fraud or suspicious money requests",
          "- impersonation of a person, institute or JEE Prep Hub itself",
          "- security issues and vulnerabilities",
          "- inappropriate or sexual content",
          "- academic misconduct, answer-selling or leaked papers",
          "- privacy violations and doxxing",
          "- child-safety concerns",
          "How to report:",
          "- Use the in-app report option on the relevant post, message or profile where available.",
          "- Or email [REPORTING EMAIL] with links, screenshots, usernames and a short description.",
          "- For copyright complaints, follow the checklist in the Copyright Policy and write to [COPYRIGHT EMAIL].",
          "- For security vulnerabilities, follow the Safety & Security page and write to [SECURITY EMAIL].",
          "Child-safety reports are treated with the highest priority. If a child is in immediate danger, contact local emergency services and a trusted adult first — do not wait for a moderator.",
          "We aim to acknowledge reports within a reasonable time. We may not be able to share the details or outcome of an investigation into another person's account.",
        ],
      },
      {
        heading: "Appeals",
        body: [
          "If you believe a moderation decision was wrong, you may appeal:",
          "- Use the in-app appeal option where available, or write to [REPORTING EMAIL].",
          "- Explain what action was taken, when, and why you believe it was mistaken.",
          "- Wherever practical, an appeal is reviewed by someone other than the moderator who made the original decision.",
          "- Appeals about serious safety violations may be refused, and permanent bans for such violations are generally final.",
        ],
      },
      {
        heading: "False reports and abuse of the reporting system",
        body: [
          "The following are prohibited:",
          "- knowingly false or malicious reports",
          "- coordinated mass reporting to silence someone",
          "- retaliation, threats or harassment against a person who filed a report",
          "- any manipulation of moderation systems",
          "You will not be penalised simply because a report you made in good faith turns out to be unsubstantiated. Report honestly, and you have nothing to worry about.",
        ],
      },
      {
        heading: "Volunteers and moderators",
        body: [
          "Student volunteers and moderators help run this community. They are expected to:",
          "- act professionally, calmly and fairly",
          "- keep report details and user information confidential",
          "- stay impartial, and step back from cases involving friends, rivals or their own disputes (conflict of interest)",
          "- never abuse moderator tools or access for personal advantage",
          "- never exploit, pressure or take advantage of any user",
          "- never ask any user for a password, OTP, payment or private photographs",
          "- avoid inappropriate private interactions, especially with minors",
          "- escalate serious incidents to the administrators immediately",
          "Moderator privileges may be limited or removed at any time, including for breach of these expectations.",
          "Moderators are volunteers. They do not represent NTA, the IITs, JoSAA, any coaching institute or any government authority, and they cannot give official examination rulings, legal advice or medical advice.",
        ],
      },
      VERSION_SECTION,
    ],
  },

  {
    id: "academic-integrity",
    title: "Academic Integrity, Tests & AI Policy",
    summary:
      "Rules against cheating and malpractice, how to treat unofficial solutions, and acceptable use of AI tools.",
    sections: [
      {
        heading: "Academic integrity — strictly enforced",
        body: [
          "JEE Prep Hub does not support examination malpractice in any form. The following are strictly prohibited:",
          "- cheating in any examination, test or assessment, including tests on this platform",
          "- selling, buying or requesting examination answers",
          "- sharing, requesting or distributing leaked examination papers",
          "- sharing stolen or confidential question papers",
          "- impersonating a candidate, or arranging for someone to be impersonated",
          "- creating, sharing or using fraudulent certificates, scorecards or marksheets",
          "- forging documents of any kind",
          "- using unauthorised help during an online test, including screen sharing, remote help or unauthorised devices",
          "- assisting, coaching or coordinating another person's cheating",
          "- presenting someone else's work, notes or solution as your own",
          "Breaches of this policy are treated as serious violations and may lead to immediate removal from the community.",
        ],
      },
      {
        heading: "If you come across leaked examination material",
        body: [
          "- Do not download it, share it, repost it or discuss its contents.",
          "- Do not forward it to study groups or friends.",
          "- Report it to the relevant examination authority through their official channels.",
          "- You may also inform us at [REPORTING EMAIL] so that we can remove it from our platform.",
          "Redistributing leaked material can carry serious consequences for you, including action by examination authorities and under law.",
        ],
      },
      {
        heading: "Tests, questions and solutions",
        body: [
          "Tests, quizzes, question sets and solutions available here may be created by JEE Prep Hub, by volunteers, or by community members.",
          "- Question accuracy: we try to check questions, but errors in wording, options, diagrams or answer keys can occur.",
          "- Unofficial solutions: any solution on this platform is unofficial. It may contain mistakes, non-standard methods, or approaches that differ from official answer keys.",
          "- Independent verification: for anything that matters — an answer key dispute, a syllabus question, a marking scheme — verify against official material or your teacher.",
          "- User-submitted solutions must be your own work, or clearly credited to their source.",
          "- Answer discussions should focus on method and reasoning. Do not use them to circumvent a live test.",
          "- Copyright: do not upload copyrighted question papers, books or solution manuals without permission. See the Copyright Policy.",
          "- Corrections: report suspected mistakes using the in-app option or [EMAIL] so that we can review and correct them.",
          "Scores, ranks, percentiles and predictions shown on JEE Prep Hub are practice estimates based on our own data. They are not official results and are not predictions of your actual examination outcome.",
        ],
      },
      {
        heading: "AI usage policy",
        body: [
          "Some features may use artificial intelligence, and you may bring your own AI provider key for certain tools.",
          "Acceptable uses of AI on JEE Prep Hub include:",
          "- getting explanations of concepts and steps",
          "- brainstorming approaches to a problem",
          "- building study plans and revision schedules",
          "- generating extra practice questions for yourself",
          "- summarising your own notes",
          "AI must NOT be used to:",
          "- cheat in any examination or proctored test",
          "- impersonate another student, teacher or moderator",
          "- fabricate academic credentials, scores or certificates",
          "- submit plagiarised work as your own",
          "- manipulate moderation, reporting or ranking systems",
          "- generate harassing, abusive, sexual, hateful or otherwise harmful content",
          "AI-generated information can be confidently wrong. It may invent formulas, misquote syllabus points, or produce incorrect solutions. Always verify AI output against reliable material, and never treat it as an official examination source.",
          "Where you use your own AI provider key, your use is also subject to that provider's own terms and privacy policy.",
        ],
      },
      VERSION_SECTION,
    ],
  },

  {
    id: "copyright",
    title: "Copyright, Study Material & User Content",
    summary:
      "How study material may be shared, our intellectual-property rules, the copyright complaint procedure, and your rights over what you post.",
    sections: [
      {
        heading: "Study material and resource policy",
        body: [
          "This policy applies to notes, PDFs, question papers, solutions, lectures, educational videos, books, website links, test series, study plans and any other resource shared here.",
          "We distinguish four categories:",
          "- Original JEE Prep Hub content — created by our team or volunteers for this platform.",
          "- User-generated content — uploaded or written by community members, who remain responsible for it.",
          "- Third-party educational content — created by publishers, coaching institutes, teachers or platforms, and only shared here where sharing is permitted.",
          "- External links — pointers to material hosted elsewhere.",
          "Linking to a third-party resource does not mean JEE Prep Hub owns, verifies, endorses or is responsible for it.",
          "Before uploading any resource, ask yourself: do I have the right to share this publicly? If not, share a link to the official source instead of a copy.",
        ],
      },
      {
        heading: "Copyright and intellectual property",
        body: [
          "JEE Prep Hub respects intellectual property rights and expects the same from every user.",
          "- Do not upload or distribute copyrighted material — books, coaching modules, paid test series, paid lectures, publisher solutions — without authorisation from the rights holder.",
          "- Do not remove watermarks, credits or author attributions.",
          "- Do not claim third-party material as your own.",
          "- Rights holders may submit an infringement complaint using the procedure below.",
          "- We may remove or restrict access to disputed material while a complaint is being investigated.",
          "- Repeat infringement may lead to account restriction or permanent removal.",
          "Nothing in these policies transfers to you any ownership of JEE Prep Hub's branding, logos, software, source code, designs, interface, databases or original content.",
        ],
      },
      {
        heading: "Copyright complaint procedure (India)",
        body: [
          "JEE Prep Hub is an India-focused platform. We operate a notice-and-action process modelled on good practice under Indian law, including the Copyright Act, 1957 and applicable intermediary rules. We do not claim to be subject to the United States DMCA process, and references to 'DMCA' elsewhere online do not apply to us unless we state otherwise.",
          "Send complaints to [COPYRIGHT EMAIL]. Please include every item in this checklist — incomplete complaints may be delayed:",
          "- your full name (and organisation, if you act for one)",
          "- your contact information (email, and phone or postal address if you wish)",
          "- clear identification of the copyrighted work concerned",
          "- the exact location of the allegedly infringing material (full URL, post link or file name)",
          "- an explanation of your ownership of the work, or your authorisation to act for the owner",
          "- a good-faith statement that the use complained of is not authorised",
          "- a declaration that the information you have provided is accurate",
          "- your electronic or physical signature, where appropriate",
          "What happens next:",
          "- We acknowledge the complaint and review it.",
          "- We may remove or restrict the material while we investigate.",
          "- We may notify the user who uploaded it, and give them an opportunity to respond.",
          "- If the material was removed in error, it may be restored after review.",
          "- We keep a record of complaints in order to identify repeat infringement.",
          "Counter-notice: if your content was removed and you believe you had the right to share it, write to [COPYRIGHT EMAIL] explaining why, with any supporting evidence.",
          "We are not a court and cannot decide ownership disputes. Where a dispute cannot be resolved, the parties may need to pursue legal remedies available to them.",
        ],
      },
      {
        heading: "User-generated content policy",
        body: [
          "Where the platform allows it, you may submit posts, comments, doubts, questions, solutions, notes, files, profile details and feedback.",
          "- You keep ownership of your lawful original content. We do not claim to own it.",
          "- By submitting content, you grant JEE Prep Hub a non-exclusive, royalty-free permission to host, store, display, reproduce, adapt for formatting, moderate and technically process that content, only as reasonably necessary to operate the platform and the features you used.",
          "- That permission lasts as long as your content is on the platform, and for a reasonable period afterwards for backups, logs and legal-compliance copies.",
          "- You must have the necessary rights to submit whatever you upload.",
          "- You are responsible for your own content. JEE Prep Hub is not responsible for every statement made by individual users, and user opinions are not our opinions.",
          "- We may remove, hide or restrict content that breaks these rules or the law.",
          "Plagiarism and unauthorised redistribution are prohibited:",
          "- Do not copy another member's notes, solutions or writing and present it as your own.",
          "- Do not redistribute material shared privately or within a closed group outside that group without permission.",
          "- Credit the original author when you build on someone else's work.",
        ],
      },
      VERSION_SECTION,
    ],
  },

  {
    id: "privacy",
    title: "Privacy Policy",
    summary:
      "What information the platform may collect, why, how long it is kept, and how you can request deletion.",
    sections: [
      {
        heading: "Our approach",
        body: [
          "JEE Prep Hub is a student community, and we try to collect as little personal information as reasonably possible.",
          "This policy uses conditional language on purpose: what is collected depends on which features you actually use. If you only browse public pages, far less information is involved than if you create an account, join a group or upload files.",
        ],
      },
      {
        heading: "Information we may collect",
        body: [
          "Depending on the features you use, we may collect:",
          "- Account information: name or display name, username, email address, and authentication details handled by our authentication provider.",
          "- Profile information you choose to add: photo or avatar, bio, class or year, subjects, and any social links you enter.",
          "- Educational preferences and activity: study plans, schedules, to-dos, habits, timer sessions, test attempts, answers, scores and progress data.",
          "- Content you submit: posts, comments, doubts, solutions, messages, uploads and feedback.",
          "- Technical and device information: IP address, browser and device type, operating system, screen and language settings.",
          "- Usage information and logs: pages visited, actions taken, timestamps, error reports and security events.",
          "- Cookies and similar local storage used for sign-in, preferences and security. See our Cookie Policy.",
          "- Optional permissions you explicitly grant, such as approximate or precise location, where a feature asks for it and you agree.",
          "We do not knowingly collect information that a feature does not need. We do not ask for identity documents, financial details, OTPs or passwords through community channels.",
        ],
      },
      {
        heading: "Why we may use this information",
        body: [
          "- to create and operate your account and keep you signed in",
          "- to provide the features you use, such as planners, tests, progress tracking and community spaces",
          "- to display your public profile and content to other users where you have chosen to make it visible",
          "- to keep the platform safe: preventing spam, abuse, cheating, fraud and unauthorised access",
          "- to investigate reports and enforce our rules",
          "- to fix problems, monitor errors and improve the platform",
          "- to send you necessary service communications",
          "- to comply with applicable legal obligations",
          "We do not sell your personal information.",
        ],
      },
      {
        heading: "Communications",
        body: [
          "We may send you service messages such as sign-in confirmations, security alerts, moderation notices, or replies to your reports.",
          "Optional messages — announcements, community digests, feature news — should be limited and, where offered, you should be able to turn them off in settings or by using the unsubscribe option in the message.",
        ],
      },
      {
        heading: "Third-party services",
        body: [
          "To run the platform we rely on third-party providers, which may process limited data on our behalf — for example hosting and database services, authentication, file storage, email delivery, and any AI provider you choose to connect with your own key.",
          "These providers have their own terms and privacy policies. Where you connect your own key or account to an external service, your use of that service is governed by that service's policies.",
          "Current providers in use: [LIST OF PROCESSORS / PROVIDERS]. We do not claim to use any specific analytics or advertising provider unless it is listed here.",
        ],
      },
      {
        heading: "Security practices",
        body: [
          "We take reasonable technical and organisational measures to protect the platform, including access controls on our database, row-level security rules, restricted administrative access, rate limiting, bot protection, and encryption in transit (HTTPS).",
          "No online service can promise perfect security. Please help protect your own account by using a strong, unique password and never sharing your login details.",
          "If we become aware of a security incident affecting your information, we will act to contain it and will inform affected users where appropriate or legally required.",
        ],
      },
      {
        heading: "Data retention",
        body: [
          "We keep information only as long as it is needed for the purpose it was collected for, or as long as legally required.",
          "- Account and profile data: while your account is active.",
          "- Content you posted publicly: while it remains on the platform.",
          "- Security and moderation records: for a limited period needed to prevent repeat abuse and to handle appeals.",
          "- Logs and backups: for a limited technical retention period.",
          "Specific retention periods, once fixed by the administrators: [RETENTION PERIODS].",
        ],
      },
      {
        heading: "Your rights and choices",
        body: [
          "Subject to applicable law, you may:",
          "- access the personal information we hold about you",
          "- correct inaccurate information, usually directly in your profile settings",
          "- delete content you posted, where the feature allows it",
          "- withdraw an optional permission you previously granted, such as location",
          "- request deletion of your account",
          "- object to or ask us to restrict certain processing",
          "To make a request, write to [PRIVACY EMAIL]. We may need to verify that the request comes from you, and we may not be able to comply where the law requires us to retain something.",
        ],
      },
      {
        heading: "Account and data deletion",
        body: [
          "You can ask us to delete your account and associated personal data.",
          "- Where an in-app delete option exists, you can use it in your account settings: [ACCOUNT DELETION PATH IN APP].",
          "- Otherwise, email [PRIVACY EMAIL] from your registered email address with the subject 'Account deletion request'.",
          "What deletion means in practice:",
          "- Your profile and personal account data are removed or anonymised.",
          "- Some content may remain visible in an anonymised form where it forms part of a conversation others took part in, unless removal is required.",
          "- Copies may persist for a short time in backups, and certain records may be retained where retention is legally required or technically necessary — for example abuse records needed to prevent ban evasion.",
          "We will not promise complete and instant erasure where that is not technically or legally possible. Expected processing time, once fixed: [DELETION TIMEFRAME].",
        ],
      },
      {
        heading: "Minors' information",
        body: [
          "Many of our users are school students under 18. We handle their information with extra care.",
          "- We do not ask minors to publicly disclose sensitive personal information such as home address, phone number, identity documents or financial details.",
          "- Public profiles should not contain private contact details.",
          "- Parents or guardians may contact [PRIVACY EMAIL] with questions about a minor's account, or to request deletion. We may ask for reasonable verification.",
          "- See our Safety Policy for the behavioural protections that apply to minors.",
        ],
      },
      {
        heading: "Legal compliance",
        body: [
          "We aim to handle personal information responsibly and in line with applicable Indian law, including data-protection and intermediary obligations as they apply to a platform of this kind.",
          "We do not claim certification or formal compliance with any specific framework unless it has been independently verified and stated here: [VERIFIED COMPLIANCE STATEMENTS, IF ANY].",
          "We may disclose information where we are legally required to do so, or where it is necessary to protect a person's safety.",
        ],
      },
      {
        heading: "Changes to this Privacy Policy",
        body: [
          "We may update this policy as features, providers or legal requirements change. Material changes will be communicated through the platform where reasonably possible, and the 'Last Updated' date below will change.",
        ],
      },
      VERSION_SECTION,
    ],
  },

  {
    id: "safety",
    title: "Safety, Minors, Accounts & Security",
    summary:
      "Protections for students under 18, account security rules, confidentiality advice, cybersecurity rules and responsible vulnerability reporting.",
    sections: [
      {
        heading: "Children and minor safety policy",
        body: [
          "Most JEE aspirants are in Class 11 or 12, and many are under 18. Their safety comes before every other consideration on this platform.",
          "The following are absolutely prohibited and are treated as the most serious violations:",
          "- sexual exploitation or abuse of any kind",
          "- grooming, or building trust with a minor for exploitative purposes",
          "- sexual solicitation, sexual comments or sexual content directed at or involving minors",
          "- inappropriate private interactions between adults and minors",
          "- requesting private, personal or intimate photographs",
          "- pressuring anyone to share private contact information or move to a private channel",
          "- threats, blackmail, manipulation or emotional coercion",
          "- financial scams, fake scholarships, fake 'paid material' offers or money requests targeting students",
          "Accounts involved in such behaviour may be removed immediately without warning, and relevant records may be preserved and reported to the appropriate authorities where appropriate or legally required.",
        ],
      },
      {
        heading: "Advice for students",
        body: [
          "- Keep conversations on the platform, and inside study topics.",
          "- Never share your home address, phone number, school timings, live location or identity documents with people you meet online.",
          "- Nobody from JEE Prep Hub will ever ask you for your password, OTP, or money.",
          "- If someone makes you uncomfortable, block and report them.",
          "- If a situation feels serious or frightening, tell a parent, guardian, teacher or another trusted adult, and contact the appropriate authorities. Do not wait for a moderator to come online.",
        ],
      },
      {
        heading: "Account security",
        body: [
          "- Use a strong, unique password that you do not reuse on other websites.",
          "- Do not share your account, and do not let anyone else use it.",
          "- You are responsible for activity that happens through your account, so keep your credentials private.",
          "- Sign out on shared or public devices, and end sessions you do not recognise where the feature is available.",
          "- Impersonating another person, or creating an account in someone else's name, is prohibited.",
          "- If you notice suspicious activity, or think your account is compromised, change your password immediately and contact [SECURITY EMAIL].",
          "JEE Prep Hub will never ask you to reveal your password publicly, in a chat, or to a moderator. Any such request is a scam — report it.",
        ],
      },
      {
        heading: "Confidentiality — what not to post publicly",
        body: [
          "Please do not post any of the following in public posts, comments, groups or profiles:",
          "- passwords or security answers",
          "- OTPs or one-time login links",
          "- bank details, UPI IDs used for private transfers, card numbers or payment screenshots",
          "- Aadhaar, PAN, admit-card scans or other identity documents",
          "- home address or exact live location",
          "- private phone numbers, including your parents'",
          "- private educational records or medical information",
          "We do not ask users to submit sensitive information unless it is genuinely necessary for a feature, and we will explain why when we do.",
        ],
      },
      {
        heading: "Website and cybersecurity rules",
        body: [
          "You must not attempt to:",
          "- exploit vulnerabilities in the platform",
          "- bypass authentication, authorisation or access controls",
          "- access restricted areas, admin functions or other users' data",
          "- manipulate, read or alter the database beyond what your account is permitted to do",
          "- steal or harvest user information",
          "- inject malicious code, scripts or payloads",
          "- disrupt or degrade the service for others",
          "- carry out denial-of-service or flooding attacks",
          "- distribute malware, spyware or harmful files",
          "- interfere with our hosting, infrastructure or third-party providers",
          "Such conduct may also be an offence under applicable law, including the Information Technology Act, 2000.",
        ],
      },
      {
        heading: "Responsible vulnerability reporting",
        body: [
          "If you are a security researcher or a curious student who finds a flaw, please tell us instead of exploiting it.",
          "- Report to [SECURITY EMAIL] with enough detail for us to reproduce the issue.",
          "- Do not access, modify or download other users' data. Use only your own test account.",
          "- Do not run destructive tests, denial-of-service attacks or automated scans that could disrupt the service.",
          "- Give us reasonable time to fix the issue before discussing it publicly.",
          "- Do not publish sensitive technical details, exploit code or user data.",
          "We appreciate good-faith reports and will not pursue action against researchers who follow these guidelines. We do not currently operate a paid bug-bounty programme: [BOUNTY PROGRAMME DETAILS, IF ANY].",
          "For everyone's safety, we do not publish detailed information about our internal security controls.",
        ],
      },
      VERSION_SECTION,
    ],
  },

  {
    id: "disclaimer",
    title: "Disclaimer, Accuracy & Third Parties",
    summary:
      "Educational disclaimers, examination-information warnings, how to report mistakes, third-party links and advertising rules.",
    sections: [
      AFFILIATION_DISCLAIMER,
      {
        heading: "Educational disclaimer",
        body: [
          "Everything on JEE Prep Hub is provided for general educational assistance only. It is not professional academic advice, career counselling, legal advice or medical advice.",
          "We do not guarantee any rank, percentile, marks, admission, seat allocation, examination success, scholarship, or improvement in academic performance. Your results depend on many factors, and your preparation and decisions remain your own responsibility.",
          "Study plans, predicted ranks, difficulty estimates and progress scores shown here are indicative tools, not forecasts.",
        ],
      },
      {
        heading: "Accuracy of information",
        body: [
          "We try hard to be accurate and up to date, but we cannot guarantee that every item on the platform is error-free or current. This includes:",
          "- examination dates and deadlines",
          "- numbers, cut-offs and statistics",
          "- answers and answer keys",
          "- solutions and explanations",
          "- syllabus details",
          "- admission and counselling rules",
          "- announcements and articles",
          "- any user submission",
          "Examination information changes frequently. For dates, application deadlines, eligibility, syllabus, exam pattern, counselling, admission rules, correction windows and results, always verify with the relevant official authority.",
        ],
      },
      {
        heading: "Corrections and reporting mistakes",
        body: [
          "Please help us fix errors — it directly helps other students.",
          "- Use the in-app report or feedback option on the relevant page, question or post where available.",
          "- Or email [EMAIL] with the page or question link, what you believe is wrong, and the correct information with a source if you have one.",
          "- We review reports, correct confirmed errors, and may add a correction note where the original information was widely seen.",
        ],
      },
      {
        heading: "Third-party links",
        body: [
          "The platform may link to external websites and services, including official portals such as NTA, JEE Main, JEE Advanced and JoSAA, educational platforms, YouTube, cloud storage, and other tools.",
          "We do not control third-party websites and are not responsible for their content, privacy practices, availability, security, terms or advertisements.",
          "Please review the policies of any third-party service before using it or sharing information with it.",
        ],
      },
      {
        heading: "Advertising and sponsorship",
        body: [
          "At the time of writing, JEE Prep Hub does not claim to have advertisers, sponsors or affiliate partners. Current status: [ADVERTISING / SPONSORSHIP STATUS].",
          "If advertisements, sponsorships, affiliate links or promotional content are introduced, the following will apply:",
          "- sponsored or paid content will be labelled as such where reasonably possible",
          "- the presence of an advertisement is not an endorsement or a recommendation",
          "- third-party products and services are subject to their own terms, pricing and policies",
          "- we do not guarantee any third-party product, course, coaching service or result",
          "- affiliate relationships will be disclosed where legally or ethically appropriate",
          "Users may not run their own advertising, referral schemes or promotional campaigns on the platform without permission.",
        ],
      },
      VERSION_SECTION,
    ],
  },

  {
    id: "cookies",
    title: "Cookie Policy",
    summary:
      "The cookies and similar local storage the platform may use, and how you can control them.",
    sections: [
      {
        heading: "What we use",
        body: [
          "JEE Prep Hub uses cookies and similar browser technologies such as localStorage and sessionStorage. Depending on the features you use, these may include:",
          "- Essential: keeping you signed in, maintaining your session, protecting forms, and remembering that you have unlocked a gated section.",
          "- Preferences: your theme (light or dark), interface mode, background settings, and other display choices stored in your own browser.",
          "- Feature storage: local-only tools such as planners, timers and offline study data stored on your device rather than on our servers.",
          "- Security: rate-limiting, bot protection and abuse prevention, including any bot-protection challenge we use.",
          "- Analytics: only if and when an analytics provider is added. Current analytics providers, if any: [ANALYTICS PROVIDERS, IF ANY]. We make no claim to use any specific provider until it is listed here.",
          "- Third-party cookies: set by embedded services you interact with, such as an embedded video player. These are controlled by those providers.",
          "We do not use cookies for advertising profiling.",
        ],
      },
      {
        heading: "Controlling cookies",
        body: [
          "- Your browser settings let you block or delete cookies and clear local storage.",
          "- Blocking essential cookies will break sign-in and some features.",
          "- Clearing local storage will erase locally-stored study data such as local planners, timers and preferences. Back up anything important first.",
          "- Where a cookie choice banner or setting is offered in the app, you can change your choice there at any time.",
        ],
      },
      VERSION_SECTION,
    ],
  },

  {
    id: "accessibility",
    title: "Accessibility",
    summary:
      "Our accessibility commitment and how to report a barrier you run into.",
    sections: [
      {
        heading: "Our commitment",
        body: [
          "We want JEE Prep Hub to be usable by as many students as possible, including those using screen readers, keyboard navigation, magnification, or assistive tools.",
          "We aim to provide readable text and contrast, keyboard-reachable controls, meaningful labels on interactive elements, alternative text on meaningful images, and layouts that work on small screens and low-end devices.",
          "We are a volunteer team and cannot claim full conformance with any formal accessibility standard. Target standard, if adopted: [ACCESSIBILITY STANDARD, IF ANY].",
        ],
      },
      {
        heading: "Reporting an accessibility problem",
        body: [
          "If something is hard or impossible for you to use, please tell us at [EMAIL] with the page, the device or assistive tool you use, and what happened.",
          "Accessibility reports are treated as genuine bugs and prioritised accordingly. Assistive technologies and accessibility tools are always permitted under our anti-automation rules.",
        ],
      },
      VERSION_SECTION,
    ],
  },

  {
    id: "contact",
    title: "Contact, Legal Notices & FAQ",
    summary:
      "Where to reach us, the placeholders administrators must fill in, version history, and answers to common legal and community questions.",
    sections: [
      {
        heading: "Contact and legal notices",
        body: [
          "The following details must be completed by JEE Prep Hub administrators. We do not publish invented contact details.",
          "- Website: [WEBSITE]",
          "- General contact: [EMAIL]",
          "- Privacy contact: [PRIVACY EMAIL]",
          "- Copyright contact: [COPYRIGHT EMAIL]",
          "- Safety and reports: [REPORTING EMAIL]",
          "- Security reports: [SECURITY EMAIL]",
          "- Legal contact: [LEGAL EMAIL]",
          "- Operating entity or owner: [LEGAL ENTITY OR INDIVIDUAL, IF APPLICABLE]",
          "- Address: [LEGAL ADDRESS, IF REQUIRED]",
          "- Grievance contact, if required by law: [GRIEVANCE OFFICER NAME AND CONTACT, IF APPLICABLE]",
          "Until these are filled in, please use the in-app contact and report features available to signed-in users.",
        ],
      },
      {
        heading: "Placeholders administrators must complete",
        body: [
          "Every item in square brackets across these documents is a placeholder. The main ones are:",
          "- all contact details listed above",
          "- effective date, last-updated date and policy owner",
          "- jurisdiction, courts and any dispute-resolution mechanism",
          "- operating status and legal entity, if any",
          "- list of third-party providers and any analytics provider",
          "- data retention periods and deletion timeframe",
          "- account deletion path inside the app",
          "- minimum age requirements for specific features, if any",
          "- pricing, refund and cancellation terms, if paid features are ever introduced",
          "- advertising, sponsorship and affiliate status",
          "- official social-media channel list",
          "- trademark status and accessibility standard, if adopted",
          "No legal, government, registration or affiliation claim should be added to these documents unless it has actually been verified.",
        ],
      },
      {
        heading: "Policy version history",
        body: [
          `- Version ${POLICY_VERSION} — ${POLICY_EFFECTIVE_DATE} — first published policy framework: About, Terms of Use, Community Guidelines, Academic Integrity & AI, Copyright & Content, Privacy, Safety & Security, Disclaimer, Cookies, Accessibility, Contact.`,
          "- Future revisions will be listed here with the date and a short note on what changed.",
        ],
      },
      {
        heading: "Frequently asked legal and community questions",
        body: [
          "### Is JEE Prep Hub official, or connected to NTA or the IITs?",
          "No. It is an independent, student-run initiative with no affiliation to NTA, JEE Main, JEE Advanced, JoSAA, the IITs, any coaching institute, or the Government of India.",
          "### Can I rely on exam dates and rules posted here?",
          "Treat them as helpful pointers only. Always confirm with the official examination portal before acting.",
          "### Will using this platform improve my rank?",
          "We hope it helps, but we cannot and do not guarantee any rank, score or admission outcome.",
          "### Is JEE Prep Hub free?",
          "It is intended to be usable free of charge. If paid features are ever added, the terms will be published before any charge applies.",
          "### Can I upload my coaching institute's material?",
          "Only if you have permission from the rights holder. Otherwise, share a link to the official source instead of a copy.",
          "### Who owns what I post?",
          "You keep ownership of your lawful original content. You give us only the permissions needed to host, display and moderate it.",
          "### How do I report harassment or unsafe behaviour?",
          "Use the in-app report option, or write to [REPORTING EMAIL]. Child-safety concerns get the highest priority. In an emergency, contact local emergency services and a trusted adult first.",
          "### What happens if I break a rule?",
          "Usually a reminder or warning first, then restrictions, suspension, and finally removal. Serious safety, fraud, security or illegal conduct can lead to immediate removal.",
          "### Can I appeal a ban?",
          "Yes, through the in-app appeal option or [REPORTING EMAIL], except for the most serious safety violations.",
          "### How do I delete my account?",
          "Use the deletion option in your account settings where available, or email [PRIVACY EMAIL] from your registered address.",
          "### Can I use AI tools for my preparation here?",
          "Yes, for explanations, planning and practice. Never for cheating, impersonation, plagiarism or fake credentials — and always verify AI output.",
          "### Are moderators officials?",
          "No. They are student volunteers. They do not represent any examination authority or government body.",
        ],
      },
      VERSION_SECTION,
    ],
  },
];

export function getPolicyDoc(id: string): PolicyDoc | undefined {
  return POLICY_DOCS.find((d) => d.id === id);
}
