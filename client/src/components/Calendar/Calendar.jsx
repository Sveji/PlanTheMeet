import { useEffect, useState } from 'react'
import './calendar.less'
import Month from './components/Month'
import EventCard from '../Events/EventCard'
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

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



    // Changes the season state when the month changes
    useEffect(() => {
        if(month.index >= 2 && month.index <= 4) setSeason('spring')
        if(month.index >= 5 && month.index <= 7) setSeason('summer')
        if(month.index >= 8 && month.index <= 10) setSeason('autumn')
        if(month.index == 11 || month.index == 0 || month.index == 1) setSeason('winter')
    }, [month])



    return (
        <>
            <div className={`calendar ${season}`}>
                <div className="text-box">
                    <h1 className='month-name'>{month.name}</h1>
                    <div className="button-container">
                        <h3 className='year'>{year}</h3>
                        <div className="icon-container" onClick={() => handleMonthChange('-')}><FaArrowLeft className='icon' /></div>
                        <div className="icon-container" onClick={() => handleMonthChange('+')}><FaArrowRight className='icon' /></div>
                    </div>
                </div>
                <Month month={month} year={year} />
            </div>
            <section className='events'>
                <EventCard />
            </section>
        </>
    )
}

export default Calendar