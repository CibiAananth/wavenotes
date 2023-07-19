import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const randomUsername = () => {
  return `U${Math.random().toString().slice(-3)}${Date.now()
    .toString()
    .slice(-5)}@acme.com`;
};

const randomPassword = () => {
  return Math.random().toString(36).slice(-8);
};

type SessionType = Partial<Session>;

type UserType = Partial<User> & {
  name: string | undefined;
};

type CredentialsType = {
  email: string;
  password: string;
};

type UserContextType = {
  user: UserType | null;
  session: SessionType | null;
  logoutUser: () => void;
};

export const UserContext = createContext<UserContextType>({
  user: {} as UserType,
  session: {} as SessionType,
  logoutUser: () => console.warn('no user provider'),
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}): React.ReactNode => {
  const [user, setUser] = useState<UserType | null>(null);
  const [session, setSession] = useState<SessionType | null>(null);

  const logoutUser = useCallback(() => {
    (async () => {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    })();
  }, []);

  const signUp = useCallback(async ({ email, password }: CredentialsType) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      throw new Error('Could not create user');
    }
    return data;
  }, []);

  const createNewUser = useCallback(async () => {
    const username = randomUsername();
    const credentials: CredentialsType = {
      email: username,
      password: randomPassword(),
    };
    const { user, session } = await signUp(credentials);
    const newUser = { name: user?.email, email: user?.email, id: user?.id };
    setUser(newUser);
    setSession(session);
  }, [signUp]);

  useLayoutEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw new Error('Could not get session');
      }
      if (!data.session?.access_token) {
        // simple check to see if the session is valid
        await createNewUser();
        return;
      }
      setSession(data.session);

      const { data: { user: userData } = {}, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        console.error('Could not get user', userError);
        if (userError.status === 404) {
          await createNewUser();
          return;
        }
      }
      // simple check to see if the user is valid
      if (userData?.id) {
        const newUser = {
          name: userData.email,
          email: userData.email,
          id: userData.id,
        };
        setUser(newUser);
      }
    })();
  }, [createNewUser]);

  return (
    <UserContext.Provider value={{ user: user, logoutUser, session: session }}>
      {children}
    </UserContext.Provider>
  );
};

export const useAuth = (): UserContextType => useContext(UserContext);
