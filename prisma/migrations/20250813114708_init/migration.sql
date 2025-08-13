-- CreateTable
CREATE TABLE `Player` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Player_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Match` (
    `id` CHAR(36) NOT NULL,
    `matchCode` VARCHAR(255) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `endedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Match_matchCode_key`(`matchCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` CHAR(36) NOT NULL,
    `matchId` CHAR(36) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `killerId` CHAR(36) NULL,
    `victimId` CHAR(36) NOT NULL,
    `weapon` VARCHAR(50) NULL,
    `isFriendly` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Event_killerId_idx`(`killerId`),
    INDEX `Event_victimId_idx`(`victimId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchPlayerStats` (
    `id` CHAR(36) NOT NULL,
    `matchId` CHAR(36) NOT NULL,
    `playerId` CHAR(36) NOT NULL,
    `frags` INTEGER NOT NULL DEFAULT 0,
    `deaths` INTEGER NOT NULL DEFAULT 0,
    `maxStreak` INTEGER NOT NULL DEFAULT 0,
    `awards` JSON NOT NULL,
    `favoriteWeapon` VARCHAR(50) NULL,

    INDEX `MatchPlayerStats_matchId_idx`(`matchId`),
    INDEX `MatchPlayerStats_playerId_idx`(`playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchPlayerTeam` (
    `id` CHAR(36) NOT NULL,
    `matchId` CHAR(36) NOT NULL,
    `playerId` CHAR(36) NOT NULL,
    `team` ENUM('RED', 'BLUE') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_killerId_fkey` FOREIGN KEY (`killerId`) REFERENCES `Player`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_victimId_fkey` FOREIGN KEY (`victimId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchPlayerStats` ADD CONSTRAINT `MatchPlayerStats_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchPlayerStats` ADD CONSTRAINT `MatchPlayerStats_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchPlayerTeam` ADD CONSTRAINT `MatchPlayerTeam_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchPlayerTeam` ADD CONSTRAINT `MatchPlayerTeam_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
