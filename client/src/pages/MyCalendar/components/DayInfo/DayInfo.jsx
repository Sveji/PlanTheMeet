import { MdArrowBackIos } from "react-icons/md";
import { Link } from "react-router-dom";
import DuplicateBox from "../../../../components/DuplicateBox/DuplicateBox";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../../../context/DataContext";



const DayInfo = ({ ref, selected, setSelected }) => {
    // Gets global data from the context
    const { crud } = useContext(DataContext)



    // Formats a date object
    const formatDate = (date) => {
        return `${date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}.${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}.${date.getFullYear()}`
    }



    // Holds the state for the events
    const [events, setEvents] = useState([])



    // Gets the event for the selected date on init
    useEffect(() => {
        const fetching = async () => {
             // EVENTS NE ZNAM
            const response = await crud({
                url: `/events/getEvents/?day=${selected.getDate()}&month=${selected.getMonth()}&year=${selected.getFullYear()}`,
                method: 'get'
            })

            console.log(response)

            if(response.status == 200) setEvents(response.data.events)
        }

        fetching()
    }, [selected])



    // Holds the placeholder holidays and events
    const holidays = [
        // {
        //     title: 'Easter',
        //     description: 'Официален празник'
        // },
        // {
        //     title: 'Great Monday',
        //     description: 'Официален празник'
        // }
    ]



    return (
        <section ref={ref} className="section-day">
            <div className="day-info-container">
                <div className="title-box">
                    <MdArrowBackIos onClick={() => setSelected(null)} className="icon" />
                    <h3 className="title">{formatDate(selected)}</h3>
                </div>
                <div className="info-box">
                    <DuplicateBox className="duplicate-btn">
                        <button className="btn">Add new event</button>
                    </DuplicateBox>

                    {
                        holidays &&
                        holidays.length > 0 &&
                        <div className="holidays-container">
                            {
                                holidays.map((holiday, i) => (
                                    <div key={i} className="holiday">
                                        <p className="title">{holiday.title}</p>
                                        <p className="description">{holiday.description}</p>
                                    </div>
                                ))
                            }
                        </div>
                    }

                    {
                        events &&
                        events.length > 0 &&
                        <div className="events-container">
                            <p className="title">Your events</p>

                            {
                                events.map((event, i) => (
                                    <div key={i} className="event">
                                        <p className="title">{event.title}</p>
                                        <Link className="details">See details</Link>
                                    </div>
                                ))
                            }
                        </div>
                    }

                    {
                        holidays.length == 0 && events.length == 0 &&
                        <p>You have nothing planned for today.</p>
                    }
                </div>
            </div>
        </section>
    )
}

export default DayInfo