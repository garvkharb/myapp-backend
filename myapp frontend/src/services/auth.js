import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const configureGoogle = () => {
  GoogleSignin.configure({
    webClientId: '331786539869-gctldb7de9tvvbd5nu81bstrstdsmt1d.apps.googleusercontent.com.apps.googleusercontent.com', // from Google Cloud Console
  });
};

export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.data.idToken;

  // Send to backend for verification + JWT
  const { access_token, user } = await api.post('/auth/google', { id_token: idToken });
  await AsyncStorage.setItem('jwt_token', access_token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  return user;
};

export const signOut = async () => {
  await GoogleSignin.signOut();
  await AsyncStorage.multiRemove(['jwt_token', 'user']);
};

export const getStoredUser = async () => {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
