import Friend from "../../../components/Friend/Friend"
import Search from "../../../components/Search/Search"
import { DataContext } from "../../../context/DataContext"
import { useState, useContext } from "react"

const Participants = () => {

    const { getFriendColor, selectedFriends, setSelectedFriends } = useContext(DataContext)

    const [search, setSearch] = useState("")


    // Removes a user from the selected array
    const handleDeselectUser = (friendToDeselect) => {
        const index = selectedFriends.findIndex(friend => friend.id === friendToDeselect.id)

        if(index >= 0) {
            let newSelected = [...selectedFriends]
            newSelected.splice(index, 1)
            setSelectedFriends(newSelected)
        }
    }



    return (
        <div className="participants">
            <p className="title">Participants</p>
            <div className="friends">
                {
                    selectedFriends &&
                    selectedFriends.length > 0 &&
                    selectedFriends.map((friend, i) => (
                        <Friend
                            key={i}
                            crossIcon
                            color={getFriendColor(i)}
                            removeFunc={() => handleDeselectUser(friend)}
                        />
                    ))
                }

            </div>
            <Search
                placeholder="Add participants"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>)
}

export default Participants