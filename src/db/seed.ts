import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// ─── Mock Script Content ─────────────────────────────────────────────────────

const SCRIPTS = [
  `COLD OPEN: Rain hammers a neon-lit alley. DETECTIVE CHEN (40s, cybernetic left eye) crouches over a body bag. He unzips it. The face inside is his own. His hands shake. A SIREN wails. He zips it shut and walks away — but pockets the victim's access chip. TITLE CARD: "THE NEON DETECTIVE." Chen mutters into his comm: "Control, I found... nothing. False alarm." He's lying. We see his pulse spike on his HUD: 142 BPM. He knows this changes everything.`,

  `Chen sits in a ramen stall, sliding the stolen access chip under a UV scanner he built from scrap. The chip unlocks a HOLO-MAP of a decommissioned cloning facility — CyGena Labs. His cybernetic eye involuntarily RECORDS everything. SARAH (30s, underground fixer) slides into the booth. "You look like you've seen a ghost." "Worse," Chen replies, "I've seen my replacement." Sarah's expression hardens. She knows about CyGena — she's been tracking them for months. They form a reluctant alliance. As they leave, Chen's eye flags a TAIL — someone in a mirrored jacket, watching from across the street.`,

  `Chen and Sarah break into CyGena Labs at night. The facility is supposedly abandoned, but the LIGHTS ARE ON. Rows of cloning pods line the walls — most empty, some containing half-formed bodies. Sarah finds a MANIFEST: twelve clones of Chen were produced. Eleven are accounted for. One is missing. "That's the one in the alley," Chen whispers. A SOUND — heavy footsteps above them. Chen draws his weapon. Sarah pulls up the facility's camera feed on her tablet: a figure in a long coat walks the upper floor. The figure turns toward the camera. IT HAS CHEN'S FACE. It smiles. END OF EPISODE.`,
];

const EPISODE_TITLES = [
  "The Mirror Corpse",
  "Ghost Protocol",
  "The Twelfth Clone",
];

// ─── Realistic Mock Segment Data ─────────────────────────────────────────────

function generateSegments(scriptContent: string) {
  // Split script into ~10-second blocks (roughly by sentences)
  const sentences = scriptContent.match(/[^.!?]+[.!?]+/g) || [scriptContent];
  const segmentCount = Math.min(9, Math.max(3, Math.ceil(sentences.length / 2)));
  const secondsPerSegment = 10;

  const emotionPool = [
    "neutral", "fear", "surprise", "curiosity", "tension",
    "anger", "sadness", "excitement", "anticipation",
  ];

  // Craft realistic intensity curves per episode position
  const intensityCurves = [
    // Ep 1: Hook high → dip → build
    [0.82, 0.75, 0.45, 0.40, 0.55, 0.65, 0.78, 0.85, 0.90],
    // Ep 2: Medium start → build → reveal spike
    [0.50, 0.55, 0.48, 0.60, 0.70, 0.65, 0.72, 0.80, 0.88],
    // Ep 3: Creepy slow burn → massive spike at end
    [0.55, 0.60, 0.52, 0.48, 0.62, 0.75, 0.82, 0.92, 0.95],
  ];

  return (episodeIndex: number) => {
    const curve = intensityCurves[episodeIndex] || intensityCurves[0];
    const segments = [];
    let sentenceIdx = 0;

    for (let i = 0; i < segmentCount; i++) {
      const chunkSentences = sentences.slice(sentenceIdx, sentenceIdx + 2);
      sentenceIdx += 2;

      const intensity = curve[i] ?? 0.5;
      // SMA-like smoothing approximation for drop_probability
      const dropProb = intensity < 0.4 ? 0.65 : intensity < 0.5 ? 0.35 : 0.05 + (1 - intensity) * 0.2;

      segments.push({
        start_sec: i * secondsPerSegment,
        end_sec: (i + 1) * secondsPerSegment,
        text: chunkSentences.join(" ").trim() || `[Segment ${i + 1}]`,
        emotion: emotionPool[i % emotionPool.length],
        emotion_intensity: parseFloat(intensity.toFixed(2)),
        drop_probability: parseFloat(dropProb.toFixed(2)),
        engagement_score: parseFloat((intensity * 0.85 + 0.1).toFixed(2)),
      });
    }

    return segments;
  };
}

// ─── Hook & Cliffhanger Metrics ──────────────────────────────────────────────

const HOOK_CLIFFHANGER_METRICS = [
  {
    hook_strength: 0.88,
    cliffhanger_score: 7,
    open_loops: 2,
    threat_level: 0.75,
  },
  {
    hook_strength: 0.62,
    cliffhanger_score: 8,
    open_loops: 3,
    threat_level: 0.80,
  },
  {
    hook_strength: 0.70,
    cliffhanger_score: 9,
    open_loops: 4,
    threat_level: 0.92,
  },
];

// ─── Continuity Ledgers ──────────────────────────────────────────────────────

