'use client'; // 클라이언트 컴포넌트 설정

import { usePathname } from 'next/navigation';
import NavBar from '@/components/Navbar';

export default function ConditionalNavBar() {
  const pathname = usePathname();
  const isStudioPage = pathname?.startsWith('/studio');

  return !isStudioPage ? <NavBar /> : null;
}
