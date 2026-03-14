export type ConsensusLevel = "perfect" | "good" | "some" | "wide";

const labels: Record<ConsensusLevel, string[]> = {
  perfect: [
    // Robotic
    "CONSENSUS.EXE: 100% match. No further processing required.",
    "ALL NODES IN AGREEMENT. PROCEEDING.",
    "VARIANCE = 0. RESULT: OPTIMAL.",
    // Overly friendly
    "Oh wow, you all picked the same thing!! I'm literally crying right now!!",
    "PERFECT MATCH!! You guys are basically telepathic besties!!",
    "Everyone agreed!! This is the most beautiful thing I've ever seen!!",
    // Corporate BS
    "Full stakeholder alignment has been achieved at the estimation layer.",
    "The team has synergized around a unified complexity narrative.",
    "Cross-functional consensus unlocked. Let's take this to the next level.",
    // Doomer
    "Everyone agreed. Suspicious. Someone is lying.",
    "Perfect consensus. Either you all understand it, or none of you do.",
    // Medieval
    "Hear ye! The council hath spoken with one voice!",
  ],

  good: [
    // Robotic
    "DEVIATION WITHIN ACCEPTABLE PARAMETERS. PROCEEDING.",
    "DELTA DETECTED. WITHIN TOLERANCE BAND. NO ALERT TRIGGERED.",
    "MINOR VARIANCE LOGGED. CONSENSUS PROBABILITY: HIGH.",
    // Overly friendly
    "So close!! You're basically all on the same page, how cute is that!!",
    "Tiny difference but honestly?? You're all doing amazing sweetie!!",
    "Almost identical!! You guys are SO in sync I can't even!!",
    // Corporate BS
    "The team is largely aligned on the complexity vector. Minor deltas noted.",
    "Estimation cohesion is strong. Recommend a quick touch-base to close the gap.",
    "Good directional alignment. Let's leverage this momentum going forward.",
    // Doomer
    "Close enough. Ship it and see what happens.",
    "Minor disagreement. Someone is wrong but it's probably fine.",
    // Medieval
    "The knights are mostly of one mind. A brief parley shall suffice.",
  ],

  some: [
    // Robotic
    "CONFLICT DETECTED. INITIATING DISCUSSION SUBROUTINE.",
    "SPREAD EXCEEDS THRESHOLD. HUMAN INTERVENTION RECOMMENDED.",
    "DIVERGENCE LOGGED. AWAITING RECONCILIATION PROTOCOL.",
    // Overly friendly
    "Okay so there's a LITTLE bit of disagreement but that's totally okay!! Talk it out!!",
    "Some different opinions here!! That's what makes your team so wonderfully UNIQUE!!",
    "Not everyone agreed but honestly the conversation is the best part!!",
    // Corporate BS
    "Estimation misalignment presents an opportunity for cross-team knowledge transfer.",
    "Some spread in the data points. Recommend a quick sync to surface hidden dependencies.",
    "The team would benefit from a transparent dialogue around complexity assumptions.",
    // Doomer
    "Somebody has no idea what they're doing. Possibly everyone.",
    "Disagreement detected. This meeting just got longer.",
    // Medieval
    "The council is divided. Let the debate commence, and may the wisest prevail.",
  ],

  wide: [
    // Robotic
    "CRITICAL DIVERGENCE. STORY NOT UNDERSTOOD. ABORT. RETRY. FAIL.",
    "ESTIMATION ENTROPY MAXIMUM. RECOMMEND STORY DECOMPOSITION.",
    "ERROR: TEAM OPERATING IN PARALLEL REALITIES. REBOOT REQUIRED.",
    // Overly friendly
    "WOW okay so everyone had a TOTALLY different idea but that's so exciting!! Growth!!",
    "Big spread!! But you know what?? Every single vote came from the heart!!",
    "Lots of different feelings here!! Let's share them all!! I love you guys!!",
    // Corporate BS
    "The delta in estimations signals a strategic misalignment in our shared understanding.",
    "Wide spread is an agile indicator of story ambiguity requiring further refinement.",
    "This is a golden opportunity to leverage our collective intelligence and right-size the backlog.",
    // Doomer
    "Nobody knows what this ticket is. Nobody has ever known. It was always this way.",
    "Complete chaos. The project is fine. This is fine.",
    "Wide spread detected. Someone is about to get voluntold to investigate.",
    // Medieval
    "The realm is divided! This story must be broken asunder and re-estimated at dawn!",
  ],
};

// Seed from the actual votes so all clients pick the same label
function seedFromVotes(votes: string[]): number {
  const str = [...votes].sort().join(",");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getConsensusLabel(level: ConsensusLevel, votes: string[]): string {
  const seed = seedFromVotes(votes);
  const arr = labels[level];
  return arr[seed % arr.length];
}
