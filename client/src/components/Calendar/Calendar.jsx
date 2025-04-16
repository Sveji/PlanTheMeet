import './calendar.less'
import EventCard from '../Events/EventCard'

const Calendar = () => {
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