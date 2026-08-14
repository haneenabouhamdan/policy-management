import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyType } from '../entities/policy-type.entity';
import { PolicyTypeEvent } from '../entities/policy-type-event.entity';
import { PolicyTypesController } from './policy-types.controller';
import { PolicyTypesService } from './policy-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([PolicyType, PolicyTypeEvent])],
  controllers: [PolicyTypesController],
  providers: [PolicyTypesService],
  exports: [PolicyTypesService],
})
export class PolicyTypesModule {}
