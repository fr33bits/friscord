import { auth, provider } from '../firebase-config.js'
import { signInWithPopup } from 'firebase/auth'

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
        <div className="auth">
            <p>Prijava</p>
            <button onClick={signInWithGoogle}>Prijava z Google računom</button>
        </div>
    )
}