import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { MatchesService } from '../services/matches.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly service: MatchesService,
              private readonly prisma: PrismaService
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    const content = file?.buffer?.toString('utf8') ?? '';
    return this.service.preview(content);
  }

  @Get('test-db')
  async testDb() {
    // faz uma consulta simples só pra verificar a conexão
    const matches = await this.prisma.match.findMany({ take: 1 });
    return { ok: true, count: matches.length, sample: matches };
  }
}
