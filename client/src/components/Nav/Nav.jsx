import { NavLink } from "react-router-dom"
import DuplicateBox from "../DuplicateBox/DuplicateBox"
import { DataContext } from "../../context/DataContext"
import { useContext } from "react"

const Nav = () => {
    const { handleLogOut } = useContext(DataContext);

    const handleLogoutClick = () => {
        handleLogOut
        console.log("Logout clicked");


    };

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
        {
            label: 'Log out',
        }
    ];

    return (
        <header className="header">
            <DuplicateBox>
                <nav className="navbar">
                    {links.map((link, i) =>
                        link.url ? (
                            <NavLink
                                key={i}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                to={link.url}
                            >
                                {link.label}
                            </NavLink>
                        ) : (
                            <button
                                key={i}
                                className="nav-link"
                                onClick={handleLogoutClick}
                            >
                                {link.label}
                            </button>
                        )
                    )}
                </nav>
            </DuplicateBox>
        </header>
    );
}

export default Nav;
