import axios from "axios";
import { createContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export const DataContext = createContext({})

const DataProvider = ({ children }) => {
    // Sends the user to a different page
    const navigate = useNavigate()



    // Gets the JWT tokens if the user has logged in
    const [refresh, setRefresh] = useState(localStorage.getItem('refresh') || null)
    const [access, setAccess] = useState(localStorage.getItem('access') || null)



    // Removes the user's information from local storage and redirects to the login page
    const handleLogOut = () => {
        localStorage.removeItem('access')
        setAccess(null)
        navigate('/login')
    }



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

            if (response.status == 401) handleLogOut()

            if (response) return response
        } catch (err) {
            if (err.status == 401) handleLogOut()

            return err
        }
    }



    // Holds whether the layout grid is shown or not
    const [grid, setGrid] = useState(false)



    // Checks which season the given month is in
    const getSeason = (month) => {
        if (month >= 2 && month <= 4) return 'spring'
        if (month >= 5 && month <= 7) return 'summer'
        if (month >= 8 && month <= 10) return 'autumn'
        if (month == 11 || month == 0 || month == 1) return 'winter'
    }



    // Holds the user's notifications
    const [notifications, setNotifications] = useState([])

    // Holds the error state for the friend requests
    const [friendReqError, setFriendReqError] = useState(null)



    // Establishes a web socket connection on init
    const socketRef = useRef(null)

    useEffect(() => {
        if (access) {
            socketRef.current = new WebSocket('ws://localhost:5000/')

            socketRef.current.onopen = () => {
                console.log("Web Socket Connection Established")

                socketRef.current.send(JSON.stringify({
                    token: access
                }))
            }

            socketRef.current.onmessage = (data) => {
                console.log(data)

                if (data.type === 'message') {
                    const parsedData = JSON.parse(data.data)
                    console.log(parsedData)
                    if (parsedData.type === "notifications") {
                        setNotifications(parsedData.notifications)
                    }
                    if (parsedData.type === "notification") {
                        const newNotifications = [
                            parsedData.notification,
                            ...notifications
                        ]
                        console.log(newNotifications)
                        setNotifications(newNotifications)
                    }
                    if (parsedData.type === "notificationRemoved") {
                        const newNotifications = notifications.filter(notification => notification.id !== parsedData.notificationId)
                        setNotifications(newNotifications)
                    }
                    if (parsedData.type === 'acceptFriendSuccess' || parsedData.type === 'rejectFriendSuccess') {
                        const newNotifications = notifications.filter(notification => notification.type !== 'friendRequest' || (notification.type === 'friendRequest' && notification.data.requestId !== parsedData.requestId))
                        setNotifications(newNotifications)
                    }
                    if (parsedData.type === 'friendReqError') {
                        setFriendReqError(parsedData.error)
                    }
                }
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



    // Sends a request through the web socket server and attaches the token
    const socketSend = (data = {}) => {
        socketRef.current.send(JSON.stringify({
            token: access,
            ...data
        }))
    }



    // Gets friend color for a list from index
    const getFriendColor = (index) => {
        switch (index % 6) {
            case 0: return 'pink'
            case 1: return 'green'
            case 2: return 'blue'
            case 3: return 'purple'
            case 4: return 'red'
            case 5: return 'orange'
        }
    }



    // Holds the friends the user selected
    const [selectedFriends, setSelectedFriends] = useState([])

    useEffect(() => {
        console.log(selectedFriends)
    }, [selectedFriends])



    return (
        <DataContext.Provider value={{
            navigate,
            crud, socketSend,
            access, setAccess, refresh, setRefresh,
            grid, setGrid,
            socketRef,
            getSeason,
            getFriendColor,
            notifications,
            friendReqError,
            selectedFriends, setSelectedFriends,
            handleLogOut
        }}>
            {children}
        </DataContext.Provider>
    )
}

export default DataProvider