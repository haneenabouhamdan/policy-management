import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { installTenantQueryRunnerPatch } from './tenant-query-runner';

@Injectable()
export class TenantQueryRunnerPatchService implements OnModuleInit {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  onModuleInit() {
    installTenantQueryRunnerPatch(this.dataSource);
  }
}
