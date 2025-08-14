import { Module } from '@nestjs/common';
import { MatchesController } from './controllers/matches.controller';
import { MatchesService } from './services/matches.service';
import { LogParserService } from './services/log-parser.service';
import { StatsService } from './services/stats.service';

@Module({
  controllers: [MatchesController],
  providers: [MatchesService, LogParserService, StatsService],
})
export class MatchesModule {}
