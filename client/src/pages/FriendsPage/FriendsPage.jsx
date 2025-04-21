import { useContext, useEffect, useState } from "react"
import { DataContext } from "../../context/DataContext"
import Notifications from "./Notifications"

const FriendsPage = () => {
    // Gets global data from the context
    const { crud, access, socketRef, socketSend } = useContext(DataContext)



    // Holds the user's friends
    const [friends, setFriends] = useState([])



    // Gets the user's friends on init
    useEffect(() => {
        const fetching = async () => {
            const response = await crud({
                url: '/getFriends',
                method: 'get'
            })

            console.log(response)
        }

        fetching()
    }, [])



    // Holds the state for the add friend input
    const [friendAdd, setFriendAdd] = useState("")



    // Sends a friend request through the web socket server
    const addFriend = (e) => {
        e.preventDefault()
        
        socketSend({
            type: 'addFriend',
            email: friendAdd
        })
    }



    // Accepts a friend request through the web socket server
    const handleAcceptFriend = (requestId) => {
        socketSend({
            type: 'acceptFriend',
            requestId
        })
    }



    // Rejects a friend request through the web socket server
    const handleRejectFriend = (requestId) => {
        socketSend({
            type: 'rejectFriend',
            requestId
        })
    }



    return (
        <>
            <h3>Your friends</h3>
            {
                friends.length > 0 ?
                null
                :
                <p>You have no friends yet :(</p>
            }

            <h3>Add friends</h3>
            <form onSubmit={(e) => addFriend(e)}>
                <input
                    placeholder="Email"
                    value={friendAdd}
                    onChange={(e) => setFriendAdd(e.target.value)}
                />
                <button type="submit">Add friend</button>
            </form>

            <button onClick={() => handleAcceptFriend(26)}>Accept Marti</button>
            <button onClick={() => handleRejectFriend(26)}>Reject Marti</button>

            <Notifications />
        </>
    )
}

export default FriendsPage