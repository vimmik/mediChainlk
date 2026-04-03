'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { Button, Avatar, AvatarFallback } from '@medichainlk/ui';

export function TopBar() {
  const { user } = useAuthStore();

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-green-100 text-green-700">
            {user?.email?.charAt(0).toUpperCase() ?? 'P'}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-gray-600">{user?.email}</span>
        <Button variant="ghost" size="sm" onClick={() => signOut(auth)}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
