"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { parseUserFromToken } from "@/lib/auth";

// dynamically load ChatWindow only on client
const ChatWindow = dynamic(
  () => import("@/components/ChatWindow"),
  { ssr: false }
);

export default function StudentChatPage() {
  const params = useParams();
  const busId = Array.isArray(params.busId) ? params.busId[0] : params.busId;
  const router = useRouter();
  const user = parseUserFromToken();
  console.log("StudentChatPage user:", user?.id);

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  if (!user || !busId) return null;

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 border-b bg-gray-800 text-white">
        <h1 className="text-xl font-semibold">Chat with Driver</h1>
      </header>
      <div className="flex-1">
        <ChatWindow
          chatRoomId={user?.id}
          userId={user.id}
          userName={user.name}
        />
      </div>
    </div>
  );
}
