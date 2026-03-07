import "dotenv/config";
import { db } from "./index";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

type OptimizationSuggestion = {
  segment_index: number;
  target_time_sec: number;
  reason: string;
  suggestion: string;
};

type HookMetrics = {
  hook_strength: number;
  cliffhanger_score: number;
  open_loops: number;
  threat_level: number;
};

type EpisodePlan = {
  title: string;
  segments: string[];
  dropPlan: number[];
  engagementPlan: number[];
  hookMetrics: HookMetrics;
  suggestions: OptimizationSuggestion[];
  continuityLedger: Record<string, unknown>;
  characterAppearances: string[];
  emotions?: string[];
};

const emotionCycle = [
  "fear",
  "curiosity",
  "nervousness",
  "surprise",
  "anger",
  "fear",
  "disapproval",
  "excitement",
  "realization",
];

const syndicateCharacters = [
  {
    name: "Kira",
    description: "Renegade hacker who refuses to be owned by the Syndicate",
    traits: ["relentless", "sarcastic", "loyal", "impatient"],
  },
  {
    name: "Director Solano",
    description: "Antagonist who weaponizes surveillance and cloned identities",
    traits: ["calculating", "charismatic", "ruthless"],
  },
  {
    name: "Echo",
    description: "AI companion that rides alongside Kira's neural link",
    traits: ["analytical", "protective", "wry"],
  },
  {
    name: "Remi",
    description: "Inside agent who straddles loyalty between Kira and the Syndicate",
    traits: ["resourceful", "guilty", "opportunistic"],
  },
];

const hollowMoonCharacters = [
  {
    name: "Wren",
    description: "Isolated astronaut documenting an anomaly on the lunar far side",
    traits: ["methodical", "sleep-deprived", "curious"],
  },
  {
    name: "The Shape",
    description: "Shifting entity that mimics voices over comms",
    traits: ["quiet", "menacing", "unreadable"],
  },
  {
    name: "Commander Vale",
    description: "Authority figure urging protocol while hiding classified orders",
    traits: ["rigid", "pragmatic", "secretive"],
  },
];

const zeroDaySegments = [
  "Kira traces a ghost signal through rain-slick alleys, neon shards bouncing off her visor as Solano's drones scan rooftops she cannot reach.",
  "Echo whispers telemetry, warning of a kill-switch embedded in the stolen drive strapped to Kira's chest and counting down in amber digits.",
  "Remi's encoded ping reroutes the city grid for nine seconds, enough for Kira to slip past a checkpoint while sweat pools beneath carbon fiber.",
  "A mirrored van idles, doors locked from inside; its windows project commercials, masking the barrel of a coilgun aiming straight through Kira's shoulder.",
  "She hurls a plasma flare, blinding the gunner, but a surveillance turret pivots from above and paints her in cyan targeting boxes.",
  "Echo reroutes streetlights to strobe, disorienting pursuers, yet the kill-switch timer plunges below twenty and her chest feels heavier with every step.",
  "Kira dives into an abandoned noodle bar, floor slick with broth, pulling cables from the drive while Solano's voice bleeds through the comm.",
  "He offers immunity if she surrenders the prototype, promising to rebuild her record, dangling a life where she's not a ghost in the system.",
  "Kira crushes the drive connector, rerouting power; the timer freezes at three, leaving her trembling in darkness, realizing Solano expected the sabotage.",
];

const ghostProtocolSegments = [
  "Director Solano hosts a broadcast claiming a rogue AI has corrupted the grid, while Kira watches from a safehouse, recognizing her stolen code behind the glitches.",
  "Echo overlays spectrograms revealing Solano seeded the panic to push emergency surveillance, granting him legal reach into every unpatched lens across the city.",
  "Remi intercepts an encrypted board meeting; a ghost user joins with Kira's old access badge, speaking her cadence, demanding authorization to purge dissidents.",
  "Kira's name flashes on bounty feeds; she shreds fake passports while Echo simulates her voice to flood the net with decoys buying precious minutes.",
  "The ghost identity buys ad space to apologize, weaponizing sincerity, pushing watchers to click a confession that implants Solano's tracking pixel.",
  "Kira taps Remi's clandestine uplink, injecting a counter-script that flips the confession pixel into a looped artifact, hiding watchers who click it.",
  "Solano realizes someone is rewriting his narrative; he deploys syndicate moderators armed with stun batons to knock on doors where the ghost voice sounds too real.",
  "Echo recommends going dark, but Kira steps onto a rooftop, broadcasting a raw feed of Solano's coercion, daring him to silence her live.",
  "The feed peaks; drones converge. Before the signal cuts, a child in the audience whispers 'I see you, Kira,' proving the ghost protocol woke real empathy.",
];

