import { redirect } from 'next/navigation';

// The upload library has been merged into the main /admin page. Keep this
// route as a permanent redirect so bookmarks still work.
export default function AdminUploadRedirect() {
  redirect('/admin');
}
