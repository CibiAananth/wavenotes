import ThemeToggle from '@/components/ui/theme-toggle';
import { useAuth } from '@/context/user-context';
import { Info as InfoIcon } from '@phosphor-icons/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();

  return (
    <div className="p-3 h-screen">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h2 className="text-3xl font-semibold">Bienvenue!</h2>
      <h3 className="text-md mt-2">
        Create recordings and get transcriptions in real-time
      </h3>

      <div className="mt-4">
        {!user &&
          (session?.access_token ? (
            <p className="text-md">Fetching user details. Please wait</p>
          ) : (
            <div className="flex items-center justify-center w-full mt-5">
              <Alert className="w-1/2" variant="warning">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                  We identified you're a new user. Creating an anonymous account
                  for you to store the recordings.
                </AlertDescription>
              </Alert>
            </div>
          ))}
        {user && (
          <>
            <p className="text-md">
              You are logged in as <strong>{user.name}</strong>
            </p>
            {children}
          </>
        )}
      </div>
    </div>
  );
}
