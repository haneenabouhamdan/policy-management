import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyType } from '../entities/policy-type.entity';
import { PolicyTypesController } from './policy-types.controller';
import { PolicyTypesService } from './policy-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([PolicyType])],
  controllers: [PolicyTypesController],
  providers: [PolicyTypesService],
  exports: [PolicyTypesService],
})
export class PolicyTypesModule {}
