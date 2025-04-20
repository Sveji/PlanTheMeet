import { useContext, useEffect, useState } from "react"
import { DataContext } from "../../context/DataContext"

const FriendsPage = () => {
    // Gets global data from the context
    const { crud, socketRef } = useContext(DataContext)



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
        console.log("ADD FRIEND")

        socketRef.current.send(JSON.stringify({
            type: 'addFriend',
            email: friendAdd
        }))
    }



    // Accepts a friend request through the web socket server
    const handleAcceptFriend = (requestId) => {
        socketRef.current.send(JSON.stringify({
            type: 'acceptFriend',
            requestId
        }))
    }



    // Rejects a friend request through the web socket server
    const handleRejectFriend = (requestId) => {
        socketRef.current.send(JSON.stringify({
            type: 'rejectFriend',
            requestId
        }))
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

            <button onClick={() => handleAcceptFriend(4)}>Accept Marti</button>
            <button onClick={() => handleRejectFriend(4)}>Reject Marti</button>
        </>
    )
}

export default FriendsPage