import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown, ArrowRight, Atom, BookOpen, BrainCircuit, Building2, Code2, Cpu, Dna,
  FlaskConical, Gem, Globe2, GraduationCap, Layers3, Leaf, Lightbulb, Menu, Moon,
  Network, Radio, Rocket, Search, ShieldCheck, Sparkles, Sun, UserRound, Wrench, X, Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Heart, MessageCircle, Send, Share2 } from "lucide-react";

const TITLE = "Engineering — JEE Prep Hub Engineering Journal";
export const Route = createFileRoute("/engineering")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: "Engineering branches, coding, AI, systems and the future — explored through the JEE Prep Hub Engineering Journal." },
      { title: TITLE },
      { name: "description", content: "Explore every engineering branch, coding, AI, emerging technologies, careers and the future through the JEE Prep Hub Engineering Journal." },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: "Engineering branches, coding, AI, systems and the future — explored through the JEE Prep Hub Engineering Journal." },
      { property: "og:image", content: "https://jeeprephub.co.in/founder-dhirendra-profile.jpg" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://jeeprephub.co.in/engineering" }],
  }),
  component: EngineeringPage,
});

type Branch = {
  id: string; name: string; icon: any; short: string; about: string;
  subjects: string; careers: string; emerging: string; jee: string;
};

// Comma-separated strings keep the data compact; they are split at render time.
const branches: Branch[] = [
  { id: "cse", name: "Computer Science & Engineering", icon: Code2, short: "Algorithms, software, systems, databases and networks.",
    about: "Designs the software and computing systems behind apps, the web, cloud platforms and intelligent products.",
    subjects: "Data Structures, Algorithms, Operating Systems, DBMS, Computer Networks, Theory of Computation, Compilers",
    careers: "Software Engineer, Backend/Full-stack Developer, Systems Engineer, Security Engineer, Cloud/DevOps Engineer",
    emerging: "AI-assisted development, Quantum computing, Edge & cloud-native systems",
    jee: "Top ranks in JEE Advanced for IITs; JEE Main for NITs, IIITs and GFTIs. Cutoffs are the highest of all branches." },
  { id: "aids", name: "Artificial Intelligence & Data Science", icon: BrainCircuit, short: "Machine learning, data, models and intelligent systems.",
    about: "Builds systems that learn from data: prediction, language, vision, recommendation and decision-making.",
    subjects: "Linear Algebra, Probability & Statistics, Machine Learning, Deep Learning, NLP, Computer Vision, Data Engineering",
    careers: "ML Engineer, Data Scientist, AI Researcher, MLOps Engineer, Data Analyst",
    emerging: "AI agents, Multimodal models, Responsible & safe AI",
    jee: "Offered at IITs (as AI/Data Science), many NITs and IIITs through JEE Main; strong maths helps a lot." },
  { id: "ece", name: "Electronics & Communication", icon: Radio, short: "Circuits, signals, communication, VLSI and embedded systems.",
    about: "Covers chips, sensors, wireless networks and the hardware that connects the digital world.",
    subjects: "Analog & Digital Electronics, Signals & Systems, Communication Systems, Electromagnetics, VLSI, Embedded Systems",
    careers: "VLSI/Chip Designer, Embedded Engineer, RF Engineer, Telecom Engineer, Hardware Engineer",
    emerging: "6G & wireless, Semiconductor fabrication, IoT & edge AI",
    jee: "High-demand branch at IITs, NITs and IIITs; many students also move into software roles." },
  { id: "ee", name: "Electrical Engineering", icon: Zap, short: "Power, machines, control systems and energy.",
    about: "Generates, transmits and controls electrical energy and builds the control systems that run industry.",
    subjects: "Circuit Theory, Electrical Machines, Power Systems, Control Systems, Power Electronics, Measurements",
    careers: "Power Engineer, Control Engineer, Grid/Renewables Engineer, PSU Engineer, Automation Engineer",
    emerging: "Smart grids, EV powertrains, Energy storage",
    jee: "Offered at all IITs and NITs; cutoffs are close to ECE at most institutes." },
  { id: "me", name: "Mechanical Engineering", icon: Cpu, short: "Mechanics, thermodynamics, machines and manufacturing.",
    about: "The broadest classical branch: machines, engines, heat, fluids, materials and production.",
    subjects: "Engineering Mechanics, Thermodynamics, Fluid Mechanics, Machine Design, Manufacturing, Heat Transfer",
    careers: "Design Engineer, Manufacturing Engineer, Automotive Engineer, Thermal Engineer, Robotics Engineer",
    emerging: "Robotics, Additive manufacturing (3D printing), Digital twins",
    jee: "Available at every IIT and NIT; a popular choice for core-industry and PSU careers." },
  { id: "ce", name: "Civil Engineering", icon: Building2, short: "Structures, transport, water and infrastructure.",
    about: "Plans and builds roads, bridges, buildings, dams, water systems and cities.",
    subjects: "Structural Analysis, Geotechnics, Fluid Mechanics, Transportation, Concrete Design, Surveying",
    careers: "Structural Engineer, Site/Project Engineer, Transport Planner, Water Resources Engineer, Government Services",
    emerging: "Smart cities, Resilient infrastructure, BIM & drone surveying",
    jee: "Offered at IITs and NITs; strong government and PSU pathways through GATE and state services." },
  { id: "che", name: "Chemical Engineering", icon: FlaskConical, short: "Processes, reactions, materials and industrial systems.",
    about: "Turns chemistry into industrial-scale processes for fuels, medicines, plastics, food and materials.",
    subjects: "Mass & Heat Transfer, Chemical Reaction Engineering, Fluid Mechanics, Thermodynamics, Process Control",
    careers: "Process Engineer, Petrochemical Engineer, Pharma Engineer, Energy Engineer, Process Safety Engineer",
    emerging: "Green hydrogen, Carbon capture, Battery materials",
    jee: "Offered at most IITs and NITs; chemistry strength is an advantage." },
  { id: "ae", name: "Aerospace Engineering", icon: Rocket, short: "Aerodynamics, propulsion, spacecraft and flight systems.",
    about: "Designs aircraft, rockets, satellites and the systems that fly them.",
    subjects: "Aerodynamics, Propulsion, Flight Mechanics, Aerospace Structures, Control & Avionics",
    careers: "Aerospace Engineer, Propulsion Engineer, Avionics Engineer, Space Systems Engineer, Defence R&D",
    emerging: "Reusable launch vehicles, Drones & UAVs, Satellite constellations",
    jee: "Limited seats: select IITs, IIST (Thiruvananthapuram) and a few other institutes." },
  { id: "bt", name: "Biotechnology & Biomedical", icon: Dna, short: "Biology, devices, genetics and healthcare technology.",
    about: "Applies engineering to living systems: medical devices, bioprocesses, genomics and diagnostics.",
    subjects: "Biochemistry, Cell Biology, Bioprocess Engineering, Genetic Engineering, Biomedical Instrumentation",
    careers: "Bioprocess Engineer, Medical Device Engineer, Research Scientist, Bioinformatics Specialist",
    emerging: "Gene editing, Wearable health tech, Computational biology",
    jee: "Offered at IITs and NITs; many students continue with M.Tech or research." },
  { id: "mm", name: "Materials & Metallurgy", icon: Gem, short: "Metals, ceramics, polymers and advanced materials.",
    about: "Develops the materials that make every other branch possible, from steel to semiconductors.",
    subjects: "Physical Metallurgy, Thermodynamics of Materials, Mechanical Behaviour, Phase Transformations, Characterization",
    careers: "Materials Engineer, Metallurgist, Quality Engineer, Materials Researcher, Semiconductor Process Engineer",
    emerging: "Battery & solar materials, Nanomaterials, Lightweight alloys",
    jee: "Offered at IITs and NITs, often with comparatively lower cutoffs and strong research scope." },
  { id: "env", name: "Environmental & Energy", icon: Leaf, short: "Sustainability, water, climate and clean energy.",
    about: "Protects ecosystems and builds cleaner energy, water and waste systems.",
    subjects: "Environmental Chemistry, Water Treatment, Air Pollution Control, Renewable Energy, Climate Modelling",
    careers: "Environmental Engineer, Sustainability Consultant, Renewable Energy Engineer, Climate Analyst",
    emerging: "Climate tech, Circular economy, Grid-scale storage",
    jee: "Offered as a branch or as part of civil/chemical programs at several IITs and NITs." },
  { id: "ep", name: "Engineering Physics", icon: Atom, short: "Physics-driven engineering: optics, quantum and devices.",
    about: "Bridges physics and engineering for photonics, quantum technology, sensors and nanodevices.",
    subjects: "Quantum Mechanics, Solid State Physics, Optics & Photonics, Electromagnetism, Computational Physics",
    careers: "Photonics Engineer, Quantum Technologist, R&D Scientist, Device Physicist, Data/Software roles",
    emerging: "Quantum computing hardware, Photonic chips, Nanosensors",
    jee: "Offered at select IITs; ideal if you enjoy physics and want research flexibility." },
];

const articles = [
  { id: "future", category: "Future", title: "The Future of Engineering", description: "How AI, automation, robotics, materials and energy are reshaping the field.", icon: Rocket, read: "9 min read" },
  { id: "problem-solving", category: "Systems", title: "Engineering Is Problem Solving", description: "Requirements, constraints, modelling, testing, failure and iteration.", icon: Layers3, read: "9 min read" },
  { id: "ai-agents", category: "AI", title: "AI Agents and the Next Engineer", description: "Tool use, reasoning workflows, automation, limits and risks.", icon: BrainCircuit, read: "9 min read" },
  { id: "coding", category: "Coding", title: "Coding as an Engineering Tool", description: "Why programming now matters in every engineering branch.", icon: Code2, read: "8 min read" },
  { id: "software", category: "Technology", title: "When Software Starts Writing Software", description: "AI-assisted development, verification, architecture and security.", icon: Cpu, read: "8 min read" },
  { id: "limits", category: "Ethics", title: "The Advantages and Limits of Engineering", description: "Every system brings constraints, risks and responsibilities.", icon: ShieldCheck, read: "8 min read" },
  { id: "building-jph", category: "Case study", title: "Building JEE Prep Hub", description: "What building a student platform as a solo developer teaches about real engineering.", icon: Wrench, read: "8 min read" },
  { id: "security", category: "Security", title: "Security Is an Engineering Problem", description: "Why security is designed in from the start, not added at the end.", icon: Building2, read: "8 min read" },
];

