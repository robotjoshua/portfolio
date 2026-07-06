import Link from 'next/link';
import { readProfile } from '@/lib/profile-server';
import { ProfileForm } from '@/components/admin/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  const profile = await readProfile();
  return (
    <div className="adm-wrap">
      <div className="adm-h">
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <h1>Profile</h1>
          <span className="sub">identity · build · skills · cv</span>
        </div>
        <div className="adm-tools">
          <Link href="/operator" className="adm-btn ghost">View Operator</Link>
          <Link href="/admin" className="adm-btn ghost">← Back</Link>
        </div>
      </div>
      <ProfileForm initial={profile} />
    </div>
  );
}