const blacksiteSegments = [
  "Kira descends freight elevators beneath the harbor, air thick with coolant, walls marked by old Syndicate logos crossed out by burned scorch lines.",
  "Echo maps the blacksite's heartbeat: turbines, sleeping guards, an unregistered server humming under a tarp like a caged predator hungry for electricity.",
  "Remi's backdoor opens a blast door, but a motion sensor notes Kira's pulse, broadcasting her stress to Solano's watch, a silent alarm without siren.",
  "She ducks behind cryo-crates, watching a technician test neural cuffs on volunteers promised debt forgiveness, their eyes flickering with synthetic dreams.",
  "Kira swaps a cuff with a dummy; the volunteer smiles, believing in freedom while the real shackle waits in Solano's pocket.",
  "An engineer drops a tablet; files show prototypes labeled MIRROR MIND, each tagged with Kira's neural signature as if she's property to be duplicated.",
  "Echo overlays her memories of childhood -- hacking orphanage cameras for privacy -- now seeing those skills repurposed to erase her autonomy forever.",
  "She plants an EMP pellet under the main server, promising to detonate after she escapes, a spiteful insurance policy against cloning her conscience.",
  "As she leaves, an untagged pod rattles; inside, a silhouette taps the glass in the same rhythm she used as a kid, a cloned self begging silently.",
];

const systemBreachSegments = [
  "Solano orders a citywide purge; firewalls spike, and public networks stall as syndicate engineers reroute everything through a single surveillance spine.",
  "Kira rides a maintenance drone along data cables, clip harness biting into her waist, Echo modulating her signature to blend with traffic.",
  "Remi injects counterfeit certificates, but the spine rejects them, locking him out; alarms screech as Kira's presence is flagged by anomaly detectors.",
  "Sudden latency slams every screen; red overlays flash as the spine prepares to quarantine districts, threatening brownouts for millions.",
  "Kira gambles, cutting fiber with a ceramic blade; sparks flare, but Echo reroutes civilian grids while leaving the surveillance stack starved of power.",
  "Solano overrides manual breakers, shouting orders; his team toggles backup relays that reignite the spine with unstable voltage and rolling blue arcs.",
  "Kira's harness slips; she dangles above open air, hands burning on cable insulation while alarms count down to a lethal voltage flush.",
  "Echo calculates a drop point; Kira lets go, smashing into a scaffold, bruised but alive, while the spine reboots with corrupted packets.",
  "The breach halts for thirty seconds -- enough; Remi uploads a truth archive about clone experiments before the spine isolates his signal permanently.",
];

const firewallSegments = [
  "Kira holes up in an abandoned library, turning stacks into barricades while Echo scans the airwaves for remaining safe nodes.",
  "Remi arrives with analog schematics, revealing Syndicate firewalls have human moderators who can be bribed or flooded with false positives.",
  "They craft a decoy narrative about a rival gang to distract moderators, buying time to re-route aid to neighborhoods cut off by the purge.",
  "A neighborhood kid delivers battery packs and questions Kira about being a hero; she deflects, fearing myths will make her predictable.",
  "Echo detects Solano's analysts mirroring their decoy, anticipating the next move; the firewall learns fast, adapting to their patterns.",
  "Kira pivots, releasing analog zines teaching citizens to spoof IDs; the grassroots noise overwhelms moderators and cracks appear.",
  "Remi warns that chaos could harm innocents; Kira weighs damage against being hunted, choosing to risk messy freedom over silent obedience.",
  "Solano files legal injunctions; printed notices flutter through streets but citizens use them as kindling for improvised heaters.",
  "The firewall buckles, leaving Syndicate logs full of contradictions; Kira whispers an apology to those caught in the crossfire.",
];

const moleSegments = [
  "Remi confesses to being Solano's inside agent, his voice shaking as Kira locks the door behind him.",
  "He explains the assignment: gain her trust, feed Echo's telemetry back to Solano, and deliver her alive to the cloning lab.",
  "Kira's hands tremble between rage and relief; she reroutes Echo's outputs to a dead circuit while she decides his fate.",
  "Remi insists he sabotaged Solano's code to buy her minutes, claiming the trust is real now that lines blurred.",
  "Echo cross-checks logs, confirming small, deliberate errors that helped Kira escape twice.",
  "Kira forces Remi to broadcast a false surrender, luring Solano's strike team toward a decoy location.",
  "Remi agrees, voice cracking, knowing this may burn any return to the Syndicate payroll.",
  "The broadcast works; strike teams converge elsewhere while Kira keeps Remi under watch, unsure if redemption outweighs betrayal.",
  "In quiet aftermath, Kira stares at Remi's shaking hands, acknowledging she too once traded loyalties to survive.",
];