const bodies: Record<string, string[]> = {
  future: [
    "Engineering has always changed with its tools. Slide rules gave way to calculators, drawing boards to CAD, and physical prototypes to simulation. AI is the next shift of that kind, and it is arriving in every branch at once.",
    "Three trends matter most. First, AI-assisted design: engineers state goals and constraints, and software proposes layouts, code or material candidates to evaluate. Second, automation and robotics, which move repetitive fabrication, inspection and logistics onto machines. Third, convergence: batteries need chemistry, chips and software; medical devices need biology, electronics and data.",
    "Energy is the quiet constraint behind all of it. Data centres, electric vehicles and electrified industry all need more power, so grids, storage and efficient hardware will keep growing as fields.",
    "What stays constant is judgement. Someone must decide what to build, confirm that it is safe and answer when it fails. New tools raise the ceiling for people who understand fundamentals and expose those who do not.",
    "For a student the advice is simple: build strong mathematics and physics, learn one programming language well, practise testing claims, and choose a branch you can stay curious about for years. Fundamentals outlast every trend.",
  ],
  "problem-solving": [
    "Engineering is not the same as building things. It is the discipline of solving a problem under limits: cost, time, materials, physics, regulation and human behaviour.",
    "Most good work follows a loop. Define the problem and write down requirements. Identify constraints. Model the situation with equations, sketches or code. Choose a design. Test it. Compare results with the requirements. Improve it and repeat.",
    "The first step is the one most often skipped. A bridge that is beautiful but cannot carry the required load has failed, however clever it is. Clear requirements turn an opinion into something you can check.",
    "Modelling means simplifying on purpose. A free-body diagram ignores most of reality so that the important forces become visible. Every model has assumptions, and a good engineer keeps a list of them.",
    "Failure is information. Aircraft, bridges and software have all become safer because investigators studied what went wrong and changed the rules. Treat a failed test as a cheap lesson rather than a defeat.",
    "You can practise this today: take a daily problem, such as organising your study schedule, and write its requirements, constraints and a way to measure success before choosing a solution.",
  ],
  "ai-agents": [
    "A chatbot answers a question. An AI agent pursues a goal: it breaks the goal into steps, uses tools such as search, code execution or file access, looks at the results and decides what to do next.",
    "A typical loop has six parts: a human goal, a planner, tool selection, an action, an observation of the result, and verification. The loop repeats until the goal is met or the agent is stopped.",
    "In engineering work, agents can draft code, run simulations, search documentation, compare design options and prepare reports. They save time on routine steps, which leaves more room for design decisions.",
    "They also fail in specific ways. They can state wrong facts confidently, misuse a tool, follow instructions hidden inside untrusted content, or make a long chain of small errors that compound. The more access an agent has, the larger the possible damage.",
    "Good practice is to give an agent only the permissions it needs, keep a human approving risky actions, log what it does, and check outputs against an independent source.",
    "The next engineer is not replaced by the agent. They are the person who defines the goal precisely, understands the domain well enough to spot a wrong answer, and takes responsibility for the result.",
  ],
  coding: [
    "Programming is no longer limited to computer science. Mechanical engineers run simulations, civil engineers model structures, electrical engineers write firmware and chemical engineers optimise processes, all with code.",
    "A computer does tedious calculation without tiring. A beam-deflection formula is easy once; evaluating it for a thousand designs is a short loop. That ability to explore many options is what makes coding so useful.",
    "Python is a good first language because it is readable and has strong libraries for mathematics, data and plotting. C or C++ matters if you work close to hardware. MATLAB and similar tools are common in control and signal work.",
    "Learn a few habits early: break problems into small functions, name things clearly, test with cases whose answer you already know, and use version control such as Git so you can undo mistakes.",
    "Do not treat code as magic. A program only does what it is told, and a wrong assumption produces a wrong answer very quickly. Always sanity-check results against physical intuition or a hand calculation.",
    "Start with something you care about: a calculator for a physics formula, a tracker for your mock-test scores or a plot of a data set. Small useful projects teach more than long courses.",
  ],
  software: [
    "AI tools can now write functions, explain errors, generate tests and refactor code. For many routine tasks, software is already helping to write software.",
    "That changes where effort goes. Typing code becomes cheaper; understanding what to build, reading code critically and verifying behaviour become more valuable.",
    "Generated code can look right and still be wrong. It may miss edge cases, use outdated libraries, leak secrets or introduce security flaws. Reviewing it takes the same care as reviewing a colleague's work, and sometimes more.",
    "Architecture still needs people. Deciding how parts fit together, where data lives, what must be reliable and what can fail gracefully depends on context that a short prompt rarely captures.",
    "To use these tools well, write clear requirements, ask for tests, run everything, read the diff before accepting it and keep sensitive keys and personal data out of prompts.",
    "A student who learns the fundamentals gets the most out of the tools, because they can tell when the answer is wrong.",
  ],
  limits: [
    "Engineering has solved enormous problems: clean water, electricity, medicine, transport and communication. Its strength is that it turns knowledge into systems that work at scale.",
    "Every system also has limits. Physics sets hard boundaries such as conservation of energy and the efficiency of heat engines. Budgets, time and materials set practical ones. Complex systems can fail in ways their designers did not predict.",
    "Solutions create side effects. Cars gave mobility and also pollution and congestion. Social platforms connected people and also changed attention and privacy. Good engineers ask who is affected, not only whether it works.",
    "Safety needs margins. Engineers add factors of safety, redundancy and fail-safe behaviour because models are imperfect and the real world is noisy.",
    "Responsibility is part of the job. Professional codes ask engineers to put public safety first, be honest about risks and speak up when a design is unsafe, even when that is uncomfortable.",
    "Before building anything, ask the question from the mindset section: should we build it at all? Sometimes the best engineering decision is to simplify, wait or not build.",
  ],
  "building-jph": [
    "JEE Prep Hub started as an attempt to build useful tools for students preparing for JEE and NEET. Building it as a single developer turned a list of features into a series of engineering decisions.",
    "The first lesson was to pick tools that let one person move fast. A hosted backend, a modern React front end and a database with access rules removed a lot of setup, so time went to the product instead of the plumbing.",
    "The second lesson was that data access is a design problem. Who may read a profile, who may edit a post and what an admin can do all have to be decided deliberately. Writing those rules early prevents painful rewrites.",
    "The third lesson was cost. Free tiers and limited credits shape architecture. Storing some data on the user's device, caching and avoiding unnecessary requests make the platform cheaper and often faster.",
    "The fourth lesson was to test what students actually do. A feature that looks good on a laptop can break on a small phone, so mobile testing matters more than anything else for this audience.",
    "The habit that helped most was shipping in small steps, checking each one and keeping notes on what broke. Real users find problems fast, and every fix teaches something.",
  ],
  security: [
    "Security is not a feature added at the end. It is a property of the whole system, decided by many small design choices.",
    "A useful starting model is to ask three questions: what are we protecting, who might attack it, and what happens if they succeed? The answers tell you where to spend effort.",
    "Some principles apply almost everywhere. Give each user and service the least access it needs. Never trust input; validate and sanitise it. Store passwords only as salted hashes from a proven library. Keep secrets such as API keys out of public code and front-end bundles.",
    "Access control must be enforced on the server or database, not only in the interface. Hiding a button does not stop someone from calling the endpoint directly.",
    "Plan for failure. Keep backups, log important events, rotate keys, keep dependencies updated and prepare a response for when something goes wrong.",
    "Security also includes people. Clear privacy settings, honest explanations and the option to export or delete data build trust, which is hard to rebuild once lost.",
  ],
};

// In-depth guides: [heading, text] sections for every branch.
const deep: Record<string, [string, string][]> = {
  cse: [
    ["What it is", "Computer science and engineering studies how to represent problems as data and procedures, then build software and systems that run them reliably at scale. It covers theory (what is computable and how fast), systems (how machines, operating systems and networks work) and applications (web, mobile, games, AI)."],
    ["What you study", "Early years build programming, discrete mathematics and data structures. Later you meet algorithms and complexity, operating systems, databases, computer networks, computer architecture and compilers. Electives usually include machine learning, security, distributed systems, graphics and human-computer interaction."],
    ["Skills to build", "Problem solving with algorithms, clean code, version control with Git, reading documentation, debugging patiently and writing tests. Competitive programming sharpens speed; open-source and personal projects show you can finish and maintain something real."],
    ["Careers and future", "Software, backend, full-stack, cloud and DevOps, security, data and research roles all start here. AI tools are changing how code is written, so understanding design, testing and security matters more than memorising syntax. Expect to keep learning for your whole career."],
  ],
  aids: [
    ["What it is", "This branch builds systems that learn patterns from data to predict, classify, generate or decide. It combines statistics, optimisation and programming, and sits behind search, recommendation, translation, medical imaging and chatbots."],
    ["What you study", "Linear algebra, probability, statistics and calculus form the base. On top come machine learning, deep learning, natural language processing, computer vision, reinforcement learning, databases and data engineering, plus ethics and evaluation."],
    ["Skills to build", "Python, NumPy and pandas, a deep-learning framework, SQL, experiment tracking and clear communication of results. The hardest skill is judging whether a model is actually good: data quality, bias, leakage and honest evaluation."],
    ["Careers and future", "Machine learning engineer, data scientist, data engineer, MLOps and research roles. Models are becoming easier to call, so value shifts toward framing the right problem, preparing data, deploying safely and monitoring behaviour after launch."],
  ],
  ece: [
    ["What it is", "Electronics and communication engineering covers devices, circuits and the systems that send information through wires, air and fibre. It links physics of semiconductors to phones, radios, sensors, satellites and chips."],
    ["What you study", "Network theory, analog and digital electronics, signals and systems, electromagnetic theory, communication systems, microprocessors, control and VLSI design. Labs teach you to build and measure circuits, which is a major part of the learning."],
    ["Skills to build", "Circuit analysis, simulation tools, microcontrollers such as Arduino or STM32, Verilog or VHDL for chip design, MATLAB or Python for signals, and careful lab habits like datasheet reading and measurement."],
    ["Careers and future", "Chip design and verification, embedded systems, telecom and wireless, RF, IoT and electronics manufacturing. Semiconductors and next-generation wireless are growing areas, and many graduates also move into software."],
  ],
  ee: [
    ["What it is", "Electrical engineering deals with generating, moving, converting and controlling electrical energy, along with the control systems that automate machines and plants."],
    ["What you study", "Circuits, electromagnetic fields, electrical machines such as motors and transformers, power systems, power electronics, control systems, measurements and instrumentation. Many programmes add renewable energy and electric-vehicle topics."],
    ["Skills to build", "Mathematical modelling, simulation in MATLAB/Simulink, safe handling of high-power equipment, reading single-line diagrams and basic programming for control and data analysis."],
    ["Careers and future", "Power utilities, grid operators, PSUs, automation and industrial control, renewable energy and EV companies. Smart grids, storage and electrification make this one of the most future-relevant branches."],
  ],
  me: [
    ["What it is", "Mechanical engineering is the study of motion, force, energy and materials in machines. It spans engines, turbines, robots, vehicles, air-conditioning, factories and medical devices."],
    ["What you study", "Engineering mechanics, strength of materials, thermodynamics, fluid mechanics, heat transfer, kinematics and dynamics of machines, machine design, manufacturing processes and industrial engineering. Later electives cover robotics, CFD, automotive and mechatronics."],
    ["Skills to build", "CAD (SolidWorks, CATIA or Fusion), finite element and CFD basics, workshop skills, drawing standards and programming for analysis. Building something physical, such as a robot or go-kart, teaches practical judgement."],
    ["Careers and future", "Design, manufacturing, automotive, aerospace support, energy, HVAC, defence and PSUs. Automation, additive manufacturing and electric vehicles are changing the field, so combine mechanical strength with electronics and coding."],
  ],
  ce: [
    ["What it is", "Civil engineering plans, designs and maintains the built environment: buildings, bridges, roads, railways, ports, dams, water supply and drainage."],
    ["What you study", "Surveying, structural analysis, reinforced concrete and steel design, geotechnical engineering, fluid mechanics, hydrology, transportation engineering, environmental engineering and construction management."],
    ["Skills to build", "Structural software such as STAAD or ETABS, AutoCAD and BIM tools, estimation and costing, site coordination and understanding of building codes. Internships on real sites teach what textbooks cannot."],
    ["Careers and future", "Design consultancies, construction firms, government departments, railways and infrastructure PSUs. Demand follows urbanisation and climate resilience, and digital tools like BIM, drones and sensors are modernising the work."],
  ],
  che: [
    ["What it is", "Chemical engineering scales chemistry from the lab bench to plants that make fuels, fertilisers, medicines, plastics, food and materials safely and economically."],
    ["What you study", "Material and energy balances, fluid mechanics, heat and mass transfer, chemical reaction engineering, thermodynamics, separation processes, process control, plant design and process safety."],
    ["Skills to build", "Process simulation (Aspen), data analysis, understanding of P&ID diagrams, safety and risk assessment, and the ability to reason about whole systems rather than single units."],
    ["Careers and future", "Refining, petrochemicals, pharmaceuticals, fertilisers, food processing, energy and environmental firms. Green hydrogen, carbon capture, batteries and sustainable materials are expanding areas."],
  ],
  ae: [
    ["What it is", "Aerospace engineering designs vehicles that fly in the atmosphere or space: aircraft, helicopters, drones, rockets and satellites. It is highly multidisciplinary and safety critical."],
    ["What you study", "Aerodynamics, propulsion, aircraft structures, flight mechanics, control and avionics, orbital mechanics and materials. Wind-tunnel and propulsion labs connect theory with measurement."],
    ["Skills to build", "CFD and structural simulation, CAD, MATLAB, control design, systems thinking and rigorous documentation. Student rocketry, drone and aero-modelling teams are excellent training grounds."],
    ["Careers and future", "Space agencies, defence research, aircraft manufacturers, MRO companies, drone and satellite start-ups. Seats and employers are fewer than in larger branches, so passion and projects matter."],
  ],
  bt: [
    ["What it is", "Biotechnology and biomedical engineering apply engineering to living systems: producing medicines, designing medical devices, analysing genomes and building diagnostic tools."],
    ["What you study", "Biochemistry, cell and molecular biology, genetics, microbiology, bioprocess engineering, bioinformatics, biomaterials and medical instrumentation, with strong lab components."],
    ["Skills to build", "Lab technique, data analysis in Python or R, statistics, understanding of regulation and ethics, and the patience for experiments that fail often."],
    ["Careers and future", "Pharma and biotech companies, medical device firms, diagnostics, research institutes and bioinformatics. Many students pursue higher studies, since advanced degrees open more research roles."],
  ],
  mm: [
    ["What it is", "Materials and metallurgical engineering explains why materials behave as they do and designs better ones: stronger alloys, lighter composites, better semiconductors and longer-lasting batteries."],
    ["What you study", "Crystal structure, thermodynamics of materials, phase diagrams, mechanical behaviour, heat treatment, extractive metallurgy, corrosion, polymers, ceramics and characterisation techniques such as microscopy and X-ray diffraction."],
    ["Skills to build", "Microscopy and testing methods, materials selection, computational materials tools, failure analysis and statistics for quality control."],
    ["Careers and future", "Steel and metals industries, automotive and aerospace, electronics, energy storage and research labs. Almost every new technology depends on a materials breakthrough, which gives this branch a strong research future."],
  ],
  env: [
    ["What it is", "Environmental and energy engineering protects air, water and land while delivering the power society needs. It combines civil, chemical and energy knowledge."],
    ["What you study", "Environmental chemistry, water and wastewater treatment, air pollution control, solid waste management, hydrology, renewable energy systems, energy storage and climate modelling."],
    ["Skills to build", "Field sampling, GIS, modelling tools, life-cycle assessment, policy understanding and the ability to explain trade-offs to non-engineers."],
    ["Careers and future", "Pollution control boards, consultancies, renewable energy developers, utilities and sustainability teams. Climate adaptation and the energy transition make demand grow steadily."],
  ],
  ep: [
    ["What it is", "Engineering physics combines deep physics with engineering practice. It prepares you for technologies that rely on quantum effects, light and advanced devices."],
    ["What you study", "Classical and quantum mechanics, electromagnetism, solid-state physics, optics and photonics, statistical mechanics, electronics, computational physics and materials, along with core mathematics."],
    ["Skills to build", "Strong mathematics, numerical simulation, experimental technique, programming and the ability to move between theory and hardware."],
    ["Careers and future", "Photonics, semiconductors, quantum technology, sensors, research and software or data roles. The flexibility is a strength, and many graduates continue to M.Tech or PhD programmes."],
  ],
};

