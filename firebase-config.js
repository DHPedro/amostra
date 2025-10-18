
const firebaseConfig = {
    apiKey: "AIzaSyD9T70fiVV0IrHss6Z0oKxbkzreoXJpj8Y", 
    authDomain: "amostra-8df52.firebaseapp.com",
    databaseURL: "https://amostra-8df52-default-rtdb.firebaseio.com/", 
    projectId: "amostra-8df52",
    storageBucket: "amostra-8df52.firebasestorage.app",
    messagingSenderId: "355389848897",
    appId: "1:355389848897:web:8b98673e3ed8a7c9deb5c0"
};


const app = firebase.initializeApp(firebaseConfig);
const database = app.database();
