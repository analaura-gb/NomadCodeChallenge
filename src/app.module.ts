import { Module } from '@nestjs/common';
import { MatchesModule } from './modules/matches/matches.module';
import { PrismaModule } from './prisma/prisma.module';
import { PlayersModule } from './modules/players/players.module';

@Module({ imports: [PrismaModule, MatchesModule, PlayersModule] })
export class AppModule {}
