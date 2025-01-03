import { Avatar, AvatarImage } from "../ui/avatar";

const BillSvg = () => {
    return (
        <Avatar className="tw-w-6 tw-h-6 tw-rounded-none">
            <AvatarImage src={`/bills.svg`} />
        </Avatar>
    )
}

export default BillSvg;