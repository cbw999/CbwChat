import type { Logger as WinstonLogger } from 'winston';
import type { RunnableConfig } from '@langchain/core/runnables';

export type SearchRefType = 'search' | 'image' | 'news' | 'video' | 'ref';

export enum DATE_RANGE {
  PAST_HOUR = 'h',
  PAST_24_HOURS = 'd',
  PAST_WEEK = 'w',
  PAST_MONTH = 'm',
  PAST_YEAR = 'y',
}