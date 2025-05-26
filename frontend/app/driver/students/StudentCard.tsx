"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Student {
  id: string;
  name: string;
  pickupTime: string;
  pickupLocation: string;
}

interface Props {
  student: Student;
  onMessage: () => void;
}

export default function StudentCard({ student, onMessage }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{student.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Pickup: {student.pickupLocation}</p>
        <p className="text-sm text-muted-foreground">Time: {student.pickupTime}</p>
        <Button size="sm" onClick={onMessage} className="mt-2">
          Message
        </Button>
      </CardContent>
    </Card>
  );
}