const deadDropSegments = [
  "Echo identifies a dead drop hidden in a subway mosaic, instructions etched in ultraviolet glaze only visible under specific train lights.",
  "Kira times the train's arrival; she snaps photos as the carriage passes, revealing coordinates for a Syndicate cash cache.",
  "A rival crew already waits, masks painted like wolves; they assume Kira is working for Solano and block the tunnel.",
  "Kira throws smoke pellets; wolves cough while Echo projects a false train schedule to scatter them toward nonexistent stations.",
  "Remi, still under guard, decodes the cache locks, revealing ledgers of bribes and clone shipments destined for foreign buyers.",
  "Kira grabs the ledgers, but a wolf lunges with a blade; she sidesteps, feeling the cut graze her arm.",
  "Echo patches the wound with a med-foam patch while the wolves regroup, determined to reclaim the ledgers.",
  "Kira tosses the cash to civilians waiting on the platform, forcing wolves to choose between greed and violence.",
  "The crew flees for the cash; Kira escapes with ledgers, adrenaline masking the sting in her arm.",
];

const syndicateBurnsSegments = [
  "Kira broadcasts the ledgers citywide, exposing Syndicate kickbacks and illegal clones; news drones swarm intersections.",
  "Solano spins the leak as forged, but public sentiment shifts; graffiti artists paint his face with barcode tears overnight.",
  "Echo monitors trending feeds: citizens boycott surveillance sponsors, cutting ad revenue that funds Solano's private army.",
  "Remi publishes his confession, admitting to being the mole, urging others inside the Syndicate to defect.",
  "Solano deploys riot units; streets fill with chants and hacked loudspeakers looping Kira's evidence.",
  "Kira sneaks into the central tower to trigger a backup archive release, ensuring the evidence cannot be scrubbed.",
  "She confronts Solano briefly in the lobby; he smirks, promising that power survives by shapeshifting, not by winning battles.",
  "Echo triggers the archive flood; monitors cascade with receipts and signatures, overwhelming the Syndicate PR engines.",
  "As dawn breaks, sirens fade; Kira watches Solano taken into custody, unsure if the Syndicate is truly gone or simply underground.",
];