const CONTINUITY_LEDGERS = [
  {
    information_state: [
      { fact: "Chen found his own clone's body", known_by: ["Chen"], unknown_by: ["Control", "Sarah"] },
      { fact: "The victim had an access chip to CyGena Labs", known_by: ["Chen"], unknown_by: ["Control", "Sarah"] },
    ],
    relationship_state: [
      { entities: ["Chen", "Control"], dynamic: "Employer-employee, Chen is now lying to Control" },
    ],
    inventory_state: [
      { item: "CyGena Access Chip", held_by: "Chen" },
    ],
  },
  {
    information_state: [
      { fact: "Chen found his own clone's body", known_by: ["Chen", "Sarah"], unknown_by: ["Control"] },
      { fact: "CyGena Labs produced 12 clones of Chen", known_by: ["Sarah"], unknown_by: ["Chen"] },
      { fact: "Someone in a mirrored jacket is tailing Chen", known_by: ["Chen"], unknown_by: ["Sarah", "Control"] },
    ],
    relationship_state: [
      { entities: ["Chen", "Sarah"], dynamic: "Reluctant alliance, mutual distrust" },
    ],
    inventory_state: [
      { item: "CyGena Access Chip", held_by: "Chen" },
      { item: "UV Scanner", held_by: "Chen" },
    ],
  },
  {
    information_state: [
      { fact: "12 clones of Chen were produced, 11 accounted for, 1 missing", known_by: ["Chen", "Sarah"], unknown_by: ["Control"] },
      { fact: "A living clone of Chen exists inside CyGena Labs", known_by: ["Chen", "Sarah"], unknown_by: ["Control"] },
    ],
    relationship_state: [
      { entities: ["Chen", "Sarah"], dynamic: "Partners under fire, trust solidifying" },
      { entities: ["Chen", "The Clone"], dynamic: "Unknown — first visual contact" },
    ],
    inventory_state: [
      { item: "CyGena Manifest", held_by: "Sarah" },
      { item: "Facility Camera Feed", held_by: "Sarah" },
    ],
  },
];

// ─── Global Characters ───────────────────────────────────────────────────────

const GLOBAL_CHARACTERS = [
  { name: "Detective Chen", description: "Weary cyber-detective with a cybernetic left eye", traits: ["cynical", "observant", "secretive"] },
  { name: "Sarah", description: "Underground fixer who has been tracking CyGena Labs", traits: ["resourceful", "guarded", "determined"] },
  { name: "The Clone", description: "A living genetic duplicate of Chen found inside CyGena", traits: ["mysterious", "unsettling", "unknown motives"] },
  { name: "Control", description: "Chen's police dispatcher and handler", traits: ["authoritative", "unaware of Chen's discovery"] },
];

// ─── Seed Execution ──────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding database...");

  const segmentGenerator = generateSegments(SCRIPTS[0]);

  // 1. Create Project
  const [project] = await db
    .insert(schema.projects)
    .values({
      title: "The Neon Detective",
      inputType: "idea",
      originalRawStory:
        "A cyberpunk detective discovers a body that looks exactly like him. He must uncover a cloning conspiracy before his department discovers what he found — or before his clone finds him first.",
    })
    .returning();

  console.log(`  ✅ Project created: ${project.id}`);

  // 2. Create Version
  const [version] = await db
    .insert(schema.versions)
    .values({
      projectId: project.id,
      parentVersionId: null,
      commitMessage: "Initial Generation",
      analysisStatus: "complete",
      globalCharacters: GLOBAL_CHARACTERS,
      generationMetadata: {
        model: "gpt-4o",
        temperature: 0.8,
        prompt_hash: "seed-mock-data-v1",
      },
    })
    .returning();

  console.log(`  ✅ Version created: ${version.id}`);

  // 3. Link active version
  await db
    .update(schema.projects)
    .set({ activeVersionId: version.id })
    .where(eq(schema.projects.id, project.id));

  console.log(`  ✅ Active version linked`);

  // 4. Create Episodes
  for (let i = 0; i < 3; i++) {
    const segments = segmentGenerator(i);
    const [episode] = await db
      .insert(schema.episodes)
      .values({
        projectId: project.id,
        versionId: version.id,
        episodeNumber: i + 1,
        title: EPISODE_TITLES[i],
        scriptContent: SCRIPTS[i],
        scriptSegments: segments,
        hookAndCliffhangerMetrics: HOOK_CLIFFHANGER_METRICS[i],
        optimizationSuggestions:
          i === 1
            ? [
                {
                  segment_index: 2,
                  issue: "Emotional intensity flatlined for 18 seconds during the ramen stall exposition.",
                  suggestion: "Insert a visual reveal — Sarah slides a photo of a second clone across the table.",
                  priority: "high",
                },
              ]
            : [],
        characterAppearances:
          i === 0
            ? ["Detective Chen"]
            : i === 1
              ? ["Detective Chen", "Sarah"]
              : ["Detective Chen", "Sarah", "The Clone"],
        continuityLedger: CONTINUITY_LEDGERS[i],
      })
      .returning();

    console.log(`  ✅ Episode ${i + 1} created: ${episode.id}`);
  }

  // 5. Create Version Analysis
  const [analysis] = await db
    .insert(schema.versionAnalysis)
    .values({
      versionId: version.id,
      overallEngagementScore: "0.78",
      averageCliffhanger: "8.0",
      emotionalVarianceIndex: "0.64",
      radarMetrics: {
        hook_strength: 0.73,
        suspense_density: 0.85,
        retention_stability: 0.71,
      },
    })
    .returning();

  console.log(`  ✅ Version Analysis created: ${analysis.id}`);

  console.log("\n🎉 Seed complete! The Neon Detective is ready.\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
