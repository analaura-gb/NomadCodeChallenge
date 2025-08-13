import { Controller, Post, UploadedFile, UseInterceptors, Body, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { MatchesService } from '../services/matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly service: MatchesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: any,
    @Query('mode') mode?: 'preview' | 'ingest',
  ) {
    const content = file?.buffer?.toString('utf8') ?? body?.content ?? '';
    const m = (mode ?? body?.mode ?? 'preview') as 'preview' | 'ingest';
    return m === 'ingest'
      ? this.service.ingest(content)
      : this.service.preview(content);
  }

}
