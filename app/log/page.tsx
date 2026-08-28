// /log
//
// This was the audit trail until Phase 4 renamed it. The page now lives at
// /evidence, with a summary strip naming the endpoint, the venue, the accepted
// and queued counts and the models that answered, because that is what the WEEX
// AI participation rule is actually decided on.
//
// The redirect stays rather than the route being deleted: the Phase 1 deploy has
// been sharing /log, and a judge following an old link should land on the page
// rather than on a 404. There is exactly one audit surface, and it is /evidence.

import { redirect } from "next/navigation";

export default function LogPage() {
  redirect("/evidence");
}