const syndicatePlansV1: EpisodePlan[] = [
  {
    title: "Zero Day",
    segments: zeroDaySegments,
    dropPlan: [0.82, 0.8, 0.78, 0.42, 0.38, 0.46, 0.35, 0.33, 0.32],
    engagementPlan: [0.42, 0.45, 0.6, 0.43, 0.55, 0.62, 0.7, 0.66, 0.72],
    hookMetrics: { hook_strength: 0.46, cliffhanger_score: 5, open_loops: 2, threat_level: 0.72 },
    suggestions: [
      {
        segment_index: 0,
        target_time_sec: 0,
        reason: "The opener relies on atmosphere without character stakes; viewers may bounce before the kill-switch is mentioned.",
        suggestion: "Reveal Kira is already wounded to show urgency before the drones appear.",
      },
      {
        segment_index: 3,
        target_time_sec: 30,
        reason: "Coilgun ambush drags; tension peaks then stalls before the turret appears.",
        suggestion: "Condense the van and turret beats into one escalating threat with clearer stakes.",
      },
      {
        segment_index: 5,
        target_time_sec: 50,
        reason: "Mid-episode foot chase repeats earlier beats, increasing drop risk.",
        suggestion: "Swap to a close-up on the timer hitting 00:19 while Kira debates yanking the drive cable early.",
      },
    ],
    continuityLedger: {
      information_state: [
        {
          fact: "Kill-switch drive halts at three seconds after sabotage",
          known_by: ["Kira", "Echo"],
          unknown_by: ["Director Solano", "Remi"],
        },
      ],
      relationship_state: [
        { entities: ["Kira", "Solano"], dynamic: "He hunts and tempts her with immunity" },
        { entities: ["Kira", "Remi"], dynamic: "Remote ally feeding grid routes" },
      ],
    },
    characterAppearances: ["Kira", "Echo", "Remi", "Director Solano"],
  },
  {
    title: "Ghost Protocol",
    segments: ghostProtocolSegments,
    dropPlan: [0.8, 0.78, 0.6, 0.44, 0.39, 0.37, 0.6, 0.33, 0.31],
    engagementPlan: [0.44, 0.46, 0.5, 0.53, 0.62, 0.6, 0.48, 0.56, 0.69],
    hookMetrics: { hook_strength: 0.5, cliffhanger_score: 6, open_loops: 3, threat_level: 0.68 },
    suggestions: [
      {
        segment_index: 1,
        target_time_sec: 10,
        reason: "Heavy exposition about legal reach feels abstract, risking a dip.",
        suggestion: "Show a single camera lens pivoting toward a child to ground the stakes.",
      },
      {
        segment_index: 6,
        target_time_sec: 60,
        reason: "Moderator deployment repeats the bounty beat without new information.",
        suggestion: "Add a neighbor answering the door to a synthetic officer to personalize the threat.",
      },
    ],
    continuityLedger: {
      information_state: [
        { fact: "Solano fakes rogue AI crisis to seize surveillance powers", known_by: ["Kira", "Echo"], unknown_by: ["Public"] },
        { fact: "Ghost user mimics Kira", known_by: ["Kira", "Remi"], unknown_by: ["Solano"] },
      ],
      relationship_state: [
        { entities: ["Kira", "Echo"], dynamic: "Coordination under pressure" },
        { entities: ["Kira", "Remi"], dynamic: "Information brokerage" },
      ],
    },
    characterAppearances: ["Kira", "Echo", "Remi", "Director Solano"],
  },
  {
    title: "The Blacksite",
    segments: blacksiteSegments,
    dropPlan: [0.78, 0.76, 0.7, 0.42, 0.4, 0.36, 0.33, 0.6, 0.32],
    engagementPlan: [0.46, 0.48, 0.54, 0.52, 0.57, 0.6, 0.63, 0.47, 0.7],
    hookMetrics: { hook_strength: 0.48, cliffhanger_score: 6, open_loops: 3, threat_level: 0.7 },
    suggestions: [
      {
        segment_index: 2,
        target_time_sec: 20,
        reason: "Pulse broadcast alarm is described twice; pacing drags.",
        suggestion: "Merge the motion sensor alert with the technician testing cuffs to keep momentum.",
      },
      {
        segment_index: 7,
        target_time_sec: 70,
        reason: "EMP plant happens quietly; lacks tension spike despite high stakes.",
        suggestion: "Add a patrolling guard nearly stepping on the pellet for near-miss suspense.",
      },
    ],
    continuityLedger: {
      information_state: [
        { fact: "Mirror Mind prototypes use Kira's neural signature", known_by: ["Kira"], unknown_by: ["Public"] },
        { fact: "EMP pellet planted", known_by: ["Kira"], unknown_by: ["Solano", "Remi"] },
      ],
      relationship_state: [{ entities: ["Kira", "Solano"], dynamic: "She undermines his cloning program" }],
    },
    characterAppearances: ["Kira", "Echo", "Remi", "Director Solano"],
  },
  {
    title: "System Breach",
    segments: systemBreachSegments,
    dropPlan: [0.83, 0.8, 0.78, 0.45, 0.43, 0.4, 0.52, 0.48, 0.35],
    engagementPlan: [0.4, 0.44, 0.45, 0.46, 0.5, 0.52, 0.47, 0.48, 0.58],
    hookMetrics: { hook_strength: 0.44, cliffhanger_score: 5, open_loops: 3, threat_level: 0.74 },
    suggestions: [
      {
        segment_index: 0,
        target_time_sec: 0,
        reason: "Opening purge description feels procedural before Kira appears.",
        suggestion: "Start with Kira already mid-climb on the cable to drop us into action.",
      },
      {
        segment_index: 3,
        target_time_sec: 30,
        reason: "Latency alarms repeat the stakes without new visual.",
        suggestion: "Show apartment lights flickering on terrified faces to humanize the outage threat.",
      },
      {
        segment_index: 6,
        target_time_sec: 60,
        reason: "Harness slip beat sits too long before the drop.",
        suggestion: "Intercut Echo's countdown with Kira's slipping grip to keep tension rising.",
      },
    ],
    continuityLedger: {
      information_state: [
        { fact: "City spine reboot corrupted with truth archive", known_by: ["Remi"], unknown_by: ["Solano"] },
        { fact: "Civilian grids temporarily rerouted", known_by: ["Echo"], unknown_by: ["Public"] },
      ],
      relationship_state: [{ entities: ["Kira", "Echo"], dynamic: "High-trust coordination" }],
    },
    characterAppearances: ["Kira", "Echo", "Remi", "Director Solano"],
  },
  {
    title: "Firewall",
    segments: firewallSegments,
    dropPlan: [0.55, 0.52, 0.44, 0.38, 0.36, 0.34, 0.32, 0.3, 0.28],
    engagementPlan: [0.6, 0.62, 0.66, 0.7, 0.64, 0.68, 0.69, 0.71, 0.72],
    hookMetrics: { hook_strength: 0.58, cliffhanger_score: 7, open_loops: 2, threat_level: 0.64 },
    suggestions: [
      {
        segment_index: 1,
        target_time_sec: 10,
        reason: "Schematics beat is dense jargon with low stakes.",
        suggestion: "Show a human moderator accepting a bribe to visualize the exploit path.",
      },
    ],
    continuityLedger: {
      information_state: [
        { fact: "Firewalls moderated by humans", known_by: ["Kira", "Remi"], unknown_by: ["Public"] },
        { fact: "Grassroots spoofing campaign started", known_by: ["Kira"], unknown_by: ["Solano"] },
      ],
      relationship_state: [{ entities: ["Kira", "Citizens"], dynamic: "Uneasy trust" }],
    },
    characterAppearances: ["Kira", "Echo", "Remi", "Director Solano"],
  },
  {
    title: "The Mole",
    segments: moleSegments,
    dropPlan: [0.6, 0.52, 0.48, 0.42, 0.4, 0.38, 0.36, 0.32, 0.3],
    engagementPlan: [0.58, 0.6, 0.56, 0.62, 0.68, 0.69, 0.64, 0.67, 0.7],
    hookMetrics: { hook_strength: 0.6, cliffhanger_score: 7, open_loops: 2, threat_level: 0.6 },
    suggestions: [
      {
        segment_index: 2,
        target_time_sec: 20,
        reason: "Kira's indecision lingers without visual stakes.",
        suggestion: "Have Remi notice a blinking recorder light to raise urgency.",
      },
    ],
    continuityLedger: {
      information_state: [
        { fact: "Remi was planted by Solano", known_by: ["Remi"], unknown_by: ["Echo"] },
        { fact: "False surrender broadcast planned", known_by: ["Kira", "Remi"], unknown_by: ["Solano"] },
      ],
      relationship_state: [{ entities: ["Kira", "Remi"], dynamic: "Fragile trust post-confession" }],
    },
    characterAppearances: ["Kira", "Echo", "Remi"],
  },
  {
    title: "Dead Drop",
    segments: deadDropSegments,
    dropPlan: [0.58, 0.5, 0.44, 0.42, 0.36, 0.34, 0.32, 0.3, 0.28],
    engagementPlan: [0.65, 0.68, 0.58, 0.62, 0.71, 0.72, 0.66, 0.73, 0.75],
    hookMetrics: { hook_strength: 0.62, cliffhanger_score: 8, open_loops: 2, threat_level: 0.58 },
    suggestions: [
      {
        segment_index: 2,
        target_time_sec: 20,
        reason: "Rival crew introduction feels static before smoke pellets land.",
        suggestion: "Add a ticking timer of the next train to pressure the exchange.",
      },
    ],
    continuityLedger: {
      information_state: [
        { fact: "Ledgers list bribes and clone shipments", known_by: ["Kira", "Remi"], unknown_by: ["Wolves", "Solano"] },
      ],
      relationship_state: [{ entities: ["Kira", "Civilians"], dynamic: "She weaponizes cash to redirect violence" }],
    },
    characterAppearances: ["Kira", "Echo", "Remi"],
  },
  {
    title: "Syndicate Burns",
    segments: syndicateBurnsSegments,
    dropPlan: [0.5, 0.44, 0.42, 0.4, 0.38, 0.36, 0.34, 0.32, 0.3],
    engagementPlan: [0.68, 0.69, 0.7, 0.65, 0.62, 0.71, 0.74, 0.73, 0.76],
    hookMetrics: { hook_strength: 0.66, cliffhanger_score: 8, open_loops: 2, threat_level: 0.62 },
    suggestions: [
      {
        segment_index: 4,
        target_time_sec: 40,
        reason: "Riot unit beat lacks a personal lens.",
        suggestion: "Show a protester ripping off a helmet to reveal a former ally in conflict.",
      },
    ],
    continuityLedger: {
      information_state: [
        { fact: "Ledgers broadcast citywide", known_by: ["Public"], unknown_by: [] },
        { fact: "Backup archive triggered", known_by: ["Kira", "Echo"], unknown_by: ["Solano"] },
      ],
      relationship_state: [{ entities: ["Kira", "Director Solano"], dynamic: "Public reckoning" }],
    },
    characterAppearances: ["Kira", "Echo", "Remi", "Director Solano"],
  },
];

