import { useContext, useEffect, useState } from "react"
import { DataContext } from "../../context/DataContext"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"

const Login = () => {
    // Gets global data from the context
    const { crud, access, setAccess, navigate } = useContext(DataContext)



    // Redirects user if they are already logged in
    useEffect(() => {
       if(access) navigate('/')
    }, [access])



    // Holds the state for the form
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)



    // Sends a register request to the backend
    const handleSubmit = async (e) => {
        e.preventDefault()

        const response = await crud({
            url: '/auth/login',
            method: 'post',
            body: {
                email,
                password,
            }
        })

        console.log(response)

        if(response.status == 200) {
            localStorage.setItem('access', response.data.token)
            setAccess(response.data.token)
            navigate('/')
        }

        if(response.status == 401) setError(response.response.data.message)
        if(response.status == 500) setError(response.response.data.error)
    }



    // Sends a google login request to the backend
    const handleGoogleLoginSuccess = async (credentials) => {
        const token = credentials.credential
        console.log(token)
    }

    const handleGoogleLoginFailure = async () => {
        console.log('Error')
    }



    return (
        <form onSubmit={(e) => handleSubmit(e)}>
            {
                error &&
                <p className="error">{error}</p>
            }

            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            <button type="submit">Login</button>

                <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_OAUTH2}>
                    <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={handleGoogleLoginFailure}
                    />
                </GoogleOAuthProvider>
        </form>
    )
}

export default Login