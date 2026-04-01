'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface StreamingTextProps {
  text: string;
  /** Show the blinking cursor at the end of the text */
  showCursor?: boolean;
  className?: string;
}

export default function StreamingText({
  text,
  showCursor = true,
  className,
}: StreamingTextProps) {
  const [cursorVisible, setCursorVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Blink the cursor at 530ms intervals
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {text}
      {showCursor && (
        <span
          aria-hidden="true"
          className={cn(
            'inline-block w-[2px] h-[1.1em] align-middle ml-[1px] rounded-sm bg-current transition-opacity duration-75',
            cursorVisible ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </span>
  );
}
