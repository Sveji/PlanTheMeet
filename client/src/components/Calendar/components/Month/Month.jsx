import { useEffect, useState } from "react"

const Month = ({ month = null, year = null }) => {
    // Holds the loading state for the calendar
    const [loading, setLoading] = useState(true)



    // Holds the state for the dates
    const [dates, setDates] = useState([])



    // Gets all dates of the given month
    const getAllDates = async (year, month) => {
        setLoading(true)

        let allDates = []

        // Gets the last day of the month - determines how many days are in the month
        const days = new Date(year, month + 1, 0).getDate()

        // Fills the array with null elements on the first days of the week which are not part of the month
        let firstDay = new Date(year, month, 1).getDay()
        if(firstDay == 0) firstDay = 7
        for(let i = 1; i < firstDay; i++) {
            allDates.push(null)
        }

        // Fills the dates array
        for(let day = 1; day <= days; day++) {
            const date = new Date(Date.UTC(year, month, day))

            allDates.push(date)
        }

        setDates(allDates)
        setLoading(false)
    }



    // Gets the dates whenever the month and year get changed
    useEffect(() => {
        if(month && year) getAllDates(year, month.index)
    }, [month, year])



    return (
        <div className="month">
            {
                !loading &&
                dates.map((date, index) => (
                    date ?
                    <div key={index} className={`date ${index % 2 == 1 ? 'disabled' : null} ${date.getDay() == 0 || date.getDay() == 6 ? 'weekend' : null}`}>
                        <div className="day-box">
                            <p className="day">{date.getDate()}</p>
                        </div>
                    </div>
                    :
                    <div key={index}></div>
                ))
            }
        </div>
    )
}

export default Month