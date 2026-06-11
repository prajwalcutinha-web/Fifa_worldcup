// Prediction scoring engine.
//
// Points model (from the design brief):
//   - Exact score correct:        +3
//   - First team to score correct:+5
//   - First player to score:      +6
//   - Double Points match:        all of the above x2
//
// `actual` is a finished match with a final score string like "2-1" and
// optionally firstTeam / firstPlayer fields once those data points are wired in.

export const POINTS = {
  SCORE: 3,
  FIRST_TEAM: 5,
  FIRST_PLAYER: 6,
};

function parseScore(score) {
  if (!score || typeof score !== "string") return null;
  const m = score.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return null;
  return { home: Number(m[1]), away: Number(m[2]) };
}

export function scorePrediction(prediction, actual) {
  const breakdown = { score: 0, firstTeam: 0, firstPlayer: 0 };

  const predScore = { home: prediction.homeScore, away: prediction.awayScore };
  const realScore = parseScore(actual.score);

  if (
    realScore &&
    predScore.home === realScore.home &&
    predScore.away === realScore.away
  ) {
    breakdown.score = POINTS.SCORE;
  }

  if (
    actual.firstTeam &&
    prediction.firstTeam &&
    prediction.firstTeam === actual.firstTeam
  ) {
    breakdown.firstTeam = POINTS.FIRST_TEAM;
  }

  if (
    actual.firstPlayer &&
    prediction.firstPlayer &&
    prediction.firstPlayer.toLowerCase() === actual.firstPlayer.toLowerCase()
  ) {
    breakdown.firstPlayer = POINTS.FIRST_PLAYER;
  }

  let total = breakdown.score + breakdown.firstTeam + breakdown.firstPlayer;
  if (prediction.double) total *= 2;

  return { total, breakdown, doubled: Boolean(prediction.double) };
}
