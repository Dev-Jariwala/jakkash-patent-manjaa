import { Avatar, AvatarImage } from "../ui/avatar";

const BankSvg = () => {
    return (
        <Avatar className="w-6 h-6 rounded-none">
            <AvatarImage src={`/sidebar/bank.svg`} />
        </Avatar>
    )
}

export default BankSvg;
