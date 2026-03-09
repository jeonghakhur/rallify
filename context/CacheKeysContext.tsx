'use client';

import { createContext, useContext } from 'react';

type CacheKeyValue = {
  scheduleKey: string;
};

export const CacheKeyContext = createContext<CacheKeyValue>({
  scheduleKey: '/api/schedule',
});

export const useCacheKeys = () => useContext(CacheKeyContext);
