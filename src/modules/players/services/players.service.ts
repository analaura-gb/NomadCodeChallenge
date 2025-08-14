import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async globalRanking() {
    const agg = await this.prisma.matchPlayerStats.groupBy({
      by: ['playerId'],
      _sum: { frags: true, deaths: true },
    });

    const ids = agg.map(a => a.playerId);
    const players = await this.prisma.player.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const nameById = new Map(players.map(p => [p.id, p.name]));

    return agg
      .map(a => ({
        playerId: a.playerId,
        name: nameById.get(a.playerId) ?? '(unknown)',
        total_frags: a._sum.frags ?? 0,
        total_deaths: a._sum.deaths ?? 0,
      }))
      .sort((x, y) =>
        (y.total_frags - x.total_frags) ||
        (x.total_deaths - y.total_deaths) ||
        x.name.localeCompare(y.name)
      );
  }
}
