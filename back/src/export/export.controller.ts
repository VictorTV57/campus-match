import {
  Controller,
  Get,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportQueryDto } from './dto/export-query.dto';
import { ExportService } from './export.service';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exporter: ExportService) {}

  /**
   * Tableur CSV ou Excel : ?kind=catalog (toutes les universités, sans
   * données perso) ou ?kind=swipes (mes swipes, classés et colorés).
   */
  @Get('universities')
  async universities(
    @CurrentUser() user: JwtPayload,
    @Query() query: ExportQueryDto,
  ): Promise<StreamableFile> {
    const file = await this.exporter.build(user.sub, {
      kind: query.kind,
      format: query.format,
      lang: query.lang ?? 'fr',
    });
    return new StreamableFile(file.content, {
      type: file.contentType,
      disposition: `attachment; filename="${file.filename}"`,
      length: file.content.length,
    });
  }
}
