import { type SchemaTypeDefinition } from 'sanity';
import { user } from './user';
import { courtSchedule } from './courtSchedule';
import { gameResult } from './games';
import { gameStatsPeriod } from './gameStatsPeriod';
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [user, courtSchedule, gameResult, gameStatsPeriod],
};
