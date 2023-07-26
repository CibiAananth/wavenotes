import {
  CircleNotch as CircleNotchIcon,
  Info as InfoIcon,
  Question as QuestionIcon,
} from '@phosphor-icons/react';

import { useAuth } from '@/context/auth-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import ThemeToggle from '@/components/ui/theme-toggle';
import { Toaster } from '@/components/ui/toaster';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();

  return (
    <div className="h-screen p-5">
      <Toaster />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold">Hello!</h2>
        <ThemeToggle />
      </div>
      <h3 className="text-md mt-2">Speech to text in real-time.</h3>

      <div className="mt-4">
        {!user &&
          (session?.access_token ? (
            <p className="text-md">Fetching user details. Please wait</p>
          ) : (
            <div className="mt-5 flex w-full flex-col items-center justify-center gap-10">
              <Alert className="w-1/2" variant="warning">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                  We identified you're a new user. Creating an anonymous account
                  for you to store the recordings.
                </AlertDescription>
              </Alert>
              <CircleNotchIcon className="h-7 w-7 animate-spin" />
            </div>
          ))}
        {user && (
          <>
            <div className="flex items-center">
              <p className="text-sm text-muted-foreground">
                You are logged in as
                <strong>{` "${user.name}"`}</strong>
              </p>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <QuestionIcon className="ml-1 hover:cursor-pointer" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <>
                    <p className="text-xs">
                      To enable an experience for storing and retrieving
                      recordings, an <mark>anonymous user</mark> is created for
                      you automatically.
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Note: You will be able to view the recording only in the
                      browser where you recorded them
                    </p>
                  </>
                </HoverCardContent>
              </HoverCard>
            </div>
            {children}
          </>
        )}
      </div>
    </div>
  );
}
