import { Avatar, AvatarImage } from '../ui/avatar'

const ProductSvg = () => {
    return (
        <Avatar className="w-6 h-6 rounded-none">
            <AvatarImage src={`/sidebar/products.svg`} />
        </Avatar>

    )
}

export default ProductSvg