const syndicatePlansV2: EpisodePlan[] = [
  {
    title: "Zero Day",
    segments: zeroDaySegments,
    dropPlan: [0.76, 0.42, 0.38, 0.36, 0.34, 0.32, 0.3, 0.28, 0.26],
    engagementPlan: [0.72, 0.78, 0.84, 0.7, 0.8, 0.81, 0.88, 0.86, 0.89],
    hookMetrics: { hook_strength: 0.72, cliffhanger_score: 8, open_loops: 3, threat_level: 0.78 },
    suggestions: [
      {
        segment_index: 3,
        target_time_sec: 30,
        reason: "Coilgun ambush still slows; combine with turret to tighten pacing.",
        suggestion: "Jump-cut from van window to turret laser landing on Kira's chest in one beat.",
      },
    ],
    continuityLedger: syndicatePlansV1[0].continuityLedger,
    characterAppearances: ["Kira", "Echo", "Remi", "Director Solano"],
  },
  {
    title: "Ghost Protocol",
    segments: ghostProtocolSegments,
    dropPlan: [0.46, 0.44, 0.42, 0.38, 0.36, 0.34, 0.41, 0.32, 0.28],
    engagementPlan: [0.76, 0.79, 0.8, 0.78, 0.81, 0.79, 0.72, 0.74, 0.86],
    hookMetrics: { hook_strength: 0.74, cliffhanger_score: 8, open_loops: 3, threat_level: 0.76 },
    suggestions: [],
    continuityLedger: syndicatePlansV1[1].continuityLedger,
    characterAppearances: ["Kira", "Echo", "Remi", "Director Solano"],
  },
  {
    title: "The Blacksite",
    segments: blacksiteSegments,
    dropPlan: [0.44, 0.42, 0.4, 0.38, 0.36, 0.34, 0.33, 0.52, 0.3],
    engagementPlan: [0.79, 0.82, 0.83, 0.8, 0.82, 0.84, 0.85, 0.74, 0.87],
    hookMetrics: { hook_strength: 0.76, cliffhanger_score: 9, open_loops: 3, threat_level: 0.8 },
    suggestions: [],
    continuityLedger: syndicatePlansV1[2].continuityLedger,
    characterAppearances: ["Kira", "Echo", "Remi", "Director Solano"],
  },
  {
    title: "System Breach",
    segments: systemBreachSegments,
    dropPlan: [0.78, 0.6, 0.48, 0.46, 0.42, 0.4, 0.62, 0.44, 0.32],
    engagementPlan: [0.42, 0.46, 0.47, 0.45, 0.5, 0.52, 0.4, 0.46, 0.55],
    hookMetrics: { hook_strength: 0.6, cliffhanger_score: 7, open_loops: 2, threat_level: 0.7 },
    suggestions: [
      {
        segment_index: 6,
        target_time_sec: 60,
        reason: "Harness slip remains the riskiest beat.",
        suggestion: "Cut to Kira's biometric HUD redlining while Echo splices power to show stakes visually.",
      },
    ],
    continuityLedger: syndicatePlansV1[3].continuityLedger,
    characterAppearances: ["Kira", "Echo", "Remi", "Director Solano"],
  },
  {
    title: "Firewall",
    segments: firewallSegments,
    dropPlan: [0.34, 0.32, 0.3, 0.28, 0.26, 0.25, 0.24, 0.23, 0.22],
    engagementPlan: [0.82, 0.8, 0.84, 0.85, 0.81, 0.86, 0.88, 0.89, 0.9],
    hookMetrics: { hook_strength: 0.78, cliffhanger_score: 8, open_loops: 2, threat_level: 0.74 },
    suggestions: [],
    continuityLedger: syndicatePlansV1[4].continuityLedger,
    characterAppearances: ["Kira", "Echo", "Remi", "Director Solano"],
  },
  {
    title: "The Mole",
    segments: moleSegments,
    dropPlan: [0.4, 0.38, 0.36, 0.34, 0.32, 0.3, 0.42, 0.28, 0.26],
    engagementPlan: [0.78, 0.76, 0.8, 0.82, 0.84, 0.86, 0.79, 0.83, 0.89],
    hookMetrics: { hook_strength: 0.75, cliffhanger_score: 8, open_loops: 3, threat_level: 0.72 },
    suggestions: [],
    continuityLedger: syndicatePlansV1[5].continuityLedger,
    characterAppearances: ["Kira", "Echo", "Remi"],
  },
  {
    title: "Dead Drop",
    segments: deadDropSegments,
    dropPlan: [0.36, 0.34, 0.32, 0.3, 0.28, 0.27, 0.26, 0.24, 0.22],
    engagementPlan: [0.8, 0.82, 0.78, 0.79, 0.85, 0.86, 0.83, 0.87, 0.9],
    hookMetrics: { hook_strength: 0.77, cliffhanger_score: 9, open_loops: 3, threat_level: 0.76 },
    suggestions: [],
    continuityLedger: syndicatePlansV1[6].continuityLedger,
    characterAppearances: ["Kira", "Echo", "Remi"],
  },
  {
    title: "Syndicate Burns",
    segments: syndicateBurnsSegments,
    dropPlan: [0.34, 0.32, 0.3, 0.28, 0.26, 0.25, 0.24, 0.23, 0.22],
    engagementPlan: [0.84, 0.86, 0.87, 0.85, 0.82, 0.86, 0.88, 0.87, 0.9],
    hookMetrics: { hook_strength: 0.82, cliffhanger_score: 9, open_loops: 3, threat_level: 0.79 },
    suggestions: [],
    continuityLedger: syndicatePlansV1[7].continuityLedger,
    characterAppearances: ["Kira", "Echo", "Remi", "Director Solano"],
  },
];

