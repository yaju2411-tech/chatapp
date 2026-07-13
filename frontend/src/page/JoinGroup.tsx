import { useParams, useNavigate } from "react-router-dom";
import { useJoinGroupByLink } from "@/hooks/groupHook/useGroup";
import { Button } from "@/components/ui/button";
import { Users, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";

export const JoinGroup = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const joinMutation = useJoinGroupByLink();

  const handleJoin = () => {
    if (!inviteCode) return;
    joinMutation.mutate(
      { inviteCode },
      {
        onSuccess: (data) => {
          if (data?.conversation?._id) {
            navigate(`/home?chatId=${data.conversation._id}`);
          } else {
            navigate("/home");
          }
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-4">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center">
        {/* Colorful Gradient Icon Container */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 p-0.5 shadow-xl shadow-indigo-500/10 mb-6">
          <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center">
            <Users className="h-10 w-10 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">Group Invitation</h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-xs mx-auto">
          You have been shared an invitation code to join a group chat room.
        </p>

        {joinMutation.isError ? (
          <div className="w-full mt-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2.5 justify-center">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Invalid or expired invite link. Please ask for a new link.</span>
          </div>
        ) : null}

        <div className="w-full mt-8 space-y-3">
          <Button
            onClick={handleJoin}
            disabled={joinMutation.isPending || !inviteCode}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            {joinMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining Conversation...
              </>
            ) : (
              <>
                Accept Invitation & Join
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/home")}
            className="w-full text-zinc-400 hover:bg-zinc-900 hover:text-white h-11 rounded-xl cursor-pointer"
          >
            Cancel & Go Home
          </Button>
        </div>
      </div>
    </div>
  );
};
