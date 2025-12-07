import { Avatar, AvatarImage } from "../ui/avatar";

const BillSvg = () => {
    return (
        <Avatar className="w-6 h-6 rounded-none">
            <AvatarImage src={`/sidebar/bills.svg`} />
        </Avatar>
    )
}

export default BillSvg;