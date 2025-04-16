import pfp from '../../img/pfp.png'

const Friend = ({ color = 'pink', image = pfp, username, icon = 'chat' }) => {
    return (
        <div className='friend'>
            <img className='pfp' src={image} alt="User Profile Picture" />
            {username}
        </div>
    )
}

export default Friend