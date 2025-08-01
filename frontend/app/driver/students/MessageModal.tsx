"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Student {
  id: string;
  name: string;
  pickupTime: string;
  pickupLocation: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

export default function MessageModal({ isOpen, onClose, student }: Props) {
  const [message, setMessage] = useState("");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {student.name}</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            onClick={() => {
              alert(`Message sent to ${student.name}: ${message}`);
              onClose();
              setMessage("");
            }}
          >
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
