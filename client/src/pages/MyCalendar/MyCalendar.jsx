import { useContext, useEffect, useRef, useState } from "react"
import Calendar from "../../components/Calendar/Calendar"
import EventCard from "../../components/EventCard/EventCard"
import Events from "./components/Events/Events"
import Friends from "./components/Friends/Friends"
import './myCalendar.less'
import DayInfo from "./components/DayInfo/DayInfo"
import { DataContext } from "../../context/DataContext"

const MyCalendar = () => {
    // Holds the selected date
    const [selected, setSelected] = useState(null)

    const { crud } = useContext(DataContext)



    // Refs for the column heights
    const leftRef = useRef(null)
    const dayRef = useRef(null)
    const friendsRef = useRef(null)

    useEffect(() => {
        if (leftRef.current && dayRef.current) {
            dayRef.current.style.height = `${leftRef.current.offsetHeight}px`
        }
    }, [leftRef.current, dayRef.current])

    // useEffect(() => {
    //     if(leftRef.current && friendsRef.current) {
    //         console.log(leftRef.current.offsetHeight)
    //         friendsRef.current.style.height = `${leftRef.current.offsetHeight}px`
    //     }
    // }, [leftRef, leftRef.current, friendsRef.current])
    useEffect(() => {
        if (!leftRef.current || !friendsRef.current) return;

        const observer = new ResizeObserver(() => {
            friendsRef.current.style.height = `${leftRef.current.offsetHeight}px`;
        });

        observer.observe(leftRef.current);

        return () => observer.disconnect();
    }, [])


    const [date, setDate] = useState('');
    const [city, setCity] = useState('Sofia, Bulgaria');
    const [recommendations, setRecommendations] = useState(null);


    useEffect(() => {
        if (!selected) {
            console.log("returning")
            return;
        }
        const fetching = async () => {

            const formattedDate = selected.toISOString().split('T')[0];
            console.log(formattedDate)

            const response = await crud({

                // url: '/getRecommendations',
                url: `/getRecommendations?date=${formattedDate}`,
                method: 'get',
                params: {
                    // date: formattedDate,
                    // city: city
                    date,
                    city
                }
            })

            console.log(response)

            if (response.status == 200) {
                setRecommendations(response.data)
                console.log(recommendations)
            }
        }

        fetching();
    }, [])



    return (
        <>
            <section className="calendar-section">
                <Calendar
                    ref={leftRef}
                    selected={selected}
                    setSelected={setSelected}

                />
                {
                    selected ?
                        <DayInfo ref={dayRef} selected={selected} setSelected={setSelected} />
                        :
                        <Friends ref={friendsRef} />
                }
            </section>
            <section className='events-section'>
                <Events />
            </section>
        </>
    )
}

export default MyCalendar