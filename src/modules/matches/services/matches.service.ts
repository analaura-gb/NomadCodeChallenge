import { Injectable, BadRequestException } from '@nestjs/common';
import { LogParserService } from './log-parser.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MatchesService {
  constructor(
    private readonly parser: LogParserService,
    private readonly prisma: PrismaService,
  ) {}

  async preview(content: string) {
    if (!content?.trim()) throw new BadRequestException('Arquivo vazio');

    await this.prisma.$queryRawUnsafe('SELECT 1');

    const { events, unknownLines } = this.parser.parse(content);

    const counts = { START: 0, JOIN: 0, KILL: 0, WORLD: 0, END: 0 };
    const matches: Record<string, { starts: number; ends: number }> = {};

    for (const e of events) {
      counts[e.type]++;
      if (e.type === 'START' || e.type === 'END') {
        const code = (e as any).matchCode;
        matches[code] ??= { starts: 0, ends: 0 };
        if (e.type === 'START') matches[code].starts++;
        if (e.type === 'END')   matches[code].ends++;
      }
    }

    const sanity = Object.entries(matches).map(([code, v]) => ({
      matchCode: code, started: v.starts, ended: v.ends, ok: v.starts === v.ends && v.starts > 0,
    }));

    return { counts, matches: sanity, unknownLines, sample: events.slice(0, 10) };
  }

  async ingest(content: string) {
    if (!content?.trim()) throw new BadRequestException('Arquivo vazio');
    const { events } = this.parser.parse(content);

    let currentMatchId: string | null = null;
    let currentMatchCode: string | null = null;

    let upsertedMatches = 0;
    let upsertedPlayers = 0;
    let upsertedTeams = 0;
    let insertedEvents = 0;
    let closedMatches = 0;

    for (const e of events) {
      if (e.type === 'START') {
        const match = await this.prisma.match.upsert({
          where: { matchCode: e.matchCode },
          create: { matchCode: e.matchCode, startedAt: e.ts, endedAt: null },
          update: { startedAt: e.ts, endedAt: null },
        });
        currentMatchId = match.id;
        currentMatchCode = match.matchCode;
        upsertedMatches++;
        continue;
      }

      if (!currentMatchId) {
        throw new BadRequestException(`Evento ${e.type} antes de START no log`);
      }

      if (e.type === 'JOIN') {
        const player = await this.prisma.player.upsert({
          where: { name: e.player },
          update: {},
          create: { name: e.player },
        });
        upsertedPlayers++;

        const totalInMatch = await this.prisma.matchPlayerTeam.count({
          where: { matchId: currentMatchId! },
        });
        if (totalInMatch >= 20) {
          throw new BadRequestException(`Limite de 20 jogadores atingido na partida ${currentMatchCode}`);
        }

        const teamUpper = e.team.toUpperCase() as 'RED' | 'BLUE';
        const teamCount = await this.prisma.matchPlayerTeam.count({
          where: { matchId: currentMatchId!, team: teamUpper },
        });
        if (teamCount >= 10) {
          throw new BadRequestException(`Time ${teamUpper} está cheio na partida ${currentMatchCode}`);
        }

        await this.prisma.matchPlayerTeam.upsert({
          where: { matchId_playerId: { matchId: currentMatchId!, playerId: player.id } },
          update: { team: teamUpper },
          create: { matchId: currentMatchId!, playerId: player.id, team: teamUpper },
        });
        upsertedTeams++;
        continue;
      }

      if (e.type === 'KILL') {
        const killer = await this.prisma.player.upsert({
          where: { name: e.killer }, update: {}, create: { name: e.killer },
        });
        const victim = await this.prisma.player.upsert({
          where: { name: e.victim }, update: {}, create: { name: e.victim },
        });

        await this.prisma.event.create({
          data: {
            matchId: currentMatchId,
            timestamp: e.ts,
            killerId: killer.id,
            victimId: victim.id,
            weapon: e.weapon,     
            isFriendly: false,
          },
        });
        insertedEvents++;
        continue;
      }

      if (e.type === 'WORLD') {
        const victim = await this.prisma.player.upsert({
          where: { name: e.victim }, update: {}, create: { name: e.victim },
        });

        await this.prisma.event.create({
          data: {
            matchId: currentMatchId,
            timestamp: e.ts,
            killerId: null,
            victimId: victim.id,
            weapon: null,
            isFriendly: false,
          },
        });
        insertedEvents++;
        continue;
      }

      if (e.type === 'END') {
        await this.prisma.match.update({
          where: { matchCode: e.matchCode },
          data: { endedAt: e.ts },
        });
        currentMatchId = null;
        currentMatchCode = null;
        closedMatches++;
        continue;
      }
    }

    
    return {
      ok: true,
      upsertedMatches,
      upsertedPlayers,
      upsertedTeams,
      insertedEvents,
      closedMatches
    };
  }

}
