import { useContext, useState } from "react"
import { DataContext } from "../../context/DataContext"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"

const Login = () => {
    // Gets global data from the context
    const { crud } = useContext(DataContext)



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

        if(response.status == 401) setError(response.response.data.message)
        if(response.status == 500) setError(response.response.data.error)
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

                {/* <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_OAUTH2}>
                    <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={handleGoogleLoginFailure}
                    />
                </GoogleOAuthProvider> */}
        </form>
    )
}

export default Login