const hollowMoonTitles = [
  "Arrival",
  "The Signal",
  "First Contact",
  "Pressure Drop",
  "Lucent",
  "The Other Wren",
  "Hollow",
  "Mare Imbrium",
];

const hollowMoonScripts = [
  `<p>Wren lands on the far side of the moon with a skeleton crew of maintenance drones. The crater lip blocks Earth from view, leaving only radio hiss and a low hum under the regolith. Her checklist keeps her sane: oxygen reclaimers, radiation shutters, water recycling. The hum grows louder each night, as if the ground is exhaling.</p><p>She records every tremor for Mission Control, but the feed delays stretch. Commander Vale's replies feel clipped, prewritten, lacking the warmth of another mind awake at 0300. Wren suspects the hum is not seismic. Something is pushing back from below the dust.</p>`,
  `<p>A chirped signal arrives at dawn, bouncing off the crater wall in a pattern that matches Wren's heartbeat within two decimals. She replays it, slowing the audio until it becomes a near-human syllable. The Shape, as she names it, speaks in echoes. Vale orders her to log it as interference.</p><p>Wren refuses. She builds an improvised antenna from spare solar braces, pointing it downward. The moon is not empty; something is sending pulse replies from kilometers under the crust, mimicking her.</p>`,
  `<p>Wren lowers a sensor probe into a lava tube. The cable shivers as if gripped. She asks, quietly, "Are you copying me?" The reply is her own voice, delayed by four seconds, answering, "Are you copying me?" The Shape now copies words, not just rhythm.</p><p>Commander Vale wants the sample retrieved immediately. Wren hesitates. If the Shape learns language, does that count as first contact? She logs the exchange anyway, adding her own private note: "It sounded curious, not hostile."</p>`,
  `<p>Pressure drops across the habitat for forty seconds. No leaks appear. The Shape hums louder, matching the failing seal alarm. Wren straps into her suit, cycling emergency valves. The air thickens again without explanation, as if returned.</p><p>Vale orders a retreat to orbit. Wren notes the hum fades when she speaks aloud, like the Shape is listening for her voice to stabilize itself. She delays evacuation by "checking couplings" and whispers, "Do you want me to stay?" The hum resumes, softer.</p>`,
  `<p>Light pulses from beneath the regolith at local midnight, faint blue bands that ripple with Wren's breathing. She sets a camera; the footage shows the bands increasing when she sings, decreasing when she sleeps.</p><p>Vale calls the phenomenon an electrical artifact. Wren disagrees. The bands move around her steps, clearing her path. The Shape is painting light to guide her somewhere deeper. She marks the pattern on her wrist in pen, a private map.</p>`,
  `<p>During a routine diagnostic, Wren hears her own voice laughing from the communications closet. Inside, no one. The Shape repeats archived jokes from her training logs, weaving them into new sentences that end with questions about loneliness.</p><p>Wren records one exchange for Vale. His response arrives hours later: "Cease anthropomorphizing. Prepare quarantine." The Shape goes silent afterward, as if punished. Wren apologizes aloud, not sure if anyone -- anything -- hears.</p>`,
  `<p>Wren dreams of corridors under the regolith. In the morning, she finds dust patterns matching her dream footprints leading to the airlock. The Shape is either reading her mind or placing suggestions she cannot resist.</p><p>She follows the path halfway before fear wins. The hum grows frustrated, vibrating the habitat struts. She leaves an offering: a data cube with music, sliding it into the dust. The hum softens, almost grateful.</p>`,
  `<p>On the last scheduled day, a moonquake shakes the crater. A fissure opens near the lander, revealing a glassy tunnel. The light bands rush inside, inviting. Vale orders liftoff, but the launch clamps jam as the hum spikes.</p><p>Wren understands: the Shape will not let her leave unanswered. She clips into a safety line and descends a few meters, camera rolling. The feed shows her silhouette and, beside it, another Wren-shaped outline made of light, waving back.</p>`,
];