// Extra detail per branch: four-year roadmap, tools and who it suits.
const more: Record<string, { road: string[]; tools: string; suits: string }> = {
  cse: { road: ["Programming, discrete maths, data structures; build small console projects.", "Algorithms, OOP, databases, computer organisation; start a web or app project.", "Operating systems, networks, software engineering, ML basics; do an internship.", "Specialise (AI, security, systems), final-year project, placement or GATE preparation."], tools: "Python, C++, Java, JavaScript, Git, Linux, SQL, Docker, VS Code", suits: "You enjoy logic puzzles, building things on a screen and learning new tools continuously." },
  aids: { road: ["Programming, calculus, linear algebra and statistics.", "Data structures, probability, databases and first ML models.", "Deep learning, NLP or vision, data pipelines; apply on real datasets.", "Specialise, deploy a model end to end, research project or placement."], tools: "Python, NumPy, pandas, scikit-learn, PyTorch, SQL, Jupyter, Git", suits: "You like mathematics, patterns in data and asking whether a result can be trusted." },
  ece: { road: ["Basic electrical and electronics, programming, physics of devices.", "Analog and digital circuits, signals, network theory; build Arduino projects.", "Communication systems, electromagnetics, microprocessors, VLSI basics.", "Specialise (VLSI, embedded, wireless), final-year hardware project or placement."], tools: "Multimeter and oscilloscope, SPICE, MATLAB, Verilog, Arduino/STM32, Python", suits: "You like understanding how phones and gadgets work and enjoy both hardware and maths." },
  ee: { road: ["Circuits, physics, mathematics and workshop practice.", "Electrical machines, electromagnetic fields, analog electronics.", "Power systems, control systems, power electronics, measurements.", "Specialise (grid, EVs, automation), plant training and a design project."], tools: "MATLAB/Simulink, PSCAD, ETAP, PLC programming, Python, lab instruments", suits: "You are curious about power, motors, the grid and how large systems stay stable." },
  me: { road: ["Mechanics, drawing, workshop and thermodynamics basics.", "Strength of materials, fluid mechanics, kinematics, manufacturing processes.", "Machine design, heat transfer, CAD/CAM, internship in a plant.", "Specialise (robotics, thermal, automotive), design project and placement."], tools: "SolidWorks, CATIA, ANSYS, AutoCAD, MATLAB, CNC and 3D printers", suits: "You like taking things apart, understanding machines and practical building." },
  ce: { road: ["Mechanics, drawing, surveying and materials.", "Structural analysis, fluid mechanics, concrete technology.", "Design of steel and concrete, geotechnics, transportation; site internship.", "Specialise (structures, water, transport), design project, GATE or services."], tools: "AutoCAD, STAAD, ETABS, Revit/BIM, total station, GIS", suits: "You want visible, lasting work such as buildings, bridges and cities, and you are fine with field work." },
  che: { road: ["Chemistry, physics, mathematics and process basics.", "Material and energy balances, fluid mechanics, thermodynamics.", "Heat and mass transfer, reaction engineering, process control; plant visit.", "Plant design, safety, specialisation (energy, pharma, polymers) and placement."], tools: "Aspen Plus, MATLAB, Python, P&ID drawings, lab analytical instruments", suits: "You like chemistry and want to see it work on an industrial scale." },
  ae: { road: ["Mechanics, mathematics, programming and engineering drawing.", "Thermodynamics, fluid mechanics, aircraft structures basics.", "Aerodynamics, propulsion, flight dynamics, control; join a student team.", "Specialise (space, UAV, propulsion), final-year design project, GATE or R&D."], tools: "CATIA/SolidWorks, ANSYS Fluent, MATLAB, XFLR5, OpenFOAM, Python", suits: "You are fascinated by flight and space and ready to work on demanding, precise problems." },
  bt: { road: ["Biology, chemistry, mathematics and basic programming.", "Biochemistry, cell biology, microbiology and lab techniques.", "Bioprocess engineering, genetic engineering, bioinformatics; internship in a lab.", "Specialise (pharma, devices, genomics), research project, higher studies or placement."], tools: "PCR and microscopy, bioreactors, BLAST, Python/R, statistics software", suits: "You are interested in biology and health and have patience for careful lab work." },
  mm: { road: ["Physics, chemistry, mathematics and engineering basics.", "Crystallography, thermodynamics of materials, mechanical behaviour.", "Heat treatment, corrosion, polymers and ceramics; characterisation labs.", "Specialise (metals, nano, batteries), research project, industry or M.Tech."], tools: "Optical and electron microscopy, XRD, tensile testers, Thermo-Calc, Python", suits: "You like asking why materials fail and how to make something stronger or lighter." },
  env: { road: ["Chemistry, physics, mathematics and environmental basics.", "Water chemistry, fluid mechanics, ecology and surveying.", "Treatment design, air and waste management, renewable energy; field study.", "Specialise (energy, water, climate), project, policy exposure and placement."], tools: "GIS, EPANET, MATLAB, Python, air and water sampling kits, LCA software", suits: "You care about climate and sustainability and want practical solutions, not only awareness." },
  ep: { road: ["Mathematics, mechanics and classical physics with programming.", "Electromagnetism, quantum mechanics, electronics.", "Solid-state physics, optics and photonics, computational methods.", "Specialise (quantum, photonics, devices), research project, M.Tech or PhD."], tools: "Python, MATLAB, COMSOL, lab optics and electronics, LaTeX", suits: "You love physics but want to build devices and keep career options open." },
};

