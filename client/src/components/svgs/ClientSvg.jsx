import { Avatar, AvatarImage } from '../ui/avatar'

const ClientSvg = () => {
    return (
        <Avatar className="w-6 h-6 rounded-none">
            <AvatarImage src={`/sidebar/clients.svg`} />
        </Avatar>
    )
}

export default ClientSvg