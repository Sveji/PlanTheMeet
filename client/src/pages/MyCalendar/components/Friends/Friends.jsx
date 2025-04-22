import { useContext, useEffect, useState } from "react"
import { HiOutlineSearch } from "react-icons/hi";
import Friend from "../../../../components/Friend/Friend";
import DuplicateBox from "../../../../components/DuplicateBox/DuplicateBox";
import Search from "../../../../components/Search/Search"
import { DataContext } from "../../../../context/DataContext";


const Friends = ({ ref }) => {
    // Gets global data from the context
    const { getFriendColor, crud } = useContext(DataContext)



    // Holds the state for the search query
    const [search, setSearch] = useState('')



    // Holds the user's friends
    const [friends, setFriends] = useState([])
    const [selectedFriends, setSelectedFriends] = useState([])



    // Gets the user's friends on init
    useEffect(() => {
        const fetching = async () => {
            const response = await crud({
                url: `/getFriends/?query=${search}`,
                method: 'get'
            })

            console.log(response)

            if(response.status == 200) {
                const friendsArr = response.data.map(friend => {
                    return {
                        ...friend,
                        selected: false
                    }
                })
                setFriends(friendsArr)
            }
        }

        fetching()
    }, [search])



    // Adds a user to the selected friends array
    const handleSelectFriend = (id) => {
        const index = friends.findIndex(friend => friend.id === id)
        const newFriend = {
            ...friends[index],
            selected: !friends[index].selected
        }
        let newFriends = [...friends]
        newFriends[index] = newFriend
        setFriends(newFriends)

        // console.log(newFriends)
    }



    return (
        <div ref={ref} className="friends-column">
            <DuplicateBox>

                <Search
                    placeholder=" search friend"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />


            </DuplicateBox>

            <div className="friends-list">
                {
                    friends &&
                    friends.length > 0 ?
                    friends.map((friend, i) => (
                        <Friend
                            onClick={() => handleSelectFriend(friend.id)}
                            key={i}
                            username={`${friend.firstName} ${friend.familyName}`}
                            color={getFriendColor(i)}
                            chatIcon
                            className={`${friend.selected ? 'selected' : null}`}
                        />
                    ))
                    :
                    <p className="empty">No friends to show here...</p>
                }
            </div>
        </div>
    )
}

export default Friends