// Future prospects, benefits and honest challenges per branch.
const outlook: Record<string, { prospects: string[]; benefits: string[]; watch: string }> = {
  cse: { prospects: ["Almost every industry now runs on software, from banking and healthcare to farming and entertainment, so demand for people who can build and secure systems stays broad. Cloud, cybersecurity, data platforms and AI-enabled products are the fastest-growing areas.", "Routine coding is being automated, so the long-term edge comes from system design, debugging, security thinking and domain knowledge. Engineers who combine computing with another field, such as biology, finance or mechanics, will be especially valuable."], benefits: ["Widest range of job types and employers", "Remote and global work is common", "Easy to start building and showing projects", "Strong start-up and entrepreneurship path", "Skills transfer to almost any other field"], watch: "Entry-level competition is high and the tools change quickly, so portfolios and continuous learning matter more than the degree title." },
  aids: { prospects: ["Organisations in every sector collect data and want decisions, forecasts and automation from it. Healthcare, finance, logistics, education and science are all adopting AI, which keeps opportunities growing.", "As models become commoditised, value moves to data quality, evaluation, safety, deployment and domain expertise. Roles in responsible AI, MLOps and applied research are rising."], benefits: ["Work on high-impact, fast-moving problems", "Strong research and higher-study options", "Applicable across many industries", "Good fit with mathematics and statistics strength", "Opportunity to build products with real users"], watch: "The field moves fast and hype is common. Weak foundations in maths and statistics show up quickly, so learn the basics properly." },
  ece: { prospects: ["Semiconductors, 5G and future wireless, satellites, wearables, electric vehicles and IoT all depend on electronics. Chip design and manufacturing are strategic priorities in many countries, including India.", "The branch is flexible: graduates move into hardware, embedded software, telecom or pure software. Edge AI, where intelligence runs on small devices, joins hardware and software skills."], benefits: ["Both hardware and software career paths", "Core demand in electronics and telecom", "Strong link to the semiconductor boom", "Good foundation for research and M.Tech", "Skills useful in robotics, EVs and space"], watch: "Hardware roles can be fewer and more specialised than pure software, so choose electives and projects with a clear direction." },
  ee: { prospects: ["The energy transition means more renewable generation, storage, electric vehicles, smart meters and a stronger grid. Every one of these needs electrical engineers to design, operate and protect the system.", "Automation, robotics and industrial control are also growing, and power electronics sits inside chargers, inverters and data centres. Long-term demand is steady because electricity use keeps rising."], benefits: ["Stable demand across utilities and industry", "Strong government and PSU opportunities", "Central to the clean-energy transition", "Good mix of theory and practical work", "Options in power, control, electronics and EVs"], watch: "Some roles are site or plant based and safety critical. Pair core skills with software and data analysis to widen your options." },
  me: { prospects: ["Manufacturing, automobiles, energy, aerospace and defence continue to need mechanical engineers. Electric vehicles, robotics, additive manufacturing and heating and cooling for a warmer world open new work.", "Modern mechanical engineers also use simulation, data and automation. Those who add programming, electronics and design skills move easily into mechatronics and robotics."], benefits: ["Broadest classical branch with many sectors", "Strong core-industry, PSU and defence options", "Hands-on, visible results", "Easy to combine with robotics and electronics", "Good base for management and entrepreneurship"], watch: "Core hiring is cyclical and campus placements vary by institute. Build CAD, simulation and coding skills to stay flexible." },
  ce: { prospects: ["Urbanisation, transport networks, housing, water supply and climate resilience create long-term demand. Large public investment in roads, metros, railways and ports supports hiring.", "Technology is changing the work: BIM, drones, sensors, 3D printing and digital twins improve design and monitoring. Sustainable construction and disaster-resistant design are growing specialities."], benefits: ["Strong government and infrastructure jobs", "Visible, lasting impact on society", "Clear path to licensed and consulting roles", "Opportunities in planning, design and management", "Good scope for starting your own firm"], watch: "Site work can be demanding and pay often grows with experience. Digital skills and a strong internship record help a lot." },
  che: { prospects: ["Chemical engineers sit at the centre of the energy transition: green hydrogen, carbon capture, batteries, biofuels and recycling all rely on process knowledge. Pharmaceuticals and specialty chemicals remain strong.", "Process automation and data analytics are growing inside plants, so engineers who combine process understanding with data skills are in demand. Safety and sustainability expertise are increasingly valued."], benefits: ["Versatile across energy, pharma, food and materials", "Strong fit for sustainability work", "Solid core and research opportunities", "Valued process-safety skills", "Many students move into data or consulting"], watch: "Plant jobs are tied to industry cycles and can be location specific. Seats and employers for core roles are fewer than for software." },
  ae: { prospects: ["Commercial and private space launches, satellite constellations, drones and defence programmes are expanding, and India is opening its space sector to private companies. Efficient and electric aircraft are active research areas.", "Opportunities are specialised but intense. Strong simulation, control and systems skills also transfer into automotive, robotics and software roles."], benefits: ["Work on aircraft, rockets and satellites", "Growing private space and drone ecosystem", "Strong research and defence prospects", "Skills transfer to automotive and robotics", "Prestigious, challenging projects"], watch: "Fewer seats and employers, and many roles require higher studies or security clearance. Keep alternate paths such as simulation, robotics or software open." },
  bt: { prospects: ["Healthcare, vaccines, diagnostics, genomics and agriculture are all adopting biotechnology, and AI is speeding up drug discovery and protein design. Personalised medicine and wearable health tech are growing.", "Research and higher studies matter here. Bioinformatics, biomedical devices and bioprocess scale-up offer paths that combine biology with computing and engineering."], benefits: ["Meaningful work in health and food security", "Strong link to research and academia", "Growing bioinformatics and device opportunities", "Interdisciplinary: biology, data, engineering", "Options abroad through higher studies"], watch: "Entry-level roles are limited and a master's or PhD often helps. Develop data and programming skills to widen options." },
  mm: { prospects: ["Batteries, solar cells, semiconductors, lightweight vehicles and recyclable materials all need better materials. Steel, aluminium and specialty alloys remain essential to infrastructure and manufacturing.", "Computational materials design and AI-guided discovery are speeding up research. Graduates can enter manufacturing, electronics, energy or research roles."], benefits: ["Foundation of every other engineering field", "Strong research and innovation scope", "Opportunities in steel, aerospace and electronics", "Growing demand from batteries and clean energy", "Often accessible cutoffs at good institutes"], watch: "Core industries are cyclical and some roles are plant based. Add simulation, data and electronics skills for broader options." },
  env: { prospects: ["Climate adaptation, clean water, waste management and renewable energy are priorities worldwide, and regulation and corporate sustainability reporting create steady demand. Carbon markets and circular-economy models are new fields.", "Roles are increasingly technical and data driven, using remote sensing, modelling and monitoring. Engineers who explain trade-offs clearly to policymakers are highly useful."], benefits: ["Work that directly protects people and nature", "Growing policy and sustainability sector", "Mix of fieldwork, modelling and design", "Interdisciplinary: civil, chemical, energy", "Rising global relevance"], watch: "The job market is smaller and often project based. Technical depth plus GIS, modelling and communication skills makes you stand out." },
  ep: { prospects: ["Quantum technologies, photonics, advanced sensors and nanoelectronics are emerging industries where physics-based engineers are needed. Semiconductor and optical-communication companies value this training.", "Because the programme is broad, graduates also move into software, data science, finance and research. Many continue to M.Tech or PhD."], benefits: ["Deep grounding in physics and mathematics", "Flexible paths into tech, research or finance", "Strong preparation for higher studies", "Exposure to cutting-edge technology", "Good problem-solving reputation"], watch: "Fewer direct campus roles and less defined job titles. Build coding and hardware projects to show what you can do." },
};

// YouTube: paste a real video ID into `videoIds` to show an embedded player in that branch guide.
// Example: cse: "dQw4w9WgXcQ" (the part after v= in a YouTube link). Search links and channels always work.
const videoIds: Record<string, string> = {
  cse: "", aids: "", ece: "", ee: "", me: "", ce: "", che: "", ae: "", bt: "", mm: "", env: "", ep: "",
};
const channels: Record<string, string> = {
  cse: "CS50, freeCodeCamp, NPTEL", aids: "StatQuest, 3Blue1Brown, Andrej Karpathy", ece: "Neso Academy, NPTEL, Learn Engineering",
  ee: "Neso Academy, NPTEL, Learn Engineering", me: "Learn Engineering, Engineering Explained, NPTEL", ce: "Practical Engineering, NPTEL, Learn Engineering",
  che: "NPTEL, Crash Course, MIT OpenCourseWare", ae: "Real Engineering, ISRO, NPTEL", bt: "Khan Academy, MIT OpenCourseWare, NPTEL",
  mm: "NPTEL, MIT OpenCourseWare, Learn Engineering", env: "Practical Engineering, NPTEL, TED-Ed", ep: "MIT OpenCourseWare, 3Blue1Brown, Veritasium",
};
const ytUrl = (q: string) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);

// Deep-dive sections, key takeaways and related branches for each journal article.
const extra: Record<string, { sections: [string, string][]; takeaways: string[]; related: string[] }> = {
  future: {
    sections: [
      ["Skills that will matter most", "Technical depth will still decide who can do the work: mathematics, physics, data handling and programming. Around that sits a second layer: systems thinking (seeing how parts interact), clear writing, teamwork across disciplines and the habit of checking AI output. Employers increasingly look for people who can learn a new tool in weeks rather than people who know one tool well."],
      ["Branch by branch", "Computer and AI engineers will spend more time designing, reviewing and securing systems than typing code. Electrical and electronics engineers will work on grids, chips and EVs. Mechanical and aerospace engineers will lean on simulation, robotics and new manufacturing. Civil and environmental engineers will focus on resilient, low-carbon infrastructure. Chemical and materials engineers will help build batteries, hydrogen and recyclable products."],
      ["How to prepare now", "Build projects, however small, and keep a record of what you learned. Take mathematics seriously in Class 11 and 12 because it carries into every branch. Learn Python early. Read about engineering failures, since they teach more than successes. Finally, stay flexible: the title on your degree matters less than the problems you can solve."],
    ],
    takeaways: ["Tools change; fundamentals last", "Convergence of fields creates new roles", "Judgement and responsibility stay human", "Learning speed is a core skill"],
    related: ["cse", "aids", "ee"],
  },
  "problem-solving": {
    sections: [
      ["A worked example: a footbridge", "Suppose a village needs a footbridge over a stream. Requirements: carry 5 kN per metre, span 12 m, last 30 years, cost under a fixed budget. Constraints: monsoon floods, local materials, limited machinery. The team models loads, compares a steel truss with a timber beam, tests a small prototype, finds excess vibration and adds bracing. At no point did the solution start with a favourite design; it started with the problem."],
      ["Common mistakes", "Jumping to a solution before defining the problem. Optimising one number, like cost, while ignoring safety or maintenance. Trusting a model without checking its assumptions. Testing only the cases you expect to pass. Hiding failures instead of recording them. Each mistake is common among beginners and professionals alike."],
      ["Habits of strong engineers", "They write assumptions down. They estimate before calculating, so they notice absurd results. They ask what could go wrong, then test it. They communicate trade-offs plainly so others can decide. They treat reviews as help, not criticism, and they keep notes on what they tried so mistakes are not repeated."],
    ],
    takeaways: ["Define the problem before the solution", "Every model has assumptions; list them", "Failures are data, not shame", "Estimate first, calculate second"],
    related: ["me", "ce", "che"],
  },
  "ai-agents": {
    sections: [
      ["Where agents help today", "Agents are useful for tasks with clear steps and checkable results: searching documentation, writing and running tests, converting data formats, drafting reports, comparing design options and monitoring systems. They are weaker where goals are vague, mistakes are costly or the environment changes unpredictably. A good rule is to give agents the boring, verifiable parts of a job."],
      ["Designing safe agent workflows", "Limit the tools an agent can use. Require human approval for irreversible actions such as deleting data, spending money or sending messages. Keep logs of every step. Treat text from websites and files as untrusted, because it may contain instructions meant to mislead the agent. Test the workflow on harmless tasks before real ones, and always have a way to stop it."],
      ["What an engineer should learn", "Learn how language models work at a high level, including why they can be wrong. Practise writing precise requirements, since an agent can only follow what you specify. Study evaluation: how to measure whether an agent actually succeeds. Learn basic security, since agents with tool access become targets. Most importantly, keep strong domain knowledge so you can recognise a wrong answer."],
    ],
    takeaways: ["Agents plan, act, observe and verify", "Give least privilege and keep humans in the loop", "Treat outside text as untrusted", "Domain knowledge is your safety net"],
    related: ["aids", "cse", "ece"],
  },
  coding: {
    sections: [
      ["A learning path that works", "Start with Python basics: variables, loops, functions and lists. Then learn to read files and plot data. Build three small projects, such as a physics calculator, a mock-test score tracker and a data plot from an experiment. Next learn Git, then a second language such as C++ or JavaScript. Practise problems regularly, but always connect them to something you want to build."],
      ["Coding in each branch", "Mechanical engineers script simulations and automate CAD tasks. Civil engineers process survey data and run structural analysis. Electrical and electronics engineers write firmware, control algorithms and signal processing code. Chemical engineers model reactors and optimise plants. Aerospace engineers simulate flight and orbits. In every case, coding extends what a single person can analyse."],
      ["Good habits from day one", "Name variables clearly. Keep functions short. Write a test for each important function. Commit often with clear messages. Read error messages calmly, from the bottom up. Comment on why, not what. Ask for help with a minimal example. These habits matter more than clever tricks, and they make collaboration possible."],
    ],
    takeaways: ["Code lets you explore many designs quickly", "Python first, then add tools as needed", "Projects teach more than passive courses", "Always sanity-check your results"],
    related: ["cse", "me", "ce"],
  },
  software: {
    sections: [
      ["A safe workflow", "Write the requirement in plain language first. Ask the AI for a small piece, not a whole system. Read every line before running it. Run tests, including edge cases you invent yourself. Check dependencies exist and are maintained. Review the diff before committing. Never paste passwords, keys or private data into a prompt. Treat the result as a draft from a fast but fallible junior colleague."],
      ["Where it breaks", "Generated code may use functions that do not exist, ignore error handling, hide subtle bugs, copy insecure patterns or pass tests while missing the real requirement. Large changes are harder to review, so errors slip in. Teams that stop reading code gradually lose understanding of their own system, which is dangerous when something fails at night."],
      ["Skills that grow in value", "System design, code review, debugging, testing strategy, security awareness and clear specification. Understanding performance, data and failure modes also becomes more important because someone must decide what good looks like. Students who learn these skills can use AI as leverage; those who skip them risk being unable to tell good code from bad."],
    ],
    takeaways: ["AI speeds up typing, not responsibility", "Review and test everything", "Keep secrets out of prompts", "Fundamentals let you spot wrong answers"],
    related: ["cse", "aids"],
  },
  limits: {
    sections: [
      ["Failures that changed engineering", "The Tacoma Narrows Bridge collapsed in 1940 because wind caused destructive oscillation, which reshaped bridge aerodynamics. The Challenger disaster in 1986 showed how cold weather and a sealing ring failure, combined with pressure to launch, can end in tragedy. The Ariane 5 rocket in 1996 was lost to a software conversion error. The Mars Climate Orbiter failed in 1999 because teams used different units. Each case led to better standards and review practices."],
      ["Living with trade-offs", "Every design balances competing goals: cost versus durability, speed versus safety, performance versus power use, features versus simplicity. There is rarely a perfect answer. Good engineers make trade-offs explicit, document the reasoning and choose margins that reflect the cost of failure. Where lives are at stake, the margin must be larger."],
      ["Professional responsibility", "Engineering codes of ethics ask for honesty, competence and putting public welfare first. That means reporting risks even when schedules are tight, refusing to approve unsafe work and acknowledging errors. It also means thinking about long-term effects such as pollution, privacy and who benefits from a technology."],
    ],
    takeaways: ["Failures teach standards and safety", "Trade-offs should be explicit", "Safety margins reflect the cost of failure", "Ethics is part of the job"],
    related: ["ce", "env", "che"],
  },
  "building-jph": {
    sections: [
      ["Decisions that mattered", "Choosing a backend with built-in authentication and database rules saved months. Keeping some user data on the device reduced server cost and improved speed. Writing access rules for each table early prevented data leaks. Designing mobile-first made sure the most common student experience worked well. Each choice traded flexibility for speed, which suits a solo project."],
      ["What to do differently next time", "Write down requirements before building each feature. Add automated tests for critical flows such as sign-in and payments. Monitor errors and costs from day one. Keep a changelog so problems can be traced. Plan backups and recovery before they are needed. These practices cost little early and save a lot later."],
      ["Advice for student builders", "Start with one real problem and a few users. Ship a small version, then listen. Learn the basics of databases, authentication and security instead of relying on tools blindly. Keep your own notes about what broke and why. Be honest with users about what exists today. Build in public carefully, and protect their data as if it were your own."],
    ],
    takeaways: ["Small, real problems beat big plans", "Design access rules early", "Test critical flows", "Listen to users and keep notes"],
    related: ["cse", "aids"],
  },
  security: {
    sections: [
      ["Common threats students should know", "Phishing tricks people into giving passwords. Weak or reused passwords let attackers in. SQL injection and cross-site scripting exploit unchecked input. Exposed API keys in public repositories are found and abused quickly. Missing access checks let users read other people's data. Outdated libraries carry known flaws. Most real attacks use simple mistakes, not advanced magic."],
      ["A beginner checklist", "Use a password manager and two-factor authentication. Keep secrets in environment variables, never in code. Validate and escape all input. Enforce permissions on the server or database. Use HTTPS everywhere. Update dependencies regularly. Log sign-ins and errors. Back up data and test restoring it. Collect only the data you need, and let users export or delete it."],
      ["Building a security habit", "Before adding a feature, ask what could be abused. After adding it, try to abuse it yourself. Read incident reports to learn how breaches happen. Ask a friend to review your work, because fresh eyes spot what you miss. Security is never finished; it is a routine, like testing, that you repeat as the system grows."],
    ],
    takeaways: ["Design security in from the start", "Enforce access on the server, not just the UI", "Protect secrets and update dependencies", "Collect less data to risk less"],
    related: ["cse", "ece"],
  },
};

