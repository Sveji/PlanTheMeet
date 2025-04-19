import axios from "axios";
import { createContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export const DataContext = createContext({ })

const DataProvider = ({ children }) => {
    // Sends the user to a different page
    const navigate = useNavigate()



    // Gets the JWT tokens if the user has logged in
    const [refresh, setRefresh] = useState(localStorage.getItem('refresh') || null)
    const [access, setAccess] = useState(localStorage.getItem('access') || null)



    // Sets the url for the backend server
    axios.defaults.baseURL = 'http://127.0.0.1:5000/'



    // Makes a CRUD operation to the backend server
    const crud = async ({ url, method, body = null, headers = null }) => {
        try {
            const config = {
                headers: access ? {
                    'Authorization': `Bearer ${access}`,
                    ...headers
                } : {
                    headers
                }
            }

            let response;
            if (method.toLowerCase() === 'get' || method.toLowerCase() === 'delete') {
                response = await axios[method](url, config);
            } else {
                response = await axios[method](url, body, config);
            }

            if(response) return response
        } catch(err) {
            return err
        }
    }



    // Holds whether the layout grid is shown or not
    const [grid, setGrid] = useState(false)



    // Checks which season the given month is in
    const getSeason = (month) => {
        if(month >= 2 && month <= 4) return 'spring'
        if(month >= 5 && month <= 7) return 'summer'
        if(month >= 8 && month <= 10) return 'autumn'
        if(month == 11 || month == 0 || month == 1) return 'winter'
    }



    // Establishes a web socket connection on init
    const socketRef = useRef(null)

    useEffect(() => {
        if(access) {
            socketRef.current = new WebSocket('ws://localhost:5000/')

            socketRef.current.onopen = () => {
                console.log("Web Socket Connection Established")
            }

            socketRef.current.onmessage = () => {
                console.log('Message')
            }

            socketRef.onerror = () => {
                console.log('Error')
            }

            socketRef.current.onclose = () => {
                console.log("Web Socket Connection Closed")
            }

            return () => {
                socketRef.current.close()
            }
        }
    }, [access])



    return (
        <DataContext.Provider value={{
            navigate,
            crud, access, setAccess, refresh, setRefresh,
            grid, setGrid,
            getSeason
        }}>
            { children }
        </DataContext.Provider>
    )
}

export default DataProvider