import { useContext, useEffect, useState } from "react"
import { DataContext } from "../../context/DataContext"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import './login.less'
import { useGoogleLogin } from '@react-oauth/google'


const Login = () => {
    // Gets global data from the context
    const { crud, access, setAccess, navigate } = useContext(DataContext)



    // Redirects user if they are already logged in
    useEffect(() => {
        if (access) navigate('/')
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

        if (response.status == 200) {
            localStorage.setItem('access', response.data.token)
            setAccess(response.data.token)
            navigate('/')
        }

        if (response.status == 401) setError(response.response.data.message)
        if (response.status == 500) setError(response.response.data.error)
    }



    // Sends a google login request to the backend
    const handleGoogleLoginSuccess = async (credentials) => {
        const token = credentials.credential;
        console.log('sending idToken:', token);
        // const response = await crud({
        //     url: '/auth/google/token',
        //     method: 'post',
        //     body: { token }
        // })

        // console.log(response)

        // if (response.status == 200) {
        //     localStorage.setItem('access', response.data.token)
        //     setAccess(response.data.token)
        //     navigate('/')
        // }
        // const res = await fetch('http://127.0.0.1:5000/auth/google', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ token })
        // });
        // const result = await res.json()
        // console.log(res);
        const response = await crud({
            url: '/auth/google/token',
            method: 'post',
            body: {
                token
            }
        })

        if (response.status == 200) {
            localStorage.setItem('access', response.data.token)
            setAccess(response.data.token)
            navigate('/')
        }
    }

    const handleGoogleLoginFailure = async () => {
        console.log('Error')
    }

    const loginWithGoogle = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: async (response) => {
            console.log("Google code login response:", response);
            const { code } = response;

            // Send this code to your backend
            const res = await crud({
                url: '/auth/google/code-exchange', // new backend route
                method: 'post',
                body: { code }
            });

            if (res.status === 200) {
                localStorage.setItem('access', res.data.token);
                setAccess(res.data.token);
                navigate('/');
            } else {
                console.error("Login failed", res);
            }
        },
        onError: () => console.error("Google login failed"),
        scope: 'openid email profile https://www.googleapis.com/auth/calendar',
        prompt: 'consent',
    });


    return (
        // <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_OAUTH2}>
        <form className="login-form"
            onSubmit={(e) => handleSubmit(e)}>
            {
                error &&
                <p className="error">{error}</p>
            }

            <h1>Log in</h1>
            <div className="input-box">
                <label htmlFor="">Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="inputs"
                />
            </div>
            <div className="input-box">
                <label htmlFor="">Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="inputs"
                />
            </div>

            <button type="submit" className="btn">Login</button>

            {/* <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_OAUTH2}>
                <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onError={handleGoogleLoginFailure}
                />
            </GoogleOAuthProvider> */}
            <button onClick={loginWithGoogle}>Login with Google</button>
        </form>
    )
}

export default Login