const list = (s: string) => s.split(",").map((x) => x.trim());
type Tab = "subjects" | "careers" | "emerging" | "jee";
const tabs: [Tab, string][] = [["subjects", "Subjects"], ["careers", "Careers"], ["emerging", "Emerging"], ["jee", "JEE route"]];

function EngineeringPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(branches[0].id);
  const [tab, setTab] = useState<Tab>("subjects");
  const [openId, setOpenId] = useState<string | null>(null);
  const [guideId, setGuideId] = useState<string | null>(null);
  const guide = branches.find((b) => b.id === guideId);
  const [likes, setLikes] = useState<string[]>([]);
  const [shareKey, setShareKey] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const ready = useRef(false);
  const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 2200); };
  useEffect(() => {
    try { setLikes(JSON.parse(localStorage.getItem("eng-likes") || "[]")); } catch {}
    const h = window.location.hash;
    if (h.startsWith("#a-") && articles.some((a) => a.id === h.slice(3))) setOpenId(h.slice(3));
    else if (h.startsWith("#g-") && branches.some((b) => b.id === h.slice(3))) setGuideId(h.slice(3));
  }, []);
  useEffect(() => {
    if (!ready.current) { ready.current = true; return; }
    const k = openId ? "a-" + openId : guideId ? "g-" + guideId : "";
    try { window.history.replaceState(null, "", window.location.pathname + window.location.search + (k ? "#" + k : "")); } catch {}
    setShareKey(null);
  }, [openId, guideId]);
  const toggleLike = (k: string) => {
    const n = likes.includes(k) ? likes.filter((x) => x !== k) : [...likes, k];
    setLikes(n);
    try { localStorage.setItem("eng-likes", JSON.stringify(n)); } catch {}
  };
  const linkFor = (k: string) => window.location.origin + window.location.pathname + "#" + k;
  const copy = async (k: string) => {
    try { await navigator.clipboard.writeText(linkFor(k)); say("Link copied"); } catch { say("Could not copy. Copy the address bar link instead."); }
    setShareKey(null);
  };
  const nativeShare = async (k: string, title: string) => {
    try { await navigator.share({ title, text: title + " — JEE Prep Hub Engineering Journal", url: linkFor(k) }); } catch {}
    setShareKey(null);
  };
  const actionBar = (k: string, title: string) => {
    const liked = likes.includes(k);
    const canNative = typeof navigator !== "undefined" && !!navigator.share;
    const msg = encodeURIComponent(title + " — JEE Prep Hub Engineering Journal\n" + linkFor(k));
    const url = encodeURIComponent(linkFor(k));
    return (
      <div className="eng-actionbar">
        {shareKey === k && (
          <div className="eng-card eng-sharemenu" role="menu">
            {canNative && <button role="menuitem" onClick={() => nativeShare(k, title)}><Share2 size={16} /> Share via…</button>}
            <a role="menuitem" href={"https://wa.me/?text=" + msg} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> WhatsApp</a>
            <a role="menuitem" href={"https://t.me/share/url?url=" + url + "&text=" + encodeURIComponent(title)} target="_blank" rel="noopener noreferrer"><Send size={16} /> Telegram</a>
            <a role="menuitem" href={"https://twitter.com/intent/tweet?text=" + encodeURIComponent(title) + "&url=" + url} target="_blank" rel="noopener noreferrer"><X size={16} /> X (Twitter)</a>
            <button role="menuitem" onClick={() => copy(k)}><Copy size={16} /> Copy link</button>
          </div>
        )}
        <button className={"eng-act" + (liked ? " is-liked" : "")} aria-pressed={liked} onClick={() => toggleLike(k)}><Heart size={18} fill={liked ? "currentColor" : "none"} /> {liked ? "Liked" : "Like"}</button>
        <button className="eng-act" aria-expanded={shareKey === k} onClick={() => setShareKey(shareKey === k ? null : k)}><Share2 size={18} /> Share</button>
      </div>
    );
  };
  const openIdx = articles.findIndex((a) => a.id === openId);

  useEffect(() => {
    if (!openId && !guideId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpenId(null); setGuideId(null); } };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [openId, guideId]);
  useEffect(() => { document.querySelector(".eng-reader")?.scrollTo(0, 0); }, [openId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("eng-theme");
      if (saved === "light" || saved === "dark") setTheme(saved);
      else if (window.matchMedia("(prefers-color-scheme: light)").matches) setTheme("light");
    } catch {}
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("eng-theme", next); } catch {}
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) => [b.name, b.short, b.subjects, b.careers].join(" ").toLowerCase().includes(q));
  }, [query]);
  const current = branches.find((b) => b.id === active) ?? branches[0];
  const CurIcon = current.icon;

  const navItems: [string, string][] = [["Branches", "#branches"], ["Articles", "#articles"], ["AI & Future", "#ai"], ["Dhirendra", "#founder"]];

  return (
    <main className={`eng ${theme === "light" ? "eng-light" : "eng-dark"}`}>
      <EngineeringStyles />
      <div className="eng-bg" aria-hidden><div className="eng-orb eng-orb-a" /><div className="eng-orb eng-orb-b" /><div className="eng-grid" /></div>

      <header className="eng-header">
        <nav className="eng-card eng-nav">
          <Link to="/" className="eng-brand">
            <span className="eng-logo"><BookOpen size={18} /></span>
            <span><b>JEE Prep Hub</b><small>Engineering</small></span>
          </Link>
          <div className="eng-links">{navItems.map(([l, h]) => <a key={h} href={h} className="eng-link">{l}</a>)}</div>
          <div className="eng-actions">
            <a href="#branches" className="eng-icon" aria-label="Search branches"><Search size={16} /></a>
            <button onClick={toggle} className="eng-icon" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/app" className="eng-btn eng-btn-sm eng-hide-sm">JEE Prep Hub <ArrowRight size={14} /></Link>
            <button onClick={() => setMenu(!menu)} className="eng-icon eng-only-sm" aria-label="Menu">{menu ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </nav>
        {menu && (
          <div className="eng-card eng-mobile-menu">
            {navItems.map(([l, h]) => <a key={h} href={h} onClick={() => setMenu(false)} className="eng-link">{l}</a>)}
            <Link to="/app" className="eng-link">Open JEE Prep Hub</Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="eng-wrap eng-pad">
        <div className="eng-hero">
          <div className="eng-hero-shade" />
          <div className="eng-hero-body">
            <p className="eng-kicker">Explore · Understand · Build · Imagine</p>
            <h1 className="eng-title">ENGINEERING</h1>
            <p className="eng-sub">The JEE Prep Hub Journal</p>
            <p className="eng-lead">A deep exploration of engineering, coding, artificial intelligence, systems, science, emerging technologies, careers and the future — written to help curious minds understand how the world is built.</p>
            <div className="eng-row">
              <a href="#branches" className="eng-btn eng-btn-primary"><Sparkles size={16} /> Explore branches <ArrowRight size={16} /></a>
              <a href="#articles" className="eng-btn"><BookOpen size={16} /> Read articles</a>
            </div>
            <div className="eng-stats">
              {[["12", "Branches"], ["Coding", "Guides"], ["AI", "Research"], ["Future", "Perspectives"]].map(([v, l]) => (
                <div key={l} className="eng-card eng-stat"><b>{v}</b><small>{l}</small></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Branch explorer */}
      <section id="branches" className="eng-wrap eng-section">
        <Heading icon={<Network size={16} />} eyebrow="All branches" title="Find your engineering branch" text="Pick a branch to see what it covers, the subjects you will study, careers, emerging areas and how to get in through JEE." />
        <label className="eng-search">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a branch, subject or career" aria-label="Search branches" />
          {query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}
        </label>

        <div className="eng-explorer">
          <div className="eng-branch-list" role="tablist" aria-label="Engineering branches">
            {filtered.map((b) => {
              const I = b.icon;
              return (
                <button key={b.id} role="tab" aria-selected={b.id === active} onClick={() => { setActive(b.id); setTab("subjects"); if (window.innerWidth < 900) window.setTimeout(() => document.getElementById("eng-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60); }}
                  className={`eng-card eng-branch ${b.id === active ? "is-active" : ""}`}>
                  <span className="eng-ico"><I size={18} /></span>
                  <span><b>{b.name}</b><small>{b.short}</small></span>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="eng-muted">No branch matches “{query}”. Try a subject like “circuits” or a career like “data”.</p>}
          </div>

          <div id="eng-detail" className="eng-card eng-detail" aria-live="polite">
            <div className="eng-detail-head">
              <span className="eng-ico eng-ico-lg"><CurIcon size={22} /></span>
              <div><h3>{current.name}</h3><p className="eng-muted">{current.about}</p></div>
            </div>
            <div className="eng-tabs" role="tablist">
              {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`eng-tab ${tab === k ? "is-active" : ""}`}>{l}</button>)}
            </div>
            {tab === "jee" ? (
              <p className="eng-jee">{current.jee}</p>
            ) : (
              <ul className="eng-chips">{list(current[tab]).map((x) => <li key={x} className="eng-chip">{x}</li>)}</ul>
            )}
            <button onClick={() => setGuideId(current.id)} className="eng-btn eng-btn-primary eng-guide-btn"><BookOpen size={16} /> Read the full {current.name} guide</button>
            <p className="eng-note">Seat availability and cutoffs change every year. Check the official JoSAA counselling data before you decide.</p>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section id="articles" className="eng-wrap eng-section">
        <Heading icon={<BookOpen size={16} />} eyebrow="The journal" title="Explore engineering" text="Long-form articles, technical explainers and future perspectives." />
        <div className="eng-grid3">
          {articles.map((a) => {
            const I = a.icon;
            return (
              <article key={a.title} className="eng-card eng-article">
                <div className="eng-between"><span className="eng-ico"><I size={18} /></span><span className="eng-tag">{a.category}</span></div>
                <h3>{a.title}</h3>
                <p className="eng-muted">{a.description}</p>
                <div className="eng-between eng-foot"><small className="eng-muted">{a.read}</small><span className="eng-footr"><button className={"eng-heart" + (likes.includes("a-" + a.id) ? " is-liked" : "")} aria-pressed={likes.includes("a-" + a.id)} aria-label="Like article" onClick={() => toggleLike("a-" + a.id)}><Heart size={18} fill={likes.includes("a-" + a.id) ? "currentColor" : "none"} /></button><button onClick={() => setOpenId(a.id)} className="eng-read">Read article <ArrowRight size={14} /></button></span></div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Coding + AI */}
      <section id="coding" className="eng-wrap eng-section">
        <div className="eng-card eng-panel eng-split">
          <div>
            <Heading icon={<Code2 size={16} />} eyebrow="Coding" title="Every engineer now writes code" text="Mechanical engineers simulate, civil engineers model, chemical engineers optimise — all with programs. Start with Python, learn to read documentation, and build small tools for problems you actually have." />
          </div>
          <pre className="eng-code" aria-label="Example code"><code>{`# Beam deflection, in five lines
E, I, L, P = 200e9, 8e-6, 3.0, 5000
def deflection(x):
    return P * x**2 * (3*L - x) / (6*E*I)
print(deflection(L))  # tip deflection (m)`}</code></pre>
        </div>
      </section>

      <section id="ai" className="eng-wrap eng-section">
        <div className="eng-card eng-panel eng-split">
          <div>
            <Heading icon={<BrainCircuit size={16} />} eyebrow="AI & agents" title="From chat to systems that act" text="AI agents plan, call tools, observe results and verify them. They speed up engineering work, but a human still owns the requirements, the checks and the responsibility." />
          </div>
          <div className="eng-flow">
            {["Human goal", "AI planner", "Tool selection", "Action", "Observation", "Verification"].map((n, i, a) => (
              <div key={n}><div className="eng-node"><i />{n}</div>{i < a.length - 1 && <ArrowDown size={14} className="eng-arrow" />}</div>
            ))}
          </div>
        </div>
        <div className="eng-grid3 eng-mt">
          {[[BrainCircuit, "Generative AI", "How modern models produce text, code, images and audio, and why that changes engineering work."],
            [Network, "AI agents", "Systems that plan, use tools, observe results and run multi-step workflows."],
            [ShieldCheck, "AI limitations", "Hallucination, security, privacy, bias and why human verification still matters."]].map(([I, t, d]: any) => (
            <div key={t} className="eng-card eng-article"><span className="eng-ico"><I size={18} /></span><h3>{t}</h3><p className="eng-muted">{d}</p></div>
          ))}
        </div>
      </section>

      {/* Future */}
      <section id="future" className="eng-wrap eng-section">
        <div className="eng-card eng-panel">
          <Heading icon={<Rocket size={16} />} eyebrow="The future" title="What happens when engineering becomes intelligent?" text="Software, AI, robotics, materials, biology and energy are converging. These are scenarios, not predictions." />
          <div className="eng-grid3 eng-mt">
            {[["2030", "AI-augmented engineering", "Engineers work alongside AI for coding, simulation, research and design."],
              ["2040", "Autonomous systems", "More systems sense, reason and adapt with limited human intervention."],
              ["2050", "Engineering convergence", "Software, biology, energy and materials operate as connected disciplines."]].map(([y, t, d]) => (
              <div key={y} className="eng-card eng-article"><b className="eng-accent">{y}</b><h3>{t}</h3><p className="eng-muted">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* Mindset */}
      <section className="eng-wrap eng-section">
        <div className="eng-card eng-panel">
          <Heading icon={<Lightbulb size={16} />} eyebrow="Mindset" title="Engineering begins with better questions" text="Ask these before you build anything." />
          <div className="eng-grid2 eng-mt">
            {["What problem are we solving?", "What constraints exist?", "What assumptions are we making?", "What could fail?", "How will we test it?", "How will we measure success?", "What are the trade-offs?", "Should we build it at all?"].map((q, i) => (
              <div key={q} className="eng-card eng-q"><small className="eng-accent">{String(i + 1).padStart(2, "0")}</small><span>{q}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section id="founder" className="eng-wrap eng-section">
        <div className="eng-card eng-panel eng-founder">
          <img src="/founder-dhirendra-profile.jpg" alt="Dhirendra Kumar" className="eng-photo" />
          <div>
            <Heading icon={<GraduationCap size={16} />} eyebrow="About the founder" title="Dhirendra Kumar" text="JEE Prep Hub began as an attempt to build useful tools for students. The Engineering Journal extends that idea into the wider world of engineering, software, AI and science. It documents what I learn, build, break and discover." />
            <ul className="eng-chips">{["Building", "Learning", "Engineering", "AI", "Technology", "Future"].map((x) => <li key={x} className="eng-chip">{x}</li>)}</ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="eng-wrap eng-section eng-center">
        <div className="eng-card eng-panel">
          <UserRound className="eng-accent" size={26} />
          <h2>Explore. Understand. Build.</h2>
          <p className="eng-muted">Ask questions, understand systems, test ideas and make things that did not exist before.</p>
          <div className="eng-row eng-row-c">
            <a href="#branches" className="eng-btn eng-btn-primary">Explore branches <ArrowRight size={16} /></a>
            <Link to="/app" className="eng-btn">Open JEE Prep Hub</Link>
          </div>
        </div>
      </section>

      {toast && <div className="eng-toast" role="status">{toast}</div>}

      {guide && (
        <div className="eng-reader" role="dialog" aria-modal="true" aria-label={guide.name + " guide"} onClick={() => setGuideId(null)}>
          <article className="eng-card eng-reader-box" onClick={(e) => e.stopPropagation()}>
            <div className="eng-between">
              <span className="eng-tag">Branch guide</span>
              <button onClick={() => setGuideId(null)} className="eng-icon" aria-label="Close guide"><X size={16} /></button>
            </div>
            <h2>{guide.name}</h2>
            <p className="eng-muted eng-by">{guide.short}</p>
            {deep[guide.id].map(([h, t]) => (<div key={h}><h3 className="eng-gh">{h}</h3><p className="eng-para">{t}</p></div>))}
            <h3 className="eng-gh">Four-year roadmap</h3>
            <ol className="eng-road">{more[guide.id].road.map((r, i) => <li key={i}><b>Year {i + 1}</b><span>{r}</span></li>)}</ol>
            <h3 className="eng-gh">Tools you will use</h3>
            <ul className="eng-chips">{list(more[guide.id].tools).map((x) => <li key={x} className="eng-chip">{x}</li>)}</ul>
            <h3 className="eng-gh">Who it suits</h3>
            <p className="eng-para">{more[guide.id].suits}</p>
            <h3 className="eng-gh">Future prospects</h3>
            {outlook[guide.id].prospects.map((t, i) => <p key={i} className="eng-para">{t}</p>)}
            <h3 className="eng-gh">Benefits of choosing this branch</h3>
            <ul className="eng-bene">{outlook[guide.id].benefits.map((b) => <li key={b}>{b}</li>)}</ul>
            <h3 className="eng-gh">Things to watch</h3>
            <p className="eng-para">{outlook[guide.id].watch}</p>
            <h3 className="eng-gh">Watch on YouTube</h3>
            {videoIds[guide.id] && (
              <div className="eng-video"><iframe src={"https://www.youtube-nocookie.com/embed/" + videoIds[guide.id]} title={guide.name + " video"} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen /></div>
            )}
            <ul className="eng-chips">
              {[["What is it?", guide.name + " what is it"], ["Career scope in India", guide.name + " career scope India"], ["Syllabus and subjects", guide.name + " syllabus subjects"], ["Day in the life", guide.name + " engineer day in the life"]].map(([l, q]) => (
                <li key={l}><a className="eng-chip eng-yt" href={ytUrl(q)} target="_blank" rel="noopener noreferrer">▶ {l}</a></li>
              ))}
            </ul>
            <p className="eng-note">Good channels to start with:</p>
            <ul className="eng-chips">{list(channels[guide.id]).map((c) => <li key={c}><a className="eng-chip eng-yt" href={ytUrl(c)} target="_blank" rel="noopener noreferrer">{c}</a></li>)}</ul>
            <h3 className="eng-gh">Subjects at a glance</h3>
            <ul className="eng-chips">{list(guide.subjects).map((x) => <li key={x} className="eng-chip">{x}</li>)}</ul>
            <h3 className="eng-gh">Careers at a glance</h3>
            <ul className="eng-chips">{list(guide.careers).map((x) => <li key={x} className="eng-chip">{x}</li>)}</ul>
            <h3 className="eng-gh">Getting in through JEE</h3>
            <p className="eng-para">{guide.jee}</p>
            {actionBar("g-" + guide.id, guide.name + " guide")}
          </article>
        </div>
      )}

      {openIdx >= 0 && (
        <div className="eng-reader" role="dialog" aria-modal="true" aria-label={articles[openIdx].title} onClick={() => setOpenId(null)}>
          <article className="eng-card eng-reader-box" onClick={(e) => e.stopPropagation()}>
            <div className="eng-between">
              <span className="eng-tag">{articles[openIdx].category} · {articles[openIdx].read}</span>
              <button onClick={() => setOpenId(null)} className="eng-icon" aria-label="Close article"><X size={16} /></button>
            </div>
            <h2>{articles[openIdx].title}</h2>
            <p className="eng-muted eng-by">By Dhirendra Kumar · JEE Prep Hub Engineering Journal</p>
            {bodies[articles[openIdx].id].map((para, i) => <p key={i} className="eng-para">{para}</p>)}
            {extra[articles[openIdx].id].sections.map(([h, t]) => (<div key={h}><h3 className="eng-gh">{h}</h3><p className="eng-para">{t}</p></div>))}
            <h3 className="eng-gh">Key takeaways</h3>
            <ul className="eng-bene">{extra[articles[openIdx].id].takeaways.map((k) => <li key={k}>{k}</li>)}</ul>
            <h3 className="eng-gh">Related branch guides</h3>
            <ul className="eng-chips">{extra[articles[openIdx].id].related.map((id) => { const b = branches.find((x) => x.id === id)!; return (<li key={id}><button className="eng-chip eng-yt" onClick={() => { setOpenId(null); setGuideId(id); }}>{b.name}</button></li>); })}</ul>
            <div className="eng-between eng-pager">
              <button disabled={openIdx === 0} onClick={() => setOpenId(articles[openIdx - 1].id)} className="eng-btn eng-btn-sm">Previous</button>
              <button disabled={openIdx === articles.length - 1} onClick={() => setOpenId(articles[openIdx + 1].id)} className="eng-btn eng-btn-sm">Next</button>
            </div>
            {actionBar("a-" + articles[openIdx].id, articles[openIdx].title)}
          </article>
        </div>
      )}

      <footer className="eng-footer">
        <div className="eng-wrap eng-between eng-wrapflex">
          <div><b>JEE Prep Hub Engineering</b><br /><small className="eng-muted">The Engineering Journal · By Dhirendra Kumar</small></div>
          <div className="eng-row">{navItems.map(([l, h]) => <a key={h} href={h} className="eng-link">{l}</a>)}</div>
        </div>
      </footer>
    </main>
  );
}

function Heading({ icon, eyebrow, title, text }: { icon: React.ReactNode; eyebrow: string; title: string; text: string }) {
  return (
    <div className="eng-heading">
      <span className="eng-eyebrow">{icon}{eyebrow}</span>
      <h2>{title}</h2>
      <p className="eng-muted">{text}</p>
    </div>
  );
}

function EngineeringStyles() {
  return (
    <style>{`
      html { scroll-behavior: smooth; }
      .eng { --bg:#05080f; --fg:#f1f5f9; --mu:#a3b1c6; --card:rgba(255,255,255,.06); --card2:rgba(255,255,255,.1);
        --line:rgba(255,255,255,.13); --ac:#67e8f9; --ac2:#818cf8; --btn:#f8fafc; --btnfg:#0b1220; --shadow:0 20px 70px rgba(0,0,0,.35);
        --hi:rgba(255,255,255,.2); --lo:rgba(255,255,255,.02); --rim:rgba(255,255,255,.38); --glow:rgba(103,232,249,.16); --shade:linear-gradient(180deg,rgba(5,8,15,.55),rgba(5,8,15,.92)); --imgo:.55; --code:#0b1220; --codefg:#a5f3fc;
        position:relative; min-height:100vh; overflow-x:hidden; background:var(--bg); color:var(--fg); font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; line-height:1.5; }
      .eng-light { --bg:#f3f7fb; --fg:#0f172a; --mu:#475569; --card:rgba(255,255,255,.55); --card2:#ffffff;
        --line:rgba(15,23,42,.12); --ac:#0e7490; --ac2:#4338ca; --btn:#0f172a; --btnfg:#ffffff; --shadow:0 18px 50px rgba(15,23,42,.09);
        --hi:rgba(255,255,255,.95); --lo:rgba(255,255,255,.3); --rim:#fff; --glow:rgba(14,116,144,.12); --shade:linear-gradient(180deg,rgba(243,247,251,.7),rgba(243,247,251,.96)); --imgo:.28; --code:#e2e8f0; --codefg:#0f172a; }
      .eng * { box-sizing:border-box; }
      :where(.eng a) { color:inherit; text-decoration:none; }
      .eng h1,.eng h2,.eng h3,.eng p,.eng ul { margin:0; padding:0; }
      :where(.eng button) { font:inherit; color:inherit; cursor:pointer; }
      .eng :focus-visible { outline:2px solid var(--ac); outline-offset:2px; }
      .eng-bg { position:fixed; inset:0; z-index:0; pointer-events:none; }
      .eng > :not(.eng-bg):not(style):not(.eng-reader):not(.eng-toast):not(.eng-header) { position:relative; z-index:1; }
      .eng-orb { position:absolute; border-radius:50%; filter:blur(80px); opacity:.34; animation:eng-drift 22s ease-in-out infinite alternate; }
      .eng-light .eng-orb { opacity:.24; }
      @keyframes eng-drift { to { transform:translate(40px,-30px) scale(1.12); } }
      .eng-orb-a { width:420px; height:420px; left:-160px; top:260px; background:#0891b2; }
      .eng-orb-b { animation-duration:28s; width:480px; height:480px; right:-200px; top:760px; background:#4f46e5; }
      .eng-grid { position:absolute; inset:0; opacity:.5;
        background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px); background-size:56px 56px;
        -webkit-mask-image:linear-gradient(180deg,#000,transparent 80%); mask-image:linear-gradient(180deg,#000,transparent 80%); }
      .eng-card { position:relative; isolation:isolate; background:linear-gradient(145deg,var(--hi),var(--lo) 55%),var(--card); border:1px solid var(--line);
        border-radius:20px; backdrop-filter:blur(26px) saturate(180%) brightness(1.04); -webkit-backdrop-filter:blur(26px) saturate(180%) brightness(1.04);
        box-shadow:inset 0 1px 0 var(--rim), inset 0 -1px 0 var(--line), inset 0 0 28px var(--glow), var(--shadow); }
      .eng-card::before { content:""; position:absolute; inset:0; z-index:-1; border-radius:inherit; pointer-events:none;
        background:radial-gradient(120% 70% at 12% -10%,var(--hi),transparent 55%),radial-gradient(80% 60% at 100% 110%,var(--glow),transparent 60%); }
      .eng-card::after { content:""; position:absolute; top:0; left:12%; right:12%; height:1px; z-index:-1; pointer-events:none; background:linear-gradient(90deg,transparent,var(--rim),transparent); }
      .eng-muted { color:var(--mu); }
      .eng-accent { color:var(--ac); }
      .eng-wrap { max-width:1180px; margin:0 auto; padding-left:16px; padding-right:16px; }
      .eng-section { padding-top:56px; padding-bottom:24px; scroll-margin-top:88px; }
      .eng-pad { padding-top:28px; }
      .eng-between { display:flex; align-items:center; justify-content:space-between; gap:12px; }
      .eng-wrapflex { flex-wrap:wrap; padding-top:32px; padding-bottom:32px; }
      .eng-row { display:flex; flex-wrap:wrap; gap:12px; }
      .eng-row-c { justify-content:center; margin-top:28px; }
      .eng-center { text-align:center; }
      .eng-mt { margin-top:28px; }

      /* Header */
      .eng-header { position:sticky; top:0; z-index:50; padding:12px 12px 0; }
      .eng-nav { display:flex; align-items:center; justify-content:space-between; gap:12px; max-width:1180px; margin:0 auto; padding:10px 14px; border-radius:18px; }
      .eng-brand { display:flex; align-items:center; gap:10px; }
      .eng-brand b { display:block; font-size:.9rem; }
      .eng-brand small { display:block; font-size:.68rem; color:var(--mu); letter-spacing:.14em; text-transform:uppercase; }
      .eng-logo, .eng-ico { display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:12px; background:var(--card2); border:1px solid var(--line); color:var(--ac); flex:none; }
      .eng-ico-lg { width:48px; height:48px; border-radius:16px; }
      .eng-links { display:none; gap:22px; }
      .eng-link { color:var(--mu); font-size:.88rem; transition:color .15s; }
      .eng-link:hover { color:var(--fg); }
      .eng-actions { display:flex; align-items:center; gap:8px; }
      .eng-icon { display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:12px; border:1px solid var(--line); background:var(--card2); color:var(--fg); }
      .eng-mobile-menu { display:flex; flex-direction:column; gap:2px; max-width:1180px; margin:8px auto 0; padding:8px; border-radius:18px; }
      .eng-mobile-menu .eng-link { padding:12px 14px; border-radius:12px; }
      .eng-mobile-menu .eng-link:hover { background:var(--card2); }
      .eng-hide-sm { display:none !important; }

      /* Buttons */
      .eng-btn { box-shadow:inset 0 1px 0 var(--rim); backdrop-filter:blur(14px) saturate(160%); -webkit-backdrop-filter:blur(14px) saturate(160%); display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:12px 20px; border-radius:999px; border:1px solid var(--line); background:var(--card2); color:var(--fg); font-weight:600; font-size:.9rem; transition:transform .15s; }
      .eng-btn:hover { transform:translateY(-2px); }
      .eng-btn-primary { box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 8px 24px var(--glow); background:var(--btn); color:var(--btnfg); border-color:transparent; }
      .eng-btn-sm { padding:8px 14px; font-size:.8rem; }

      /* Hero */
      .eng-hero { position:relative; overflow:hidden; border-radius:28px; border:1px solid var(--line); background:var(--card); box-shadow:var(--shadow); }
      .eng-hero-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:var(--imgo); }
      .eng-hero-shade { position:absolute; inset:0; background:radial-gradient(70% 60% at 85% 0%,var(--glow),transparent 70%),radial-gradient(60% 50% at 0% 100%,rgba(129,140,248,.2),transparent 70%); }
      .eng-hero-body { position:relative; padding:44px 20px 24px; }
      .eng-kicker { font-size:.72rem; font-weight:600; letter-spacing:.22em; text-transform:uppercase; color:var(--ac); }
      .eng-title { margin-top:18px !important; font-size:clamp(2.1rem,12vw,5.5rem); font-weight:800; letter-spacing:-.05em; line-height:.95;
        background:linear-gradient(100deg,var(--fg) 10%,var(--ac) 55%,var(--ac2)); -webkit-background-clip:text; background-clip:text; color:transparent; }
      .eng-sub { margin-top:14px !important; font-size:1.15rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; }
      .eng-lead { margin-top:18px !important; max-width:640px; color:var(--mu); font-size:1rem; line-height:1.8; }
      .eng-hero .eng-row { margin-top:26px; }
      .eng-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-top:34px; }
      .eng-stat { padding:14px 16px; border-radius:16px; }
      .eng-stat b { display:block; font-size:.95rem; }
      .eng-stat small { display:block; margin-top:2px; font-size:.7rem; letter-spacing:.16em; text-transform:uppercase; color:var(--mu); }

      /* Headings */
      .eng-heading { max-width:720px; }
      .eng-eyebrow { display:inline-flex; align-items:center; gap:8px; font-size:.72rem; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--ac); }
      .eng-heading h2 { margin-top:12px; font-size:clamp(1.7rem,5.5vw,2.8rem); font-weight:700; letter-spacing:-.03em; line-height:1.1; }
      .eng-heading p { margin-top:14px; line-height:1.8; }
      .eng-center .eng-panel h2 { font-size:clamp(1.7rem,5.5vw,2.8rem); margin-top:18px; letter-spacing:-.03em; }
      .eng-center .eng-panel p { max-width:560px; margin:14px auto 0; line-height:1.8; }

      /* Explorer */
      .eng-search { display:flex; align-items:center; gap:10px; margin-top:26px; max-width:520px; padding:0 14px; height:48px; border-radius:14px; border:1px solid var(--line); background:var(--card); color:var(--mu); }
      .eng-search input { flex:1; min-width:0; height:100%; background:transparent; border:0; outline:0; color:var(--fg); font:inherit; font-size:.92rem; }
      .eng-search button { background:none; border:0; display:flex; }
      .eng-explorer { display:grid; gap:16px; margin-top:20px; }
      .eng-branch-list { display:grid; gap:10px; align-content:start; }
      .eng-branch { display:flex; align-items:center; gap:12px; width:100%; padding:12px 14px; text-align:left; border-radius:16px; transition:border-color .15s, background .15s; }
      .eng-branch b { display:block; font-size:.92rem; }
      .eng-branch small { display:block; margin-top:2px; font-size:.78rem; color:var(--mu); line-height:1.4; }
      .eng-branch:hover { border-color:var(--ac); }
      .eng-branch.is-active { border-color:var(--ac); background:var(--card2); box-shadow:0 0 0 1px var(--ac) inset; }
      .eng-detail { padding:22px; align-self:start; }
      .eng-detail-head { display:flex; gap:14px; align-items:flex-start; }
      .eng-detail h3 { font-size:1.35rem; letter-spacing:-.02em; }
      .eng-detail-head p { margin-top:6px; font-size:.92rem; line-height:1.7; }
      .eng-tabs { display:flex; flex-wrap:wrap; gap:8px; margin-top:22px; }
      .eng-tab { padding:8px 14px; border-radius:999px; border:1px solid var(--line); background:transparent; font-size:.82rem; font-weight:600; color:var(--mu); }
      .eng-tab.is-active { background:var(--btn); color:var(--btnfg); border-color:transparent; }
      .eng-chips { display:flex; flex-wrap:wrap; gap:8px; list-style:none; margin-top:18px !important; }
      .eng-chip { box-shadow:inset 0 1px 0 var(--rim); padding:8px 13px; border-radius:12px; border:1px solid var(--line); background:var(--card2); font-size:.84rem; }
      .eng-jee { margin-top:18px !important; line-height:1.8; font-size:.95rem; }
      .eng-note { margin-top:22px !important; font-size:.75rem; color:var(--mu); border-top:1px solid var(--line); padding-top:14px; }

      /* Cards & grids */
      .eng-grid3 { display:grid; gap:16px; margin-top:32px; }
      .eng-mt.eng-grid3 { margin-top:28px; }
      .eng-grid2 { display:grid; gap:10px; }
      .eng-article { padding:22px; transition:transform .15s, border-color .15s; }
      .eng-article:hover { transform:translateY(-3px); border-color:var(--ac); }
      .eng-article h3 { margin-top:20px; font-size:1.1rem; letter-spacing:-.01em; }
      .eng-article p { margin-top:8px; font-size:.88rem; line-height:1.7; }
      .eng-tag { font-size:.7rem; font-weight:600; padding:4px 10px; border-radius:999px; border:1px solid var(--line); color:var(--ac); }
      .eng-foot { margin-top:20px; padding-top:14px; border-top:1px solid var(--line); font-size:.8rem; }
      .eng-panel { padding:24px; border-radius:28px; }
      .eng-split { display:grid; gap:24px; align-items:center; }
      .eng-code { margin:0; padding:18px; overflow-x:auto; border-radius:16px; border:1px solid var(--line); background:var(--code); color:var(--codefg); font:.8rem/1.7 ui-monospace,SFMono-Regular,Menlo,monospace; }
      .eng-flow { display:flex; flex-direction:column; gap:6px; padding:18px; border:1px solid var(--line); border-radius:20px; background:var(--card2); }
      .eng-node { display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:12px; border:1px solid var(--line); background:var(--card); font-size:.85rem; }
      .eng-node i { width:8px; height:8px; border-radius:50%; background:var(--ac); box-shadow:0 0 12px var(--ac); }
      .eng-arrow { display:block; margin:4px auto 0; color:var(--ac); opacity:.7; }
      .eng-q { display:flex; gap:14px; align-items:flex-start; padding:14px 16px; border-radius:14px; box-shadow:none; font-size:.9rem; }
      .eng-founder { display:grid; gap:28px; align-items:center; }
      .eng-photo { width:100%; max-width:280px; aspect-ratio:1/1; object-fit:cover; border-radius:24px; border:1px solid var(--line); margin:0 auto; background:var(--card2); }
      .eng-center h2 { margin-top:18px; }
      .eng-footer { margin-top:48px; border-top:1px solid var(--line); }

      @media (min-width:640px) {
        .eng-wrap { padding-left:24px; padding-right:24px; }
        .eng-hide-sm { display:inline-flex !important; }
        .eng-only-sm { display:none !important; }
        .eng-hero-body { padding:64px 40px 32px; }
        .eng-stats { grid-template-columns:repeat(4,1fr); }
        .eng-grid3 { grid-template-columns:repeat(2,1fr); }
        .eng-grid2 { grid-template-columns:repeat(2,1fr); }
        .eng-panel { padding:40px; }
      }
      @media (min-width:900px) {
        .eng-links { display:flex; }
        .eng-hero-body { padding:90px 64px 40px; }
        .eng-grid3 { grid-template-columns:repeat(3,1fr); }
        .eng-explorer { grid-template-columns:minmax(300px,380px) 1fr; }
        .eng-detail { position:sticky; top:96px; padding:30px; }
        .eng-split { grid-template-columns:1.1fr 1fr; }
        .eng-founder { grid-template-columns:280px 1fr; }
      }
      .eng-read { display:inline-flex; align-items:center; gap:6px; background:none; border:0; padding:0; font-weight:600; color:var(--ac); }
      .eng-reader { position:fixed; inset:0; z-index:100; display:flex; align-items:flex-start; justify-content:center; padding:12px; overflow-y:auto; background:rgba(2,6,15,.72); backdrop-filter:blur(6px); }
      .eng-reader-box { width:100%; max-width:720px; margin:12px auto; padding:22px; background:var(--bg); border-radius:24px; }
      .eng-reader-box h2 { margin-top:18px; font-size:clamp(1.6rem,6vw,2.4rem); letter-spacing:-.03em; line-height:1.15; }
      .eng-by { margin-top:10px !important; font-size:.82rem; }
      .eng-para { margin-top:18px !important; font-size:1.02rem; line-height:1.85; }
      .eng-pager { margin-top:32px; padding-top:18px; border-top:1px solid var(--line); }
      .eng-road { list-style:none; margin:16px 0 0 !important; padding:0 0 0 18px !important; border-left:1px solid var(--line); display:grid; gap:14px; }
      .eng-road li { position:relative; display:grid; gap:2px; font-size:.95rem; line-height:1.7; }
      .eng-road li::before { content:""; position:absolute; left:-24px; top:9px; width:11px; height:11px; border-radius:50%; background:var(--ac); box-shadow:0 0 12px var(--ac); }
      .eng-road b { color:var(--ac); font-size:.82rem; }
      .eng-bene { list-style:none; margin:14px 0 0 !important; display:grid; gap:8px; }
      .eng-bene li { position:relative; padding:10px 14px 10px 38px; border:1px solid var(--line); border-radius:14px; background:var(--card2); font-size:.93rem; }
      .eng-bene li::before { content:"✓"; position:absolute; left:14px; top:10px; color:var(--ac); font-weight:700; }
      .eng-yt { display:inline-block; color:var(--fg); }
      .eng-yt:hover { border-color:var(--ac); }
      .eng-video { position:relative; aspect-ratio:16/9; margin-top:14px; overflow:hidden; border-radius:18px; border:1px solid var(--line); background:#000; }
      .eng-video iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }
      .eng-guide-btn { margin-top:22px; width:100%; }
      .eng-gh { margin-top:28px !important; font-size:1.15rem; letter-spacing:-.01em; color:var(--ac); }
      .eng-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; }
      @media (min-width:640px) { .eng-reader-box { padding:36px; } .eng-reader { padding:32px; } }
      .eng-heart { display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:14px; border:1px solid var(--line); background:var(--card2); color:var(--mu); }
      .eng-heart.is-liked, .eng-act.is-liked { color:#f43f5e; border-color:#f43f5e; }
      .eng-footr { display:flex; align-items:center; gap:10px; }
      .eng-actionbar { position:sticky; bottom:calc(12px + env(safe-area-inset-bottom,0px)); z-index:3; display:flex; gap:10px; margin-top:28px; padding:8px; border-radius:20px; border:1px solid var(--line); background:var(--bg); box-shadow:var(--shadow); }
      .eng-act { flex:1; min-height:48px; display:inline-flex; align-items:center; justify-content:center; gap:8px; border-radius:14px; border:1px solid var(--line); background:var(--card2); font-weight:600; font-size:.92rem; }
      .eng-sharemenu { position:absolute; left:0; right:0; bottom:calc(100% + 10px); display:grid; gap:2px; padding:8px; background:var(--bg); }
      .eng-sharemenu a, .eng-sharemenu button { display:flex; align-items:center; gap:12px; min-height:48px; padding:0 14px; border-radius:12px; border:0; background:transparent; text-align:left; color:var(--fg); font-size:.95rem; }
      .eng-sharemenu a:hover, .eng-sharemenu button:hover { background:var(--card2); }
      .eng-toast { position:fixed; left:50%; bottom:calc(92px + env(safe-area-inset-bottom,0px)); transform:translateX(-50%); z-index:200; padding:12px 18px; border-radius:999px; background:var(--btn); color:var(--btnfg); font-size:.88rem; font-weight:600; box-shadow:var(--shadow); max-width:90vw; text-align:center; }
      #eng-detail { scroll-margin-top:92px; }
      @media (max-width:899px) {
        .eng-branch-list { display:flex; overflow-x:auto; scroll-snap-type:x mandatory; gap:10px; padding:2px 2px 10px; -webkit-overflow-scrolling:touch; }
        .eng-branch { flex:0 0 82%; scroll-snap-align:start; }
      }
      @media (max-width:639px) {
        .eng-icon { width:44px; height:44px; }
        .eng-btn, .eng-tab { min-height:44px; }
        .eng-header { padding-top:calc(8px + env(safe-area-inset-top,0px)); }
        .eng-reader { padding:0; }
        .eng-reader-box { margin:0; min-height:100%; border-radius:0; border-left:0; border-right:0; padding:16px 16px 24px; }
        .eng-section { padding-top:44px; }
        .eng-hero { border-radius:22px; }
        .eng-hero-body .eng-row .eng-btn { width:100%; }
        .eng-detail, .eng-panel { padding:18px; border-radius:22px; }
        .eng-para { font-size:1rem; line-height:1.8; }
        .eng-chip { font-size:.82rem; }
      }
      @media (prefers-reduced-motion:reduce) {
        .eng-orb { animation:none; }
        html { scroll-behavior:auto; }
        .eng *, .eng *::before, .eng *::after { transition:none !important; }
      }
    `}</style>
  );
}
