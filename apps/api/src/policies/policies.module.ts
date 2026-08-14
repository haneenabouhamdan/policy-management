import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policy } from '../entities/policy.entity';
import { PolicyEvent } from '../entities/policy-event.entity';
import { PolicyType } from '../entities/policy-type.entity';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Policy, PolicyType, PolicyEvent])],
  controllers: [PoliciesController],
  providers: [PoliciesService],
})
export class PoliciesModule {}