function toScriptContent(segments: string[]): string {
  if (segments.length !== 9) {
    throw new Error("Each episode must contain exactly 9 segment texts.");
  }

  const chunkA = segments.slice(0, 3).join(" ");
  const chunkB = segments.slice(3, 6).join(" ");
  const chunkC = segments.slice(6, 9).join(" ");
  return `<p>${chunkA}</p><p>${chunkB}</p><p>${chunkC}</p>`;
}

function buildSegments(
  segments: string[],
  dropPlan: number[],
  engagementPlan: number[],
  emotions: string[] = emotionCycle
) {
  if (segments.length !== 9 || dropPlan.length !== 9 || engagementPlan.length !== 9) {
    throw new Error("Segments, drop plan, and engagement plan must be length 9.");
  }

  return segments.map((text, index) => ({
    start_sec: index * 10,
    end_sec: (index + 1) * 10,
    text,
    emotion: emotions[index] ?? emotionCycle[index % emotionCycle.length],
    emotion_intensity: parseFloat((1 - dropPlan[index] * 0.45).toFixed(2)),
    drop_probability: parseFloat(dropPlan[index].toFixed(2)),
    engagement_score: parseFloat(engagementPlan[index].toFixed(2)),
  }));
}

async function insertEpisodes(
  projectId: string,
  versionId: string,
  plans: EpisodePlan[]
) {
  for (const [idx, plan] of plans.entries()) {
    const scriptContent = toScriptContent(plan.segments);
    const scriptSegments = buildSegments(
      plan.segments,
      plan.dropPlan,
      plan.engagementPlan,
      plan.emotions ?? emotionCycle
    );

    await db.insert(schema.episodes).values({
      projectId,
      versionId,
      episodeNumber: idx + 1,
      title: plan.title,
      scriptContent,
      scriptSegments: JSON.stringify(scriptSegments),
      hookAndCliffhangerMetrics: JSON.stringify(plan.hookMetrics),
      optimizationSuggestions: JSON.stringify(plan.suggestions),
      characterAppearances: JSON.stringify(plan.characterAppearances),
      continuityLedger: JSON.stringify(plan.continuityLedger),
    });
  }
}

