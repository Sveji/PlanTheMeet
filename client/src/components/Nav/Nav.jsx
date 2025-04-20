import { NavLink } from "react-router-dom"
import DuplicateBox from "../DuplicateBox/DuplicateBox"

const Nav = () => {
    // Holds the links for the navbar
    const links = [
        {
            url: '/',
            label: 'Calendar'
        },
        {
            url: '/chat',
            label: 'Chats'
        },
        {
            url: '/friends',
            label: 'Friends'
        },
        {
            url: '/n',
            label: 'Notifications'
        },
    ]



    return (
        <header className="header">
            <DuplicateBox>
                <nav className="navbar">
                    {
                        links.map((link, i) => (
                            <NavLink key={i} className={({isActive}) => `nav-link ${isActive && 'active'}`} to={link.url}>{link.label}</NavLink>
                        ))
                    }
                </nav>
            </DuplicateBox>
        </header>
    )
}

export default Nav