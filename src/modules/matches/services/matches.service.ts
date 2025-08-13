import { Injectable, BadRequestException } from '@nestjs/common';
import { LogParserService } from './log-parser.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MatchesService {
  constructor(private readonly parser: LogParserService,
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

}
