import { useContext, useEffect, useState } from "react"
import './event.less'
import { DataContext } from "../../context/DataContext"

const AddEvent = () => {
    // Gets global data from the context
    const { getSeason } = useContext(DataContext)



    const [date, setDate] = useState(new Date())
    const [season, setSeason] = useState('winter')



    // Sets the season on init
    useEffect(() => {
        const currSeason = getSeason(date.getMonth())
        setSeason(currSeason)
    }, [date])

    return (
        <section className={`section-event ${season}`}>
            <div className="title-box">
                <h2>Add an event</h2>
                <div className="date-box">
                    {date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`}.{date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`}.{date.getFullYear()}
                </div>
            </div>
        </section>
    )
}

export default AddEvent