import { readCombinedArtifacts } from '@/lib/combined-artifacts';
import { RecordConsole } from '@/components/RecordConsole';
import { ViewerFrame } from '@/components/ViewerFrame';
import { pad } from '@/lib/kinds';

export const dynamic = 'force-dynamic';

export default async function RecordLandingPage() {
  const artifacts = await readCombinedArtifacts();
  const nowLabel = new Date().toISOString().slice(0, 10);
  return (
    <ViewerFrame
      meta={`${pad(artifacts.length, 3)} FEED`}
      date={nowLabel}
      currentLabel="RECORD"
      prev={{ label: 'CATALOG', href: '/catalog' }}
      next={[
        { label: 'OPERATOR', href: '/operator' },
        { label: 'INDEX', href: '/' },
      ]}
    >
      <div className="rec-viewer-inner">
        <RecordConsole artifacts={artifacts} />
      </div>
    </ViewerFrame>
  );
}
