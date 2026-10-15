import { Avatar, AvatarImage } from "../ui/avatar";

const MastersSvg = () => {
    return (
        <Avatar className="w-6 h-6 rounded-none">
            <AvatarImage src={`/sidebar/masters.svg`} />
        </Avatar>
    )
}

export default MastersSvg;
