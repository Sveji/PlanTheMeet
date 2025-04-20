import { FaArrowLeft, FaArrowRight } from "react-icons/fa6"
import DuplicateBox from "../../../DuplicateBox/DuplicateBox"

const TextBox = ({ month, setMonth, year, setYear, getMonthName }) => {
    // Changes the month and year states
    const handleMonthChange = (operation) => {
        if(operation === '+') {
            if(month.index === 11) {
                setMonth({
                    index: 0,
                    name: getMonthName(0)
                })
                setYear(year + 1)
            }
            else setMonth({
                index: month.index + 1,
                name: getMonthName(month.index + 1)
            })
        } else {
            if(month.index === 0) {
                setMonth({
                    index: 11,
                    name: getMonthName(11)
                })
                setYear(year - 1)
            }
            else if(operation === '-') setMonth({
                index: month.index - 1,
                name: getMonthName(month.index - 1)
            })
        }
    }



    return (
        <div className="text-box">
            <h1 className='month-name'>{month.name}</h1>
            <div className="button-container">
                <h3 className='year'>{year}</h3>
                <DuplicateBox><div className="icon-container" onClick={() => handleMonthChange('-')}><FaArrowLeft className='icon' /></div></DuplicateBox>
                <DuplicateBox><div className="icon-container" onClick={() => handleMonthChange('+')}><FaArrowRight className='icon' /></div></DuplicateBox>
            </div>
        </div>
    )
}

export default TextBox