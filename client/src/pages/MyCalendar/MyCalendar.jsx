import Calendar from "../../components/Calendar/Calendar"
import EventCard from "../../components/EventCard/EventCard"
import Events from "./components/Events/Events"
import Friends from "./components/Friends/Friends"
import './myCalendar.less'

const MyCalendar = () => {
    return (
        <>
            <section className="calendar-section">
                <Calendar />
                <Friends />
            </section>
            <section className='events-section'>
                <Events />
            </section>
        </>
    )
}

export default MyCalendar