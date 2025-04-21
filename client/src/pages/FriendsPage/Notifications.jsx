import { useContext } from "react"
import { DataContext } from "../../context/DataContext"

const Notifications = () => {
    // Gets global data from the context
    const { notifications, socketSend } = useContext(DataContext)



    // Sends a notification through the web socket server to mark a notification as read
    const handleMarkAsRead = (notificationId) => {
        socketSend({
            type: 'markAsRead',
            notificationId
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
        <div>
            {
                notifications && notifications.length > 0 &&
                notifications.map((notification, i) => (
                    <div key={i} className="notification">
                        <p>{notification.message}</p>
                        {
                            notification.type === 'friendRequest' ?
                            <>
                                <button onClick={() => handleAcceptFriend(notification.data.requestId)}>Accept</button>
                                <button onClick={() => handleRejectFriend(notification.data.requestId)}>Reject</button>
                            </>
                            :
                            <button onClick={() => handleMarkAsRead(notification.id)}>Mark as read</button>
                        }
                    </div>
                ))
            }
        </div>
    )
}

export default Notifications