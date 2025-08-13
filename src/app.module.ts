import { Module } from '@nestjs/common';
import { MatchesModule } from './modules/matches/matches.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({ imports: [PrismaModule, MatchesModule] })
export class AppModule {}
