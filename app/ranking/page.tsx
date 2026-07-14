'use client';

import { Container } from '@/components/Layout';
import LatestGameRanking from '@/components/LatestGameRanking';
import StatsTable from '@/components/StatsTable';
import useAuthRedirect from '@/hooks/useAuthRedirect';

export default function Page() {
  const { isLoading } = useAuthRedirect('/');
  if (isLoading) return null;

  return (
    <Container>
      <div className="flex flex-col gap-4">
        <h2 className="px-1 text-2xl font-black tracking-tight">
          랭킹
          <span className="ml-2 text-xs font-bold text-muted-foreground">
            승점 = 승 2점 · 무 1점
          </span>
        </h2>
        <StatsTable />
        <LatestGameRanking />
      </div>
    </Container>
  );
}
