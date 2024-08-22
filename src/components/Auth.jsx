import { auth, provider } from '../firebase-config.js'
import { signInWithPopup } from 'firebase/auth'

import '../styles/Auth.css'

import Cookies from 'universal-cookie'
const cookies = new Cookies();

export const Auth = ({ setIsAuthenticated }) => {
    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, provider)
            cookies.set("auth-token", result.user.refreshToken)
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