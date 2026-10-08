'use client';
import { useEffect, useState } from 'react';
import Link from './doc-link';

export function useReducedMotion() {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

// A status line only; the reduced-motion section carries the explanation.
export function MotionPreference() {
  const reduced = useReducedMotion();
  return <p className="motion-preference" role="status" data-motion-preference={reduced === null ? 'pending' : reduced ? 'reduce' : 'no-preference'}>
    <span className="motion-preference-dot" aria-hidden="true" />
    현재 브라우저의 동작 줄이기: <strong>{reduced === null ? '확인 중' : reduced ? '켜짐' : '꺼짐'}</strong>
    <span className="motion-preference-note">예제에 바로 반영됩니다.</span>
    <Link href="#reduced-motion">달라지는 점</Link>
  </p>;
}
