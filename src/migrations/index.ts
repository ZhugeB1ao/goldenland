import * as migration_20260420_024240_sync_schema from './20260420_024240_sync_schema';

export const migrations = [
  {
    up: migration_20260420_024240_sync_schema.up,
    down: migration_20260420_024240_sync_schema.down,
    name: '20260420_024240_sync_schema'
  },
];
