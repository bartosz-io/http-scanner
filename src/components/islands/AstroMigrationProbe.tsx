import { useState } from 'react';

export function AstroMigrationProbe() {
  const [verified, setVerified] = useState(false);

  return (
    <button
      type="button"
      className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium"
      onClick={() => setVerified(true)}
    >
      {verified ? 'React hydration verified' : 'Verify React hydration'}
    </button>
  );
}
