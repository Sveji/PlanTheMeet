import { useContext, useState } from "react"
import { DataContext } from "../../context/DataContext"

const Register = () => {
    // Gets global data from the context
    const { crud } = useContext(DataContext)



    // Holds the state for the form
    const [email, setEmail] = useState("")
    const [firstName, setFirstName] = useState("")
    const [familyName, setFamilyName] = useState("")
    const [password, setPassword] = useState("")
    const [conform_password, setConfirmPassword] = useState("")
    const [error, setError] = useState(null)



    // Sends a register request to the backend
    const handleSubmit = async (e) => {
        e.preventDefault()

        const response = await crud({
            url: '/auth/register',
            method: 'post',
            body: {
                email,
                firstName,
                familyName,
                password,
                conform_password
            }
        })

        console.log(response)

        if(response.status == 400 || response.status == 500) setError(response.response.data.error)
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
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
            />
            <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Family Name"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            <input
                type="password"
                value={conform_password}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
            />
            <button type="submit">Register</button>
        </form>
    )
}

export default Register