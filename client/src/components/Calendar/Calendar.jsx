import { useContext, useEffect, useState } from 'react'
import './calendar.less'
import Month from './components/Month/Month'
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import TextBox from './components/TextBox/TextBox';
import { DataContext } from '../../context/DataContext';

const Calendar = ({ ref, selected, setSelected }) => {
    // Gets global data from the context
    const { getSeason } = useContext(DataContext)



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



    // Sets the values to the current date on init
    useEffect(() => {
        const today = new Date()

        setMonth({
            index: today.getMonth(),
            name: getMonthName(today.getMonth())
        })
        setYear(today.getFullYear())
    }, [])



    // Changes the season state when the month changes
    useEffect(() => {
        const currSeason = getSeason(month.index)
        setSeason(currSeason)
    }, [month])



    return (
        <div ref={ref} className={`calendar ${season}`}>
            <TextBox month={month} setMonth={setMonth} year={year} setYear={setYear} getMonthName={getMonthName} />
            <Month selected={selected} setSelected={setSelected} month={month} year={year} />
        </div>
    )
}

export default Calendar