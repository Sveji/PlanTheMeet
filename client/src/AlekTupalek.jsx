import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './alekTupalek.less'; // You'll create this for styling
import { DataContext } from './context/DataContext';

const AlekTupalek = () => {
//   const [events, setEvents] = useState({
//     events: [],
//     holidays: [],
//     birthdays: [],
//     other: [],
//     summary: { totalEvents: 0, upcomingEvents: 0, calendarTypes: {} }
//   });
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   useEffect(() => {
//     // Check if user is authenticated
//     checkAuthStatus();
//   }, []);

//   const checkAuthStatus = async () => {
//     try {
//       // This endpoint would check if valid tokens exist in the session
//       const response = await axios.get('/api/calendar/status');
//       setIsAuthenticated(response.data.isAuthenticated);

//       console.log(response)
      
//       if (response.data.isAuthenticated) {
//         fetchEvents();
//       }
//     } catch (error) {
//       console.error('Error checking auth status:', error);
//       setIsAuthenticated(false);
//       setError('Failed to check authentication status');
//       setIsLoading(false);
//     }
//   };

//   const handleAuthenticate = async () => {
//     try {
//       const response = await axios.get('/auth');
//       window.location.href = response.data.authUrl;
//     } catch (error) {
//       console.error('Authentication error:', error);
//       setError('Failed to start authentication process');
//     }
//   };

//   const fetchEvents = async () => {
//     setIsLoading(true);
//     try {
//       const response = await axios.get('/api/calendar/events');
//       setEvents(response.data);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching events:', error);
//       setError('Failed to fetch calendar events');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Helper function to get upcoming events within the next X days
//   const getUpcomingEvents = (days = 30) => {
//     const now = new Date();
//     const cutoffDate = new Date();
//     cutoffDate.setDate(now.getDate() + days);
    
//     // Combine all event types
//     const allEvents = [
//       ...events.events,
//       ...events.holidays,
//       ...events.birthdays,
//       ...events.other
//     ];
    
//     // Filter and sort by date
//     return allEvents
//       .filter(event => {
//         const eventDate = new Date(event.start.dateString);
//         return eventDate >= now && eventDate <= cutoffDate;
//       })
//       .sort((a, b) => {
//         return new Date(a.start.dateString) - new Date(b.start.dateString);
//       });
//   };


//   const { crud } = useContext(DataContext)

//   const handleAlekTupalek = async () => {
//     const startDate = new Date(2025, 4, 1)
//     const endDate = new Date(2025, 4, 30)

//     const startString = `${startDate.getFullYear()}-${startDate.getMonth() < 10 ? `0${startDate.getMonth()}` : startDate.getMonth()}-${startDate.getDate() < 10 ? `0${startDate.getDate()}` : startDate.getDate()}`
    
//     const endString = `${endDate.getFullYear()}-${endDate.getMonth() < 10 ? `0${endDate.getMonth()}` : endDate.getMonth()}-${endDate.getDate() < 10 ? `0${endDate.getDate()}` : endDate.getDate()}`

//     const response = await crud({
//         url: `/events/calendar/?startDate=${startString}&endDate=${endString}`,
//         method: 'get'
//     })

//     console.log(response)
//   }


//   if (!isAuthenticated) {
//     return (
//       <div className="calendar-auth">
//         <button onClick={handleAlekTupalek}>Alek Tupalek</button>
//         <h2>Calendar Integration</h2>
//         <p>Connect your Google Calendar to view events, holidays, and birthdays.</p>
//         <button onClick={handleAuthenticate} className="auth-button">
//           Connect Google Calendar
//         </button>
//         {error && <p className="error-message">{error}</p>}
//       </div>
//     );
//   }

//   if (isLoading) {
//     return <div className="loading">Loading calendar data...</div>;
//   }

//   const upcomingEvents = getUpcomingEvents(30);


//   return (
//     <div className="calendar-container">

//       <h2>Calendar Events</h2>
      
//       <div className="calendar-summary">
//         <h3>Summary</h3>
//         <p>Total events: {events.summary.totalEvents}</p>
//         <p>Upcoming events (30 days): {events.summary.upcomingEvents}</p>
//         <div className="calendar-types">
//           {Object.entries(events.summary.calendarTypes || {}).map(([type, count]) => (
//             <div key={type} className="calendar-type">
//               <span className={`type-indicator ${type}`}></span>
//               <span className="type-name">{type}</span>
//               <span className="type-count">{count}</span>
//             </div>
//           ))}
//         </div>
//       </div>
      
//       <div className="upcoming-events">
//         <h3>Upcoming Events</h3>
//         {upcomingEvents.length === 0 ? (
//           <p>No upcoming events found.</p>
//         ) : (
//           <ul className="events-list">
//             {upcomingEvents.map(event => (
//               <li key={event.id} className={`event-item ${event.calendarType}`}>
//                 <div className="event-date">
//                   {event.isAllDay ? 
//                     new Date(event.start.dateString).toLocaleDateString() : 
//                     new Date(event.start.dateString).toLocaleString()}
//                   {event.isAllDay && <span className="all-day">All day</span>}
//                 </div>
//                 <div className="event-details">
//                   <h4 className="event-title">{event.title}</h4>
//                   <span className="event-type">{event.calendarType}</span>
//                   {event.location && <p className="event-location">{event.location}</p>}
//                   {event.description && <p className="event-description">{event.description}</p>}
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
      
//       {error && <p className="error-message">{error}</p>}
//     </div>
//   );

    const { socketSend, crud } = useContext(DataContext)

    const handleAddEvent = () => {
        socketSend({
            type: 'addEvent',
            title: "Aleeeeek",
            description: "Alek pravi kalendar :)",
            date: "2025-04-19",
            time: "15:43:48",
            location: "Largoto",
            participants: [ 2 ],
            creatorId: 13
        })
    }

    const handleSyncWithGoogle = async () => {
        console.log("heloo")

        const response = await crud({
            url: '/syncGoogleCallendar',
            method: 'get'
        })

        console.log(response)
    }

    return (
        <>
            <button onClick={handleAddEvent}>Add event</button>
            <button onClick={handleSyncWithGoogle}>Sync with google</button>
        </>
    )
};

export default AlekTupalek;