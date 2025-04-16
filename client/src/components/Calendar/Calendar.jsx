import { useEffect, useState } from 'react'
import './calendar.less'
import Month from './components/Month/Month'
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import TextBox from './components/TextBox/TextBox';

const Calendar = () => {
    // Holds the selected date
    const [selected, setSelected] = useState(new Date())



    const [season, setSeason] = useState('')
    const [month, setMonth] = useState({ index: null, name: null })
    const [year, setYear] = useState(null)



    // Gets the name of the given month
    const getMonthName = (month) => {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]

        return months[month]
    }



    // Sets the values to the selected date on init
    useEffect(() => {
        if(selected) {
            setMonth({
                index: selected.getMonth(),
                name: getMonthName(selected.getMonth())
            })
            setYear(selected.getFullYear())
        }
    }, [selected])



    // Changes the season state when the month changes
    useEffect(() => {
        if(month.index >= 2 && month.index <= 4) setSeason('spring')
        if(month.index >= 5 && month.index <= 7) setSeason('summer')
        if(month.index >= 8 && month.index <= 10) setSeason('autumn')
        if(month.index == 11 || month.index == 0 || month.index == 1) setSeason('winter')
    }, [month])



    return (
        <div className={`calendar ${season}`}>
            <TextBox month={month} setMonth={setMonth} year={year} setYear={setYear} getMonthName={getMonthName} />
            <Month month={month} year={year} />
        </div>
    )
}

export default Calendar