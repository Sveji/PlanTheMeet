import Calendar from "../../components/Calendar/Calendar"
import EventCard from "../../components/Events/EventCard"

const MyCalendar = () => {
    return (
        <>
            <Calendar />
            <section className='events'>
                <EventCard />
            </section>
        </>
    )
}

export default MyCalendar