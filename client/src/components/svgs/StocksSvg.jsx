import { Avatar, AvatarImage } from '../ui/avatar'

const StocksSvg = () => {
    return (
        <Avatar className="w-6 h-6 rounded-none">
            <AvatarImage src={`/sidebar/stocks.svg`} />
        </Avatar>
    )
}

export default StocksSvg