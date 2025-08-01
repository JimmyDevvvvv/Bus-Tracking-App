"use client";
import { useParams, useRouter } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import { parseUserFromToken } from "@/lib/auth";
import { useEffect } from "react";

export default function DriverChatPage() {
  const params = useParams();
  const busId = Array.isArray(params.busId) ? params.busId[0] : params.busId;     // <-- same param name as the student page
  const router    = useRouter();
  const user      = parseUserFromToken();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  if (!user || !busId) return null;

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 border-b bg-gray-800 text-white">
        <h1 className="text-xl font-semibold">Chat with Student</h1>
      </header>
      <div className="flex-1">
        <ChatWindow
          chatRoomId={busId}
          userId={user.id}
          userName={user.name}
        />
      </div>
    </div>
  );
}