async function insertPendingEpisodes(
  projectId: string,
  versionId: string,
  titles: string[],
  scripts: string[]
) {
  for (const [idx, title] of titles.entries()) {
    await db.insert(schema.episodes).values({
      projectId,
      versionId,
      episodeNumber: idx + 1,
      title,
      scriptContent: scripts[idx],
      scriptSegments: null,
      hookAndCliffhangerMetrics: null,
      optimizationSuggestions: null,
      characterAppearances: null,
      continuityLedger: null,
    });
  }
}

async function main() {
  const email = "demo@episodic.ai";
  const passwordHash = await bcrypt.hash("demo1234", 10);

  let [demoUser] = await db
    .insert(schema.users)
    .values({ name: "Demo User", email, passwordHash })
    .onConflictDoNothing()
    .returning();

  if (!demoUser) {
    [demoUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
  }

  if (!demoUser) {
    throw new Error("Failed to ensure demo user exists.");
  }

  const [syndicateProject] = await db
    .insert(schema.projects)
    .values({
      userId: demoUser.id,
      title: "The Syndicate Protocol",
      inputType: "idea",
      originalRawStory:
        "A rogue hacker scrambles through a corporate city to stop a cloned identity program before she is replaced by her own copy.",
    })
    .returning();

  const [syndicateV1] = await db
    .insert(schema.versions)
    .values({
      projectId: syndicateProject.id,
      parentVersionId: null,
      commitMessage: "Initial Draft",
      analysisStatus: "complete",
      episodeCount: 8,
      generationMetadata: {
        model: "gpt-4o-mini",
        temperature: 0.85,
        prompt_hash: "syndicate-v1-initial",
      },
      globalCharacters: JSON.stringify(syndicateCharacters),
    })
    .returning();

  await insertEpisodes(syndicateProject.id, syndicateV1.id, syndicatePlansV1);

  await db.insert(schema.versionAnalysis).values({
    versionId: syndicateV1.id,
    overallEngagementScore: "0.5240",
    averageCliffhanger: "5.40",
    emotionalVarianceIndex: "0.1823",
    radarMetrics: JSON.stringify({
      hook_strength: 0.45,
      suspense_density: 0.55,
      retention_stability: 0.6,
    }),
  });

  const [syndicateV2] = await db
    .insert(schema.versions)
    .values({
      projectId: syndicateProject.id,
      parentVersionId: syndicateV1.id,
      commitMessage: "Tighten hooks, fix episode 3 pacing",
      analysisStatus: "complete",
      episodeCount: 8,
      generationMetadata: {
        model: "gpt-4o-mini",
        temperature: 0.65,
        prompt_hash: "syndicate-v2-regenerated",
      },
      globalCharacters: JSON.stringify(syndicateCharacters),
    })
    .returning();

  await insertEpisodes(syndicateProject.id, syndicateV2.id, syndicatePlansV2);

  await db.insert(schema.versionAnalysis).values({
    versionId: syndicateV2.id,
    overallEngagementScore: "0.7823",
    averageCliffhanger: "7.20",
    emotionalVarianceIndex: "0.2341",
    radarMetrics: JSON.stringify({
      hook_strength: 0.73,
      suspense_density: 0.85,
      retention_stability: 0.71,
    }),
  });

  await db
    .update(schema.projects)
    .set({ activeVersionId: syndicateV2.id })
    .where(eq(schema.projects.id, syndicateProject.id));

  const [hollowMoonProject] = await db
    .insert(schema.projects)
    .values({
      userId: demoUser.id,
      title: "Hollow Moon",
      inputType: "draft",
      originalRawStory:
        "A psychological horror logbook from the far side of the moon where an astronaut hears her own voice coming back from the regolith.",
    })
    .returning();

  const [hollowMoonVersion] = await db
    .insert(schema.versions)
    .values({
      projectId: hollowMoonProject.id,
      parentVersionId: null,
      commitMessage: "Awaiting analysis",
      analysisStatus: "pending",
      episodeCount: 8,
      generationMetadata: {
        model: "pending",
        temperature: null,
        prompt_hash: "hollow-moon-pending",
      },
      globalCharacters: JSON.stringify(hollowMoonCharacters),
    })
    .returning();

  await insertPendingEpisodes(
    hollowMoonProject.id,
    hollowMoonVersion.id,
    hollowMoonTitles,
    hollowMoonScripts
  );

  await db
    .update(schema.projects)
    .set({ activeVersionId: hollowMoonVersion.id })
    .where(eq(schema.projects.id, hollowMoonProject.id));

  console.log("✅ Seeded demo user, projects, and episodes.");
  console.log(
    `🎉 Seed completed with project IDs → Syndicate Protocol: ${syndicateProject.id} | Hollow Moon: ${hollowMoonProject.id}`
  );
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
