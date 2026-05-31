import { useUser, useClerk } from "@clerk/react";
import { Clock, Mail, LogOut } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function PendingApproval() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-5">
          <Clock className="w-7 h-7 text-amber-600" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">Pending Admin Approval</h1>
        <p className="text-slate-500 text-sm mb-5">
          Your account <span className="font-medium text-slate-700">{user?.primaryEmailAddress?.emailAddress}</span> has
          been received and is awaiting review by an Affinity Risk administrator.
        </p>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">What happens next</div>
          <div className="text-sm text-slate-600">
            An Affinity Risk admin will review your request, assign your role (Club or Shop Owner), and activate your account.
            You'll be able to sign in and access your data once approved.
          </div>
        </div>

        <a
          href="mailto:ahughes@affinityrisk.com"
          className="flex items-center justify-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium mb-6"
        >
          <Mail className="w-4 h-4" />
          Contact ahughes@affinityrisk.com to expedite
        </a>

        <button
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
