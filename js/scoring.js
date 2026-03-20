/* ================================================================
   scoring.js — Port of helpers.py scoring functions
   All pure arithmetic, no dependencies.
   ================================================================ */

function sumMoveGames(moveInfo) {
  return moveInfo.white + moveInfo.black + moveInfo.draws;
}

function computeMoveFreq(moveInfo, mostPlayedMove) {
  return sumMoveGames(moveInfo) / sumMoveGames(mostPlayedMove);
}

function isSomewhatRare(frequency, pmTotalGames, rmTotalGames,
                        threshold = 0.05, minGames = 10, maxGames = 500) {
  if (pmTotalGames <= minGames || rmTotalGames >= maxGames) return false;
  if (frequency === 0.0) return true;
  return frequency < threshold;
}

function computeRarityScore(frequency, moveNumber, pmTotalGames, rmTotalGames,
                            threshold = 0.05, minGames = 10, maxGames = 500) {
  if (!isSomewhatRare(frequency, pmTotalGames, rmTotalGames, threshold, minGames, maxGames)) {
    return 0.0;
  }

  let score = 1.0;

  // Penalty 1: too many follow-up games means the move is somewhat known
  const gamesThreshold = 10;
  if (rmTotalGames > gamesThreshold) {
    const excessTens = Math.floor((rmTotalGames - gamesThreshold) / 10);
    score -= excessTens * 0.01;
  }

  // Penalty 2: late novelties are less exciting (starts at move 8)
  const moveThreshold = 8;
  if (moveNumber > moveThreshold) {
    score -= (moveNumber - moveThreshold) * 0.05;
  }

  // Penalty 3: higher frequency = worse (0% -> 0, 5% -> -0.40)
  score -= frequency * 8.0;

  return Math.round(Math.max(0.0, Math.min(1.0, score)) * 1000) / 1000;
}

function computeResultScore(result, whiteToMove) {
  let score = 0;
  if (whiteToMove) {
    if (result === "1-0")       score = 0.05;
    else if (result === "0-1")  score = -0.10;
    else if (result === "1/2-1/2") score = -0.05;
  } else {
    if (result === "0-1")       score = 0.10;
    else if (result === "1-0")  score = -0.05;
    else if (result === "1/2-1/2") score = 0.05;
  }
  return score;
}

function computeEfficiencyScore(result, whiteToMove, stockfishScore = 0.0) {
  return stockfishScore + computeResultScore(result, whiteToMove);
}

function computeInterestScore(rarityScore, efficiencyScore) {
  return Math.round(Math.max(0.0, Math.min(1.0, rarityScore + efficiencyScore)) * 1000) / 1000;
}

function isRare(moveSan, movesData, moveNumber,
                threshold = 0.05, minGames = 10, maxGames = 500) {
  const movesDict = {};
  for (const m of movesData.moves) movesDict[m.san] = m;

  const moveInfo     = movesDict[moveSan] || null;
  const pmTotalGames = sumMoveGames(movesData.moves[0]);
  const rmTotalGames = moveInfo ? sumMoveGames(moveInfo) : 0;
  const frequency    = moveInfo ? computeMoveFreq(moveInfo, movesData.moves[0]) : 0.0;

  return computeRarityScore(frequency, moveNumber, pmTotalGames, rmTotalGames,
                            threshold, minGames, maxGames) > 0.0;
}

function getAllMoveInfo(moveSan, movesData, moveNumber, result, whiteToMove,
                       stockfishScore = 0.0,
                       threshold = 0.05, minGames = 10, maxGames = 500) {
  const pmTotalGames = sumMoveGames(movesData.moves[0]);
  const movesDict = {};
  for (const m of movesData.moves) movesDict[m.san] = m;

  const moveInfo = movesDict[moveSan] || null;
  let frequency, gamesWithMove;
  if (!moveInfo) {
    frequency = 0.0;
    gamesWithMove = 0;
  } else {
    frequency = computeMoveFreq(moveInfo, movesData.moves[0]);
    gamesWithMove = sumMoveGames(moveInfo);
  }

  const rarityScore     = computeRarityScore(frequency, moveNumber, pmTotalGames,
                                             gamesWithMove, threshold, minGames, maxGames);
  const resultScore     = computeResultScore(result, whiteToMove);
  const efficiencyScore = computeEfficiencyScore(result, whiteToMove, stockfishScore);
  const interestScore   = computeInterestScore(rarityScore, efficiencyScore);

  return { frequency, gamesWithMove, pmTotalGames, rarityScore, resultScore, efficiencyScore, interestScore, stockfishScore };
}
