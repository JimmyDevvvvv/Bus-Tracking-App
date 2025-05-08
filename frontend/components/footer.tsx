"use client";

export function Footer() {
  return (
    <footer className="p-4 text-center text-sm text-muted-foreground">
      <p>© {new Date().getFullYear()} BusTracker. All rights reserved.</p>
    </footer>
  );
} 