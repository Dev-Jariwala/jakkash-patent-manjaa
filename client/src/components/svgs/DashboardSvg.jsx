import { Avatar, AvatarImage } from "../ui/avatar"

const DashboardSvg = () => {
    return (
        <Avatar className="w-6 h-6 rounded-none">
            <AvatarImage src={`/sidebar/dashboard.svg`} />
        </Avatar>
    )
}

export default DashboardSvg