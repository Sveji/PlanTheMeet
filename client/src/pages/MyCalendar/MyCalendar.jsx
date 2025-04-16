import Calendar from "../../components/Calendar/Calendar"
import EventCard from "../../components/Events/EventCard"
import Friends from "./components/Friends/Friends"
import './myCalendar.less'

const MyCalendar = () => {
    return (
        <>
            <section className="calendar-section">
                <Calendar />
                <Friends />
            </section>
            <section className='events'>
                <EventCard />
            </section>
        </>
    )
}

export default MyCalendar