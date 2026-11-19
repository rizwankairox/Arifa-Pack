'use client';
// If an Arabic page crashes while loading, this shows instead. The page itself is src/views/error.tsx.
import { ErrorView } from '@/views/error';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView locale="ar" error={error} reset={reset} />;
}
