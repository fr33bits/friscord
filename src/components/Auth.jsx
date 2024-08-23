import { auth, provider, db } from '../firebase-config.js'
import { signInWithPopup } from 'firebase/auth'

import { addDoc, collection, serverTimestamp, where, getDocs, query } from 'firebase/firestore'


import '../styles/Auth.css'

import Cookies from 'universal-cookie'
const cookies = new Cookies();

export const Auth = ({ setIsAuthenticated, setAuthenticatedUser }) => {
    const usersRef = collection(db, 'users')

    const addUser = async (user) => {
        // user.preventDefault()
        try {
            const userData = {
                id_local: user.localId,
                origin: "friscord",
                id_global: auth.currentUser.uid + '@friscord',
                createdAt: serverTimestamp(),
                name: user.displayName,
                email: user.email,
                email_verified: user.emailVerified,
                photo_url: user.photoUrl,
                last_login: user.lastLoginAt,
                last_refresh: user.lastRefreshAt
            }
            await addDoc(usersRef, userData)
            return userData;
        } catch (err) {
            console.error(err)
        }
    }

    const getUser = async (user_id) => {
        const q = query(usersRef, where("id_local", "==", user_id))
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map(doc => doc.data());
        return users;
    }

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, provider)

            var authenticatedUser = await getUser(result.user.reloadUserInfo.localId); // if no user with this ID exists, an empty array is returned
            if (authenticatedUser.length == 0) { // the user with this ID does not exist and must thus be added to the database
                authenticatedUser = await addUser(result.user.reloadUserInfo)
            } else {
                authenticatedUser = authenticatedUser[0] // converts the initial array to a single element
            }

            cookies.set("auth-token", result.user.refreshToken)
            cookies.set("auth-user", authenticatedUser)
            setAuthenticatedUser(authenticatedUser)
            setIsAuthenticated(true)
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className='auth-container'>
            <div className='service-name auth-service-name'>
                FRISCORD
            </div>
            <div className="auth gradient">
                <div className='auth-card-container'>
                    <div className='auth-card'>
                        {/* <div className='auth-card-item login-text'>
                            Log in to Friscord
                        </div> */}
                        <button onClick={signInWithGoogle} className="auth-card-item google-sign-in-button">
                            <img
                                src="https://raw.githubusercontent.com/firebase/firebaseui-web/5ff6fde2324d95d976e35ef1986ac5f241d3774e/image/google.svg"
                                alt="Google logo"
                                className="google-logo"
                            />
                            Sign in with Google
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}