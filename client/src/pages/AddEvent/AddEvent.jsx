import { useContext, useEffect, useState } from "react"
import './event.less'
import { DataContext } from "../../context/DataContext"
import "../MyCalendar/myCalendar.less"
import FormBox from "./components/FormBox"
import IMG from "../../img/jake.jpg"
import { useParams } from "react-router-dom"
import RecommendEvent from "./components/RecommendEvent"



const AddEvent = () => {


    // Gets global data from the context
    const { crud, getSeason, selectedFriends, setSelectedFriends } = useContext(DataContext)

    const [summary, setSummary] = useState("");
    const [description, setDescription] = useState("")

    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [start, setStart] = useState('');

    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [end, setEnd] = useState('');


    const dateString = useParams().date
    const [date, setDate] = useState(new Date())
    const [season, setSeason] = useState('winter')

    useEffect(() => {
        if (startDate && startTime) {
            const isoString = new Date(`${startDate}T${startTime}`).toISOString();
            setStart(isoString);
        }
    }, [startDate, startTime]);

    useEffect(() => {
        if (endDate && endTime) {
            const isoString = new Date(`${endDate}T${endTime}`).toISOString();
            setEnd(isoString);
        }
    }, [endDate, endTime]);


    const handleSubmit = async () => {
        try {
            const response = await crud({
                url: '/add-event',
                method: 'post',
                header: {
                    'Authorization': `Bearer ${localStorage.getItem('access')}`
                },
                body: {
                    summary,
                    description,
                    start,
                    end
                }
            })
            console.log("Event added: ", response);
        } catch (error) {
            console.error("Error adding event:", error)
        }
    }






    // Sets the date on init
    useEffect(() => {
        if (dateString) {
            const str = dateString.split(['.'])
            const day = parseInt(str[0])
            const month = parseInt(str[1])
            const year = parseInt(str[2])
            setDate(new Date(year, month, day))
            console.log(new Date(year, month - 1, day))
        }
    }, [dateString])




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
                        {dateString}
                    </div>
                </div>

                <FormBox
                    summary={summary}
                    setSummary={setSummary}
                    description={description}
                    setDescription={setDescription}

                    startDate={startDate}
                    setStartDate={setStartDate}
                    startTime={startTime}
                    setStartTime={setStartTime}

                    endDate={endDate}
                    setEndDate={setEndDate}
                    endTime={endTime}
                    setEndTime={setEndTime}

                    handleSubmit={handleSubmit}
                />
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