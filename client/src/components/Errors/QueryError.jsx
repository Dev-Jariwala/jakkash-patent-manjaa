/* eslint-disable react/prop-types */
import { cn } from "@/lib/utils";
import { MdError } from "react-icons/md";

const QueryError = ({ error, className }) => {
  return (
    <div
      className={cn(" text-xs lg:text-sm text-red-500 ", className)}
    >
      <div className="flex items-center space-x-2">
        <MdError />

        <div className="flex items-center space-x-2">
          <div>{error?.response?.data?.message} - </div>
          <div>{error?.message}</div>
        </div>
      </div>
    </div>
  );
};

export default QueryError;
