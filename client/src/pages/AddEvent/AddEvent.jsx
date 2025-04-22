import { useContext, useEffect, useState } from "react"
import './event.less'
import { DataContext } from "../../context/DataContext"
import "../MyCalendar/myCalendar.less"
import FormBox from "./components/FormBox"
import IMG from "../../img/jake.jpg"
import RecommendEvent from "./components/RecommendEvent"



const AddEvent = () => {
    // Gets global data from the context
    const { getSeason } = useContext(DataContext)





    const [date, setDate] = useState(new Date())
    const [season, setSeason] = useState('winter')

    // useEffect(() => {
    //     const fetching = async () => {
    //         const response = await crud({

    //         })
    //     }
    // })




    // Sets the season on init
    useEffect(() => {
        const currSeason = getSeason(date.getMonth())
        setSeason(currSeason)
    }, [date])

    return (
        <section className={`section-add-event ${season}`}>
            <div className="add">
                <div className="title-box">
                    <h2>Add an event</h2>
                    <div className="date-box">
                        {date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`}.{date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`}.{date.getFullYear()}
                    </div>
                </div>

                <FormBox />
            </div >

            <div className="recomendation">
                <div className="title-container">
                    <h3>You might also like...</h3>
                    <p>
                        Here's some events for {date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`}.{date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`}.{date.getFullYear()} in Sofia that you should consider.
                    </p>
                </div>
                <div className="events-container">
                    <RecommendEvent />

                </div>
            </div>
        </section >
    )
}

export default AddEvent