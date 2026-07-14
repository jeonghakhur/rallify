'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  name?: string | null | undefined;
  image?: string | null | undefined;
  size?: number | undefined;
};

// 프로필 이미지가 없거나 로드에 실패하면 이니셜 아바타로 폴백
export default function UserAvatar({ name, image, size = 36 }: Props) {
  const [failed, setFailed] = useState(false);
  const initial = (name ?? '?').trim().charAt(0) || '?';

  if (!image || failed) {
    return (
      <span
        aria-hidden
        className="flex items-center justify-center rounded-full bg-court-deep font-extrabold text-ball ring-1 ring-ball/60 select-none"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        {initial}
      </span>
    );
  }

  return (
    <Image
      src={image}
      width={size}
      height={size}
      alt={`${name ?? '사용자'} 프로필 이미지`}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      priority
    />
  );
}
