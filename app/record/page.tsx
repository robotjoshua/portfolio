import { readArtifacts } from '@/lib/artifacts-server';
import { RecordConsole } from '@/components/RecordConsole';

export const dynamic = 'force-dynamic';

export default async function RecordLandingPage() {
  const artifacts = await readArtifacts();
  return (
    <div className="pw">
      <div className="sh">
        <span className="sl">Record · Experimental Console</span>
        <span className="sc">CH.01–08 · LIVE</span>
      </div>
      <RecordConsole artifacts={artifacts} />
    </div>
  );
}
