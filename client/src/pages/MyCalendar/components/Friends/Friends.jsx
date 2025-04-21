import { useContext, useState } from "react"
import { HiOutlineSearch } from "react-icons/hi";
import Friend from "../../../../components/Friend/Friend";
import DuplicateBox from "../../../../components/DuplicateBox/DuplicateBox";
import Search from "../../../../components/Search/Search"
import { DataContext } from "../../../../context/DataContext";


const Friends = ({ ref }) => {
    // Gets global data from the context
    const { getFriendColor } = useContext(DataContext)



    const [search, setSearch] = useState('')


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
                    Array.from({ length: 18 }, _ => null).map((friend, i) => (
                        <Friend
                            key={i}
                            username='AlekPalek69bgXXAlekPalek69bgXXAlekPalek69bgXXAlekPalek69bgXXAlekPalek69bgXXAlekPalek69bgXX'
                            color={getFriendColor(i)}
                            chatIcon
                        />
                    ))
                }
            </div>
        </div>
    )
}

export default Friends