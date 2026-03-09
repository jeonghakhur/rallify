import { cn } from '@/lib/utils';
import React from 'react';

type TextSplitterProps = {
  text: string;
  width?: number; // ✅ 기본 너비를 설정할 수 있도록 옵션 추가
};

export default function TextSplitter({ text, width = 100 }: TextSplitterProps) {
  return (
    <div
      className={cn('flex', 'justify-between')}
      style={{ width: `${width}px` }}
    >
      {text.split('').map((char, index) => (
        <span key={index}>{char}</span>
      ))}
    </div>
  );
}
