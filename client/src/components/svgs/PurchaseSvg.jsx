import React from 'react'
import { Avatar, AvatarImage } from '../ui/avatar'

const PurchaseSvg = () => {
    return (
        <Avatar className="w-6 h-6 rounded-none">
            <AvatarImage src={`/sidebar/purchases.svg`} />
        </Avatar>

    )
}

export default PurchaseSvg