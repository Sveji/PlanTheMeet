import Friend from "../../../components/Friend/Friend"
import Search from "../../../components/Search/Search"
import { DataContext } from "../../../context/DataContext"
import { useState, useContext } from "react"

const Participants = () => {

    const { getFriendColor } = useContext(DataContext)

    const [search, setSearch] = useState("")

    return (
        <div className="participants">
            <p className="title">Participants</p>
            <div className="friends">
                {
                    Array.from({ length: 3 }, _ => null).map((friend, i) => (
                        <Friend
                            key={i}
                            crossIcon
                            color={getFriendColor(i)} />
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