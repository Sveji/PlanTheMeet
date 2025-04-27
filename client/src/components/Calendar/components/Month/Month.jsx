import { useContext, useEffect, useState } from "react"
import { DataContext } from "../../../../context/DataContext"

const Month = ({ selected, setSelected, month = null, year = null }) => {
    // Gets global data from the context
    const { crud } = useContext(DataContext)



    // Holds the loading state for the calendar
    const [loading, setLoading] = useState(true)



    // Holds the state for the dates
    const [dates, setDates] = useState([])



    // Gets all dates of the given month
    const getAllDates = async (year, month) => {
        setLoading(true)



        // EVENTS NE ZNAM
        const response = await crud({
            url: `/events/getEvents/?month=${month}&year=${year}`,
            method: 'get'
        })

        console.log(response)

        let events = []
        if(response.status == 200) events = response.data.events


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
            const currEvents = events.filter(event => {
                const eventDate = new Date(event.datetime)
                return eventDate.getFullYear() === year && eventDate.getMonth() === month && eventDate.getDate() === day
            })

            allDates.push({
                date: date,
                events: currEvents
            })
        }

        setDates(allDates)
        setLoading(false)
    }



    // Gets the dates whenever the month and year get changed
    useEffect(() => {
        if(month && year) getAllDates(year, month.index)
    }, [month, year])

    useEffect(() => {
        //     const fetching = async () => {

        //     const response = await crud({
        //         url: `/calendars`,
        //         method: 'get',
        //         header: {
        //             'Authorization': `Bearer ${localStorage.getItem('access')}`
        //         },
        //         params: {
        //             month,
        //             year
        //         }
        //     })

        //     console.log(response)

        //     if (response.status == 200) {
        //         const ress = response.data
        //         console.log(ress)
        //     }
        // }

        // fetching()
        const fetching = async () => {
            const response = await crud({
                url: `/calendars`,
                method: 'get',
                headers: { // fix typo: header ➔ headers
                    'Authorization': `Bearer ${localStorage.getItem('access')}`
                },
                params: {
                    month: month.index,
                    year: year
                }
            });
    
            console.log(response);
    
            if (response.status === 200) {
                const googleEvents = response.data; // Assuming it's an array of events
                console.log(googleEvents);
    
                setDates(prevDates => {
                    if (!prevDates.length) return prevDates; // no dates yet
    
                    const newDates = prevDates.map(dateObj => {
                        if (dateObj === null) return null; // skip empty slots
    
                        const day = dateObj.date.getUTCDate();
                        const monthInDate = dateObj.date.getUTCMonth();
                        const yearInDate = dateObj.date.getUTCFullYear();
    
                        const matchingEvents = googleEvents.filter(event => {
                            const eventDate = new Date(event.start?.dateTime || event.start?.date);
                            return (
                                eventDate.getUTCDate() === day &&
                                eventDate.getUTCMonth() === monthInDate &&
                                eventDate.getUTCFullYear() === yearInDate
                            );
                        });
    
                        return {
                            ...dateObj,
                            events: [...dateObj.events, ...matchingEvents]
                        };
                    });
    
                    return newDates;
                });
            }
        };
    
        if (month && year) fetching();
    }, [month, year])

    return (
        <div className="month">
            {
                !loading &&
                dates.map((date, index) => (
                    date ?
                    <div onClick={() => setSelected(date.date)} key={index} className={`
                        date
                        ${date.date.getDay() == 0 || date.date.getDay() == 6 ? 'weekend' : null}
                        ${
                            date.date.getFullYear() === new Date().getFullYear() &&
                            date.date.getMonth() === new Date().getMonth() && 
                            date.date.getDate() === new Date().getDate() 
                            ? 'today' : null
                        }
                        ${
                            selected &&
                            date.date.getFullYear() === selected.getFullYear() &&
                            date.date.getMonth() === selected.getMonth() && 
                            date.date.getDate() === selected.getDate() 
                            ? 'selected' : null
                        }`
                    }>
                        <div className="day-box">
                            <p className="day">{date.date.getDate()}</p>
                        </div>

                        {
                            date.events &&
                            date.events.length > 0 &&
                            <div className="event-list">
                                {
                                    date.events.map((event, i) => (
                                        <div key={i} className="event">
                                            <div className="circle"></div>
                                            <p className="title">{event.title}</p>
                                        </div>
                                    ))
                                }
                            </div>
                        }
                    </div>
                    :
                    <div key={index}></div>
                ))
            }
        </div>
    )
}

export default Month