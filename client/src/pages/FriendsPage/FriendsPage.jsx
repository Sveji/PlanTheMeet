import { useContext, useEffect, useState } from "react"
import { DataContext } from "../../context/DataContext"
import Notifications from "./Notifications"
import Friend from "../../components/Friend/Friend"

const FriendsPage = () => {
    // Gets global data from the context
    const { crud, socketSend, friendReqError } = useContext(DataContext)



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

            if(response.status == 200) {
                setFriends(response.data)
            }
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



    return (
        <>
            <h3>Your friends</h3>
            {
                friends.length > 0 ?
                friends.map(friend => (
                    <Friend firstName={friend.firstName} familyName={friend.familyName} />
                ))
                :
                <p>You have no friends yet :(</p>
            }

            <h3>Add friends</h3>
            {
                friendReqError &&
                <p className="error">{friendReqError}</p>
            }
            <form onSubmit={(e) => addFriend(e)}>
                <input
                    placeholder="Email"
                    value={friendAdd}
                    onChange={(e) => setFriendAdd(e.target.value)}
                />
                <button type="submit">Add friend</button>
            </form>

            <Notifications />
        </>
    )
}

export default FriendsPage