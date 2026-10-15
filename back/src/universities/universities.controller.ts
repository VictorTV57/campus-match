import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UniversitiesService,
  type UniversityFilters,
} from './universities.service';
import type { UniversityDetail } from './university.mapper';

@Controller('universities')
@UseGuards(JwtAuthGuard)
export class UniversitiesController {
  constructor(private readonly universities: UniversitiesService) {}

  /** Pays, langues et spécialisations disponibles (questionnaire). */
  @Get('filters')
  filters(): Promise<UniversityFilters> {
    return this.universities.filters();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UniversityDetail> {
    return this.universities.findOne(id);
  }
}
