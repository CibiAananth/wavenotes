import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

import { randomPassword, randomUsername } from './util';

type SessionType = Partial<Session>;

type UserType = Partial<User> & {
  name: string | undefined;
};

type CredentialsType = {
  email: string;
  password: string;
};

type SignUpData = {
  username: string;
};

type SignUpOptions =
  | {
      data: SignUpData;
    }
  | Record<string, never>;

type UserContextType = {
  user: UserType | null;
  session: SessionType | null;
  logoutUser: () => void;
};

export const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
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

  const signUp = useCallback(
    async (credentials: CredentialsType, options: SignUpOptions = {}) => {
      const { data, error } = await supabase.auth.signUp({
        ...credentials,
        options,
      });

      if (error) {
        throw new Error('Could not create user');
      }
      return data;
    },
    [],
  );

  const createNewUser = useCallback(async () => {
    const username = randomUsername();
    const credentials: CredentialsType = {
      email: `${username}@acme.com`,
      password: randomPassword(),
    };
    const { user, session } = await signUp(credentials, {
      data: {
        username,
      },
    });
    const newUser = { name: username, email: user?.email, id: user?.id };
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
          name: userData?.user_metadata?.username ?? userData.email,
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
