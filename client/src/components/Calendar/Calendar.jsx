import './calendar.less'

const Calendar = () => {
    return (
        <div className="calendar">
            {
                Array.from({ length: 31 }, _ => null).map((date, index) => (
                    <div className={`date ${index % 2 == 1 ? 'disabled' : null}`}>
                        <div className="day-box">
                            <p className="day">{index + 1}</p>
                        </div>
                    </div>
                ))
            }
        </div>
    )
}

export default Calendar