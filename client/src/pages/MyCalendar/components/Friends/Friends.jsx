import { useState } from "react"
import { HiOutlineSearch } from "react-icons/hi";
import Friend from "../../../../components/Friend/Friend";
import DuplicateBox from "../../../../components/DuplicateBox/DuplicateBox";

const Friends = () => {
    const [search, setSearch] = useState('')


    // Gets friend color from index
    const getColor = (index) => {
        switch (index % 6) {
            case 0: return 'pink'
            case 1: return 'green'
            case 2: return 'blue'
            case 3: return 'purple'
            case 4: return 'red'
            case 5: return 'orange'
        }
    }


    return (
        <div className="friends-column">
            <DuplicateBox>
                <div className="input-container">
                    <HiOutlineSearch className="icon"/>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search friend"
                    />
                </div>
            </DuplicateBox>

            <div className="friends-list">
                {
                    Array.from({ length: 18 }, _ => null).map((friend, i) => (
                        <Friend
                            key={i}
                            username='AlekPalek69bgXXAlekPalek69bgXXAlekPalek69bgXXAlekPalek69bgXXAlekPalek69bgXXAlekPalek69bgXX'
                            color={getColor(i)}
                        />
                    ))
                }
            </div>
        </div>
    )
}

export default Friends