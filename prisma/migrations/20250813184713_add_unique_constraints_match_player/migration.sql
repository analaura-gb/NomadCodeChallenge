/*
  Warnings:

  - A unique constraint covering the columns `[matchId,playerId]` on the table `MatchPlayerStats` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[matchId,playerId]` on the table `MatchPlayerTeam` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `MatchPlayerStats_matchId_playerId_key` ON `MatchPlayerStats`(`matchId`, `playerId`);

-- CreateIndex
CREATE UNIQUE INDEX `MatchPlayerTeam_matchId_playerId_key` ON `MatchPlayerTeam`(`matchId`, `playerId`);
