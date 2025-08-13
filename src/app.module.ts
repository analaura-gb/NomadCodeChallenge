import { Module } from '@nestjs/common';
import { MatchesModule } from './modules/matches/matches.module';

@Module({ imports: [MatchesModule] })
export class AppModule {}
