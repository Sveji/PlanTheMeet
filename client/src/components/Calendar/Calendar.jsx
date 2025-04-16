import { useEffect, useState } from 'react'
import './calendar.less'
import Month from './components/Month'
import EventCard from '../Events/EventCard'

const Calendar = () => {
    // Holds the selected date
    const [selected, setSelected] = useState(new Date())



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



    return (
        <>
            <section className="calendar">
                {
                    Array.from({ length: 31 }, _ => null).map((date, index) => (
                        <div className={`date ${index % 2 == 1 ? 'disabled' : null}`}>
                            <div className="day-box">
                                <p className="day">{index + 1}</p>
                            </div>
                        </div>
                    ))
                }
            </section>
            <section className='events'>
                <EventCard />
            </section>
        </>
    )
}

export default Calendar