import { HiOutlineSearch } from "react-icons/hi"
import "./search.less"

const Search = ({ placeholder = "Search", value, onChange }) => {
    return (
        <div className="input-container">
            <HiOutlineSearch className="icon" />
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
    )
}

export default Search
