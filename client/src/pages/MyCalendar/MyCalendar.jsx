import { useEffect, useRef, useState } from "react"
import Calendar from "../../components/Calendar/Calendar"
import EventCard from "../../components/EventCard/EventCard"
import Events from "./components/Events/Events"
import Friends from "./components/Friends/Friends"
import './myCalendar.less'
import DayInfo from "./components/DayInfo/DayInfo"

const MyCalendar = () => {
    // Holds the selected date
    const [selected, setSelected] = useState(null)

    

    // Refs for the column heights
    const leftRef = useRef(null)
    const dayRef = useRef(null)
    const friendsRef = useRef(null)

    useEffect(() => {
        if(leftRef.current && dayRef.current) {
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



    return (
        <>
            <section className="calendar-section">
                <Calendar ref={leftRef} selected={selected} setSelected={setSelected} />
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