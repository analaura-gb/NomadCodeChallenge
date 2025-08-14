import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../../generated/prisma';

type OnePlayerState = {
  team: 'RED' | 'BLUE';
  frags: number;
  deaths: number;
  streak: number;
  maxStreak: number;
  awards: Set<string>;
  weaponCount: Map<string, number>;
  killTimes: Date[];
};

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async computeForMatch(matchId: string) {
    const roster = await this.prisma.matchPlayerTeam.findMany({
      where: { matchId },
      select: { playerId: true, team: true },
    });

    const events = await this.prisma.event.findMany({
      where: { matchId },
      orderBy: { timestamp: 'asc' },
      select: { killerId: true, victimId: true, timestamp: true, isFriendly: true, weapon: true },
    });

    const state = new Map<string, OnePlayerState>();
    for (const r of roster) {
      state.set(r.playerId, {
        team: r.team as 'RED' | 'BLUE',
        frags: 0,
        deaths: 0,
        streak: 0,
        maxStreak: 0,
        awards: new Set<string>(),
        weaponCount: new Map<string, number>(),
        killTimes: [],
      });
    }

    for (const e of events) {
      if (e.killerId) {
        if (!state.has(e.killerId)) {
          state.set(e.killerId, {
            team: 'RED',
            frags: 0, deaths: 0, streak: 0, maxStreak: 0,
            awards: new Set(), weaponCount: new Map(), killTimes: [],
          });
        }
        const k = state.get(e.killerId)!;

        if (e.isFriendly) {
          k.frags -= 1;
        } else {
          k.frags += 1;
          k.streak += 1;
          if (k.streak > k.maxStreak) k.maxStreak = k.streak;

          if (e.weapon) {
            k.weaponCount.set(e.weapon, (k.weaponCount.get(e.weapon) ?? 0) + 1);
          }

          k.killTimes.push(e.timestamp);
          const cutoff = e.timestamp.getTime() - 60_000;
          while (k.killTimes.length && k.killTimes[0].getTime() < cutoff) k.killTimes.shift();
          if (k.killTimes.length >= 5) k.awards.add('Rampage-5-in-1m');
        }
      }

      if (e.victimId) {
        if (!state.has(e.victimId)) {
          state.set(e.victimId, {
            team: 'RED',
            frags: 0, deaths: 0, streak: 0, maxStreak: 0,
            awards: new Set(), weaponCount: new Map(), killTimes: [],
          });
        }
        const v = state.get(e.victimId)!;
        v.deaths += 1;
        v.streak = 0;
      }
    }

    let redScore = 0, blueScore = 0;
    for (const s of state.values()) {
      if (s.team === 'RED') redScore += s.frags;
      else blueScore += s.frags;
    }
    const winners = redScore > blueScore ? new Set(['RED'])
                 : blueScore > redScore ? new Set(['BLUE'])
                 : new Set(['RED', 'BLUE']);

    for (const s of state.values()) {
      if (winners.has(s.team) && s.deaths === 0) {
        s.awards.add('Untouchable');
      }
    }

    await this.prisma.matchPlayerStats.deleteMany({ where: { matchId } });

    const rows: Prisma.MatchPlayerStatsCreateManyInput[] = [];
    for (const [playerId, s] of state.entries()) {
      let favoriteWeapon: string | null = null;
      if (s.weaponCount.size) {
        const sorted = [...s.weaponCount.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        favoriteWeapon = sorted[0][0];
      }
      rows.push({
        matchId,
        playerId,
        frags: s.frags,
        deaths: s.deaths,
        maxStreak: s.maxStreak,
        awards: Array.from(s.awards),
        favoriteWeapon,
      });
    }

    if (rows.length) {
      await this.prisma.matchPlayerStats.createMany({ data: rows });
    }
  }
}
