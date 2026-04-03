import { useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { useAuthStore } from '@/store/authStore';
import { setAuthToken } from '@/lib/api';

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setAuthToken(token);
        setUser({
          uid: firebaseUser.uid,
          phone: firebaseUser.phoneNumber,
          email: firebaseUser.email,
        });
      } else {
        setAuthToken(null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  return { user, loading };
}
