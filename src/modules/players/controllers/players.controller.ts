import { Controller, Get } from '@nestjs/common';
import { PlayersService } from '../services/players.service';

@Controller('players')
export class PlayersController {
  constructor(private readonly service: PlayersService) {}

  @Get('ranking')
  ranking() {
    return this.service.globalRanking();
  }
}
