import { lazy, Suspense } from 'react';

// Agentation: point at the thing that looks wrong, copy the structured note, paste it to the agent. Dev only; never shipped.
const Agentation = lazy(() => import('agentation').then((m) => ({ default: m.Agentation })));

export default function DevTools() {
  if (!import.meta.env.DEV) return null;
  return (
    <Suspense fallback={null}>
      <Agentation />
    </Suspense>
  );
}
