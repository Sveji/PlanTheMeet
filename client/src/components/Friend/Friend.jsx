import pfp from '../../img/pfp.png'
import { IoChatbubbleOutline } from "react-icons/io5";

const Friend = ({ color = 'pink', image = pfp, username, icon = 'chat' }) => {
    return (
        <div className={`friend ${color}`}>
            <div className="user-info">
                <img className='pfp' src={image} alt="User Profile Picture" />
                <p className='username'>{username}</p>
            </div>

            <div className="icon-container">
                {
                    icon === 'chat' &&
                    <IoChatbubbleOutline className='icon' />
                }
            </div>
        </div>
    )
}

export default Friend