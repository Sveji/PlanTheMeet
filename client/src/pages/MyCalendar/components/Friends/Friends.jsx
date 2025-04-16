import { useState } from "react"
import { HiOutlineSearch } from "react-icons/hi";
import Friend from "../../../../components/Friend/Friend";

const Friends = () => {
    const [search, setSearch] = useState('')

    return (
        <div className="friends-column">
            <div className="input-container">
                <HiOutlineSearch className="icon"/>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search friend"
                />
            </div>

            <div className="friends-list">
                {
                    Array.from({ length: 18 }, _ => null).map(friend => (
                        <Friend
                            username='AlekPalek69bgXX'
                        />
                    ))
                }
            </div>
        </div>
    )
}

export default Friends