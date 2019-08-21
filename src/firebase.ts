/// <reference lib="dom" />
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCZpWrZEnAFoDKNWTg0Uq-smXjkSGRKbm4',
  authDomain: 'evil-bot.firebaseapp.com',
  databaseURL: 'https://evil-bot.firebaseio.com',
  projectId: 'evil-bot',
  storageBucket: '',
  messagingSenderId: '1064630954863',
  appId: '1:1064630954863:web:923118db1feac5ce',
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();

export { auth, firestore };
