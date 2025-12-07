import { Avatar, AvatarImage } from "../ui/avatar";

const CollectionsSvg = () => {
    return (
        <Avatar className="w-6 h-6 rounded-none">
            <AvatarImage src={`/sidebar/collections.svg`} />
        </Avatar>
    );
};

export default CollectionsSvg;
