'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import MatchPrintPageContent from '@/components/MatchPrintPageContent';

export default function MatchPrintPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: matchData, isLoading } = useSWR(`/api/match/${id}`);
  return (
    <MatchPrintPageContent
      matchData={matchData}
      isLoading={isLoading}
      className="px-4 pb-10"
    />
  );
}
