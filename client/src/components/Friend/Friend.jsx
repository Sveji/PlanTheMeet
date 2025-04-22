import pfp from '../../img/pfp.png'
import { IoChatbubbleOutline } from "react-icons/io5";
import { IoClose } from "react-icons/io5";


const Friend = ({ color = 'pink', image = pfp, firstName = 'Alek', familyName = 'Palek', chatIcon = false, crossIcon = false, className = '', onClick = () => {}, removeFunc = () => {} }) => {
    return (
        <div onClick={onClick} className={`friend ${color} ${className}`}>
            <div className="user-info">
                <img className='pfp' src={image} alt="User Profile Picture" />
                <p className='username'>{`${firstName} ${familyName}`}</p>
            </div>

            <div className="icons-box">
                {
                    chatIcon &&
                    <div className="icon-container">
                        <IoChatbubbleOutline className='icon' />
                    </div>

                }
                {
                    crossIcon &&
                    <div className='icon-container'>
                        <IoClose onClick={removeFunc} className='icon' />
                    </div>
                }
            </div>
        </div>
    )
}

export default Friend